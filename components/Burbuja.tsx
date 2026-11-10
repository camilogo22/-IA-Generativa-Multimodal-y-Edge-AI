import type { UIMessage } from 'ai';
import { Image, StyleSheet, Text, View } from 'react-native';

/** Pinta un mensaje con avatar y diseño moderno de burbuja. */
export function Burbuja({ mensaje }: { mensaje: UIMessage }) {
  const esUsuario = mensaje.role === 'user';
  return (
    <View style={[s.fila, esUsuario ? s.filaUsuario : s.filaIA]}>
      {!esUsuario && (
        <View style={s.avatarIA}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
      )}
      <View style={[s.burbuja, esUsuario ? s.usuario : s.ia]}>
        {mensaje.parts?.map((part: any, i: number) => {
          switch (part.type) {
            case 'text':
              return (
                <Text key={i} style={esUsuario ? s.textoUsuario : s.texto}>
                  {part.text}
                </Text>
              );
            case 'file':
              return part.mediaType.startsWith('image') ? (
                <Image key={i} source={{ uri: part.url }} style={s.foto} resizeMode="cover" />
              ) : null;
            default:
              return null;
          }
        })}
      </View>
      {esUsuario && (
        <View style={s.avatarUsuario}>
          <Text style={{ fontSize: 16 }}>👤</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    gap: 8,
  },
  filaUsuario: {
    justifyContent: 'flex-end',
  },
  filaIA: {
    justifyContent: 'flex-start',
  },
  avatarIA: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  avatarUsuario: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burbuja: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  usuario: {
    backgroundColor: '#15803d',
    borderBottomRightRadius: 4,
  },
  ia: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  texto: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  textoUsuario: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  foto: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
});
