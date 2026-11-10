import { useChat } from '@ai-sdk/react';
import type { FileUIPart } from 'ai';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Burbuja } from '../components/Burbuja';
import { crearTransporte } from '../lib/chatTransport';
import { elegirFoto } from '../lib/foto';
import { supabase } from '../lib/supabase';

export default function Chat() {
  const transport = useMemo(() => crearTransporte('tutor'), []);
  const { messages, sendMessage, status, error, stop, clearError } = useChat({ transport });
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<FileUIPart | null>(null);
  const lista = useRef<FlatList>(null);

  const ocupado = status === 'submitted' || status === 'streaming';

  function enviar() {
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

  return (
    <SafeAreaView style={s.pantalla} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Tutor IA',
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={lista}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Burbuja mensaje={item} />}
          contentContainerStyle={{ padding: 12 }}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={s.vacio}>
              Pregúntame lo que quieras de programación móvil. También puedes enviarme una foto.
            </Text>
          }
        />

        {status === 'submitted' && <ActivityIndicator style={{ marginBottom: 8 }} />}

        {error && (
          <Pressable style={s.error} onPress={clearError}>
            <Text style={s.errorTexto}>{error.message}</Text>
            <Text style={s.errorTexto}>Toca para cerrar</Text>
          </Pressable>
        )}

        {foto && (
          <View style={s.previa}>
            <Image source={{ uri: foto.url }} style={s.miniatura} />
            <Text style={{ flex: 1, color: '#555' }}>Foto lista. Se enviará a Google Gemini.</Text>
            <Pressable onPress={() => setFoto(null)}><Text style={s.salir}>Quitar</Text></Pressable>
          </View>
        )}

        <View style={s.barra}>
          <Pressable style={s.icono} onPress={() => adjuntar('camara')} disabled={ocupado}><Text>📷</Text></Pressable>
          <Pressable style={s.icono} onPress={() => adjuntar('galeria')} disabled={ocupado}><Text>🖼️</Text></Pressable>
          <TextInput
            style={s.input}
            placeholder="Escribe tu pregunta"
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!ocupado}
          />
          {ocupado ? (
            <Pressable style={s.enviar} onPress={stop}><Text style={s.enviarTexto}>■</Text></Pressable>
          ) : (
            <Pressable style={s.enviar} onPress={enviar}><Text style={s.enviarTexto}>➤</Text></Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#f6f8f7' },
  vacio: { textAlign: 'center', color: '#777', marginTop: 40, paddingHorizontal: 24 },
  salir: { color: '#15803d', fontWeight: '600' },
  error: { backgroundColor: '#fee2e2', marginHorizontal: 12, padding: 10, borderRadius: 10, marginBottom: 8 },
  errorTexto: { color: '#991b1b' },
  previa: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 8 },
  miniatura: { width: 48, height: 48, borderRadius: 8 },
  barra: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 8, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  icono: { padding: 10 },
  input: { flex: 1, maxHeight: 120, backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  enviar: { backgroundColor: '#15803d', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  enviarTexto: { color: '#fff', fontSize: 18 },
});
