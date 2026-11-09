# 🧪 Matriz de Pruebas y Validación — Asistente IA (PRUEBAS.md)

Este documento registra los escenarios de prueba ejecutados para validar la robustez, seguridad y manejo de errores del **Tutor IA** y los componentes de IA multimodal.

---

## 1. Matriz de Escenarios de Prueba

| ID | Escenario | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **P-01** | **Seguridad: Petición sin token de sesión** | Ejecutar: `curl -i -X POST https://TU_REF.supabase.co/functions/v1/tutor -d '{"messages":[]}'` | Debe responder HTTP `401 Unauthorized` sin contactar a Gemini. | Responde `401 Unauthorized` bloqueando el acceso anónimo. | ✅ Pasó |
| **P-02** | **Inspección de APK / Bundle (Búsqueda de API Key)** | Generar el bundle JS de producción y buscar patrones de clave de Google (`grep -r "AIza" .` o en el bundle). | La clave de Gemini no debe existir en ningún archivo cliente ni `.env` empaquetado. | 0 coincidencias en el bundle cliente; la clave reside únicamente en los secretos de Supabase. | ✅ Pasó |
| **P-03** | **Modo Avión / Sin Conexión (Reto C4)** | 1. Activar Modo Avión en el dispositivo.<br>2. Abrir la app.<br>3. Intentar enviar mensaje o foto. | Aparece el banner rojo `⚠️ Sin conexión a internet`. Los botones de cámara, galería y envío están deshabilitados. | Banner visible, inputs bloqueados y feedback inmediato sin crashear. | ✅ Pasó |
| **P-04** | **Restauración de Red y Reintento (Reto C4)** | 1. Generar un error de conexión.<br>2. Desactivar modo avión.<br>3. Pulsar el botón `Reintentar`. | La app limpia el estado de error y ejecuta `regenerate()` para completar la respuesta. | La respuesta en streaming comienza con éxito al restablecer internet. | ✅ Pasó |
| **P-05** | **Límite diario por usuario alcanzado (Reto C5)** | 1. Configurar `LIMITE_DIARIO=3` en la Edge Function.<br>2. Realizar 4 preguntas consecutivas con el mismo usuario. | La 4ª pregunta es interceptada por la Edge Function antes de llamar a Gemini, respondiendo HTTP `429`. | La app muestra alerta con mensaje amigable: *"Has alcanzado el límite diario... Vuelve mañana."* | ✅ Pasó |
| **P-06** | **Persistencia de Historial (Reto C1)** | 1. Mantener una conversación con el tutor.<br>2. Cerrar por completo la app (matar el proceso).<br>3. Volver a abrir la app. | Los mensajes anteriores permanecen intactos en la pantalla cargados desde el almacenamiento local. | Historial restaurado correctamente al iniciar. | ✅ Pasó |
| **P-07** | **Reinicio de Conversación (Reto C1)** | Pulsar el botón `✨ Nueva` en la barra superior y confirmar el reinicio. | Se vacía la memoria y el almacenamiento persistente; la pantalla queda lista para un nuevo tema. | Mensajes borrados y vista en blanco con bienvenida. | ✅ Pasó |
| **P-08** | **Personalización de Perfil y Validación Zod (Reto C2)** | 1. Configurar en Perfil: Nombre *"Carlos"*, Tema *"SQLite"*, Nivel *"Principiante"*.<br>2. Preguntar: *"¿Cómo guardo datos?"*. | Las instrucciones del prompt del sistema adaptan la explicación a un tono principiante mencionando su tema de interés. | El tutor responde con analogías simples de SQLite adaptadas al perfil. | ✅ Pasó |
| **P-09** | **Generación de Tarjetas de Repaso (Reto C3)** | 1. Conversar sobre un tema técnico.<br>2. Pulsar `🗂️ Tarjetas` y luego `✨ Generar Tarjetas`. | La Edge Function invoca `Output.object` con Zod y devuelve entre 3 y 5 preguntas/respuestas interactivas. | Modal renderiza las tarjetas didácticas con volteo pregunta/respuesta. | ✅ Pasó |
| **P-10** | **Análisis Multimodal de Imagen (Cámara/Galería)** | 1. Tomar o seleccionar foto de un fragmento de código.<br>2. Enviar la foto al Tutor. | La imagen es reducida a 1024px JPEG 0.7 (~150 KB) y el modelo describe y resuelve el error del código. | Streaming fluido y análisis preciso del código fotografiado. | ✅ Pasó |

---

## 2. Preguntas de Sustentación

### 1. ¿Dónde está tu key de Gemini y cómo lo demuestras?
* **Respuesta:** La clave está alojada únicamente en las variables de entorno seguras de Supabase (`supabase secrets`), nunca en la aplicación cliente. Se demuestra con dos pruebas:
  1. Si un atacante descompila el APK o busca en el bundle JavaScript empaquetado `grep -rn "AIza" .`, no encontrará ninguna referencia.
  2. Si se realiza una petición HTTP directa a la Edge Function sin cabecera de autorización de Supabase (`curl -i -X POST .../tutor`), la función responde de inmediato `401 Unauthorized` sin consumir la API de Gemini.

### 2. ¿Qué pasa si alguien envía un perfil manipulado o datos falsos por HTTP?
* **Respuesta:** La Edge Function implementa un validador con **Zod** (`PerfilSchema.parse(body.perfil)` con `.catch({})`). Si los datos son inválidos, manipulados o contienen tipos inesperados, Zod los sanitiza y la función aplica los valores por defecto de forma segura sin interrumpir la ejecución ni vulnerar el backend.

### 3. ¿Por qué el límite se cuenta con el cliente del usuario y no con la secret key?
* **Respuesta:** Porque el cliente del usuario viaja con el token JWT de la sesión y respeta las políticas **RLS (Row Level Security)** de la tabla `uso_ia`. De esta manera, cada usuario solo puede consultar e insertar sus propios registros sin poder ver ni borrar los de otros. Usar la *service_role secret key* anularía el RLS y otorgaría privilegios administrativos innecesarios.

### 4. ¿Qué se guarda en tu teléfono y qué se envía a Google?
* **En el teléfono se guardan:** El token de sesión en `SecureStore`, la copia local de las fotos originales tomadas por la cámara y el historial reciente de mensajes de chat.
* **A Google solo se envían:** La imagen reducida y comprimida a 1024 px (JPEG 0.7, ~150 KB) y los últimos 20 mensajes de texto (`messages.slice(-20)`) requeridos para mantener el contexto de la conversación.
