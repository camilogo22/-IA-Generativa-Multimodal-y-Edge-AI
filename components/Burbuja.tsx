import type { UIMessage } from 'ai';
import { Image, StyleSheet, Text, View } from 'react-native';

/** Pinta un mensaje recorriendo sus parts: texto e imágenes. */
export function Burbuja({ mensaje }: { mensaje: UIMessage }) {
  const esUsuario = mensaje.role === 'user';
  return (
    <View style={[s.burbuja, esUsuario ? s.usuario : s.ia]}>
      {mensaje.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <Text key={i} style={esUsuario ? s.textoUsuario : s.texto}>{part.text}</Text>;
          case 'file':
            return part.mediaType.startsWith('image') ? (
              <Image key={i} source={{ uri: part.url }} style={s.foto} />
            ) : null;
          default:
            return null; // reasoning, step-start, herramientas: no se muestran en este ejemplo
        }
      })}
    </View>
  );
}

const s = StyleSheet.create({
  burbuja: { maxWidth: '85%', borderRadius: 14, padding: 12, marginVertical: 4, gap: 8 },
  usuario: { alignSelf: 'flex-end', backgroundColor: '#15803d' },
  ia: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  texto: { fontSize: 15, color: '#111', lineHeight: 21 },
  textoUsuario: { fontSize: 15, color: '#fff', lineHeight: 21 },
  foto: { width: 200, height: 200, borderRadius: 10 },
});
