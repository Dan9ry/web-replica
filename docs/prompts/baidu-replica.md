# 百度首页复刻 Prompt 记录

## 真实页面观察

使用 `@chrome` 打开并观察 `https://www.baidu.com/`，确认页面可访问，标题为“百度一下，你就知道”。当前百度首页可见搜索区更偏 AI 搜索形态：

- 可见输入框：`#chat-textarea`
- 可见提交按钮：`#chat-submit-button`
- 页面中仍存在传统搜索元素：`#kw`、`#su`，但它们在当前形态下可能是隐藏的兼容元素
- 主要区域：顶部导航、居中 Logo、AI 搜索框、文心胶囊、百度热搜、右下角悬浮工具

## 实现 Prompt

```text
请基于当前项目的 Vite + React + TypeScript + CSS Modules 结构，实现百度首页复刻页面。
复刻范围包括：首页搜索框、搜索按钮点击交互、搜索结果文案展示、结果列表和分页功能。
不调用百度真实接口，搜索结果使用本地 mock 数据。
视觉上参考当前百度首页：顶部导航、居中 Logo、大圆角搜索框、右侧“百度一下”按钮、文心胶囊入口和百度热搜两列布局。
请先基于真实页面提取结果建立组件计划：包含 accessibility snapshot 摘要、DOM/computedStyle 摘要、交互元素清单、design tokens 和结构 landmark。
请拆分组件到 src/pages/BaiduReplica/components，并保证 npm run test、npm run build、npm run test:e2e 可通过。
```

## 人工边界

- 不调用百度真实搜索接口。
- 不复刻登录、设置、语音搜索、图片搜索和上传能力。
- 不绕过验证码或风控。
- 搜索结果和热榜使用本地 mock 数据，保证评估可重复。

