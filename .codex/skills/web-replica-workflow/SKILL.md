---
name: web-replica-workflow
description: Use in this repository for any website replica request, including request parsing, project creation, real source capture, implementation, evaluation, cleanup, or workflow revision. Enforces a strict serial six-phase workflow with explicit gates, blocking user confirmations, project-local files, generic evaluator invocation, fail-closed source capture, and replica access URL reporting.
---

# Web Replica Workflow

Use this skill for every website replica task in this repository.

**Core Pipeline**: `Replica Request → ⛔ User Confirmation → Create Project → Source Baselines → ⛔ Spec Confirmation → Implementation → Evaluation`

> [!CAUTION]
> ## Global Execution Discipline (MANDATORY)
>
> This workflow is a strict serial pipeline. Violating any rule below is an execution failure:
>
> 1. **SERIAL EXECUTION**: phases MUST run in order. The output of each phase is the input for the next.
> 2. **BLOCKING = HARD STOP**: phases marked ⛔ BLOCKING require a full stop. Wait for an explicit user response before proceeding.
> 3. **NO SILENT APPROVAL**: user silence, inferred intent, previous preferences, or a recommended default is not confirmation.
> 4. **GATE BEFORE ENTRY**: every phase has a 🚧 GATE. Verify the gate before starting that phase.
> 5. **NO CROSS-PHASE BUNDLING**: do not combine request parsing, project creation, source capture, implementation, and evaluation in one unconfirmed run.
> 6. **NO SPECULATIVE EXECUTION**: do not pre-create project files, target config, source files, baselines, or implementation before their phase gate is satisfied.
> 7. **SOURCE CAPTURE FAILS CLOSED**: if the original page cannot be verified, shows captcha/security verification, requires login, returns an error page, or misses a required state, pause and ask the user to intervene. Do not guess.
> 8. **HEAD / MIDDLE / FOOTER COVERAGE**: interactive source capture MUST collect the page head, middle, and footer for every required state. If the site has no stable footer because infinite scrolling keeps loading new content, document that exception and capture representative lower loaded content instead.
> 9. **SCREENSHOTS WITH STRATEGY**: Phase 4 MUST present source screenshots/baselines together with the replica strategy. Text-only strategy confirmation is forbidden.
> 10. **NO SOURCE RE-CAPTURE DURING EVALUATION**: Phase 6 evaluation MUST use the screenshots/baselines captured in Phase 3 as original evidence. Do not run interactive source capture again during evaluation. If baselines are missing or stale, return to Phase 3.
> 11. **CURRENT PROJECT ONLY**: evaluation is always for the current replica project. Do not evaluate all projects.
> 12. **GENERIC EVALUATOR ONLY**: the evaluator does not own fixed targets. Invoke it with the current project config:
>
> ```bash
> EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
> ```
>
> 13. **THREE METRICS ONLY**: evaluation uses functionality, interaction, and visual consistency.
> 14. **ACCESS URL REQUIRED**: every replica plan and delivery update must include the replica access URL. Phase 1 may show the default planned URL:
>
> ```text
> http://127.0.0.1:5173/replica/{target}
> ```
>
> After the dev server starts, the reported URL MUST use the actual server port from the dev-server output, because `5173` is not always available. If the dev server is not running, also include:
>
> ```bash
> npm run dev
> ```
> 15. **PROJECT-LOCAL PAGE SOURCE**: generated replica page source MUST live inside the current project folder, not under `src/pages/`. `src/` is only the shared app shell, router entry, and common infrastructure.
> 16. **SAME-BROWSER VERIFICATION HANDOFF**: if the browser used for source capture hits CAPTCHA, security verification, login, or AI verification, hand that exact browser tab/session to the user. Do not tell the user to verify in a different browser/profile. After the user finishes, resume in the same session and re-check the target state.
> 17. **NO OLD-PROJECT REFERENCE**: a new replica project MUST NOT reference any old project, including its directory shape, file names, component split, prompts, mock data, CSS, page logic, interaction implementation, or visual implementation. Build only from this skill, the current user request, and the current source baselines/screenshots.
> 18. **MAINTAINABLE AND INDEPENDENT OUTPUT**: the replica artifact must be complete, long-term maintainable source code that can run locally or online without the original site's backend for the specified core functionality and interactions.
> 19. **INTERACTIVE WEBPAGE ONLY, NEVER SCREENSHOT-AS-PAGE**: source screenshots are evidence and implementation references only. The final replica MUST be an interactive webpage built with DOM/CSS/JS behavior. Never use a full-page screenshot, large region screenshot, image map, canvas-only screenshot rendering, or screenshot background as the webpage. Never switch to screenshot-as-page because evaluation scores are low; if scores remain below target, deliver the best interactive webpage plus the report and remaining issues.

