# 百度首页复刻 AI 使用记录

- 时间：2026-05-29
- 工具：Codex + `@chrome`
- 任务：复刻百度首页核心搜索流程
- 关联文件：
  - `src/pages/BaiduReplica/`
  - `tests/e2e/baidu.spec.ts`
  - `docs/百度首页复刻方案.md`

## 真实页面观察摘要

通过 `@chrome` 连接用户 Chrome，并接管已打开的百度标签页进行只读观察。

观察结果：

- 页面 URL：`https://www.baidu.com/`
- 页面标题：`百度一下，你就知道`
- 可见搜索输入区域为 AI 搜索形态，主要可交互元素是 `#chat-textarea` 和 `#chat-submit-button`
- 传统 `#kw`、`#su` 仍存在于 DOM 中，但当前页面形态下可能为隐藏兼容元素
- 首屏包含顶部导航、Logo、搜索区、文心入口、热搜列表和右下角工具按钮

## 关键实现

- 新增百度页面组件结构：
  - `TopNav`
  - `SearchBox`
  - `WenxinPill`
  - `HotSearchBoard`
  - `SearchResults`
  - `FloatingTools`
- 新增本地 mock 数据：
  - `data/hotSearch.ts`
  - `data/searchResults.ts`
- 新增 e2e 测试：
  - 按钮搜索
  - Enter 搜索
  - 空输入校验
  - 热搜换一换
  - 搜索结果分页

## 验证记录

红灯阶段：

```text
npm run test:e2e
结果：失败。占位页缺少“百度搜索”输入框和“百度一下”按钮。
```

绿灯阶段：

```text
npm run test:e2e
结果：3 passed。百度交互用例和 smoke 用例均通过。
```

## 人工修改说明

- 结果页使用本地 mock 数据，避免真实接口依赖。
- 搜索输入使用 `textarea`，更接近当前百度 AI 搜索区域，但通过 `aria-label="百度搜索"` 保证自动化和可访问性稳定。
- 分页使用真实 `<button>`，当前页通过 `aria-current="page"` 标记。
- 热搜使用本地两组数据，点击“换一换”切换内容。

