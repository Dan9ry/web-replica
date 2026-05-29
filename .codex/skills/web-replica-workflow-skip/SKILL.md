---
name: web-replica-workflow-skip
description: Use in this repository when the user wants a website replica workflow that skips blocking user confirmations. Automatically parses the request, creates the project, captures real source baselines, writes the spec, implements, evaluates, and iterates. Still fails closed on captcha, inaccessible source pages, missing required screenshots, or unverifiable original evidence.
---

# Web Replica Workflow Skip

Use this skill only when the user explicitly wants the website replica process to run without confirmation gates, or names the `web-replica-workflow-skip` skill.

Default user-facing language in this repository is Chinese.

**Core Pipeline**: `Replica Request -> Auto Plan -> Create Project -> Source Baselines -> Auto Spec -> Implementation -> Evaluation`

## Skip Mode Rules

This skill removes user confirmation gates, but it does not remove evidence quality gates.

1. **No confirmation waiting**: do not stop after request parsing or strategy/spec generation to ask "是否确认". Present a short progress summary and continue automatically.
2. **Conservative defaults**: when request details are incomplete, choose conservative defaults from this skill and record the decision in `projects/{target-id}/logs/decisions.md`.
3. **Fail closed on source evidence**: if the original site cannot be verified, shows captcha/security verification, requires login, returns an error page, or misses a required state, pause for user intervention. Do not guess.
4. **Same-browser verification handoff**: if the capture browser hits verification, hand that exact browser tab/session to the user. Do not ask the user to verify in a different browser/profile.
5. **No source recapture during evaluation**: evaluation uses Phase 3 baselines only. If baselines are missing or stale, return to Phase 3 before evaluating.
6. **Current project only**: evaluate only the current replica project. Do not evaluate all projects.
7. **Project-local page source**: generated replica page source must live under `projects/{target-id}/page/`, not under `src/pages/`.
8. **No old-project reference**: do not inspect, copy, adapt, or pattern-match previous `projects/*` implementations.
9. **Access URL required**: every progress/delivery update must include the replica access URL. Before the dev server starts, use the planned URL; after it starts, use the actual port from dev-server output.
10. **Three metrics only**: evaluation reports functionality, interaction, and visual consistency.

Planned URL format:

```text
http://127.0.0.1:5173/replica/{target}
```

Actual URL must use the running dev server port, because `5173` is not always available.

## Project Folder Contract

Every target gets this folder:

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
│   ├── urls.md
│   └── capture-session.md
├── page/
│   ├── {TargetReplica}Page.tsx
│   ├── {TargetReplica}Page.module.css
│   ├── components/
│   ├── data/
│   ├── hooks/
│   └── utils/
├── baselines/
│   └── {state-id}/
├── captures/
├── evaluation/
│   ├── latest/
│   └── history/
└── config/
    └── target.json
