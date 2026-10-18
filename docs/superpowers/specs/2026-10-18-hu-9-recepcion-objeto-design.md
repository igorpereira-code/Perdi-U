# HU-9 - Recepcion de un objeto encontrado

## Objetivo

Permitir que el personal de Bienestar consulte los objetos encontrados que aun no fueron entregados en la oficina, busque uno mediante su codigo, revise sus datos y los del hallador, y confirme su recepcion. Al confirmar, el objeto queda bajo custodia y listo para publicarse en HU-14.

## Alcance

- Mostrar unicamente objetos con estado `PENDING_DROP_OFF` en la lista de recepciones pendientes.
- Buscar un objeto mediante su codigo `HZ-xxxx`.
- Mostrar los datos del objeto y del usuario que lo encontro.
- Confirmar la recepcion del objeto.
- Cambiar el estado a `IN_CUSTODY` y registrar `receivedById` y `receivedAt`.
- Proteger todas las operaciones de Bienestar con `requireRole('WELFARE')`.
- Integrar una pantalla protegida de Bienestar en el frontend.

No se modificara la carpeta `finder/`. El criterio de que el Hallador vea que el objeto fue recibido se satisface mediante el estado persistido `IN_CUSTODY`; la pantalla del Hallador, mantenida por otro integrante, consumira ese estado compartido.

## Arquitectura

### Backend

La funcionalidad se implementara bajo `backend/src/welfare/`:

- `data/welfareRepository.ts`: contrato que define listado, busqueda y recepcion.
- `data/fakeWelfareRepository.ts`: implementacion en memoria para pruebas.
- `data/prismaWelfareRepository.ts`: implementacion real con Prisma.
- `routes/receivedItemsRouter.ts`: endpoints HTTP protegidos.
- Tests colocados junto al codigo que prueban.

La aplicacion recibira el repositorio como dependencia. Los tests de rutas utilizaran el repositorio falso y no tocaran la base compartida.

### Frontend

La funcionalidad se implementara bajo `frontend/src/welfare/`:

- `data/welfareService.ts`: llamadas al backend mediante `ApiFetch`.
- `presenter/WelfarePage.tsx`: lista, busqueda, detalle y confirmacion.
- Tests colocados junto al codigo que prueban.

El servicio se construira en `main.tsx`, se pasara por las props de `App` y se inyectara en la ruta protegida de Bienestar. `App.test.tsx` recibira un servicio falso para no romper las pruebas existentes.

## API propuesta

### `GET /welfare/found-items/pending`

Devuelve los objetos `PENDING_DROP_OFF` con los datos necesarios del objeto, categoria, lugar y hallador.

### `GET /welfare/found-items/:code`

Busca un objeto por codigo.

- `200`: objeto pendiente encontrado.
- `404`: codigo inexistente.
- `409`: el objeto existe, pero ya no esta pendiente de recepcion.

### `POST /welfare/found-items/:code/receive`

Confirma la recepcion y persiste:

- `status = IN_CUSTODY`
- `receivedById = usuario de Bienestar autenticado`
- `receivedAt = fecha y hora de la confirmacion`

La operacion rechaza objetos inexistentes o que ya no esten en `PENDING_DROP_OFF`.

## Interfaz

La ruta `/bienestar` mostrara un panel pensado primero para computadora con:

- titulo "Panel de Bienestar";
- lista de objetos pendientes;
- busqueda por codigo;
- detalle del objeto seleccionado;
- datos del hallador;
- boton "Confirmar recepcion";
- mensajes de exito, lista vacia y errores.

Se reutilizaran `Button`, `Field`, `StatusChip`, `Alert`, `EmptyState`, `InfoRow` y `Thumb`. No se duplicaran componentes compartidos.

Tras confirmar, el objeto desaparecera de la lista pendiente y la interfaz mostrara el resultado exitoso. La publicacion pertenece a HU-14 y queda fuera de este alcance.

## Manejo de errores

- Un usuario que no tenga rol `WELFARE` recibira `403`.
- Un codigo inexistente mostrara un mensaje comprensible y conservara la pantalla utilizable.
- Un objeto que ya haya sido recibido no se podra confirmar nuevamente.
- Un error de red o servidor se mostrara sin alterar falsamente el estado visible.

## TDD real y evidencia

Cada criterio de aceptacion se desarrollara con ciclos completos y verificables:

1. Escribir primero el test del comportamiento.
2. Crear solo el esqueleto minimo necesario para que el test se ejecute.
3. Ejecutar `npm test` y comprobar que el test falle por el comportamiento ausente (rojo).
4. Implementar el codigo minimo para satisfacer el test.
5. Ejecutar `npm test` y comprobar que toda la suite pase (verde).
6. Refactorizar sin cambiar el comportamiento y volver a ejecutar `npm test`.
7. Probar el criterio en pantalla cuando corresponda.
8. Hacer el commit semantico unicamente despues del verde.

No se escribira implementacion antes de obtener el rojo correspondiente. Se usara `npm test`, no `npx jest`, para que `script/tdd_log.json` conserve la evidencia exigida por el docente. Los commits se organizaran por criterio de aceptacion, no como un unico commit final de toda la historia.

## Verificacion final

Antes del pull request `welfare-hu-9` hacia `welfare` se ejecutara:

```powershell
npm test
npm run typecheck
npm run build
```

Tambien se probara el flujo local con `x-sample-user: welfare` y los objetos de ejemplo destinados a recepcion. Los archivos `.env` y `.env.local` deben seguir ignorados por Git.
