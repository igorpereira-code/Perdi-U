# HU-9 Recepcion de un objeto encontrado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que Bienestar liste, busque y reciba objetos encontrados pendientes, dejandolos en custodia para su posterior publicacion.

**Architecture:** Un contrato de repositorio aisla Express de Prisma y permite pruebas backend en memoria. Un servicio frontend consume la API con `ApiFetch`, y una pagina React recibe ese servicio por inyeccion desde `App`.

**Tech Stack:** TypeScript, Express, Prisma 6, React 19, React Router, Jest, Supertest, React Testing Library y Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-18-hu-9-recepcion-objeto-design.md`

## Global Constraints

- Desarrollar exclusivamente en `welfare-hu-9`; el destino del PR sera `welfare`.
- Usar `npm test` para cada rojo y cada verde; no usar `npx jest`.
- No escribir implementacion antes de observar el rojo correspondiente.
- Hacer un commit semantico por criterio terminado, solo despues de obtener verde.
- No modificar `finder/`, `core/`, `matching/`, `schema.prisma`, `script/` ni `.husky/`, salvo las integraciones permitidas en `app.ts`, `App.tsx`, `App.test.tsx` y `main.tsx`.
- No ejecutar `npm run db:seed`, `npx prisma migrate`, `npm audit fix --force` ni `semantic-commits-off`.
- Las rutas de Bienestar deben usar `requireRole('WELFARE')`.
- Los tests backend deben usar el repositorio falso y nunca la base compartida.
- Todo texto visible va en espanol; identificadores de codigo en ingles.

## Review Focus

- Codigo con minusculas o espacios: normalizar a mayusculas y recortar antes de buscar.
- Objeto inexistente: devolver `404` y mantener la pantalla utilizable.
- Objeto ya recibido: devolver `409` sin sobrescribir `receivedById` ni `receivedAt`.
- Dos confirmaciones simultaneas: solo una actualizacion condicional puede tener exito.
- Usuario `COMMUNITY`: todos los endpoints de Bienestar deben devolver `403`.

---

### Task 1: Listado backend de objetos pendientes

**Files:**
- Create: `shared/welfare.ts`
- Create: `backend/src/welfare/data/welfareRepository.ts`
- Create: `backend/src/welfare/data/fakeWelfareRepository.ts`
- Create: `backend/src/welfare/routes/receivedItemsRouter.ts`
- Create: `backend/src/welfare/routes/receivedItemsRouter.test.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Produces: `WelfareFoundItemView`, `WelfareRepository.listPending(): Promise<WelfareFoundItem[]>` and `createReceivedItemsRouter(welfare: WelfareRepository): Router`.
- `WelfareFoundItemView` contains `code`, `description`, `photoUrl`, `category`, `place`, `classroom`, `placeReference`, ISO `foundAt`, `status` and nullable `finder { name, email }`.

- [ ] **Step 1: Write the failing route tests**

Add tests named `lista los objetos que aun no fueron entregados`, `no incluye objetos que ya estan en custodia` and `solo Bienestar puede consultar los pendientes`. Assert `200` plus only `PENDING_DROP_OFF` rows for `x-sample-user: welfare`, and `403` for the default community user.

- [ ] **Step 2: Run the suite and capture red**

Run: `npm test`

Expected: FAIL because `WelfareRepository`, the router, or the route does not exist.

- [ ] **Step 3: Implement the minimum in-memory listing path**

Define the shared response type, repository contract, defensive-copy fake repository, `GET /welfare/found-items/pending`, dependency injection through `AppOptions.welfare`, and router registration after current-user middleware.

- [ ] **Step 4: Run the suite and capture green**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 5: Refactor and verify**

Remove duplication in test fixtures without adding behavior; run `npm test` again and require green.

- [ ] **Step 6: Commit**

```powershell
git add shared/welfare.ts backend/src/welfare backend/src/app.ts
git commit -m "feat(welfare): listar objetos pendientes de recepcion"
```

### Task 2: Busqueda backend y detalle por codigo

**Files:**
- Modify: `backend/src/welfare/data/welfareRepository.ts`
- Modify: `backend/src/welfare/data/fakeWelfareRepository.ts`
- Modify: `backend/src/welfare/routes/receivedItemsRouter.ts`
- Modify: `backend/src/welfare/routes/receivedItemsRouter.test.ts`

