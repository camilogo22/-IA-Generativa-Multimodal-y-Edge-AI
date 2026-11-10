import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';

/**
 * Transporte de useChat hacia la Edge Function "tutor".
 * - api: URL pública de la función en Supabase.
 * - headers: envía el token si existe o la publishable key si no hay login.
 * - fetch: el de Expo, que sí entrega la respuesta por partes (streaming).
 */
export function crearTransporte(funcion = 'tutor') {
  return new DefaultChatTransport({
    api: `${SUPABASE_URL}/functions/v1/${funcion}`,
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = data.session?.access_token || SUPABASE_PUBLISHABLE_KEY;
      return { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY };
    },
  });
}
