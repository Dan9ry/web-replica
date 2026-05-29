---
name: web-replica-workflow
description: Use in this repository for any website replica request, including planning, project creation, real source capture, implementation, evaluation, cleanup, or workflow revision. Enforces the self-contained six-phase project workflow, project-local files, upfront evaluation-mode selection, generic evaluator invocation, and replica access URL reporting.
---

# Web Replica Workflow

Use this skill for every website replica task in this repository.

## Non-Negotiable Rules

1. Do not start implementation before the replica request, source/state scope, evaluation mode, and replica access URL are documented.
2. After Phase 1 request parsing is complete, stop and wait for explicit user confirmation before entering Phase 2 project initialization. Do not treat silence or an inferred scope as approval.
3. Each replica target is created under `projects/{target-id}/`; project files are not scattered across `docs/`.
4. The skill creates project files and target config, then calls the generic evaluator with the project config.
5. The evaluator is generic. It does not own fixed project targets and must be invoked with:

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

6. There is no all-project evaluation. Evaluate only the current project.
7. Source capture fails closed. If the real site cannot be verified, asks for login, shows captcha/security verification, or a required state is missing, pause and ask the user to intervene.
8. Evaluation uses only functionality, interaction, and visual consistency.
9. Every replica plan and delivery update must include the local replica access URL:

```text
http://127.0.0.1:5173/replica/{target}
```

If the dev server is not running, also include:

```bash
npm run dev
```

## Project Folder Contract

Create this structure for every new replica:

```text
projects/{target-id}/
├── request.md
├── spec.md
├── logs/
│   ├── ai-log.md
│   ├── decisions.md
│   └── blockers.md
├── prompts/
│   └── replica-prompts.md
├── sources/
│   ├── user-screenshots/
│   └── urls.md
├── baselines/
│   └── {state-id}/
├── captures/
├── evaluation/
│   ├── latest/
│   └── history/
└── config/
    └── target.json
```

Page source code may be generated under `src/pages/{TargetReplica}/`, but the project remains the owner of request/spec/logs/sources/baselines/evaluation/config.

## Six-Phase Workflow

### Phase 1: Replica Request Parsing

Create or update `projects/{target-id}/request.md`.

Record:

- material source: URL, screenshot, or mixed,
- original URL or screenshot list,
- replica access URL,
- page scope,
- state scope,
- function scope,
- explicit non-goals,
- evaluation mode,
- source evidence mode,
- verification/fallback behavior,
- acceptance thresholds.

Evaluation modes:

- `普通自动评估`: realtime source capture; configured fallback may use the latest verified screenshot/DOM baseline.
- `交互辅助评估`: visible browser; pause for user verification when needed.
- `截图来源评估`: use user screenshots or confirmed baselines; do not infer states outside screenshots.

Gate: request is documented, the replica plan is shown to the user, and the user explicitly confirms it. Stop here until confirmation is received; do not create the project folder, target config, source files, or baselines before the user confirms Phase 1.

### Phase 2: Project Initialization

Create the project folder contract above.

Create `projects/{target-id}/config/target.json` with the evaluator target config. This config is the source passed to the generic evaluator.

Gate:

- project folder exists,
- `request.md` exists,
- `config/target.json` exists,
- local route and replica access URL are known.

### Phase 3: Real Source Capture And State Baselines

Before implementation, collect every required original state.

For URL sources:

- open the real site,
- execute state trigger steps,
- capture top, middle, bottom, and viewport screenshots for scrollable pages,
- save DOM/style summaries and interaction notes,
- pause if access or verification fails.

For screenshot sources:

- place user screenshots in `sources/user-screenshots/`,
- label each screenshot by page and state,
- pause if required state screenshots are missing.

Each required state should have:

```text
projects/{target-id}/baselines/{state-id}/original-desktop.png
projects/{target-id}/baselines/{state-id}/original-top.png
projects/{target-id}/baselines/{state-id}/original-middle.png
projects/{target-id}/baselines/{state-id}/original-bottom.png
projects/{target-id}/baselines/{state-id}/original-dom.json
projects/{target-id}/baselines/{state-id}/capture-notes.md
```

Gate: every required state has verified source evidence.

### Phase 4: Replica Strategy And Spec Confirmation

Create `projects/{target-id}/spec.md`.

Confirm with the user:

- page scope,
- state scope,
- function scope,
- explicit non-goals,
- visual priorities for header/body/footer/popups/forms/lists,
- component split,
- route and replica access URL,
- evaluation mode and fallback behavior,
- acceptance thresholds.

Gate:

- user confirms strategy,
- every state maps to source evidence,
- evaluation mode is locked,
- `config/target.json` covers all required states.

### Phase 5: Replica Implementation

Implement only after Phase 4 is locked.

Do:

- create page route/source files,
- implement states one by one,
- keep real network/login/payment/upload out unless explicitly requested,
- locally self-check that all required states can be triggered,
- record prompts, AI outputs, manual edits, and commits in `logs/ai-log.md` and `logs/decisions.md`.

Gate:

- replica URL opens locally,
- required states are triggerable,
- header/body/footer or screenshot-covered regions are implemented,
- non-goals are respected.

### Phase 6: Evaluation Iteration And Delivery

Run only the current project:

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

For interaction-assisted evaluation:

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval:interactive
```

Reports must include:

- locked evaluation mode,
- actual source evidence,
- total score,
- functionality score,
- interaction score,
- visual score,
- visual diffs,
- issue list,
- low-score fix suggestions.

Archive reports:

```text
projects/{target-id}/evaluation/latest/
projects/{target-id}/evaluation/history/{timestamp}/
```

Gate:

- report contains only functionality, interaction, and visual scores,
- report identifies source evidence and evaluation mode,
- low-score items include fix suggestions,
- result contains only the current project,
- score reaches target or next fixes are documented.

## Required Plan Output

When giving a replica plan, include:

- material source,
- replica access URL,
- page scope,
- state scope,
- function scope,
- non-goals,
- evaluation mode and fallback behavior,
- required source screenshots/baselines,
- project folder path,
- evaluator config path,
- acceptance thresholds.