**Interfaces:**
- Consumes: `WelfareFoundItem` and the router from Task 1.
- Produces: `WelfareRepository.findByCode(code: string): Promise<WelfareFoundItem | null>` and `GET /welfare/found-items/:code`.

- [ ] **Step 1: Write failing search tests**

Add tests named `busca un reporte por el codigo que muestra el Hallador`, `normaliza espacios y minusculas`, `muestra los datos del objeto y del Hallador`, `responde 404 si el codigo no existe` and `responde 409 si ya no esta pendiente`.

- [ ] **Step 2: Run `npm test` and verify red**

Expected: FAIL because the detail route or `findByCode` is missing.

- [ ] **Step 3: Implement minimum lookup behavior**

Add `findByCode`, normalize with `String(code).trim().toUpperCase()`, serialize the same view used by the list, and distinguish nonexistent (`404`) from non-pending (`409`, `{ code: 'ALREADY_RECEIVED' }`).

- [ ] **Step 4: Run `npm test` and verify green**

- [ ] **Step 5: Refactor, rerun `npm test`, and commit**

```powershell
git add backend/src/welfare
git commit -m "feat(welfare): buscar objetos pendientes por codigo"
```

### Task 3: Confirmacion backend de la recepcion

**Files:**
- Modify: `backend/src/welfare/data/welfareRepository.ts`
- Modify: `backend/src/welfare/data/fakeWelfareRepository.ts`
- Modify: `backend/src/welfare/routes/receivedItemsRouter.ts`
- Modify: `backend/src/welfare/routes/receivedItemsRouter.test.ts`

**Interfaces:**
- Produces: `WelfareRepository.receivePending(itemId: string, receivedById: string, receivedAt: Date): Promise<boolean>` and `POST /welfare/found-items/:code/receive`.

- [ ] **Step 1: Write failing receipt tests**

Add tests named `confirma que Bienestar recibio el objeto`, `registra quien y cuando lo recibio`, `deja el objeto en custodia`, `no permite confirmar dos veces`, `solo Bienestar puede confirmar` and `solo una confirmacion simultanea puede actualizar el objeto`.

- [ ] **Step 2: Run `npm test` and verify red**

- [ ] **Step 3: Implement minimum receipt behavior**

Look up the normalized code, call `receivePending` with `getCurrentUser(req).id` and one `new Date()`, return `200` with the updated view, `404` when absent and `409` with `{ code: 'ALREADY_RECEIVED' }` when the conditional transition fails.

- [ ] **Step 4: Run `npm test` and verify green**

- [ ] **Step 5: Refactor, rerun `npm test`, and commit**

```powershell
git add backend/src/welfare
git commit -m "feat(welfare): confirmar la recepcion de un objeto"
```

### Task 4: Persistencia real con Prisma

