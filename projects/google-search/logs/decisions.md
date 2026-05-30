# Decisions

- Use React + TypeScript + CSS Modules, matching the repository default stack.
- Use local mock search data for results because the replica must work without Google's backend.
- Keep generated page source under `projects/google-search/page/`; only route registration will touch `src/`.


## Phase 3 Capture

- Captured 3 required Google states using Playwright headed.
- Saved viewport, top, middle, bottom screenshots and DOM/style summaries under `projects/google-search/baselines/`.
- Verification handoff was not required unless noted in `sources/capture-session.md`.

## Phase 5 Implementation

- Search results are local mock data modeled on the captured result layout and copy patterns.
- Local interaction selectors use `data-*` attributes while visual and structural comparison selectors keep Google-like DOM anchors such as `#searchform`, `#search`, `#rso`, `#botstuff`, and `#footcnt`.
- Search button click and Enter share the same local submit path.

## Phase 6 Round 1

- Evaluation command: `EVAL_TARGET_CONFIG=projects/google-search/config/target.json npm run eval`
- Initial score: total 89.8, functionality 94.7, interaction 100, visual 76.7, structure 95.9, content 73.6, engineering 100.
- Low-score item: content text baseline used English `Advertising`, while Phase 3 captured the Japanese Google locale with footer text `広告`.
- Change made: updated top-level expected text baseline to match the captured source locale.
- Rerun score: total 91.9, functionality 97.5, interaction 100, visual 76.7, structure 95.9, content 87.4, engineering 100.
- Remaining issue: visual score is above the default threshold but still warning-level because Google source includes dynamic result modules and a language popup that are only approximated.

## Same-Type Stability Check

- Same-type page considered: Bing Search (`https://www.bing.com/`), a content/search display page.
- Request parsing would proceed with source URL, initial state, query/results state, pagination state, and local mock search data.
- Source-capture planning would use the same Phase 3 headed-browser baseline approach with verification handoff if access/security checks appear.
- Implementation strategy would use the same independent React + TypeScript + CSS Modules structure: search box, results header, results list, pagination, and footer components under a new project-local `page/` folder.
- Result: workflow can proceed without extra user intervention for the same page type.
