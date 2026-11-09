// Edge Function "describir-foto": Visión por computadora con Google Gemini
// Utilizada por GeoCam ve (Taller en clase - Requisitos T1-T6)
import { withSupabase } from 'npm:@supabase/server@1';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@4';
import { generateText } from 'npm:ai@7';

const google = createGoogleGenerativeAI({ apiKey: Deno.env.get('GEMINI_API_KEY') });
const MODELO = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Usa POST', { status: 405 });

    const body = await req.json().catch(() => ({}));
    let { dataUrl, base64 } = body;

    if (!dataUrl && !base64) {
      return new Response(JSON.stringify({ error: 'Falta la imagen (dataUrl o base64)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extraer base64 limpio si viene en formato data URL (data:image/jpeg;base64,...)
    if (dataUrl && dataUrl.includes(',')) {
      base64 = dataUrl.split(',')[1];
    } else if (dataUrl) {
      base64 = dataUrl;
    }

    try {
      const { text } = await generateText({
        model: google(MODELO),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe brevemente lo que se ve en esta fotografía en una o dos oraciones en español. Sé conciso y objetivo.',
              },
              {
                type: 'file',
                mediaType: 'image/jpeg',
                data: base64,
              },
            ],
          },
        ],
        temperature: 0.2,
        maxTokens: 250,
      });

      return new Response(JSON.stringify({ descripcion: text.trim() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error al generar descripción con Gemini:', error);
      return new Response(
        JSON.stringify({ error: 'No se pudo generar la descripción de la imagen.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),
};
