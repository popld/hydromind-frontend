# System Module Guidance

Use this reference when working under `src/modules/system/*`, `src/services/api/system.ts`, `src/queries/system.query.ts`, or related system-management types and mocks.

## Scope

The `system` domain currently covers:

- users
- departments
- posts
- roles
- menus
- login logs
- operation logs
- system settings

These pages are conventional admin CRUD screens. Prefer consistency over novelty.

## Page Pattern

Default pattern for system pages:

1. `PageContainer` for page shell
2. `ProTable` for list rendering
3. local `useState` for filter text, modal visibility, current editing record, and selected rows
4. `useQuery` hooks from `src/queries/system.query.ts` for reads
5. `useMutation` plus `queryClient.invalidateQueries()` for writes
6. `ModalForm` or `DrawerForm` for create/update flows

Follow the existing user page as the strongest local precedent:

- `src/modules/system/user/index.tsx`

## Permissions

- Gate page routes via `config/routes.ts` and `src/access.ts`.
- Gate action buttons with `PermissionButton` where possible.
- Gate row actions with `access.hasPermission(...)`.
- Apply `access.applyDataScope(...)` before client-side filtering when the list is scope-sensitive.

Do not scatter hard-coded permission strings throughout nested child components if the container can own the decision.

## Query And Mutation Rules

- Put list/tree/detail fetching hooks in `src/queries/system.query.ts` unless there is a strong reason to split the file.
- Reuse `queryKeys.system.*` for invalidation.
- After create/update/delete, invalidate the narrowest correct system query key first.
- Keep API wrappers in `src/services/api/system.ts`; do not call `request(...)` directly from page files.

## Form Rules

- Prefer explicit validation rules in `ProFormText` and `ProFormSelect`.
- Encode lightweight uniqueness checks against already-loaded list data only when it improves UX; do not pretend client checks replace server validation.
- Keep initial values close to the modal form declaration.
- When a form becomes large, extract it into a module-local component such as `components/UserForm.tsx`.

## Refactor Threshold

Split a system page when one file starts owning too many of these at once:

- table columns
- toolbar filters
- mutation wiring
- modal form JSX
- permission branching
- tree flattening or option mapping helpers

Recommended split order:

1. extract constants such as columns or options helpers
2. extract modal form component
3. extract mutation/query orchestration hook

Do not introduce a global abstraction just because two pages look similar. Prefer module-local reuse until a third concrete use case appears.

## Mock And Data Shape Rules

- Keep endpoint contracts aligned with `src/types/system.ts`.
- Keep tree and page-result shapes stable.
- When adding a new system page, add or update the corresponding mock endpoint in `mock/system.ts` first if the backend is not ready.
- Use `src/mock-data/system.ts` only for reusable fixture generation, not for page-level fake state.

## Validation

- Verify route access and action-level permissions separately.
- Verify mutation success messages and refetch behavior.
- Verify filters still work after `applyDataScope(...)`.
- Verify row selection and batch actions clear correctly after destructive operations.
