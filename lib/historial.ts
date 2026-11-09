import type { UIMessage } from 'ai';
import * as SecureStore from 'expo-secure-store';

const CLAVE_HISTORIAL = 'tutor_ia_historial_v1';

/**
 * Guarda los mensajes persistidos de la conversación actual (Reto C1).
 */
export async function guardarHistorial(mensajes: UIMessage[]): Promise<void> {
  try {
    // Almacenamos únicamente los últimos 50 mensajes para optimizar espacio y memoria
    const aGuardar = mensajes.slice(-50);
    await SecureStore.setItemAsync(CLAVE_HISTORIAL, JSON.stringify(aGuardar));
  } catch (error) {
    console.error('Error al guardar historial de chat:', error);
  }
}

/**
 * Carga el historial previo al abrir la aplicación.
 */
export async function cargarHistorial(): Promise<UIMessage[]> {
  try {
    const data = await SecureStore.getItemAsync(CLAVE_HISTORIAL);
    if (!data) return [];
    return JSON.parse(data) as UIMessage[];
  } catch {
    return [];
  }
}

/**
 * Limpia el historial para comenzar una "Nueva conversación".
 */
export async function limpiarHistorial(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CLAVE_HISTORIAL);
  } catch (error) {
    console.error('Error al limpiar historial:', error);
  }
}
