# Google Search Replica Spec

## Scope

- Page scope: Google search home and local search-results experience.
- State scope: initial home, typed query/submitted result page, pagination to page 2.
- Function scope: search input, search button click, Enter submit, result text display, page switching.
- Non-goals: no real Google Search API, login/account menu, voice/image search, ads backend, live suggestions, AI backend, CAPTCHA bypass, or personalization.

## Route And Runtime

- Replica route: `/replica/google-search`
- Planned local URL: `http://127.0.0.1:5173/replica/google-search`
- Source files: `projects/google-search/page/`
- Stack: React + TypeScript + CSS Modules
- Evaluation target config: `projects/google-search/config/target.json`
- Evaluation mode: Phase 6 uses Phase 3 baselines only.
- Acceptance thresholds: total >= 90, functionality >= 90, interaction >= 90, visual >= 90.

## Source Evidence

| State | Top | Middle | Bottom | DOM/notes |
| --- | --- | --- | --- | --- |
| Home | `baselines/home/original-top.png` | `baselines/home/original-middle.png` | `baselines/home/original-bottom.png` | `baselines/home/original-dom.json`, `baselines/home/capture-notes.md` |
| Results page 1 | `baselines/results-page-1/original-top.png` | `baselines/results-page-1/original-middle.png` | `baselines/results-page-1/original-bottom.png` | `baselines/results-page-1/original-dom.json`, `baselines/results-page-1/capture-notes.md` |
| Results page 2 | `baselines/results-page-2/original-top.png` | `baselines/results-page-2/original-middle.png` | `baselines/results-page-2/original-bottom.png` | `baselines/results-page-2/original-dom.json`, `baselines/results-page-2/capture-notes.md` |

All required states have top, middle, and bottom captures. The home page has viewport-height content, so middle and bottom represent the same no-scroll lower position and are still recorded as evidence.

## Region And Component Decomposition

| Area/region | Source state and screenshot evidence | Key elements | Visual requirements | Interaction requirements | Implementation component/file |
| --- | --- | --- | --- | --- | --- |
| Home header | Home: `original-top.png` | left text links, right Gmail/images/login-style controls | sparse white header, small dark links, right-aligned controls | links are inert local anchors | `components/HomeHeader.tsx` |
| Home search center | Home: `original-top.png`, `original-middle.png` | Google wordmark, rounded search input, icon slots, two buttons | centered layout, Google-color wordmark, pill input with subtle shadow/border, compact buttons | input focus, typing, button click submits, Enter submits | `components/SearchHome.tsx`, `hooks/useSearchExperience.ts` |
| Home footer | Home: `original-bottom.png` | location row, footer links, settings text | light gray footer pinned near viewport bottom | inert local footer links | `components/HomeFooter.tsx` |
| Results header/search bar | Results page 1/2: `original-top.png` | compact Google logo, search box, search icon, nav tabs, login button | sticky-feeling top area, horizontal search form, nav row, muted separators | query remains editable; submit updates result list | `components/ResultsHeader.tsx` |
| Results summary and AI-style block | Results page 1: `original-top.png`, DOM text sample | result count/summary text, short overview block | compact body column, Google-like typography, subdued metadata | static local content tied to query | `components/ResultsList.tsx`, `data/results.ts` |
| Organic result list | Results page 1/2: `original-top.png`, `original-middle.png` | title links, URLs, snippets, translated/local text | blue titles, green/gray URLs, readable snippets, left aligned at Google result width | result links are local inert anchors | `components/ResultItem.tsx`, `components/ResultsList.tsx` |
| Results pagination | Results page 1/2: `original-bottom.png` | page numbers, previous/next controls, Google-like pagination mark | centered under result list, colored page numbers and next affordance | clicking page 1/page 2/next/previous switches local page state and updates URL params | `components/Pagination.tsx`, `hooks/useSearchExperience.ts` |
| Results footer | Results page 1/2: `original-bottom.png` | region/location text, footer links | light gray lower band after results, compact link rows | inert local footer links | `components/ResultsFooter.tsx` |
| Empty/local fallback state | Required by local interaction, inferred from form behavior and no backend non-goal | "no local results" text if query is blank or unsupported | same results shell, simple message | blank submit keeps focus; unsupported query shows local generic results | `components/ResultsList.tsx`, `data/results.ts` |

## Implementation Strategy

1. Register `/replica/google-search` in `src/App.tsx` and import the project-local page component.
2. Keep all replica source under `projects/google-search/page/`.
3. Build a maintainable local search experience:
   - `GoogleSearchReplicaPage.tsx` decides home vs results state from URL query params.
   - `useSearchExperience.ts` owns query input, submit, and page changes.
   - `data/results.ts` contains deterministic local result text for page 1 and page 2.
4. Match the captured desktop layout:
   - home page: white canvas, center search group, footer at bottom;
   - results page: compact top search header, nav tabs, left column result list, pagination footer.
5. Implement real DOM/CSS/JS behavior only. Source screenshots remain evidence and are not used as page backgrounds or image maps.
6. After implementation, run local build/tests where available, start Vite, and run the current-project evaluator with:

```bash
EVAL_TARGET_CONFIG=projects/google-search/config/target.json npm run eval
```

## Phase 4 Checkpoint

- [x] `spec.md` drafted
- [x] State-to-baseline mapping complete
- [x] Source screenshots/baselines listed with implementation strategy
- [x] Region/component decomposition table complete and evidence-bound
- [ ] BLOCKING: waiting for explicit user confirmation before implementation
