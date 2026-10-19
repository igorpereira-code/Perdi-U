# Backend de HU-3, CA10

Implementación provisional del registro de hallazgos. El formulario todavía no llama
a este endpoint. La selección y vista previa de fotografías de CA4 siguen disponibles.

## Autenticación y catálogos

Las dos rutas reutilizan el middleware de autenticación de la aplicación. En producción
requieren `Authorization: Bearer <sesión de Supabase>`; los usuarios de ejemplo solo
funcionan con la opción de desarrollo existente `ALLOW_SAMPLE_USERS=true`.

`GET /found-items/catalogs` devuelve:

- `categories`: objetos con `id` y `name`.
- `places`: objetos con `id`, `name`, `type` (`BLOCK` o `SPACE`) y `classrooms`.
- Cada aula contiene `id` y `name` y está anidada en su lugar correspondiente.

Se consultan mediante Prisma únicamente categorías, lugares y aulas activos,
ordenados por nombre. Los identificadores del reporte deben provenir de esta respuesta.

## POST /found-items

Cuerpo JSON:

| Campo | Requerido | Validación |
| --- | --- | --- |
| `description` | Sí | Texto no vacío; se recortan espacios exteriores. |
| `categoryId` | Sí | Entero positivo del catálogo activo. |
| `placeId` | Sí | Entero positivo del catálogo activo. |
| `foundAt` | Sí | Fecha y hora ISO 8601 con segundos y zona explícita (`Z` o `±HH:mm`). |
| `classroomId` | No | Entero positivo o `null`; debe ser un aula activa del bloque elegido. |
| `placeReference` | No | Texto de hasta 200 caracteres después de recortar espacios, o `null`. |
| `photoUrl` | Provisionalmente no | Solo se admite ausente o `null`; una ruta o URL del cliente devuelve `400`. |

Los IDs tienen el rango de `Int` de Prisma/PostgreSQL: de 1 a 2147483647.

Ejemplo de fecha válida: `2026-10-18T08:15:00-04:00`, que representa el instante
`2026-10-18T12:15:00.000Z`. Se rechazan fechas imposibles y entradas sin hora o zona.
No se usa la zona del servidor, la hora actual ni una hora de hallazgo predeterminada.
Antes de conectar el formulario se debe acordar cómo representar una fecha cuya hora
se desconoce; la hora del formulario continúa siendo opcional.

El hallador se obtiene exclusivamente de `getCurrentUser(req)`. El repositorio crea
el reporte con `PENDING_DROP_OFF`, sin datos de recepción ni publicación. Omite `code`
e `id` para usar los valores generados por PostgreSQL que ya existen en el esquema.
Los campos adicionales del cliente, como `code`, `status` o `finderId`, no se guardan.

Respuesta `201`: objeto con `code` y `status`, exactamente los devueltos por Prisma.
El backend no genera ni sustituye el código HZ-.

Errores:

- `400`: `{ error, errors }`, con mensajes por campo; no se guarda el reporte.
- `401` y `403`: respuestas de la autenticación existente.
- `500`: `{ error }` con un mensaje en español, sin detalles internos ni código de éxito.

## Verificación y trabajo pendiente

Ejecutar `npm test` desde la raíz. Las pruebas del router inyectan un repositorio
simulado; las del adaptador Prisma simulan `db()`. Ninguna escribe en la base compartida.
Ejecutar también `npm run typecheck` y `npm run build`.

El contrato interno `NewFoundItem` admite `photoUrl` opcional para la integración futura
con Storage. Antes de aceptarla desde el endpoint se debe verificar que sea una subida
válida y pertenezca al usuario autenticado. Quedan pendientes el servicio de subida,
la lectura autorizada de fotografías, la convención para fecha sin hora y la conexión
del formulario con el envío y la confirmación del código. CA10 completo sigue pendiente.