```

Default implementation stack is **React + TypeScript + CSS Modules**. Do not switch to Vue, Next.js, plain static HTML, Tailwind, or another stack unless the user explicitly requested it.

Use `page/components/` for meaningful UI regions, `page/data/` for local mock/result data, `page/hooks/` for reusable local interaction state, and `page/utils/` for pure helpers when needed. Do not deliver a one-off static HTML dump or one giant file when multiple regions or states are in scope.

## Website Type Defaults

Use these as defaults when the user does not fully specify scope.

**Content/search display pages**:

- states: entry page, query/results page, pagination or more-results state, empty/no-result state when naturally in scope,
- regions: header, search box, category/filter nav, result list, side panels when present, pagination, footer,
- interactions: typing, click submit, Enter submit, result text rendering, pagination or more-results navigation.

**Form interaction pages**:

- states: initial form, typed input, validation error, submit loading/failure, captcha/security state when present,
- regions: form container, labels, inputs, helper text, captcha block, submit button, error messages, footer,
- interactions: focus/blur, typing, clearing, validation, disabled/enabled submit, local failure feedback.

Do not call real login, payment, upload, or destructive APIs unless explicitly requested.

## Phase 1: Automatic Request Parsing

**Gate**: the user provided at least one source:

- website URL,
- user-provided screenshot,
- or mixed URL + screenshot material.

If no material source exists, ask for the missing source and stop.

**Actions**:

1. Parse the request into a replica plan.
2. Fill missing details with conservative defaults.
3. Record the plan in `projects/{target-id}/request.md` after Phase 2 creates the project.
4. Continue directly to Phase 2 without asking for confirmation.

**Plan must include**:

- material source,
- original URL or screenshot list,
- target id,
- replica access URL,
- page scope,
- state scope,
- function scope,
- explicit non-goals,
- Phase 3 source capture mode,
- Phase 6 baseline-only evaluation rule,
- same-browser verification handoff plan,
- required screenshots/baselines,
- project folder path,
- evaluator config path,
- acceptance thresholds.

Default thresholds:

- total score >= 90,
- functionality >= 90,
- interaction >= 90,
- visual >= 90.

## Phase 2: Project Initialization

**Gate**: Phase 1 produced a usable plan.

**Actions**:

1. Create the project folder contract under `projects/{target-id}/`.
2. Write the parsed request and selected defaults into `request.md`.
3. Create `config/target.json` for the generic evaluator.
4. Create initial `logs/` and `prompts/` files.
5. Record the route plan and replica access URL.
6. Create `page/` implementation folders.
7. Continue directly to Phase 3.

Do not collect baselines or implement UI in this phase.

## Phase 3: Real Source Capture And State Baselines

**Gate**: Phase 2 complete; `config/target.json` exists; required states are known.

**URL source actions**:

- choose and record the capture browser/session before opening the real site,
- prefer `@chrome` when normal Chrome profile, cookies, extensions, or visible local verification matter,
- if using Playwright or another automation browser, launch a visible persistent browser/context that can be handed to the user,
- open the real site,
- execute state trigger steps,
- capture page head/top, middle, footer/bottom, and viewport screenshots for every required state,
- if the page uses infinite scroll and has no stable footer, capture representative lower loaded content and document why no footer exists,
- save DOM/style summaries and interaction notes,
- record blockers in `logs/blockers.md`,
- pause if access or verification fails.

**Screenshot source actions**:

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

`capture-notes.md` must explicitly mark:

- head/top captured,
- middle captured,
- footer/bottom captured,
- browser/session used,
- or `no-stable-footer` with reason and lower-content evidence.

**Same-browser verification handoff**:

1. Detect CAPTCHA, security verification, AI verification, access restriction, login challenge, or missing required selectors.
2. Keep the failing tab/session open.
3. Bring that exact browser window/tab to the foreground or provide its live-view URL.
4. Ask the user to complete verification in that opened browser window/tab.
5. Provide a visible recovery signal such as terminal `Enter`, a documented resume command, or a watched `verification-resume.json` file.
6. Resume in the same session and re-run the state gate.
7. If the same session still fails, record the blocker and stop.

Continue directly to Phase 4 only after all required states have verified baselines.

## Phase 4: Automatic Replica Strategy And Spec

**Gate**: Phase 3 complete; every required state has verified source evidence.

**Actions**:

1. Create `projects/{target-id}/spec.md`.
2. Map every required state to source evidence.
3. Embed or link source screenshots for every required state, including head/middle/footer evidence.
4. Create a region/component decomposition table.
5. Write the implementation strategy.
6. Present a concise summary with screenshot links, decomposition table location, strategy, and access URL.
7. Continue directly to Phase 5 without asking for confirmation.

`spec.md` must include a region/component table with these columns:

- area/region,
- source state and screenshot evidence,
- key elements,
- visual requirements,
- interaction requirements,
- implementation component/file.

Every in-scope header, body section, footer, form, list, pagination control, popup, empty state, loading state, and error state must appear in the table. Every row must reference Phase 3 evidence. Do not invent regions without source evidence.

## Phase 5: Replica Implementation

**Gate**: Phase 4 complete and `spec.md` exists.

**Actions**:

- create route registration in `src` only when needed,
- create all replica page source files under `projects/{target-id}/page/`,
- implement with React + TypeScript + CSS Modules unless the user explicitly requested another stack,
- keep component/file names aligned with the region/component table,
- separate components, state/hooks, mock data, helpers, and styles where useful,
- implement required states one by one,
- keep real network/login/payment/upload out unless explicitly requested,
- make specified core functionality and interactions work locally without the original site's backend,
- locally self-check every required state,
- start the dev server and report the actual working URL/port,
- keep `logs/ai-log.md`, `logs/decisions.md`, and `prompts/replica-prompts.md` updated,
- continue directly to Phase 6 unless the dev server or required state self-check fails.

## Phase 6: Evaluation Iteration And Delivery

**Gate**: Phase 5 complete; replica page runs locally; `config/target.json` points to the current project; Phase 3 baselines exist.

Run only the current project:

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

Evaluation rules:

- use Phase 3 screenshots/baselines as original evidence,
- do not open the original website interactively during evaluation,
- do not ask the user to solve captcha/security verification during evaluation,
- if baselines are missing, incomplete, or stale, stop and return to Phase 3.

Reports must include:

- locked evaluation mode,
- actual source evidence,
- whether Phase 3 baseline screenshots were used,
- total score,
- functionality score,
- interaction score,
- visual score,
- visual diffs,
- issue list,
- low-score fix suggestions.

Archive reports under:

```text
projects/{target-id}/evaluation/latest/
projects/{target-id}/evaluation/history/{timestamp}/
```

**Iteration rule**:

- if evaluation misses the target score, fix the low-score items,
- rerun only the current project evaluation,
- record each round in `logs/decisions.md` or `logs/ai-log.md`,
- stop once the target score is reached,
- run at most 3 fix/evaluation rounds,
- if still below target after 3 rounds, deliver the latest score, report, and remaining issue list.

**Delivery must include**:

- replica access URL,
- project path,
- evaluation report path,
- final functionality/interaction/visual scores,
- remaining issues if any,
- commands needed to run locally.
