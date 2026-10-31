# Domain docs

## Before exploring

- Read `GLOSSARY.md` at the repository root when it exists.
- If `GLOSSARY-MAP.md` exists, use it to find and read the glossary relevant to the topic.
- Read relevant architecture decision records in `docs/adr/`.
- If these files do not exist, proceed without them. Create or update domain documentation only when a domain term or technical decision is resolved.

## Layout

PlannerMC is a single-context project. Use a root `GLOSSARY.md` and `docs/adr/` for shared domain vocabulary and architecture decisions. Do not create context-specific glossary or ADR directories unless the project becomes a genuine multi-context repository.

## Vocabulary

Use terms as defined in the glossary in issue titles, proposals, hypotheses, and test names. If a needed term is missing or unclear, record the gap for domain modeling rather than silently introducing a competing term.

## Decision conflicts

If work conflicts with an existing ADR, identify the ADR and surface the conflict for review instead of silently overriding it.
