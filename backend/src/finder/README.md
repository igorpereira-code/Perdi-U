# Backend de HU-3, CA10

Registro de hallazgos desde el formulario, con fotografía opcional y confirmación del
código devuelto por PostgreSQL. Se conserva el backend inicial del commit `531c2fc`.
La selección y vista previa de fotografías de CA4 siguen disponibles.

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
| `photoUrl` | No es un dato del cliente | Solo se admite ausente o `null`; una ruta o URL del cliente devuelve `400`. |

Sin foto se envía JSON. Con foto, la misma ruta autenticada acepta `multipart/form-data`
con `report` (el JSON anterior como texto) y un único archivo `photo`. El navegador no
establece manualmente el encabezado `Content-Type`, para conservar el boundary del formulario.

Los IDs tienen el rango de `Int` de Prisma/PostgreSQL: de 1 a 2147483647.

Ejemplo de fecha válida: `2026-10-18T08:15:00-04:00`, que representa el instante
`2026-10-18T12:15:00.000Z`. Se rechazan fechas imposibles y entradas sin hora o zona.
El formulario convierte fecha y hora de `America/La_Paz` (UTC−4), sin usar la zona del
equipo o del servidor. Si la hora se deja vacía, utiliza `00:00` UTC−4, según la decisión
autorizada para el primer sprint. Esto es una convención técnica de almacenamiento y
**no significa que el usuario haya confirmado un hallazgo a medianoche**. El esquema
actual no distingue esa convención de una medianoche real. Una fecha sin hora produce
`04:00Z` del mismo día. Si se indica hora, se conserva exactamente el instante elegido,
incluso cuando la conversión UTC pasa al día siguiente. El endpoint sigue recibiendo un
`foundAt` explícito y validando que la fecha sea real.

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
- `413` y `415`: tamaño o formato de fotografía no admitido.
- `503`: Storage no disponible; no se crea un reporte si falla la subida.

## Fotografías privadas

El único cliente que sube archivos está en `backend/src/finder/data/` y utiliza
`SUPABASE_URL` y `SUPABASE_SECRET_KEY` del entorno del servidor. La clave secreta no se
configura en Vite ni se envía al navegador. No se crean buckets ni se modifican políticas.

- Bucket privado confirmado: `found-item-photos`.
- JPEG, PNG o WebP, con tamaño máximo de 5 MiB; se verifica MIME y firma binaria.
- El cuerpo multipart completo se limita a 6 MiB; el texto de sus metadatos también se limita antes de procesarlo.
- Ruta: `<id-del-hallador>/<uuid-aleatorio>.jpg|png|webp`, generada por el servidor.
- Se ignora el nombre original del archivo y se sube con `upsert: false`.
- Solo la ruta se guarda en `photoUrl`; no se guardan URLs `blob:`, públicas o firmadas.
- La validación del reporte precede a la subida. Si el guardado falla, se intenta borrar
  exclusivamente el archivo cuya subida fue confirmada para esa solicitud. Una subida
  rechazada no dispara borrados, para proteger archivos existentes.
- Si también falla Storage al borrar, la compensación puede dejar un archivo huérfano.
  Una interrupción sin confirmación de la subida también puede dejar un archivo sin
  asociar. No hay una transacción distribuida entre Storage y Prisma; no se elimina un archivo
  después de confirmar el guardado. No se requieren tablas adicionales.

Se usa el soporte nativo de `Request.formData()` de Node 22+ para leer multipart,
sin instalar nuevas dependencias.

`GET /found-items/:code/photo` requiere una sesión y obtiene ruta, hallador, estado y
visibilidad desde Prisma. Primero autoriza, después llama a `createSignedUrl` con una
duración de 60 segundos. Devuelve `{ url, expiresIn: 60 }` y
`Cache-Control: private, no-store`. Nunca acepta una ruta del cliente para firmar.

| Solicitante | Acceso |
| --- | --- |
| Hallador del reporte | Sus fotografías, en cualquier estado o visibilidad. |
| Bienestar (`WELFARE`) | Reportes administrados por Bienestar; el contrato actual tiene ámbito institucional, sin asignación exclusiva por funcionario. |
| Otros usuarios autenticados | Solo `VISIBLE` y estado `IN_CUSTODY`, `PUBLISHED` o `DELIVERED`. |
| Sin sesión | Sin acceso. |

`HIDDEN` es una visibilidad distinta de los estados del hallazgo. Bloquea el acceso de
otros usuarios incluso en los tres estados autorizados. `PENDING_DROP_OFF` también lo
bloquea aunque sea `VISIBLE`. Las consultas de matching conservan sus filtros existentes;
esta ruta aplica la matriz de fotografías autorizada por Igor. Un usuario sin permiso
recibe `403`, y no se solicita ninguna firma a Storage. Un reporte o foto inexistente
devuelve `404`. Cada nueva firma vuelve a comprobar permisos; una firma ya entregada
vence después de 60 segundos y no se almacena en la base.

Referencia del SDK: [subida de archivos](https://supabase.com/docs/reference/javascript/storage-from-upload)
y [URLs firmadas](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl).

## Verificación

Ejecutar `npm test` desde la raíz. Las pruebas del router inyectan un repositorio
simulado; las del adaptador Prisma simulan `db()`. Ninguna escribe en la base compartida.
Ejecutar también `npm run typecheck` y `npm run build`.

Para comprobar manualmente CA10:

1. Configurar las variables del backend localmente, sin copiarlas al frontend, y levantar
   `npm run dev:backend` y `npm run dev:frontend` desde la raíz.
2. Ingresar con una cuenta institucional y abrir «Encontré un objeto». Los selectores
   deben mostrar los catálogos reales del backend.
3. Completar los cuatro campos obligatorios, dejar hora y fotografía vacías, y enviar.
   Debe aparecer el código HZ- recibido en la respuesta `201`; no debe llamarse a Storage.
4. Abrir otro formulario, completar los datos y seleccionar una fotografía válida.
   Tras enviar, comprobar la respuesta `201` y que Prisma guarde una ruta relativa en
   `photoUrl`, con estado `PENDING_DROP_OFF`, sin recepción ni publicación.
5. Solicitar `GET /found-items/<código>/photo` con la sesión del hallador o de Bienestar:
   se debe recibir una URL temporal. Con otra cuenta, un reporte pendiente devuelve `403`.
6. Para otros estados y `HIDDEN`, utilizar los casos simulados de
   `foundItemPhotos.test.ts`; no cambiar la base compartida manualmente para probarlos.
7. Intentar un archivo no admitido o mayor a 5 MiB: se muestra el error conservando todos
   los campos y la vista previa. Reintentar con un archivo válido debe permitir guardar.
8. Con una respuesta lenta, el botón indica «Enviando…» y no se repite la solicitud.

El formulario solo muestra el código después de un `201` válido del servidor. El cliente
no lo genera. El repositorio continúa omitiendo `code` y PostgreSQL ejecuta el generador
`next_code('HZ-', 'found_item_code_seq')` existente. CA11–CA14 no se implementan aquí.
