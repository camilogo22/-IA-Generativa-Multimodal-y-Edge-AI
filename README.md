# 🤖 Tutor IA & GeoCam con IA — Semana 10 / 11

Proyecto completo de **Asistente IA Multimodal y Edge AI** para el Taller Integrador 2 (etiquetado con el tag `v2.0.0`). Desarrollado con **Expo SDK 57**, **Supabase Auth**, **Supabase Edge Functions**, **Vercel AI SDK v7** y **Google Gemini**.

> [!IMPORTANT]
> **Seguridad absoluta:** La API key de Gemini nunca viaja a la app ni está en el bundle. Se custodia exclusivamente como secreto de las Supabase Edge Functions con validación de sesión de usuario (`auth: 'user'`).

---

## 🏛️ Arquitectura del Sistema

```
App Móvil (useChat + expo/fetch) ──Token de Sesión──► Edge Function "tutor" ──GEMINI_API_KEY──► Google Gemini
                                 ◄──── Streaming ────                       ◄──── Streaming ────
```

---

## 🚀 Funcionalidades Desarrolladas (Retos C1 a C6 y Taller)

* **Streaming en tiempo real:** Lectura chunk a chunk en Hermes usando `expo/fetch` y polyfills web.
* **Multimodalidad (Cámara y Galería):** Reducción de imágenes a 1024 px JPEG 0.7 en base64 (~150 KB) con `expo-image-manipulator` para análisis visual sin saturar memoria ni payload.
* **C1 · Historial Persistente:** Persistencia local de la conversación en `SecureStore` al finalizar cada respuesta (`onFinish`), restauración automática al reabrir la app y botón `✨ Nueva` para reiniciar el chat.
* **C2 · Instrucciones con Perfil:** Modal interactivo de perfil (Nombre, Tema, Nivel) enviado en cada mensaje y validado con **Zod** en la Edge Function para adaptar el prompt del sistema.
* **C3 · Salida Estructurada (Tarjetas de Repaso):** Edge Function `tarjetas` usando `generateText` con `Output.object` para extraer de 3 a 5 tarjetas de estudio interactivas (Flashcards) a partir del chat.
* **C4 · Manejo de Errores y Modo Offline:** Detección de conectividad con `expo-network`, banner `⚠️ Sin conexión a internet`, bloqueo de envíos en modo avión y botón `Reintentar` (`regenerate()`).
* **C5 · Control de Límite Diario:** Tabla `uso_ia` con políticas RLS en Supabase. Si el usuario supera el límite configurable (`LIMITE_DIARIO`), la función responde HTTP `429` con mensaje amigable.
* **C6 · Bitácora y Pruebas:** Matriz de escenarios en `PRUEBAS.md` y registro de auditoría en `AI-LOG.md`.
* **Taller GeoCam (`describir-foto`):** Función para descripción multimodal sin streaming y script de migración SQL para la columna `ai_description`.

---

## 📂 Estructura del Proyecto

| Archivo / Directorio | Descripción |
| :--- | :--- |
| `app/_layout.tsx` | Punto de entrada. Importa `polyfills.ts` como primera línea y protege rutas según la sesión. |
| `app/index.tsx` | Pantalla principal de chat con streaming, controles multimedia, banner offline y modales C2/C3. |
| `app/login.tsx` | Autenticación con Supabase (inicio de sesión y registro de usuarios). |
| `components/Burbuja.tsx` | Renderizador de mensajes y partes (texto formateado e imágenes). |
| `components/BannerSinRed.tsx` | Banner de advertencia de conectividad sin red (Reto C4). |
| `components/ModalPerfil.tsx` | Modal para configurar el perfil del estudiante (Reto C2). |
| `components/ModalTarjetas.tsx` | Modal interactivo para repasar con tarjetas flashcard generadas por IA (Reto C3). |
| `lib/chatTransport.ts` | Transporte personalizado con `DefaultChatTransport`, `expo/fetch` y headers dinámicos. |
| `lib/historial.ts` | Métodos de persistencia del historial de mensajes (Reto C1). |
| `lib/perfil.ts` | Almacenamiento seguro de preferencias del estudiante (Reto C2). |
| `lib/foto.ts` | Captura y optimización de fotos para useChat. |
| `services/vision.ts` | Servicio de invocación a la función `describir-foto` para GeoCam. |
| `supabase/functions/tutor/index.ts` | Edge Function del chat con streaming, límite diario C5 y perfil C2. |
| `supabase/functions/describir-foto/index.ts` | Edge Function para describir fotos en 1-2 oraciones. |
| `supabase/functions/tarjetas/index.ts` | Edge Function para generar flashcards estructuradas con Zod. |
| `supabase/migrations/20261109_init.sql` | Scripts SQL de tabla `uso_ia` con RLS y columna `ai_description`. |
| `AI-LOG.md` | Bitácora de prompts, cambios manuales y alucinaciones corregidas. |
| `PRUEBAS.md` | Matriz de pruebas y respuestas a preguntas de sustentación. |

---

## 🛠️ Puesta en Marcha

### 1. Variables de entorno (`.env`)
Copia `.env.example` a `.env` y coloca las credenciales de tu proyecto de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

### 2. Base de datos (Supabase)
Ejecuta el script SQL ubicado en `supabase/migrations/20261109_init.sql` desde el **SQL Editor** del dashboard de Supabase para crear la tabla `uso_ia` con sus políticas de RLS.

### 3. Desplegar Edge Functions
```bash
# Iniciar sesión y vincular el proyecto
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF

# Configurar el secreto con la API Key de Google Gemini
npx supabase secrets set GEMINI_API_KEY=AIzaSy...

# (Opcional) Configurar límite diario para pruebas rápidas
npx supabase secrets set LIMITE_DIARIO=20

# Desplegar las funciones
npx supabase functions deploy tutor
npx supabase functions deploy describir-foto
npx supabase functions deploy tarjetas
```

### 4. Ejecutar la App Móvil
```bash
npm install
npx expo start -c
```
Escanea el código QR con **Expo Go (SDK 57)** en Android o iOS.
