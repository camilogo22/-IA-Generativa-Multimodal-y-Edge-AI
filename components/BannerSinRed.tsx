import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetworkState } from 'expo-network';

interface Props {
  conectado?: boolean;
}

export function BannerSinRed({ conectado: conectadoProp }: Props) {
  const networkState = useNetworkState();
  const conectado = conectadoProp !== undefined 
    ? conectadoProp 
    : (networkState.isConnected && networkState.isInternetReachable !== false);

  if (conectado) return null;

  return (
    <View style={s.banner}>
      <Text style={s.texto}>⚠️ Sin conexión a internet. El envío con IA está pausado.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
