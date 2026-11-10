# 🤖 Registro de Auditoría de IA (AI-LOG) — Semana 10

**Estudiante:** Camilo Gómez  
**Código:** 0182220083  
**Semana:** 10 / 11  
**Proyecto:** Tutor IA & GeoCam con IA Multimodal (Taller Integrador 2, tag v2.0.0)  
**Institución:** Universidad de La Guajira  

---

## 1. Prompts Utilizados

1. *"Crea una función en Supabase Edge Functions que reciba mensajes de chat de Vercel AI SDK y haga streaming con Google Gemini."*
2. *"Implementa la captura de fotos con ImagePicker y redúcelas para enviarlas como un part de imagen multimodal a un modelo de visión."*
3. *"Crea una tabla en Supabase y la lógica para restringir que ningún usuario pueda hacer más de 20 peticiones cada 24 horas usando RLS."*
4. *"Genera de 3 a 5 tarjetas de repaso didácticas tipo flashcard basadas en la conversación usando generateText y Output.object de Vercel AI SDK v7."*
5. *"Configura useChat en React Native con expo/fetch para streaming y persistencia en SecureStore."*

---

## 2. Código Generado vs. Código Modificado

### A. Ubicación de la API Key de Gemini
* **¿Qué generó la IA?:** Inicialmente, la IA sugirió declarar `EXPO_PUBLIC_GEMINI_API_KEY` en el archivo `.env` de Expo e invocar el SDK `@google/genai` directamente desde los componentes de React Native.
* **¿Qué modifiqué/corregí?:** Rechacé y eliminé por completo esa propuesta. Cualquier variable con prefijo `EXPO_PUBLIC_*` queda compilada en texto plano dentro del bundle de JavaScript (vulnerable a ingeniería inversa en el APK). Moví la API Key como secreto seguro de Supabase (`npx supabase secrets set GEMINI_API_KEY=...`) y construí el proxy seguro en la Edge Function `supabase/functions/tutor/index.ts` autenticado con `withSupabase({ auth: 'user' })`.

### B. Streaming en Hermes y Fetch de React Native
* **¿Qué generó la IA?:** La IA utilizó el `fetch` nativo global de React Native y no incluyó polyfills de streams.
* **¿Qué modifiqué/corregí?:** El motor Hermes de React Native no soporta streaming en el `fetch` estándar (espera al buffer final) ni trae primitivas como `structuredClone`, `TextEncoderStream` y `TextDecoderStream`. Reemplacé el cliente HTTP por `expo/fetch` dentro de `DefaultChatTransport` e importé los polyfills en la primera línea de `app/_layout.tsx`.

### C. Generación de Objetos Estructurados (Vercel AI SDK v7)
* **¿Qué generó la IA?:** La IA generó código utilizando la API heredada de Vercel AI SDK v4/v5: utilizó `generateObject()` y la propiedad `system: "..."`.
* **¿Qué modifiqué/corregí?:** En la versión v7 de Vercel AI SDK, `generateObject()` está deprecado. Se corrigió migrando a `generateText()` con la propiedad `output: Output.object({ schema: EsquemaZod })` y renombrando `system:` a `instructions:`.

---

## 3. Alucinaciones y Errores Detectados

1. **Alucinación de modelos deprecados:** La IA propuso usar `gemini-1.5-pro` y `gemini-2.5-flash`. Estos modelos ya fueron dados de baja o tienen endpoint modificado. Se corrigió forzando el uso de `gemini-3.8-flash` y `gemini-3.5-flash-lite`.
2. **Intento de conteo de límite con la Service Role Key:** Al implementar el Reto C5, la IA sugirió usar la `SUPABASE_SERVICE_ROLE_KEY` en el cliente móvil o Edge Function para saltarse el RLS y contar las peticiones. Se corrigió usando `ctx.supabaseClient` (el cliente autenticado del usuario) junto con políticas RLS de sólo lectura e inserción propia, impidiendo que el usuario pueda trucar o borrar sus registros de consumo.
3. **Omisión del límite de tamaño en fotos:** La IA intentó enviar la foto tomada por la cámara en resolución completa (4000x3000, ~8 MB en base64), lo que ocasionaba saturación de memoria y timeout 413 (Payload Too Large). Se añadió `ImageManipulator` para redimensionar a 1024 px de ancho y compresión JPEG a 0.7 (~150 KB).