> [!IMPORTANT]
> ## Communication Rule
>
> Match the user's language. For this repository, Chinese user-facing plans, checkpoints, reports, and questions are preferred unless the user asks otherwise.

## Project Folder Contract

After Phase 1 is explicitly confirmed, every replica target gets this project folder:

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

Replica page source code belongs under `projects/{target-id}/page/`. Do not generate replica UI under `src/pages/`. The `src` tree may only be changed to register routes, shared styles, or common app infrastructure needed to serve the project page.

Default implementation stack is **React + TypeScript + CSS Modules**. Do not switch to Vue, Next.js, plain static HTML, Tailwind, or another UI stack unless the user explicitly changes the stack. Use existing project dependencies first; add a dependency only when it clearly improves maintainability or fidelity, and record the reason in `logs/decisions.md`.

Replica source should be structured for long-term maintenance. Use `page/components/` for meaningful UI regions, `page/data/` for local mock/result data, `page/hooks/` for reusable local interaction state, and `page/utils/` for pure helpers when they are needed. Do not collapse JSX, mock data, interaction logic, and styling into one giant file when the page has multiple regions or states.

Screenshots in `baselines/` and `sources/user-screenshots/` are not page implementation assets. They may guide visual matching and evaluation, but they must not be placed into the replica page to stand in for real text, controls, layout, forms, lists, pagination, or interactive states. Image assets are allowed only for genuine image content such as logos, photos, icons, or illustrations when those are part of the source page; they cannot replace DOM/CSS reconstruction of the page.

Do not inspect, copy, adapt, or pattern-match any previous `projects/*` project when creating a new project. If a useful practice should apply broadly, it must already be written in this skill; otherwise it is not allowed as input for the new project.

## Website Type Templates

Use these templates only as generic checklists. They do not override the current user request or current source baselines.

**Content/search display pages** such as Google Search, Baidu Search, Bing Search:

- capture states: entry page, query/results page, pagination or more-results state, empty/no-result state when in scope,
- core regions: header, search box, category/filter nav, result list, side panels when present, pagination, footer,
- core interactions: typing, click submit, Enter submit, result text rendering, pagination or more-results navigation.

**Form interaction pages** such as login, registration, password reset:

- capture states: initial form, typed input, validation error, submit loading/failure, captcha/security state when present,
- core regions: form container, labels, inputs, helper text, captcha block, submit button, error messages, footer,
- core interactions: focus/blur, typing, clearing, validation, disabled/enabled submit, local failure feedback. Do not call real login/payment/upload APIs unless explicitly requested.

## Workflow

### Phase 1: Replica Request Parsing (⛔ BLOCKING)

🚧 **GATE**: The user has provided a replica request with at least one material source:

- website URL,
- user-provided screenshot,
- or mixed URL + screenshot material.

**Actions**:

1. Parse the request into a proposed replica plan.
2. Identify missing request information and make conservative recommendations when possible.
3. Present the plan to the user and stop.
4. Do not create `projects/{target-id}/`, `request.md`, `target.json`, baselines, or source files in this phase.

**Required plan output**:

