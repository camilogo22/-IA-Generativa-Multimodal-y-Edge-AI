import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

export interface ResultadoDescripcion {
  descripcion?: string;
  error?: string;
}

/**
 * Reduce la fotografía a 1024px de ancho, calidad JPEG 0.7 (~150 KB)
 * y llama a la Edge Function "describir-foto" mediante supabase.functions.invoke (Requisito T2).
 */
export async function describirFotoConIA(uri: string): Promise<string> {
  // 1. Reducir la imagen
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1024 });
  const imagen = await ctx.renderAsync();
  const guardada = await imagen.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });

  const dataUrl = `data:image/jpeg;base64,${guardada.base64}`;

  // 2. Invocar la Edge Function con el token de sesión automático
  const { data, error } = await supabase.functions.invoke<ResultadoDescripcion>('describir-foto', {
    body: { dataUrl },
  });

  if (error) {
    let mensajeError = error.message;
    // Si viene error HTTP de FunctionsHttpError, extraer cuerpo json
    if ('context' in error && typeof (error as any).context?.json === 'function') {
      try {
        const bodyError = await (error as any).context.json();
        if (bodyError?.error) mensajeError = bodyError.error;
      } catch {
        // ignorar fallo al parsear error json
      }
    }
    throw new Error(mensajeError || 'Error al comunicarse con la función de visión.');
  }

  if (!data?.descripcion) {
    throw new Error('La función no devolvió una descripción válida.');
  }

  return data.descripcion;
}
