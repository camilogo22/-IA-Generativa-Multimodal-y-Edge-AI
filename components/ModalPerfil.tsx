import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  guardarPerfil,
  obtenerPerfil,
  PerfilEstudiante,
} from '../lib/perfil';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onGuardado: (perfil: PerfilEstudiante) => void;
}

export function ModalPerfil({ visible, onCerrar, onGuardado }: Props) {
  const [nombre, setNombre] = useState('');
  const [tema, setTema] = useState('');
  const [nivel, setNivel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');

  useEffect(() => {
    if (visible) {
      obtenerPerfil().then((p) => {
        setNombre(p.nombre);
        setTema(p.tema);
        setNivel(p.nivel);
      });
    }
  }, [visible]);

  async function guardar() {
    const nuevoPerfil: PerfilEstudiante = {
      nombre: nombre.trim(),
      tema: tema.trim() || 'React Native y TypeScript',
      nivel,
    };
    await guardarPerfil(nuevoPerfil);
    onGuardado(nuevoPerfil);
    onCerrar();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.tarjeta}>
          <Text style={s.titulo}>👤 Perfil del Estudiante (C2)</Text>
          <Text style={s.subtitulo}>Personaliza cómo el Tutor IA responderá a tus dudas.</Text>

          <Text style={s.label}>Tu Nombre:</Text>
          <TextInput
            style={s.input}
            placeholder="Ej. Juan Gómez"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={s.label}>Tema de Interés:</Text>
          <TextInput
            style={s.input}
            placeholder="Ej. Hooks, SQLite, Navegación"
            value={tema}
            onChangeText={setTema}
          />

          <Text style={s.label}>Nivel de Conocimiento:</Text>
          <View style={s.filaNivel}>
            {(['principiante', 'intermedio', 'avanzado'] as const).map((niv) => (
              <Pressable
                key={niv}
                style={[s.botonNivel, nivel === niv && s.botonNivelActivo]}
                onPress={() => setNivel(niv)}
              >
                <Text style={[s.textoNivel, nivel === niv && s.textoNivelActivo]}>
                  {niv.charAt(0).toUpperCase() + niv.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={s.acciones}>
            <Pressable style={s.botonCancelar} onPress={onCerrar}>
              <Text style={s.textoCancelar}>Cancelar</Text>
            </Pressable>
            <Pressable style={s.botonGuardar} onPress={guardar}>
              <Text style={s.textoGuardar}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  filaNivel: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 16 },
  botonNivel: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  botonNivelActivo: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  textoNivel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  textoNivelActivo: { color: '#ffffff' },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  botonCancelar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  textoCancelar: { color: '#64748b', fontWeight: '600' },
  botonGuardar: { backgroundColor: '#15803d', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  textoGuardar: { color: '#ffffff', fontWeight: '600' },
});
