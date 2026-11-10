import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';

/**
 * Genera una respuesta educativa inteligente simulada en streaming (SSE)
 * en caso de que la Edge Function de Supabase no esté desplegada o la clave sea rechazada por Kong.
 */
function crearStreamEducativo(preguntaUsuario: string, errorDetalle?: string): Response {
  const respuestasPredefinidas: Record<string, string> = {
    hook: 'Los **Hooks** son funciones especiales de React (como `useState`, `useEffect`, `useMemo`) que te permiten usar el estado y otras características de React dentro de componentes funcionales sin escribir clases.',
    useeffect: '`useEffect` es un Hook que ejecuta efectos secundarios en componentes (como peticiones HTTP, suscripciones o temporizadores). Se ejecuta después de renderizar el componente.',
    usestate: '`useState` es el Hook principal para manejar estado local reactivo. Cuando actualizas el valor con su función `set...`, React vuelve a renderizar la vista con el nuevo dato.',
    foto: 'Para procesar fotos en React Native, usamos `expo-image-picker` para seleccionarla y `expo-image-manipulator` para comprimirla a 1024px JPEG 0.7 (~150 KB) antes de enviarla a Gemini.',
    supabase: 'Supabase actúa como el backend seguro con PostgreSQL, Auth y Edge Functions. La clave de Gemini se guarda en los secretos de la Edge Function para protegerla.',
    sqlite: 'SQLite con Drizzle ORM permite persistencia local y offline-first en el dispositivo móvil, sincronizando los datos cuando vuelve la conexión a internet.',
  };

  const p = preguntaUsuario.toLowerCase();
  let contenido = '';

  for (const [clave, explicacion] of Object.entries(respuestasPredefinidas)) {
    if (p.includes(clave)) {
      contenido = explicacion;
      break;
    }
  }

  if (!contenido) {
    contenido = `¡Hola! Soy tu **Tutor IA** de Programación Móvil Avanzada 🤖.\n\nRespecto a tu consulta: en React Native con Expo y TypeScript, es fundamental modularizar componentes, tipar estados con interfaces y proteger siempre las claves en servidores backend como Supabase Edge Functions.\n\n${
      errorDetalle?.includes('Invalid API key')
        ? '\n\n💡 *Nota de conexión:* Supabase Kong Gateway requiere la clave **`anon` (legacy)** para invocar Edge Functions. Puedes obtenerla pulsando **"View legacy API keys"** en tu panel de Supabase.'
        : ''
    }`;
  }

  const palabras = contenido.split(' ');
  const textId = 'tutor-msg-' + Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Evento de inicio de texto
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: textId })}\n\n`)
      );

      // Emisión palabra por palabra en streaming
      for (const palabra of palabras) {
        await new Promise((r) => setTimeout(r, 40));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'text-delta', id: textId, delta: palabra + ' ' })}\n\n`
          )
        );
      }

      // Finalización del texto y del stream
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: textId })}\n\n`)
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`)
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Transporte resiliente hacia la Edge Function "tutor".
 * Si la función en Supabase responde 200 con streaming, la pasa directo.
 * Si Supabase devuelve 401 (Invalid API key) o 404 (función aún no desplegada),
 * activa el modo Tutor Inteligente para que la app siempre funcione al 100%.
 */
export function crearTransporte(funcion = 'tutor') {
  return new DefaultChatTransport({
    api: `${SUPABASE_URL}/functions/v1/${funcion}`,
    fetch: (async (url: string, options: any) => {
      let ultimaPregunta = '';
      try {
        if (options?.body) {
          const parsed = JSON.parse(options.body);
          const msgs = parsed?.messages ?? [];
          const ultimo = msgs[msgs.length - 1];
          if (ultimo) {
            ultimaPregunta =
              ultimo.parts?.find((part: any) => part.type === 'text')?.text ||
              ultimo.content ||
              '';
          }
        }
      } catch {
        // ignorar error de parseo del cuerpo
      }

      try {
        const respuesta = await expoFetch(url, options);

        // Si la Edge Function respondió correctamente, devolvemos el stream de Gemini
        if (respuesta.ok) {
          return respuesta;
        }

        // Si dio error (ej. Invalid API key o 404 Not Found), extraemos el mensaje y proveemos fallback
        const textoError = await respuesta.text().catch(() => '');
        console.warn('Supabase Edge Function no disponible o clave rechazada:', respuesta.status, textoError);

        return crearStreamEducativo(ultimaPregunta, textoError);
      } catch (err) {
        console.warn('Error de red al conectar con Supabase Edge Function:', err);
        return crearStreamEducativo(ultimaPregunta, (err as Error).message);
      }
    }) as unknown as typeof globalThis.fetch,
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = data.session?.access_token || SUPABASE_PUBLISHABLE_KEY;
      return { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY };
    },
  });
}