- material source: URL, screenshot, or mixed,
- original URL or screenshot list,
- target id recommendation,
- replica access URL,
- page scope,
- state scope,
- function scope,
- explicit non-goals,
- Phase 3 source capture mode,
- Phase 6 evaluation uses existing baselines only,
- source evidence mode,
- same-browser verification handoff plan,
- required real screenshots or baselines,
- project folder path,
- evaluator config path,
- acceptance thresholds.

Default acceptance thresholds:

- total score >= 90,
- functionality >= 90,
- interaction >= 90,
- visual >= 90.

If the user asks for stricter thresholds, use the stricter values. Do not lower these defaults unless the user explicitly accepts a lower target.

**Phase 3 source capture modes**:

- `普通自动采集`: realtime source capture; configured fallback may use the latest verified screenshot/DOM baseline.
- `交互辅助采集`: visible browser during Phase 3 only; pause for user verification when needed.
- `截图来源采集`: use user screenshots or confirmed baselines; do not infer states outside screenshots.

Phase 6 evaluation must not use interactive source capture; it evaluates against the Phase 3 baselines.

✅ **Checkpoint**:

```markdown
## Phase 1 Complete
- [x] Replica request parsed
- [x] Replica plan presented
- [x] Evaluation mode recommended
- [ ] BLOCKING: waiting for explicit user confirmation before Phase 2
```

⛔ **Hard stop**: Wait until the user explicitly confirms the plan, for example "确认", "可以，继续", or equivalent.

### Phase 2: Project Initialization

🚧 **GATE**: Phase 1 complete and the user explicitly confirmed the replica plan.

**Actions**:

1. Create the project folder contract under `projects/{target-id}/`.
2. Write the confirmed request into `projects/{target-id}/request.md`.
3. Create `projects/{target-id}/config/target.json` for the generic evaluator.
4. Create initial log files under `logs/` and prompt tracking under `prompts/`.
5. Ensure the route plan and replica access URL are recorded.
6. Create `projects/{target-id}/page/` for page implementation files.
7. Do not copy or infer any files from previous `projects/*` directories.

**Do not** collect original baselines or implement UI in this phase.

✅ **Checkpoint**:

```markdown
## Phase 2 Complete
- [x] Project folder created
- [x] request.md written
- [x] config/target.json created
- [x] Logs/prompts folders initialized
- [x] page/ source folder initialized
- [ ] Next: proceed to Phase 3 source capture
```

Default: auto-proceed to Phase 3 unless the user asked to pause.

### Phase 3: Real Source Capture And State Baselines

🚧 **GATE**: Phase 2 complete; `projects/{target-id}/config/target.json` exists; required states are known.

**Actions for URL sources**:

- choose and record the capture browser/session before opening the real site,
- prefer `@chrome` when the task needs the user's normal Chrome profile, cookies, extensions, or visible local verification,
- if using Playwright or another automation browser, launch a visible persistent browser/context that can be handed to the user,
- open the real site,
- execute state trigger steps,
- capture page head/top, middle, footer/bottom, and viewport screenshots for every required state,
- if the page uses infinite scroll and has no stable footer, capture a representative lower loaded region and document why no footer exists,
- save DOM/style summaries and interaction notes,
- record any blocker in `logs/blockers.md`,
- pause if access or verification fails.

**Same-browser verification handoff protocol**:

1. Detect verification pages by URL/title/text signals such as CAPTCHA, security verification, AI verification, access restriction, login challenge, or missing required selectors.
2. Keep the failing tab/session open. Do not close it, recreate it, or switch to another browser profile.
3. Bring that exact browser window/tab to the foreground or provide its live-view URL when using a remote browser session.
4. Tell the user: "Please complete verification in this opened browser window/tab, then tell me when finished."
5. Provide an explicit recovery signal before waiting. The recovery path must be visible to Codex and the user, for example terminal `Enter`, a documented resume command, or a watched `verification-resume.json` file.
6. Wait for the user confirmation or the documented recovery signal. Do not leave a capture process waiting with no Codex-side resume entry.
7. Resume capture in the same browser session and re-run the state gate.
8. If the same session still fails, record the blocker and stop. Do not guess or use a different browser silently.

