# Issue tracker: Local Markdown

Issues and specifications for this repository live as Markdown files in `.scratch/`.

## Conventions

- Use one directory per feature: `.scratch/<feature-slug>/`.
- Store the feature specification at `.scratch/<feature-slug>/spec.md`.
- Store each implementation issue in a separate file at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Record triage state in a `Status:` line near the top of each issue file, using the roles in `triage-labels.md`.
- Append comments and conversation history under a `## Comments` heading.

## Tracker operations

- To publish an issue, create a Markdown file under the matching feature's `issues/` directory.
- To fetch an issue, read the referenced path or issue number.

## Wayfinding

- Map: `.scratch/<effort>/map.md`, containing Notes, Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`, with `Type:` set to `research`, `prototype`, `grilling`, or `task`, and `Status:` set to `claimed` or `resolved`.
- Blocking: record dependencies as `Blocked by: NN, NN`. A ticket is unblocked when every listed ticket is resolved.
- Frontier: scan the effort's issues for open, unblocked, unclaimed files; select the lowest issue number first.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the answer under `## Answer`, set `Status: resolved`, then add a concise context pointer to Decisions-so-far in `map.md`.