**Files:**
- Create: `backend/src/welfare/data/prismaWelfareRepository.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Consumes: complete `WelfareRepository` from Tasks 1-3.
- Produces: `prismaWelfareRepository: WelfareRepository` as the default production dependency.

- [ ] **Step 1: Write the failing contract-oriented type check**

Declare the Prisma object with `satisfies WelfareRepository` before implementing its methods, then run the required suite to observe the missing-method/type red.

- [ ] **Step 2: Run `npm test` and `npm run typecheck` and record red**

Expected: typecheck fails because the Prisma repository is incomplete.

- [ ] **Step 3: Implement Prisma queries**

Use `findMany` for pending rows, `findUnique` for code lookup, relations for category/place/classroom/finder, and `updateMany({ where: { id, status: 'PENDING_DROP_OFF' }, data: { status: 'IN_CUSTODY', receivedById, receivedAt } })`. Return `count === 1` from `receivePending`.

- [ ] **Step 4: Run `npm test` and `npm run typecheck` and require green**

- [ ] **Step 5: Commit**

```powershell
git add backend/src/welfare/data/prismaWelfareRepository.ts backend/src/app.ts
git commit -m "feat(welfare): guardar la recepcion en la base de datos"
```

### Task 5: Servicio frontend de Bienestar

**Files:**
- Create: `frontend/src/welfare/data/welfareService.ts`
- Create: `frontend/src/welfare/data/welfareService.test.ts`

**Interfaces:**
- Consumes: `ApiFetch` and `WelfareFoundItemView`.
- Produces: `WelfareService` with `listPending()`, `findByCode(code)` and `receive(code)`; lookup returns a discriminated result `FOUND | NOT_FOUND | ALREADY_RECEIVED`.

- [ ] **Step 1: Write failing service tests**

Assert exact request paths and methods, code normalization, successful JSON parsing, `404 -> NOT_FOUND`, `409 -> ALREADY_RECEIVED`, and rejection of unexpected server/network failures.

- [ ] **Step 2: Run `npm test` and verify red**

- [ ] **Step 3: Implement `createWelfareService(apiFetch: ApiFetch): WelfareService`**

- [ ] **Step 4: Run `npm test` and verify green**

- [ ] **Step 5: Refactor, rerun `npm test`, and commit**

```powershell
git add frontend/src/welfare/data
git commit -m "feat(welfare): conectar el panel con la recepcion de objetos"
```

### Task 6: Pantalla de pendientes, busqueda y detalle

**Files:**
- Create: `frontend/src/welfare/presenter/WelfarePage.tsx`
- Create: `frontend/src/welfare/presenter/WelfarePage.test.tsx`

**Interfaces:**
- Consumes: `WelfareService` and shared presenter components.
- Produces: `WelfarePage({ welfareService }: { welfareService: WelfareService })`.

- [ ] **Step 1: Write failing presentation tests**

Test the loading result, pending list, empty state, search by code, lowercase/space normalization through the service, selected-object detail, Hallador name/email, `NOT_FOUND`, `ALREADY_RECEIVED`, and a rejected request. Assert accessible headings, labels, buttons and messages in Spanish.

- [ ] **Step 2: Run `npm test` and verify red**

- [ ] **Step 3: Implement the minimum page**

Use `Field`, `INPUT_CLASSES`, `Button`, `StatusChip`, `Alert`, `EmptyState`, `InfoRow` and `Thumb`; keep API state and selected item inside the page and do not add unrelated navigation.

- [ ] **Step 4: Run `npm test` and verify green**

- [ ] **Step 5: Refactor, rerun `npm test`, and commit**

```powershell
git add frontend/src/welfare/presenter
git commit -m "feat(welfare): consultar objetos pendientes y sus datos"
```

### Task 7: Confirmacion en pantalla e integracion de la ruta

**Files:**
- Modify: `frontend/src/welfare/presenter/WelfarePage.tsx`
- Modify: `frontend/src/welfare/presenter/WelfarePage.test.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `WelfareService.receive(code)` and `WelfarePage`.
- Produces: authenticated `/bienestar` route, wired production service and receipt interaction.

- [ ] **Step 1: Write failing UI and route tests**

Test that `Confirmar recepcion` calls `receive(code)`, shows success, removes the item from pending results, disables duplicate submission, preserves the item on failure, renders `/bienestar` for a `WELFARE` user and denies or redirects a `COMMUNITY` user.

- [ ] **Step 2: Run `npm test` and verify red**

- [ ] **Step 3: Implement minimum confirmation and wiring**

Create the service in `main.tsx`, add it to `AppProps`, pass it to `/bienestar`, add a role check before rendering the page, and update UI state only after a successful response.

- [ ] **Step 4: Run `npm test` and verify green**

- [ ] **Step 5: Refactor, rerun `npm test`, and commit**

```powershell
git add frontend/src/welfare frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/main.tsx
git commit -m "feat(welfare): registrar la recepcion desde el panel"
```

### Task 8: Verificacion integral de HU-9

**Files:**
- Modify only files needed for defects exposed by verification.

**Interfaces:**
- Consumes: complete HU-9 implementation.
- Produces: verified branch ready for review.

- [ ] **Step 1: Run complete automated verification**

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all commands exit successfully.

- [ ] **Step 2: Verify secrets and scope**

Run `git status --short`, `git check-ignore backend/.env frontend/.env.local`, and `git diff welfare...HEAD --stat`. Confirm no secret file and no unrelated folder is committed.

- [ ] **Step 3: Run the application and verify the acceptance flow**

Start both dev servers, use `x-sample-user: welfare`, verify `HZ-0005` or `HZ-0006` appears, search it, inspect its detail, confirm receipt, and verify it no longer appears as pending. Do not alter shared data outside this acceptance flow.

- [ ] **Step 4: Push without opening the pull request yet**

```powershell
git push
```

After the user verifies Trello criteria, open `welfare-hu-9 -> welfare`.
