# Persist the planner's conversation-language preference

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the first bounded part of the remaining Spanish/English conversation requirement: let an authenticated planner choose and persist `en` or `es` as their preferred conversation language.

## Scope

- Use the existing `public.user_preferences` table and authenticated principal.
- Default to English when no preference row exists.
- Add authenticated `GET /api/me/preferences` and `PUT /api/me/preferences/conversation-language` endpoints.
- Verify preference writes through an independent read-back.
- Add an accessible selector in the authenticated PlannerMC shell and load the saved value after sign-in/reload.
- Keep menus, interface messages, asset names, and PM documents in English.
- State clearly that the preference applies to conversational prompts when that capability is added.
- Do not add a chat model, external translation/generation, external research, speech recognition, or speech synthesis.

## Acceptance

- A signed-in planner can read their own stored `en` or `es` preference; a missing row defaults to `en`.
- A signed-in planner can save either supported value. The API derives `user_id` and `workspace_id` from the authenticated principal, rejects unsupported values, and confirms the stored value through a separate query.
- Unauthenticated requests are rejected; a request body cannot select a different user or workspace.
- The authenticated UI exposes a keyboard-accessible, labeled language selector, restores the persisted value after reload, and reports save failures without showing a false success.
- The preference does not change the UI or PM document language, and no external provider is called.
- The build succeeds and focused automated checks cover the language parser and preference API behavior that can be isolated locally.

## Comments

- 2026-11-01: Selected as a bounded `/replica-build` slice after Q4 catalog verification and the refreshed `/replica-diff` report. This implements only the preference specified in RF-11; it does not claim that bilingual text or voice conversation is complete.

## Answer

Implemented the authenticated es/en preference routes and desktop/mobile selector using the existing `user_preferences` table. The API derives ownership from the verified session, defaults a missing value to English, rejects unsupported values, and performs a separate read-back. `npm run build` passed; `npm run test:conversation-preferences` passed 4/4. Authenticated development QA verified Spanish persistence across reload, restored English and verified it after reload, confirmed unauthenticated access returns 401, and checked focus/visibility at mobile and desktop widths. No external providers or production services were used. Text conversation and speech remain absent; this issue resolves only the language-preference sub-slice.
