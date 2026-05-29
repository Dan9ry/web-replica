---
name: web-replica-workflow
description: Use for this repository when planning, collecting sources for, implementing, evaluating, or iterating a website replica. Enforces the project-local six-phase clone workflow, current-project-only evaluation, upfront evaluation-mode selection, project folder organization, and live replica URL reporting.
---

# Web Replica Workflow

Use this skill for every website replica task in this repository, including requests to create a clone plan, collect real site evidence, implement a replica page, evaluate a replica, or revise the clone workflow.

Detailed workflow reference:

```text
docs/网页复刻六阶段流程.md
```

Read that document when the task needs phase details, templates, project folder layout, or acceptance gates.

## Core Rules

1. Follow the six phases in order:
   - Phase 1: Replica request parsing.
   - Phase 2: Project initialization.
   - Phase 3: Real source capture and state baselines.
   - Phase 4: Replica strategy and spec confirmation.
   - Phase 5: Replica implementation.
   - Phase 6: Evaluation iteration and delivery.
2. Every replica target gets its own project folder:
   - `projects/{target-id}/request.md`
   - `projects/{target-id}/spec.md`
   - `projects/{target-id}/logs/`
   - `projects/{target-id}/prompts/`
   - `projects/{target-id}/sources/`
   - `projects/{target-id}/baselines/`
   - `projects/{target-id}/evaluation/`
   - `projects/{target-id}/config/target.json`
3. Before implementation, create or update the replica request/spec and obtain user confirmation when scope or evaluation mode is not already locked.
4. Evaluation mode is decided in the upfront replica plan:
   - `普通自动评估`
   - `交互辅助评估`
   - `截图来源评估`
   Record the chosen mode and evidence source in `projects/{target-id}/spec.md`.
5. Evaluation is always for the current replica project only. Use `EVAL_TARGET={target-id}` or a current-target script. Do not offer or run all-target evaluation.
6. Source capture must fail closed:
   - If the real site cannot be accessed, enters security verification, shows captcha, requires login, or cannot be confirmed as the target page, pause and ask the user to intervene.
   - Do not guess missing original states.
   - Screenshot-source replicas can only rely on states visible in provided screenshots.
7. Capture all required states before implementation. For scrollable pages, capture top, middle, bottom, and viewport screenshots.
8. Evaluation uses only:
   - 功能一致性
   - 交互一致性
   - 视觉一致性
9. Reports must identify:
   - locked evaluation mode,
   - actual source evidence,
   - score breakdown,
   - low-score fix suggestions.
10. Every replica plan and delivery update must include the live local access URL for the replica page, for example:

```text
http://127.0.0.1:5173/replica/{target}
```

If the dev server is not running yet, still state the intended URL and the command to start it:

```bash
npm run dev
```

## Required Plan Output

When giving a replica plan, include:

- Material source: URL, screenshot, or mixed.
- Replica access URL: `http://127.0.0.1:5173/replica/{target}`.
- Page scope.
- State scope.
- Function scope.
- Explicit non-goals.
- Evaluation mode and fallback behavior.
- Required real screenshots or screenshot baselines.
- Project folder path: `projects/{target-id}/`.
- Acceptance thresholds for functionality, interaction, visual, and total score.

## Required Evaluation Behavior

Before running evaluation:

1. Confirm the current `target-id`.
2. Confirm the locked evaluation mode from `projects/{target-id}/spec.md`.
3. Run only that target:

```bash
EVAL_TARGET={target-id} npm run eval
```

or the target-specific script, such as:

```bash
npm run eval:baidu
```

For interaction-assisted evaluation, use the matching interactive command:

```bash
EVAL_TARGET={target-id} npm run eval:interactive
```

If verification appears, pause and wait for the user to complete it before continuing.
