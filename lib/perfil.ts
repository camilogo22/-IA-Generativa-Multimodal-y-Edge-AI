import * as SecureStore from 'expo-secure-store';

export interface PerfilEstudiante {
  nombre: string;
  tema: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
}

const CLAVE_PERFIL = 'tutor_ia_perfil_v1';

export const PERFIL_DEFAULT: PerfilEstudiante = {
  nombre: 'Camilo Gómez',
  tema: 'React Native y TypeScript',
  nivel: 'intermedio',
};

export async function obtenerPerfil(): Promise<PerfilEstudiante> {
  try {
    const raw = await SecureStore.getItemAsync(CLAVE_PERFIL);
    if (!raw) return PERFIL_DEFAULT;
    return { ...PERFIL_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return PERFIL_DEFAULT;
  }
}

export async function guardarPerfil(perfil: PerfilEstudiante): Promise<void> {
  try {
    await SecureStore.setItemAsync(CLAVE_PERFIL, JSON.stringify(perfil));
  } catch (e) {
    console.error('Error guardando perfil:', e);
  }
}
