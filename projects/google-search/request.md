# Google Search Replica Request

## User Request

复刻网页：

- 网址：https://www.google.com/
- 复刻范围：搜索输入框、搜索按钮点击交互、搜索结果文案展示、结果列表翻页功能。

## Confirmed Plan

- Target id: `google-search`
- Original URL: `https://www.google.com/`
- Planned replica URL: `http://127.0.0.1:5173/replica/google-search`
- Stack: React + TypeScript + CSS Modules
- Source capture mode: 交互辅助采集
- Evaluation mode: Phase 6 uses Phase 3 project-local baselines only.

## Scope

- Initial Google search home state.
- Typed search query state.
- Search result list state after submit.
- Pagination state after moving to the next result page.

## Core Interactions

- Type into the search input.
- Submit with the Google Search button.
- Submit with Enter.
- Render local mock search-result text.
- Page through local mock result lists.

## Non-Goals

- No real Google Search API integration.
- No login, account menus, voice search, image search, ads, live suggestions, AI answer panels, or personalized services.
- No CAPTCHA or security-verification bypass. If verification appears during source capture, the same browser session is handed to the user.

## Acceptance Thresholds

- Total score >= 90
- Functionality >= 90
- Interaction >= 90
- Visual >= 90
