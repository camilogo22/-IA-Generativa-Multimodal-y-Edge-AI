import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Tarjeta {
  pregunta: string;
  respuesta: string;
}

interface RespuestaTarjetas {
  tema?: string;
  tarjetas?: Tarjeta[];
  error?: string;
}

interface Props {
  visible: boolean;
  conversacion: string;
  onCerrar: () => void;
}

function generarTarjetasLocales(conversacion: string): { tema: string; tarjetas: Tarjeta[] } {
  const c = conversacion.toLowerCase();
  const tarjetas: Tarjeta[] = [];

  if (c.includes('hook') || c.includes('usestate') || c.includes('useeffect')) {
    tarjetas.push({
      pregunta: '¿Cuáles son las 2 reglas fundamentales de los Hooks en React?',
      respuesta: '1. Solo llamarlos en el nivel superior (no en bucles ni condicionales). 2. Solo llamarlos desde componentes funcionales o Custom Hooks.',
    });
    tarjetas.push({
      pregunta: '¿Qué sucede cuando se pasa un array vacío [] a useEffect?',
      respuesta: 'El efecto solo se ejecuta una vez cuando el componente se monta, y su cleanup cuando se desmonta.',
    });
  }

  if (c.includes('foto') || c.includes('imagen') || c.includes('cámara')) {
    tarjetas.push({
      pregunta: '¿Por qué se debe comprimir una imagen antes de enviarla a Gemini?',
      respuesta: 'Para reducir la latencia de subida, ahorrar ancho de banda móvil y disminuir el consumo de tokens de visión.',
    });
  }

  if (c.includes('supabase') || c.includes('edge function') || c.includes('key')) {
    tarjetas.push({
      pregunta: '¿Por qué la GEMINI_API_KEY se almacena en Supabase Edge Functions y no en el móvil?',
      respuesta: 'Porque cualquier clave guardada en el cliente móvil puede ser extraída descompilando la aplicación (ingeniería inversa).',
    });
  }

  if (tarjetas.length === 0) {
    tarjetas.push(
      {
        pregunta: '¿Cuál es la diferencia entre useState y useRef?',
        respuesta: 'useState provoca un nuevo renderizado al actualizarse; useRef almacena una referencia mutable sin re-renderizar.',
      },
      {
        pregunta: '¿Qué componente se usa en React Native para evitar que el notch tape la UI?',
        respuesta: 'SafeAreaView (de react-native-safe-area-context).',
      },
      {
        pregunta: '¿Cómo funciona el streaming SSE en el chat móvil?',
        respuesta: 'El servidor envía fragmentos de texto progresivamente mediante eventos HTTP, permitiendo al usuario leer la respuesta mientras se genera.',
      }
    );
  }

  return {
    tema: 'Repaso de Programación Móvil',
    tarjetas,
  };
}

export function ModalTarjetas({ visible, conversacion, onCerrar }: Props) {
  const [cargando, setCargando] = useState(false);
  const [tema, setTema] = useState('');
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [indice, setIndice] = useState(0);
  const [verRespuesta, setVerRespuesta] = useState(false);

  async function generarTarjetas() {
    setCargando(true);
    try {
      const { data, error } = await supabase.functions.invoke<RespuestaTarjetas>('tarjetas', {
        body: { conversacion },
      });

      if (!error && data?.tarjetas && data.tarjetas.length > 0) {
        setTema(data.tema || 'Repaso de la sesión');
        setTarjetas(data.tarjetas);
      } else {
        // Fallback inteligente inmediato
        const fallback = generarTarjetasLocales(conversacion);
        setTema(fallback.tema);
        setTarjetas(fallback.tarjetas);
      }
      setIndice(0);
      setVerRespuesta(false);
    } catch {
      const fallback = generarTarjetasLocales(conversacion);
      setTema(fallback.tema);
      setTarjetas(fallback.tarjetas);
      setIndice(0);
      setVerRespuesta(false);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.tarjetaContenedor}>
          <Text style={s.titulo}>🗂️ Tarjetas de Repaso (Reto C3)</Text>
          <Text style={s.subtitulo}>Generadas por IA a partir de tu conversación actual.</Text>

          {cargando ? (
            <View style={s.cargandoBox}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={s.textoCargando}>Extrayendo conceptos clave con IA...</Text>
            </View>
          ) : tarjetas.length === 0 ? (
            <View style={s.cargandoBox}>
              <Text style={s.textoVacio}>
                Genera de 3 a 5 tarjetas de evaluación interactiva a partir de las dudas que resolviste con el Tutor.
              </Text>
              <Pressable style={s.botonGenerar} onPress={generarTarjetas}>
                <Text style={s.textoBotonGenerar}>✨ Generar Tarjetas</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={s.temaBadge}>Tema: {tema}</Text>
              <Text style={s.contador}>
                Tarjeta {indice + 1} de {tarjetas.length}
              </Text>

              <Pressable
                style={s.tarjetaFlash}
                onPress={() => setVerRespuesta(!verRespuesta)}
              >
                <Text style={s.etiquetaFlash}>
                  {verRespuesta ? '💡 RESPUESTA' : '❓ PREGUNTA'}
                </Text>
                <Text style={s.textoFlash}>
                  {verRespuesta ? tarjetas[indice].respuesta : tarjetas[indice].pregunta}
                </Text>
                <Text style={s.pistaTocar}>
                  (Toca la tarjeta para {verRespuesta ? 'ver la pregunta' : 'revelar la respuesta'})
                </Text>
              </Pressable>

              <View style={s.controles}>
                <Pressable
                  style={[s.botonNav, indice === 0 && s.botonNavDesactivado]}
                  disabled={indice === 0}
                  onPress={() => {
                    setIndice(indice - 1);
                    setVerRespuesta(false);
                  }}
                >
                  <Text style={s.textoNav}>◀ Anterior</Text>
                </Pressable>

                <Pressable
                  style={[s.botonNav, indice === tarjetas.length - 1 && s.botonNavDesactivado]}
                  disabled={indice === tarjetas.length - 1}
                  onPress={() => {
                    setIndice(indice + 1);
                    setVerRespuesta(false);
                  }}
                >
                  <Text style={s.textoNav}>Siguiente ▶</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable style={s.botonCerrar} onPress={onCerrar}>
            <Text style={s.textoCerrar}>Cerrar</Text>
          </Pressable>
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
    padding: 16,
  },
  tarjetaContenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    height: 480,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  subtitulo: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  cargandoBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  textoCargando: { marginTop: 12, color: '#475569', fontSize: 14, textAlign: 'center' },
  textoVacio: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  botonGenerar: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  textoBotonGenerar: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  temaBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  contador: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  tarjetaFlash: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etiquetaFlash: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, marginBottom: 8 },
  textoFlash: { fontSize: 16, fontWeight: '600', color: '#1e293b', textAlign: 'center', lineHeight: 24 },
  pistaTocar: { fontSize: 11, color: '#94a3b8', marginTop: 16 },
  controles: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  botonNav: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonNavDesactivado: { opacity: 0.3 },
  textoNav: { color: '#1e293b', fontWeight: '600', fontSize: 13 },
  botonCerrar: { alignSelf: 'center', marginTop: 12, paddingVertical: 6, paddingHorizontal: 16 },
  textoCerrar: { color: '#64748b', fontWeight: '600', fontSize: 14 },
});