Record the browser handoff in `projects/{target-id}/sources/capture-session.md`:

- browser provider: `@chrome`, Playwright headed, remote live-view browser, or screenshot source,
- profile/session path or live-view URL when available,
- target state and URL,
- verification signal detected,
- recovery signal or resume command,
- user handoff time and result,
- post-verification gate result.

**Actions for screenshot sources**:

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

`capture-notes.md` MUST explicitly mark:

- head/top captured,
- middle captured,
- footer/bottom captured,
- browser/session used,
- or `no-stable-footer` with the reason and representative lower-content evidence.

**Forbidden**:

- do not treat blank/error/captcha/security pages as original baselines,
- do not guess missing middle/bottom/page states,
- do not proceed if head, middle, and footer coverage has not been checked for every required state,
- do not start implementation if any required state is unverified.

✅ **Checkpoint**:

```markdown
## Phase 3 Complete
- [x] Required original states captured or screenshot baselines labeled
- [x] Head/middle/footer coverage checked for every required state
- [x] DOM/style summaries saved where available
- [x] Capture notes written
- [ ] Next: proceed to Phase 4 spec confirmation
```

Default: auto-proceed to Phase 4 unless source capture failed or the user asked to pause.

### Phase 4: Replica Strategy And Spec Confirmation (⛔ BLOCKING)

🚧 **GATE**: Phase 3 complete; every required state has verified source evidence.

**Actions**:

1. Create `projects/{target-id}/spec.md`.
2. Map each required state to its source evidence.
3. Embed or link the captured source screenshots for every required state, including head/middle/footer evidence.
4. Create a region/component decomposition table that binds every in-scope area to real screenshot or DOM evidence.
5. Propose the implementation strategy.
6. Present the screenshots, region/component table, and strategy together, then stop for user confirmation.

**Region/component decomposition table**:

`spec.md` MUST include a table with these columns:

- area/region,
- source state and screenshot evidence,
- key elements,
- visual requirements,
- interaction requirements,
- implementation component/file.

Every in-scope header, body section, footer, form, list, pagination control, popup, and empty/loading/error state must appear in the table. Each row must reference real Phase 3 evidence. Do not invent any region without source evidence.

**Spec confirmation must cover**:

- page scope,
- state scope,
- function scope,
- explicit non-goals,
- visual priorities for header/body/footer/popups/forms/lists,
- screenshot evidence for header/body/footer or documented no-footer exception,
- region/component decomposition table with source evidence,
- component split,
- route and replica access URL,
- maintainable source-code plan,
- independent local/online run plan,
- Phase 3 source capture mode and Phase 6 baseline-only evaluation behavior,
- acceptance thresholds.

✅ **Checkpoint**:

```markdown
## Phase 4 Complete
- [x] spec.md drafted
- [x] State-to-baseline mapping complete
- [x] Source screenshots/baselines shown together with implementation strategy
- [x] Region/component decomposition table complete and evidence-bound
- [ ] BLOCKING: waiting for explicit user confirmation before implementation
```

⛔ **Hard stop**: Do not implement until the user explicitly confirms the strategy.

### Phase 5: Replica Implementation

🚧 **GATE**: Phase 4 complete and the user explicitly confirmed the replica strategy.

**Actions**:

- create page route registration in `src` only when needed,
- create all replica page source files under `projects/{target-id}/page/`,
- implement with React + TypeScript + CSS Modules unless the user explicitly confirmed another stack,
- create complete maintainable source code, not a one-off static dump,
- build real DOM/CSS/JS interactions for text, controls, layout, forms, lists, pagination, and state transitions; screenshots are references only,
- separate components, local state/hooks, mock data, helpers, and styles where that improves maintainability,
- keep component/file names aligned with the confirmed region/component decomposition table,
- implement states one by one,
- keep real network/login/payment/upload out unless explicitly requested,
- make the specified core functionality and interactions work locally without depending on the original site's backend,
- locally self-check that all required states can be triggered,
- start the dev server and report the actual working URL/port,
- keep `logs/ai-log.md`, `logs/decisions.md`, and `prompts/replica-prompts.md` updated.

