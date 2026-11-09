import { useChat } from '@ai-sdk/react';
import type { FileUIPart, UIMessage } from 'ai';
import { Stack } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerSinRed } from '../components/BannerSinRed';
import { Burbuja } from '../components/Burbuja';
import { ModalPerfil } from '../components/ModalPerfil';
import { ModalTarjetas } from '../components/ModalTarjetas';
import { crearTransporte } from '../lib/chatTransport';
import { elegirFoto } from '../lib/foto';
import { cargarHistorial, guardarHistorial, limpiarHistorial } from '../lib/historial';
import { supabase } from '../lib/supabase';

export default function Chat() {
  const transport = useMemo(() => crearTransporte('tutor'), []);
  const [mensajesIniciales, setMensajesIniciales] = useState<UIMessage[]>([]);
  const [historialListo, setHistorialListo] = useState(false);

  // Estados para modales de Retos C2 y C3
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);
  const [modalTarjetasVisible, setModalTarjetasVisible] = useState(false);

  // Cargar historial previo (Reto C1)
  useEffect(() => {
    cargarHistorial().then((h) => {
      setMensajesIniciales(h);
      setHistorialListo(true);
    });
  }, []);

  if (!historialListo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <ChatConHistorial
      transport={transport}
      initialMessages={mensajesIniciales}
      modalPerfilVisible={modalPerfilVisible}
      setModalPerfilVisible={setModalPerfilVisible}
      modalTarjetasVisible={modalTarjetasVisible}
      setModalTarjetasVisible={setModalTarjetasVisible}
    />
  );
}

interface ChatInternoProps {
  transport: ReturnType<typeof crearTransporte>;
  initialMessages: UIMessage[];
  modalPerfilVisible: boolean;
  setModalPerfilVisible: (v: boolean) => void;
  modalTarjetasVisible: boolean;
  setModalTarjetasVisible: (v: boolean) => void;
}

