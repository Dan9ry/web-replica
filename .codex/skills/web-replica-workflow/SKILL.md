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
> 14. **ACCESS URL REQUIRED**: every replica plan and delivery update must include:
>
> ```text
> http://127.0.0.1:5173/replica/{target}
> ```
>
> If the dev server is not running, also include:
>
> ```bash
> npm run dev
> ```

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

Page source code may be generated under `src/pages/{TargetReplica}/`, but request/spec/logs/prompts/sources/baselines/evaluation/config belong to `projects/{target-id}/`.

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
- verification/fallback behavior,
- required real screenshots or baselines,
- project folder path,
- evaluator config path,
- acceptance thresholds.

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

**Do not** collect original baselines or implement UI in this phase.

✅ **Checkpoint**:

```markdown
## Phase 2 Complete
- [x] Project folder created
- [x] request.md written
- [x] config/target.json created
- [x] Logs/prompts folders initialized
- [ ] Next: proceed to Phase 3 source capture
```

Default: auto-proceed to Phase 3 unless the user asked to pause.

### Phase 3: Real Source Capture And State Baselines

🚧 **GATE**: Phase 2 complete; `projects/{target-id}/config/target.json` exists; required states are known.

**Actions for URL sources**:

- open the real site,
- execute state trigger steps,
- capture page head/top, middle, footer/bottom, and viewport screenshots for every required state,
- if the page uses infinite scroll and has no stable footer, capture a representative lower loaded region and document why no footer exists,
- save DOM/style summaries and interaction notes,
- record any blocker in `logs/blockers.md`,
- pause if access or verification fails.

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
4. Propose the implementation strategy.
5. Present the screenshots and strategy together, then stop for user confirmation.

**Spec confirmation must cover**:

- page scope,
- state scope,
- function scope,
- explicit non-goals,
- visual priorities for header/body/footer/popups/forms/lists,
- screenshot evidence for header/body/footer or documented no-footer exception,
- component split,
- route and replica access URL,
- Phase 3 source capture mode and Phase 6 baseline-only evaluation behavior,
- acceptance thresholds.

✅ **Checkpoint**:

```markdown
## Phase 4 Complete
- [x] spec.md drafted
- [x] State-to-baseline mapping complete
- [x] Source screenshots/baselines shown together with implementation strategy
- [ ] BLOCKING: waiting for explicit user confirmation before implementation
```

⛔ **Hard stop**: Do not implement until the user explicitly confirms the strategy.

### Phase 5: Replica Implementation

🚧 **GATE**: Phase 4 complete and the user explicitly confirmed the replica strategy.

**Actions**:

- create page route/source files,
- implement states one by one,
- keep real network/login/payment/upload out unless explicitly requested,
- locally self-check that all required states can be triggered,
- keep `logs/ai-log.md`, `logs/decisions.md`, and `prompts/replica-prompts.md` updated.

**Forbidden**:

- do not implement states that were not included in the confirmed scope,
- do not call real payment/login/upload APIs unless explicitly requested,
- do not remove or overwrite unrelated user changes.

✅ **Checkpoint**:

```markdown
## Phase 5 Complete
- [x] Replica page opens locally
- [x] Required states are triggerable
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

**Iteration rule**: Fix low-score items, rerun only the current project evaluation, and record changes until the score reaches the target or remaining fixes are documented.

✅ **Checkpoint**:

```markdown
## Phase 6 Complete
- [x] Current project evaluated only
- [x] Report identifies source evidence and evaluation mode
- [x] Functionality/interaction/visual scores reported
- [x] Low-score fix suggestions listed
- [x] Replica access URL reported
```
