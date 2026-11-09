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
const LIMITE_DIARIO = parseInt(Deno.env.get('LIMITE_DIARIO') ?? '20', 10);

// Validación de perfil del estudiante con Zod (Reto C2)
const PerfilSchema = z.object({
  nombre: z.string().trim().min(1).max(50).optional(),
  tema: z.string().trim().max(100).optional(),
  nivel: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
}).catch({});

export default {
  // auth: 'user' => sin un token de sesión válido responde 401 y nunca llega a Gemini.
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Usa POST', { status: 405 });

    const body = await req.json().catch(() => ({}));
    const messages: UIMessage[] = body.messages ?? [];
    const perfil = PerfilSchema.parse(body.perfil);

    // Reto C5: Límite por usuario cada 24 horas usando el cliente autenticado de Supabase
    try {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: errCount } = await ctx.supabaseClient
        .from('uso_ia')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hace24h);

      if (!errCount && count !== null && count >= LIMITE_DIARIO) {
        return new Response(
          JSON.stringify({
            error: `Límite diario alcanzado. Has realizado ${count} de ${LIMITE_DIARIO} preguntas permitidas en las últimas 24 horas. Vuelve mañana.`,
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Registrar el consumo actual
      await ctx.supabaseClient.from('uso_ia').insert({ funcion: 'tutor' });
    } catch (e) {
      console.warn('No se pudo verificar o registrar el límite en uso_ia:', e);
    }

    // Armar instrucciones dinámicas personalizadas (Reto C2)
    const nombreEstudiante = perfil.nombre || ctx.userClaims?.email || 'estudiante';
    const nivelEstudiante = perfil.nivel || 'intermedio';
    const temaInteres = perfil.tema ? ` Se enfoca principalmente en: ${perfil.tema}.` : '';

    const instructions = `Eres "Tutor IA", un tutor experto de Programación Móvil Avanzada (React Native con Expo y TypeScript) de la Universidad de La Guajira.
Respondes en español, claro y pedagógico. Adapta tu explicación al nivel ${nivelEstudiante} del estudiante (${nombreEstudiante}).${temaInteres}
Sé breve (máximo 8 líneas salvo que pidan un fragmento de código).
Si te envían una foto, analízala con atención, descríbela y soluciónale la duda. Si no sabes algo, dilo honestamente; no inventes APIs inexistentes.`;

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
          console.error('Error en streamText:', error);
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
