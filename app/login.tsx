import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!email.includes('@') || clave.length < 6) {
      Alert.alert('Revisa los datos', 'Correo válido y contraseña de al menos 6 caracteres.');
      return;
    }
    setEnviando(true);
    const { error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password: clave })
        : await supabase.auth.signUp({ email, password: clave });
    setEnviando(false);
    if (error) Alert.alert('No se pudo', error.message);
    // Si todo sale bien, onAuthStateChange cambia la sesión y Stack.Protected lleva al chat.
  }

  return (
    <SafeAreaView style={s.pantalla}>
      <Text style={s.titulo}>Tutor IA</Text>
      <Text style={s.sub}>{modo === 'entrar' ? 'Inicia sesión' : 'Crea tu cuenta'}</Text>
      <TextInput style={s.input} placeholder="correo@uniguajira.edu.co" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={clave} onChangeText={setClave} />
      <Pressable style={s.boton} onPress={enviar} disabled={enviando}>
        {enviando ? <ActivityIndicator color="#fff" /> : <Text style={s.botonTexto}>{modo === 'entrar' ? 'Entrar' : 'Registrarme'}</Text>}
      </Pressable>
      <Pressable onPress={() => setModo(modo === 'entrar' ? 'registro' : 'entrar')}>
        <Text style={s.link}>{modo === 'entrar' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#f6f8f7' },
  titulo: { fontSize: 32, fontWeight: '700', color: '#14532d' },
  sub: { fontSize: 16, color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd' },
  boton: { backgroundColor: '#15803d', borderRadius: 10, padding: 14, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#15803d', textAlign: 'center', marginTop: 8 },
});
