import { useChat } from '@ai-sdk/react';
import type { FileUIPart } from 'ai';
import { Stack } from 'expo-router';
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
import { obtenerPerfil, PerfilEstudiante } from '../lib/perfil';

export default function Chat() {
  const transport = useMemo(() => crearTransporte('tutor'), []);
  const { messages, setMessages, sendMessage, status, error, stop, clearError } = useChat({ transport });
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<FileUIPart | null>(null);
  const [modalTarjetasVisible, setModalTarjetasVisible] = useState(false);
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const lista = useRef<FlatList>(null);

  const ocupado = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    obtenerPerfil().then(setPerfil);
  }, []);

  function enviar(textoPersonalizado?: string) {
    const t = (textoPersonalizado ?? texto).trim();
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

  function reiniciarChat() {
    Alert.alert('Reiniciar conversación', '¿Deseas vaciar los mensajes y comenzar de nuevo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: () => setMessages([]) },
    ]);
  }

  const textoConversacion = messages
    .map((m: any) => {
      const contenido = m.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join(' ');
      return `${m.role === 'user' ? 'Estudiante' : 'Tutor'}: ${contenido || ''}`;
    })
    .join('\n');

  return (
    <SafeAreaView style={s.pantalla} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Tutor IA 🤖',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Pressable onPress={() => setModalPerfilVisible(true)} style={{ paddingHorizontal: 8 }}>
              <Text style={s.botonHeader}>👤 Perfil</Text>
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {messages.length > 0 && (
                <Pressable onPress={() => setModalTarjetasVisible(true)}>
                  <Text style={s.botonHeader}>🗂️ Tarjetas</Text>
                </Pressable>
              )}
              {messages.length > 0 && (
                <Pressable onPress={reiniciarChat}>
                  <Text style={s.botonHeader}>🗑️</Text>
                </Pressable>
              )}
            </View>
          ),
        }}
      />

      <BannerSinRed />

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
          contentContainerStyle={{ padding: 14, flexGrow: 1 }}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={s.vacioContainer}>
              <View style={s.iconoGrandeBox}>
                <Text style={{ fontSize: 40 }}>🎓</Text>
              </View>
              <Text style={s.vacioTitulo}>
                ¡Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''}! Soy tu Tutor IA
              </Text>
              <Text style={s.vacioSub}>
                Resuelvo tus dudas de programación móvil en React Native, Expo y TypeScript. También puedes enviarme una foto de tu código o pantalla.
              </Text>
              <View style={s.sugerencias}>
                <Text style={s.sugerenciasTitulo}>Sugerencias rápidas:</Text>
                {[
                  '¿Qué es un Hook y cómo funciona?',
                  '¿Cuándo debo usar useEffect?',
                  '¿Qué diferencia hay entre useState y useRef?',
                ].map((sug, i) => (
                  <Pressable key={i} style={s.chip} onPress={() => enviar(sug)}>
                    <Text style={s.chipTexto}>💡 {sug}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
        />

        {status === 'submitted' && (
          <View style={s.cargandoBox}>
            <ActivityIndicator size="small" color="#15803d" />
            <Text style={s.cargandoTexto}>Tutor pensando...</Text>
          </View>
        )}

        {error && (
          <Pressable style={s.error} onPress={clearError}>
            <Text style={s.errorTexto}>{error.message}</Text>
            <Text style={s.errorCerrar}>Toca para descartar</Text>
          </Pressable>
        )}

        {foto && (
          <View style={s.previa}>
            <Image source={{ uri: foto.url }} style={s.miniatura} />
            <Text style={{ flex: 1, color: '#475569', fontSize: 13 }}>
              Foto lista para analizar con IA.
            </Text>
            <Pressable onPress={() => setFoto(null)}>
              <Text style={s.quitarFoto}>Quitar</Text>
            </Pressable>
          </View>
        )}

        <View style={s.barra}>
          <Pressable style={s.icono} onPress={() => adjuntar('camara')} disabled={ocupado}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </Pressable>
          <Pressable style={s.icono} onPress={() => adjuntar('galeria')} disabled={ocupado}>
            <Text style={{ fontSize: 20 }}>🖼️</Text>
          </Pressable>
          <TextInput
            style={s.input}
            placeholder="Escribe tu pregunta aquí..."
            placeholderTextColor="#94a3b8"
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!ocupado}
          />
          {ocupado ? (
            <Pressable style={[s.enviar, { backgroundColor: '#dc2626' }]} onPress={stop}>
              <Text style={s.enviarTexto}>■</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[s.enviar, !texto.trim() && !foto && s.enviarInactivo]}
              onPress={() => enviar()}
              disabled={!texto.trim() && !foto}
            >
              <Text style={s.enviarTexto}>➤</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <ModalPerfil
        visible={modalPerfilVisible}
        onCerrar={() => setModalPerfilVisible(false)}
        onGuardado={(p) => setPerfil(p)}
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
  pantalla: { flex: 1, backgroundColor: '#f8fafc' },
  botonHeader: { color: '#15803d', fontWeight: '700', fontSize: 14 },
  vacioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  iconoGrandeBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vacioTitulo: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  vacioSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  sugerencias: { width: '100%', gap: 8 },
  sugerenciasTitulo: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chipTexto: { fontSize: 13, color: '#334155', fontWeight: '500' },
  cargandoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  cargandoTexto: { fontSize: 13, color: '#15803d', fontWeight: '600' },
  error: { backgroundColor: '#fee2e2', marginHorizontal: 14, padding: 10, borderRadius: 12, marginBottom: 8 },
  errorTexto: { color: '#991b1b', fontSize: 12 },
  errorCerrar: { color: '#b91c1c', fontSize: 11, fontWeight: '600', marginTop: 4 },
  previa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniatura: { width: 44, height: 44, borderRadius: 8 },
  quitarFoto: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  icono: { padding: 8 },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  enviar: {
    backgroundColor: '#15803d',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarInactivo: {
    backgroundColor: '#cbd5e1',
  },
  enviarTexto: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
