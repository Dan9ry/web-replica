# Decisions

## 2026-05-29

- Use target id `google-search`.
- Use React + TypeScript + CSS Modules per repository replica workflow.
- Use local mock search data for result text and pagination; do not call Google backend APIs.
- Use `tencent` as the source-capture query because it is relevant to the workspace name and produces a stable search-results page.
- Use Phase 3 source baselines for Phase 6 evaluation. Evaluation must not recapture the original Google site.
- Google's captured search input is a `textarea[name='q']` in this session, so evaluator selectors accept `textarea[name='q'],input[name='q']`.
- Use immediate scroll-to-top after local pagination to keep page 2 state stable for screenshots and users.

## Evaluation Round 1

- Command: `EVAL_TARGET_CONFIG=projects/google-search/config/target.json npm run eval`
- Mode: Phase 3 baseline-only evaluation.
- Result: total 94.6, functionality 100, interaction 100, visual 86.4.
- Remaining issue: `#result-stats` is present in the original baseline but detected hidden by the automated visibility check; this is a source baseline warning, not a replica blocker.
- Target reached: yes.

## Same-Type Stability Check

- Same-type task considered: a Bing-style or Baidu-style search/display replica with input, submit, result text, and pagination.
- Request parsing can proceed with the same state model: home, typed query, results page 1, results page 2.
- Source-capture planning remains valid: collect top, middle, bottom, DOM summary, and preserve same-browser handoff if security verification appears.
- Implementation strategy remains valid: local mock result data, URL-driven query/page state, DOM/CSS result list and pagination, no real search backend.