function ChatConHistorial({
  transport,
  initialMessages,
  modalPerfilVisible,
  setModalPerfilVisible,
  modalTarjetasVisible,
  setModalTarjetasVisible,
}: ChatInternoProps) {
  // Reto C1: Persistir al finalizar streaming con onFinish
  const { messages, setMessages, sendMessage, status, error, stop, clearError, regenerate } = useChat({
    transport,
    initialMessages,
    onFinish: ({ messages: m }) => {
      guardarHistorial(m);
    },
  });

  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<FileUIPart | null>(null);
  const lista = useRef<FlatList>(null);

  // Reto C4: Estado de red
  const networkState = useNetworkState();
  const sinRed = !networkState.isConnected || networkState.isInternetReachable === false;
  const ocupado = status === 'submitted' || status === 'streaming';

  function enviar() {
    if (sinRed) {
      Alert.alert('Sin conexión', 'No tienes conexión a internet para consultar al Tutor IA.');
      return;
    }
    const t = texto.trim();
    if (!t && !foto) return;

    sendMessage({ text: t || '¿Qué ves en esta foto?', files: foto ? [foto] : undefined });
    setTexto('');
    setFoto(null);
  }

  async function adjuntar(origen: 'camara' | 'galeria') {
    try {
      const f = await elegirFoto(origen);
      if (f) setFoto(f);
    } catch (e) {
      Alert.alert('Foto', (e as Error).message);
    }
  }

  async function nuevaConversacion() {
    Alert.alert(
      'Nueva conversación',
      '¿Deseas reiniciar el chat y borrar el historial guardado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            await limpiarHistorial();
            setMessages([]);
            clearError();
          },
        },
      ]
    );
  }

  // Convertir mensajes a texto para el generador de tarjetas (Reto C3)
  const textoConversacion = messages
    .map((m) => {
      const contenido = m.parts
        ?.filter((p) => p.type === 'text')
        .map((p: any) => p.text)
        .join(' ');
      return `${m.role === 'user' ? 'Estudiante' : 'Tutor'}: ${contenido || ''}`;
    })
    .join('\n');

  return (
    <SafeAreaView style={s.pantalla} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Tutor IA',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => setModalTarjetasVisible(true)}>
                <Text style={s.botonHeader}>🗂️ Tarjetas</Text>
              </Pressable>
              <Pressable onPress={() => setModalPerfilVisible(true)}>
                <Text style={s.botonHeader}>👤 Perfil</Text>
              </Pressable>
              <Pressable onPress={nuevaConversacion}>
                <Text style={s.botonHeader}>✨ Nueva</Text>
              </Pressable>
              <Pressable onPress={() => supabase.auth.signOut()}>
                <Text style={s.salir}>Salir</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Reto C4: Banner Offline */}
      <BannerSinRed conectado={!sinRed} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={lista}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Burbuja mensaje={item} />}
          contentContainerStyle={{ padding: 12 }}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 24 }}>
              <Text style={s.vacioTitulo}>¡Bienvenido al Tutor IA!</Text>
              <Text style={s.vacio}>
                Haz preguntas sobre Programación Móvil, Expo, TypeScript o envía una foto de tu código.
              </Text>
            </View>
          }
        />

        {status === 'submitted' && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ActivityIndicator size="small" color="#15803d" />
            <Text style={{ fontSize: 13, color: '#15803d', fontWeight: '500' }}>Tutor pensando...</Text>
          </View>
        )}

        {/* Retos C4 y C5: Alerta detallada de error con Reintentar */}
        {error && (
          <View style={s.errorContenedor}>
            <View style={{ flex: 1 }}>
              <Text style={s.errorTitulo}>
                {error.message.includes('429') || error.message.includes('Límite')
                  ? '⏳ Límite de consultas'
                  : '⚠️ Ocurrió un problema'}
              </Text>
              <Text style={s.errorTexto}>{error.message}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {regenerate && (
                <Pressable
                  style={s.botonReintentar}
                  onPress={() => {
                    clearError();
                    regenerate();
                  }}
                >
                  <Text style={s.textoReintentar}>Reintentar</Text>
                </Pressable>
              )}
              <Pressable style={s.botonCerrarError} onPress={clearError}>
                <Text style={s.textoCerrarError}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {foto && (
          <View style={s.previa}>
            <Image source={{ uri: foto.url }} style={s.miniatura} />
            <Text style={{ flex: 1, color: '#555', fontSize: 13 }}>
              Foto lista. Se enviará a Google Gemini.
            </Text>
            <Pressable onPress={() => setFoto(null)}>
              <Text style={s.salir}>Quitar</Text>
            </Pressable>
          </View>
        )}

        <View style={s.barra}>
          <Pressable
            style={s.icono}
            onPress={() => adjuntar('camara')}
            disabled={ocupado || sinRed}
          >
            <Text style={{ opacity: ocupado || sinRed ? 0.3 : 1 }}>📷</Text>
          </Pressable>
          <Pressable
            style={s.icono}
            onPress={() => adjuntar('galeria')}
            disabled={ocupado || sinRed}
          >
            <Text style={{ opacity: ocupado || sinRed ? 0.3 : 1 }}>🖼️</Text>
          </Pressable>
          <TextInput
            style={[s.input, sinRed && { backgroundColor: '#e2e8f0' }]}
            placeholder={sinRed ? 'Sin conexión a internet...' : 'Escribe tu pregunta...'}
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!ocupado && !sinRed}
          />
          {ocupado ? (
            <Pressable style={[s.enviar, { backgroundColor: '#dc2626' }]} onPress={stop}>
              <Text style={s.enviarTexto}>■</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[s.enviar, (sinRed || (!texto.trim() && !foto)) && s.enviarDesactivado]}
              onPress={enviar}
              disabled={sinRed || (!texto.trim() && !foto)}
            >
              <Text style={s.enviarTexto}>➤</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modales C2 y C3 */}
      <ModalPerfil
        visible={modalPerfilVisible}
        onCerrar={() => setModalPerfilVisible(false)}
        onGuardado={() => {}}
      />
      <ModalTarjetas
        visible={modalTarjetasVisible}
        conversacion={textoConversacion}
        onCerrar={() => setModalTarjetasVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#f6f8f7' },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  vacio: { textAlign: 'center', color: '#64748b', fontSize: 14, lineHeight: 20 },
  botonHeader: { color: '#0f766e', fontWeight: '600', fontSize: 13 },
  salir: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  errorContenedor: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorTitulo: { color: '#991b1b', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  errorTexto: { color: '#b91c1c', fontSize: 12 },
  botonReintentar: {
    backgroundColor: '#dc2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoReintentar: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  botonCerrarError: { padding: 4 },
  textoCerrarError: { color: '#991b1b', fontSize: 16, fontWeight: 'bold' },
  previa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  miniatura: { width: 44, height: 44, borderRadius: 8 },
  barra: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  icono: { padding: 10 },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  enviar: {
    backgroundColor: '#15803d',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarDesactivado: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  enviarTexto: { color: '#fff', fontSize: 18 },
});
