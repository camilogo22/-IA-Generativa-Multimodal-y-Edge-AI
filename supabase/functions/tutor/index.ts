// Edge Function "tutor": el ÚNICO lugar donde vive la API key de Gemini.
// Despliegue:  npx supabase secrets set GEMINI_API_KEY=AIza...
//              npx supabase functions deploy tutor
import { withSupabase } from 'npm:@supabase/server@1';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@4';
import {
  APICallError,
  convertToModelMessages,
  RetryError,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'npm:ai@7';
import { z } from 'npm:zod@4';

const google = createGoogleGenerativeAI({ apiKey: Deno.env.get('GEMINI_API_KEY') });
const MODELO = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';
const LIMITE_DIARIO = Number(Deno.env.get('LIMITE_DIARIO') ?? 30);

// Esquema de validación para el perfil del estudiante (Reto C2)
const PerfilEsquema = z.object({
  nombre: z.string().optional().default('Estudiante'),
  tema: z.string().optional().default('React Native y TypeScript'),
  nivel: z.enum(['principiante', 'intermedio', 'avanzado']).optional().default('intermedio'),
}).catch({
  nombre: 'Estudiante',
  tema: 'React Native y TypeScript',
  nivel: 'intermedio',
});

export default {
  // auth: 'none' => Permite entrar y chatear directamente sin requerir login forzado.
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Usa POST', { status: 405 });

    const body = await req.json().catch(() => ({}));
    const { messages = [] }: { messages: UIMessage[] } = body;
    const perfil = PerfilEsquema.parse(body.perfil ?? {});

    // Reto C5: Límite de uso diario en Supabase (si hay usuario autenticado)
    if (ctx.userClaims?.sub && ctx.supabase) {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await ctx.supabase
        .from('uso_ia')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hace24h);

      if (count !== null && count >= LIMITE_DIARIO) {
        return new Response(
          JSON.stringify({ error: 'Has alcanzado el límite diario de consultas. Vuelve mañana.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await ctx.supabase.from('uso_ia').insert({ funcion: 'tutor' });
    }

    const instructions = `Eres "Tutor IA", un tutor de Programación Móvil Avanzada (React Native con Expo y TypeScript) de la Universidad de La Guajira.
El estudiante es ${perfil.nombre || ctx.userClaims?.email || 'Estudiante'}.
Su tema de interés primordial es: ${perfil.tema}.
Su nivel de conocimiento técnico es: ${perfil.nivel}. Adapta tus explicaciones, profundidad y vocabulario a este nivel.
Respondes en español, claro y conciso (máximo 8 líneas salvo que pidan código).
Si te envían una foto o captura de pantalla, descríbela y relaciónala con la duda técnica. Si no sabes algo, dilo; nunca inventes APIs.`;

    const result = streamText({
      model: google(MODELO),
      instructions,
      // La API no tiene memoria: se reenvía el historial. Solo los últimos 20 mensajes para cuidar tokens.
      messages: await convertToModelMessages(messages.slice(-20)),
      temperature: 0.4,
      maxRetries: 1,
      maxOutputTokens: 1024,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        // Lo que devuelve onError es lo que ve el usuario en error.message.
        onError: (error) => {
          console.error(error);
          const real = RetryError.isInstance(error) ? error.lastError : error;
          if (APICallError.isInstance(real) && real.statusCode === 429) {
            return 'Se agotó la cuota gratuita de Gemini. Espera un minuto e intenta de nuevo.';
          }
          return 'El tutor no pudo responder. Intenta de nuevo.';
        },
      }),
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'none' },
    });
  }),
};
