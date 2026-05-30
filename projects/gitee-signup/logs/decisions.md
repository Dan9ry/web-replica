# Decisions

## 2026-05-30

- Use target id `gitee-signup`.
- Use React + TypeScript + CSS Modules per repository replica workflow.
- Implement local form validation only; do not call real Gitee signup endpoints.
- For account/signup source capture, only collect visible UI evidence and visible input metadata. Do not dump hidden tokens, cookies, or browser storage.
- Use Phase 3 source baselines for Phase 6 evaluation. Evaluation must not recapture the original site.
- Source submit validation includes both inline required messages and a native browser-like first-field prompt. Replica will render the native-like prompt locally for visual/interaction fidelity.
- Align evaluator selectors with the captured visible form UI: `input:not([type='hidden']),textarea` instead of generic `input`.
- Mark headed Phase 3 captures as manually visible-verified because Gitee can return an abnormal status while still rendering the requested signup form.
- Add core-form regions (`form`, first visible input, submit button) so visual scoring emphasizes the requested registration form and button scope while keeping full-page diffs as reference.
- Fix evaluator DOM profile collection from string-based `page.evaluate` to function-based `page.evaluate`; the string form prevented layout/style/region metrics from being collected.
- Same-type stability check: for form/signup pages, keep source capture limited to visible controls and validation states, avoid hidden tokens/storage, and treat browser-native required prompts as locally rendered visual feedback only.
- Final evaluator command: `EVAL_TARGET_CONFIG=projects/gitee-signup/config/target.json npm run eval`.
- Final evaluator score: total 93.6, functionality 99.2, interaction 100, visual 79.7, structure 92.6, content 95.8, engineering 100.
