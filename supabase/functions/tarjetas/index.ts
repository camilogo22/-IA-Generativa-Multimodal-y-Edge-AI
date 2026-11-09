// Edge Function "tarjetas": Reto C3 - Salida estructurada con Zod y Output.object
import { withSupabase } from 'npm:@supabase/server@1';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@4';
import { generateText, Output } from 'npm:ai@7';
import { z } from 'npm:zod@4';

const google = createGoogleGenerativeAI({ apiKey: Deno.env.get('GEMINI_API_KEY') });
const MODELO = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

const EsquemaTarjetas = z.object({
  tema: z.string().describe('Tema o concepto general de las tarjetas'),
  tarjetas: z.array(
    z.object({
      pregunta: z.string().describe('Pregunta concisa para evaluar el aprendizaje'),
      respuesta: z.string().describe('Respuesta clara, didáctica y breve'),
    })
  ).min(3).max(5).describe('Entre 3 y 5 tarjetas de repaso'),
});

export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    if (req.method !== 'POST') return new Response('Usa POST', { status: 405 });

    const { conversacion }: { conversacion: string } = await req.json().catch(() => ({ conversacion: '' }));

    if (!conversacion || conversacion.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Se requiere el texto de la conversación.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const result = await generateText({
        model: google(MODELO),
        instructions: 'Eres un docente universitario experto. Analiza el contenido de la conversación y extrae entre 3 y 5 tarjetas de estudio/repaso (Flashcards) clave en español.',
        prompt: `Conversación reciente entre el estudiante y el tutor:\n"""\n${conversacion.slice(-3000)}\n"""\nGenera las tarjetas de repaso.`,
        output: Output.object({
          schema: EsquemaTarjetas,
        }),
      });

      return new Response(JSON.stringify(result.output), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Error generando tarjetas:', err);
      return new Response(
        JSON.stringify({ error: 'No se pudieron generar las tarjetas de repaso.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),
};
