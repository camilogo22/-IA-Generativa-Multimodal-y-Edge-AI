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

const google = createGoogleGenerativeAI({ apiKey: Deno.env.get('GEMINI_API_KEY') });
const MODELO = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

const INSTRUCCIONES = `Eres "Tutor IA", un tutor de Programación Móvil Avanzada (React Native con Expo y TypeScript)
de la Universidad de La Guajira. Respondes en español, claro y breve (máximo 8 líneas salvo que pidan código).
Si te envían una foto, descríbela y relaciónala con la pregunta. Si no sabes algo, dilo; no inventes APIs.`;

export default {
  // auth: 'none' => permite entrar y chatear directamente sin requerir login obligatorio.
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Usa POST', { status: 405 });

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google(MODELO),
      instructions: `${INSTRUCCIONES}\nEl estudiante que pregunta es ${ctx.userClaims?.email ?? 'estudiante'}.`,
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
          // Tras los reintentos automáticos el error real viene dentro de RetryError.
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
