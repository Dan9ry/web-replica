# Google Search Replica Spec

## Page Scope

- Source: `https://www.google.com/`
- Local route: `/replica/google-search`
- Planned access URL: `http://127.0.0.1:5173/replica/google-search`
- Stack: React + TypeScript + CSS Modules
- Source evidence mode: Phase 3 Playwright-headed source baselines only.
- Phase 6 behavior: evaluate against saved Phase 3 baselines; do not recapture Google during evaluation.

## State Scope And Evidence

| State | Source URL | Evidence |
| --- | --- | --- |
| Initial search page | `https://www.google.com/` | `baselines/initial/original-desktop.png`, `original-top.png`, `original-middle.png`, `original-bottom.png`, `original-dom.json` |
| Search results page | `https://www.google.com/search?q=tencent` | `baselines/results/original-desktop.png`, `original-top.png`, `original-middle.png`, `original-bottom.png`, `original-dom.json` |
| Second results page | `https://www.google.com/search?q=tencent&start=10` | `baselines/page-2/original-desktop.png`, `original-top.png`, `original-middle.png`, `original-bottom.png`, `original-dom.json` |

All required states have top, middle, and footer/bottom captures. No verification handoff was required.

## Function Scope

- Search input accepts typing.
- Search button click submits a local query.
- Enter key submits a local query.
- Results page renders query text, result count/timing copy, and result items.
- Pagination switches between local result pages and updates the URL query string.

## Non Goals

- No live Google backend calls.
- No account/login, apps launcher, personalization, ads engine, CAPTCHA, or real ranking.
- External result links are non-operational safe mock links.

## Region And Component Decomposition

| Area/region | Source state and screenshot evidence | Key elements | Visual requirements | Interaction requirements | Evaluation role | Suggested structure selectors | Implementation component/file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Top navigation | initial, `original-top.png` | About/Store links, Gmail/Images/Login area | Sparse white header, small text, right-aligned account cluster | Links are visual only | visual | `body`, `a` | `components/SearchHome.tsx` |
| Google logo/search shell | initial, `original-desktop.png` | logo wordmark, centered search form | Centered layout, large whitespace, rounded pill search box, subtle shadow | Input focus, Enter submit | functional | `form`, `textarea[name='q'], input[name='q']` | `components/SearchHome.tsx`, `components/SearchBox.tsx` |
| Home action buttons | initial, `original-desktop.png` | Google Search button, I'm Feeling Lucky button | Low-contrast grey buttons below search pill | Search button submits query | functional | `input[name='btnK'], button[type='submit']` | `components/SearchBox.tsx` |
| Initial footer | initial, `original-bottom.png` | country row, advertising/business/privacy/settings links | Light grey band at bottom, compact link rows | Visual only | visual | `#fbar, footer, [role='contentinfo']` | `components/GoogleFooter.tsx` |
| Results header | results/page-2, `original-top.png` | small logo, search input, right links, nav tabs | Sticky-feeling top area with search pill, thin divider, compact tabs | Query input, submit | functional | `#searchform, form`, `textarea[name='q'], input[name='q']` | `components/ResultsHeader.tsx`, `components/SearchBox.tsx` |
| Results list | results/page-2, `original-middle.png` | result count text, titles, URLs, snippets | Left-aligned column, blue titles, green/dark URL lines, grey snippets | Result links visual only | content | `#rso, #search`, `.g` in replica | `components/ResultsList.tsx`, `data/searchResults.ts` |
| Pagination | results/page-2, `original-bottom.png` | numbered pages, Previous/Next | Google-like page numbers and next link under results | Next/Previous and page numbers update local page | functional | `#botstuff, #footcnt`, `[data-page-next]`, `[data-current-page]` | `components/Pagination.tsx` |
| Results footer | results/page-2, `original-bottom.png` | location/settings/help/footer links | Light grey footer beneath result column | Visual only | visual | `#footcnt, footer` | `components/GoogleFooter.tsx` |

## Implementation Plan

- Keep routing registration in `src/App.tsx`.
- Keep all generated page source under `projects/google-search/page/`.
- Use `GoogleSearchReplicaPage.tsx` as the page-level coordinator.
- Use a small local hook to synchronize `q` and `page` query params with UI state.
- Use local data in `data/searchResults.ts` so results and pagination work offline.
- Use selectors that are stable for both visual comparison and interaction:
  - common Google-like selectors: `form`, `textarea[name='q'], input[name='q']`, `#searchform`, `#search`, `#rso`, `#botstuff`, `#footcnt`
  - local interaction selectors: `[data-page-next]`, `[data-current-page]`

## Acceptance Thresholds

- Total score >= 85
- Functionality >= 85
- Interaction >= 85
- Visual >= 60
- Structure/semantics >= 80
- Content/data >= 80
- Engineering maintainability >= 80
