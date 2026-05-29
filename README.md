# 网页复刻与一致性评估

这是微信支付后台开发实习岗考察项目：使用 AI 工具完成网页复刻，并搭建自动化一致性评估体系，对原网页与复刻页面在功能、交互、视觉、性能、可访问性和响应式表现上进行量化比较。

## 项目目标

- 至少完成 3 个不同类型页面的复刻，并提供可长期维护的前端源码。
- 先搭建评估体系，再进行页面复刻，形成“复刻 → 评估 → 修复 → 再评估”的闭环。
- 原网页采集必须可信：如果原网页访问、截图、DOM 提取或关键元素识别失败，评估必须立即停止，不允许主观猜测或继续评分。
- 复刻网页时，可以使用 `@chrome` 实时操纵真实网页，观察 DOM、交互、状态变化和异常情况，而不是只依赖截图分析。
- 如果 AI 操作真实网页时被阻拦、进入错误页、触发验证码/风控、Chrome 插件通信失败，或无法确认页面内容正确，必须及时汇报，不继续臆测。
- 保留关键 Prompt、AI 对话片段、人工修改说明和评估报告，体现 AI 工具使用过程。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端工程 | Vite + React + TypeScript |
| 路由 | React Router |
| 自动化浏览器 | Playwright；必要时使用 `@chrome` 操作真实 Chrome |
| 视觉对比 | pixelmatch、sharp、ssim.js |
| 可访问性 | axe-core |
| 测试 | Vitest、Playwright Test |
| 报告 | JSON + Markdown，后续扩展 HTML 报告 |

## 目录结构

```text
src/
  pages/
    BaiduReplica/
    WeChatPayLoginReplica/
    ThirdReplica/
  shared/
evaluator/
  collectors/        # 原网页与复刻页采集
  core/              # 配置、门禁、指标、报告核心逻辑
  reports/           # 报告生成脚本
  targets/           # 每个目标页面的评估配置
tests/
  e2e/
  unit/
docs/
  ai-logs/
  prompts/
reports/
  latest/
  history/
```

## 本地启动

```bash
npm install
npm run dev
```

启动后访问：

```text
http://127.0.0.1:5173
```

## 常用命令

```bash
npm run build       # 构建前端工程
npm run test        # 运行单元测试
npm run test:e2e    # 运行 Playwright 冒烟测试
npm run eval        # 运行一致性评估流程
npm run eval:interactive # 交互式评估，遇到安全验证时暂停给用户处理
```

`npm run eval` 适合自动化或 CI：只要原网页真实状态采集失败，就立即中断，不生成复刻一致性总分。

`npm run eval:interactive` 适合本地人工辅助评估：当真实网页进入安全验证、AI 校验、验证码或关键状态未出现时，评估器会打开可见浏览器窗口并暂停。用户在浏览器中完成验证后，回到终端按 Enter，评估器会继续采集当前真实状态。该模式使用 `.evaluator-browser-profile/` 保存本地浏览器状态，减少重复验证。

## 复刻页面

| 页面 | 路由 | 当前状态 |
| --- | --- | --- |
| 百度首页 | `/replica/baidu` | 已实现首页、搜索结果页、分页和空输入交互 |
| 微信支付商户登录页 | `/replica/wechat-pay-login` | 第一阶段占位页 |
| 第三个目标页面 | `/replica/third` | 等待用户提供目标 URL |

## 评估原则

评估体系采用硬门禁机制：先验证原网页采集是否可信，再计算一致性指标。

原网页采集失败时，流程必须停止该页面评分，并输出诊断信息：

- 请求状态码和最终 URL。
- 缺失的关键 selector。
- 页面标题、核心文本或 URL 是否与目标页面匹配。
- 失败截图或错误原因。

禁止把空白页、错误页、拦截页、验证码页或不确定页面作为原网页基准。

## Chrome 使用约束

复刻阶段可以通过 `@chrome` 操作真实网页，以观察：

- 页面真实交互流程。
- 表单 focus、hover、错误提示和状态变化。
- 动态 DOM 与网络加载后的最终结构。
- 截图无法体现的细节。

如果 Chrome 操作受阻，必须记录并汇报，不得继续猜测：

- Chrome 未安装或未启动。
- Codex Chrome Extension 无法通信。
- 页面需要登录、验证码、风控校验。
- 页面进入错误页、空白页或非目标页面。
- 无法确认采集内容是否来自目标网页。

## 文档

- [题目原文](docs/微信支付后台开发实习岗-基于%20AI%20工具的网页复刻与一致性评估.md)
- [实施方案](docs/网页复刻与一致性评估实施方案.md)
