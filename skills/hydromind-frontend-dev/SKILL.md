---
name: hydromind-frontend-dev
description: Guidance for implementing and refactoring features in the Hydromind enterprise admin frontend at D:\workspace\hydromind-frontend. Use when adding or changing routes, pages, permissions, mock APIs, services, react-query hooks, auth flow, or shared components in this repo. Preserve the existing domain-first structure based on src/modules, src/queries, src/services, src/stores, and src/access.ts rather than converting the project into a generic Ant Design Pro template.
---

# Hydromind Frontend Dev

## Overview

Follow the current repo's architecture first. This project uses Umi Max and Ant Design Pro components, but it is not a standard `src/pages`-driven Pro scaffold. Treat it as a business-first admin app with domain modules and explicit request, query, auth, and permission layers.

Load extra guidance only when relevant:

- For `src/modules/system/*`, read `references/system.md`.
- For `src/modules/knowledge/*`, read `references/knowledge.md`.

## Core Rules

- Keep page entry files under `src/modules/*`. Do not create `src/pages` unless explicitly asked.
- Keep routes in `config/routes.ts` and point them to module entry files.
- Keep runtime app bootstrapping in `src/app.tsx`.
- Keep route permissions and data-scope helpers in `src/access.ts`.
- Keep HTTP transport centralized in `src/services/request.ts`. Do not call `axios` directly from pages or query hooks.
- Keep endpoint wrappers in `src/services/api/*`.
- Keep server-state fetching in `src/queries/*` using `@tanstack/react-query`.
- Keep `zustand` usage narrow. Use stores for auth and a small amount of cross-page client state only. Do not mirror list/detail server data into stores.
- Keep mock endpoints in `mock/*`. Use `src/mock-data/*` only for reusable fixture data that supports the mock layer.
- Keep files UTF-8 without BOM when writing JSON, TS, TSX, LESS, or Markdown.

## Architecture Map

- `config/routes.ts`: route tree, menu structure, and page-level access flags.
- `src/app.tsx`: initial state, QueryClientProvider, layout shell, login redirect, avatar logout.
- `src/access.ts`: permission checks, route guards, and data-scope filtering helpers.
- `src/services/request.ts`: the only request transport and interceptor entry.
- `src/services/api/*`: business-facing API functions.
- `src/queries/*`: react-query hooks and query key usage.
- `src/stores/*`: auth token and limited client-only global state.
- `src/modules/*`: business-domain pages and module-local UI.
- `src/components/*`: reusable cross-module components such as `PermissionButton`.

## State Boundaries

- Put current user and app bootstrap data in `initialState`.
- Put auth token persistence in `src/stores/auth.store.ts`.
- Put server data, caching, refetching, and invalidation in react-query hooks.
- Put modal open state, filters, tabs, and local editing state in page-local React state.
- Do not introduce another global state library unless the user explicitly asks for it.

## Page Conventions

- Use Ant Design and Pro Components pragmatically. `PageContainer`, `ProTable`, `ModalForm`, and `DrawerForm` are good defaults for admin CRUD pages.
- Keep module entry files readable. When a page grows large, split it into local `components/`, `hooks/`, or `constants/` folders under the same module.
- Do not place fake data directly in page files.
- Do not call services directly from deeply nested presentational components when the container page can own the data flow.
- Reuse `PermissionButton` and `useAccess()` for action-level gating instead of hand-written permission checks scattered across JSX.
- Apply `access.applyDataScope()` for list data that must respect user scope.

## Adding Or Updating A Feature

Use this order unless the task is trivial:

1. Update or add route entries in `config/routes.ts` if the feature is navigable.
2. Extend types in `src/types/*` when contracts change.
3. Add or update endpoint wrappers in `src/services/api/*`.
4. Add or update react-query hooks in `src/queries/*`.
5. Add or update mock endpoints in `mock/*`, and fixture data in `src/mock-data/*` only when needed.
6. Implement the page in `src/modules/*`.
7. Wire access flags in `src/access.ts` and action-level permission checks where needed.

## Refactor Rules

- Refactor incrementally. Do not rewrite unrelated modules just to normalize style.
- Preserve the current domain-first structure. Do not migrate the repo toward a generic `pages/models/services` Pro layout unless explicitly requested.
- If a page is too large, split that page first before introducing new architectural layers.
- Avoid adding parallel abstractions that overlap with existing request, query, or auth flows.
- Prefer extracting reusable module-local code over introducing new global helpers prematurely.

## Validation Checklist

- Run `npm run typecheck` after meaningful code changes.
- Run `npm run build` for changes that touch routes, runtime config, layout, or shared infrastructure.
- When touching auth or runtime, verify login, logout, redirect to `/login`, and current-user bootstrap.
- When touching a CRUD page, verify filters, mutations, permission gating, and query invalidation.
- When touching mocks, verify the API shape still matches the corresponding `src/services/api/*` functions.
