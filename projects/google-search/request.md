# Google Search Replica Request

## User Request

复刻网站，不需要用户确认：

- 网站：https://www.google.com/
- 复刻范围：搜索输入框、搜索按钮点击交互、搜索结果文案展示、结果列表翻页功能。

## Parsed Scope

- Target id: `google-search`
- Material source: live URL
- Original URL: `https://www.google.com/`
- Planned local URL: `http://127.0.0.1:5173/replica/google-search`
- Stack: React + TypeScript + CSS Modules
- Source capture mode: 普通自动采集；若遇到 CAPTCHA/安全验证则改为同一可见浏览器会话交接并停止等待。
- Evaluation mode: Phase 6 仅使用 Phase 3 保存的 baselines，不重新采集原站。

## In Scope

- Search landing page with search input and action buttons.
- Query submission by clicking the search button and pressing Enter.
- Local search results page with copied presentation patterns and mock result copy.
- Result list pagination with previous/next and numbered pages.
- Header/body/footer regions visible in captured states.

## Non Goals

- Calling Google's real search backend.
- Reproducing personalized ranking, ads, account menus, Google apps menu, login, CAPTCHA, or localization persistence.
- Implementing external result links beyond safe mock links.

## Acceptance Thresholds

- Total score >= 85
- Functionality >= 85
- Interaction >= 85
- Visual >= 60
- Structure/semantics >= 80
- Content/data >= 80
- Engineering maintainability >= 80
