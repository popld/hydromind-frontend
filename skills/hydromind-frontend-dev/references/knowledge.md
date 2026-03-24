# Knowledge Module Guidance

Use this reference when working under `src/modules/knowledge/*`, `src/services/api/knowledge.ts`, `src/queries/knowledge.query.ts`, `src/hooks/useKnowledgeQaChat.ts`, or related types and mocks.

## Scope

The `knowledge` domain currently covers:

- knowledge base management
- document management
- QA conversation experience
- streaming answer handling
- conversation persistence and reference preview

This domain mixes admin CRUD with conversational interaction. Do not force every screen into the same pattern.

## Structural Rules

- Keep CRUD-like pages such as knowledge base and document management close to the `system` CRUD pattern.
- Keep chat-specific logic in dedicated hooks and components instead of inflating the page container.
- Prefer keeping `qa` interaction logic near existing chat utilities and hooks.

The current QA page already coordinates:

- active conversation selection
- draft session restoration
- SSE/stream lifecycle
- rename and delete mutations
- reference preview behavior

Do not move all of that into one new global store.

## API Rules

- Keep standard REST-like endpoints in `src/services/api/knowledge.ts`.
- Keep SSE parsing and stream transport in the same knowledge service layer or a closely related utility, not inline in page JSX.
- Preserve the `/v1/knowledge/*` contract shape unless the user explicitly requests an API migration.

## Query Rules

- Keep conversation lists, message lists, base lists, and document/base CRUD reads in `src/queries/knowledge.query.ts`.
- Use react-query for cacheable reads and mutation invalidation.
- For streaming answer assembly, use a dedicated hook rather than trying to model the entire live stream as a normal query.

## QA Page Rules

- Preserve session restore behavior from `readKnowledgeChatSession(...)` and `writeKnowledgeChatSession(...)` unless intentionally changing product behavior.
- Preserve the distinction between draft conversations and persisted conversations.
- Keep stop/retry/edit-message flows explicit in the page or a module-local hook.
- Keep reference preview behavior driven by selected `KnowledgeReference` objects, not ad hoc string parsing in components.

When extending the QA page, prefer this split:

1. page shell owns orchestration and route/session integration
2. hook owns chat run/stream state
3. presentational components render message list, composer, and reference preview

## UX Rules

- Do not regress multi-turn conversation continuity.
- Do not drop the selected knowledge-base context silently.
- Show user-facing feedback for restore, rename, delete, retry, and stream failure states.
- Prefer graceful fallback from streaming failure over clearing the whole conversation view.

## Refactor Threshold

If the QA page grows further, split in this order:

1. conversation list panel component
2. reference side panel component
3. page-level orchestration hook for session and route syncing

Avoid premature extraction of tiny helpers if it makes the chat flow harder to read.

## Mock And Data Shape Rules

- Keep knowledge mock endpoints aligned with `src/types/knowledge.ts`.
- Preserve SSE event naming and payload shape when editing stream mocks or parsers.
- Keep reusable fixture data in `src/mock-data/knowledge.ts`; do not embed large fake conversations directly into page files.

## Validation

- Verify conversation switching, rename, and delete flows.
- Verify draft restoration after reload or route return.
- Verify selected base IDs remain valid when the base list changes.
- Verify stream stop, retry, and final message/reference rendering.
- Verify both non-stream and stream API paths if either one was touched.