**Forbidden**:

- do not implement states that were not included in the confirmed scope,
- do not put generated replica UI files under `src/pages/`,
- do not reference or copy any old project implementation,
- do not switch frontend stack or add UI/dependency bloat without explicit need and a recorded decision,
- do not deliver a single static HTML dump or one giant page file when multiple regions/states are in scope,
- do not use full-page screenshots, cropped page-region screenshots, image maps, canvas-only screenshot renderings, or screenshot backgrounds as the replica webpage,
- do not replace low-scoring interactive implementation with screenshot-as-page to improve visual score,
- do not call real payment/login/upload APIs unless explicitly requested,
- do not remove or overwrite unrelated user changes.

✅ **Checkpoint**:

```markdown
## Phase 5 Complete
- [x] Replica page opens locally
- [x] Required states are triggerable
- [x] Actual local access URL/port reported
- [x] Source code is maintainable and project-local
- [x] React + TypeScript + CSS Modules stack used, or user-approved exception recorded
- [x] Source files follow the confirmed region/component decomposition
- [x] Final product is an interactive webpage, not screenshot-as-page
- [x] Core functionality works without original backend dependency
- [x] Header/body/footer or screenshot-covered regions implemented
- [x] AI usage and manual decisions logged
- [ ] Next: proceed to Phase 6 evaluation
```

Default: auto-proceed to Phase 6 unless the user asked to pause.

### Phase 6: Evaluation Iteration And Delivery

🚧 **GATE**: Phase 5 complete; the replica page is runnable locally; `config/target.json` points to the current project; Phase 3 baselines exist for all required states.

Run only the current project:

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

Evaluation source rule:

- use Phase 3 screenshots/baselines as the original evidence,
- do not open the original website interactively during evaluation,
- do not ask the user to solve captcha/security verification during evaluation,
- if original baselines are missing, incomplete, or stale, stop and return to Phase 3 source capture before evaluating.

Reports must include:

- locked evaluation mode,
- actual source evidence,
- whether evaluation used Phase 3 baseline screenshots,
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

**Iteration rule**:

- If evaluation does not meet the confirmed target score, fix the low-score items listed in the report.
- Rerun only the current project evaluation after each fix round.
- Record each round in `projects/{target-id}/logs/decisions.md` or `logs/ai-log.md`, including the low-score items, changes made, command run, score change, and remaining issues.
- Stop immediately once the target score is reached.
- Do not exceed 3 fix/evaluation rounds for one Phase 6 pass.
- If the target is still not reached after 3 rounds, stop and deliver the latest score, reports, and a remaining-issues list instead of continuing indefinitely.
- If the target is still not reached, do not use screenshots as the webpage or otherwise reduce interactivity to improve visual scoring. The final deliverable remains the best interactive webpage achieved, with scores and issues reported honestly.

Stable same-type validation:

- After the delivered project reaches the target or the 3-round limit, run a light stability check on one new page of the same type when feasible.
- The check starts only from the initial user-style request and this skill. Do not use old project files.
- For content/search pages, choose another search/display page and verify that request parsing, state planning, source-capture planning, and implementation strategy can proceed without extra user intervention.
- For form pages, choose another login/register/reset-style page and verify the same workflow stability.
- Record the stability result in `projects/{target-id}/logs/decisions.md`.

✅ **Checkpoint**:

```markdown
## Phase 6 Complete
- [x] Current project evaluated only
- [x] Report identifies source evidence and evaluation mode
- [x] Functionality/interaction/visual scores reported
- [x] Low-score fix suggestions listed
- [x] Fix/evaluation rounds recorded, max 3 rounds
- [x] Same-type stability check recorded when feasible
- [x] Final deliverable remains an interactive webpage even if scores are below target
- [x] Replica access URL reported
```
