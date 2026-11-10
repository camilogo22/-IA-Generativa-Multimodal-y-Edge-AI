// Polyfills que el AI SDK necesita en Hermes (Android/iOS).
// Se importa PRIMERO en app/_layout.tsx, antes que cualquier otra cosa.
import { Platform } from 'react-native';
import structuredClone from '@ungap/structured-clone';
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import { TextEncoderStream, TextDecoderStream } from '@stardazed/streams-text-encoding';

if (Platform.OS !== 'web') {
  if (!('structuredClone' in globalThis)) {
    polyfillGlobal('structuredClone', () => structuredClone);
  }
  polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
  polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
}

export {};
