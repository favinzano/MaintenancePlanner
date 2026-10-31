# PlannerMC component inventory

**Status:** design primitives and visual states; not complete product workflows.  
**Product identity:** PlannerMC with the user-directed MacroCap Labs identity.  
**Route:** `/design` (Vite single-page fallback).  
**Source capture:** [source-sign-in.png](./source-sign-in.png), public sign-in page only.

The gallery uses sample content. Actions are preview interactions and do not save planner records, upload source files, activate the microphone, or contact another service. The PM copy button writes sample text to the local clipboard when the browser permits it.

## Visual foundations

| Foundation | Decision |
| --- | --- |
| Palette | Observed dark background, surface, text, pale-blue action, ring, semantic colors, and approximate logo colors; see `tokens.json` and `../brand-reference.md`. |
| Control border | `#707070` (`border-input`) for text inputs, select, focusable file controls, and similar boundaries. `#2F2F2F` is reserved for decorative separators. |
| Warning | `#F3C969` is a proposed semantic warning color. No warning color appeared on the public sign-in screenshot. |
| Typeface | Geist Variable with a system sans-serif fallback. Vite bundles the variable WOFF2 from the `geist` package; retain the [SIL OFL 1.1 license](./licenses/Geist-OFL-1.1.txt). |
| Icons | Lucide React line icons. Decorative icons are hidden from assistive technology; icon-only controls carry an accessible name. |
| Radius | 6 px controls, 10 px cards, 14 px larger panels, pill badges. |
| Spacing | 4 px base; common steps 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64 px. |
| Motion | 120 ms fast and 180 ms base; reduced-motion preference shortens animation and transition duration. |
| Layout | 238 px desktop navigation rail; rail becomes a horizontally scrollable navigation strip below the large-screen breakpoint; content max width 1440 px. |

## Components and states

### Application shell

- **Parts:** MacroCap Labs logo, PlannerMC product name, primary navigation, breadcrumb, preview/account controls, responsive navigation, status footer.
- **States:** active navigation item; desktop rail; narrow viewport navigation; announcement message.
- **Behavior:** navigation selection is local to the gallery. It does not change routes or records.
- **Accessibility:** landmark elements, labeled navigation regions, `aria-current="page"` on the selected section, visible focus, logo alternative text `MacroCap Labs`.

### Button

- **Variants:** primary, secondary, ghost, danger.
- **Sizes:** small (32 px minimum height), medium (40 px minimum height), icon-only 36 px.
- **States:** default, hover, focus-visible, disabled, loading sample.
- **Accessibility:** native `<button>`; icon-only controls include `aria-label`; loading preserves a text label.

### Badge

- **Variants:** neutral, success, warning, danger, blue/information.
- **States:** plain, with leading status icon, current, review required.
- **Accessibility:** text names every state; color is supplementary.

### Text field, search, select, and textarea

- **Variants:** labeled text, search with leading icon, native select, multi-line note.
- **States:** empty, filled, focused, placeholder; browser validation remains native.
- **Tokens:** `panel-muted`, `foreground`, `muted`, `border-input`, `ring`.
- **Accessibility:** visible `<label>` associations, native control semantics, keyboard operation, high-contrast field edge and focus outline.

### Manual selection

- **Variants:** drop-zone prompt and selected file row; standalone and dialog.
- **States:** empty, selected, removable, dialog open/closed.
- **Behavior:** file selection is only displayed locally in this gallery; no upload occurs.
- **Accessibility:** native file input, associated label, removal button names the selected file. Dialog uses Radix Dialog for focus management, Escape close, and focus return.

### Evidence card

- **Parts:** source icon, source title/type, locator, excerpt, linked status, detail action.
- **States:** source linked and locator retained.
- **Accessibility:** status has text and icon; action has an accessible name.

### Limitation notice

- **Variants:** warning panel and review-required badge.
- **States:** visible/open; sample content only.
- **Accessibility:** warning text is explicit; icon does not carry the meaning by itself.

### Asset tree

- **Parts:** one parent equipment card and directly nested sub-asset rows.
- **States:** parent confirmed, child present, parent action menu.
- **Scope:** one hierarchy level only.
- **Accessibility:** visible parent/child text and named action button.

### PM step editor

- **Parts:** title/interval summary, numbered editable rows, add and remove actions, count.
- **States:** populated, empty, add disabled at 15, editable text.
- **Rule shown:** at most 15 steps. The gallery enforces this cap in its local view state.
- **Accessibility:** ordered list, labeled step inputs, separately named remove buttons, disabled add action at the cap.

### Review status and version history

- **Statuses:** Draft, Ready for review, Approved.
- **History rows:** current and saved versions with author/time sample labels.
- **Behavior:** preview actions only; no approval, version, or save is persisted.
- **Accessibility:** state labels remain visible as text, and version information is grouped by row.

### Text/voice composer

- **Variants:** text input, voice preview state, language pair.
- **States:** text, voice preview enabled, preview status announcement.
- **Behavior:** voice toggle does not access a microphone or record audio; send action does not submit.
- **Accessibility:** labeled textarea, pressed-state buttons, `role="status"` for voice state, descriptive action name.

### Copy actions

- **Variants:** full sample PM, selected-step preview.
- **States:** ready, copied confirmation, clipboard unavailable.
- **Behavior:** full sample PM uses the Clipboard API; no CMMS or service integration.
- **Accessibility:** visible label, icon plus text, polite status confirmation.

## Source and licensing notes

- Source sign-in screenshot: `https://ops.macrocaplabs.com/`, captured 2026-10-30. It contains only the public username/password form and brand presentation; no account was entered.
- Logo source URL: `https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif`. The gallery references this public image URL to preserve the supplied logo; permanence and asset-hosting terms have not been confirmed.
- The source icon package was not identifiable. PlannerMC uses Lucide React.
- Geist Variable is distributed under SIL Open Font License 1.1. Include the upstream license notice in the project package when font files are bundled.
- No trademark glyph is added to the product or logo wordmark.

## Deliberate exclusions

No KPI dashboard, charts, Gantt, inventory, purchasing, operational records, or complete PlannerMC workflow is included in this design step.
