import '../polyfills'; // SIEMPRE la primera línea
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Tutor IA' }} />
    </Stack>
  );
}
