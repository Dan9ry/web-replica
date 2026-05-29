# 网页复刻与一致性评估

这是微信支付后台开发实习岗考察项目：使用 AI 工具完成桌面端网页复刻，并搭建自动化一致性评估体系，对原网页与复刻页面在功能、交互、视觉、结构语义、内容数据和工程可维护性六个维度上进行量化比较。

## 项目目标

- 至少完成 3 个不同类型页面的复刻，并提供可长期维护的前端源码。
- 先搭建评估体系，再进行页面复刻，形成“复刻 → 评估 → 修复 → 再评估”的闭环。
- 原网页素材采集必须可信：如果原网页访问、截图、DOM 提取或关键元素识别失败，必须在素材采集阶段停止；评估阶段只使用已确认基线，不允许主观猜测或继续评分。
- 复刻网页时，可以使用 `@chrome` 实时操纵真实网页，观察 DOM、交互、状态变化和异常情况，而不是只依赖截图分析。
- 如果 AI 操作真实网页时被阻拦、进入错误页、触发验证码/风控、Chrome 插件通信失败，或无法确认页面内容正确，必须及时汇报，不继续臆测。
- 保留关键 Prompt、AI 对话片段、人工修改说明和评估报告，体现 AI 工具使用过程。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端工程 | Vite + React + TypeScript |
| 路由 | React Router |
| 图标 | lucide-react |
| UI 组件库 | Ant Design |
| 页面生成 | 由项目级 skill 按当前复刻 project 创建页面源码；`src` 只负责应用壳与路由入口 |
| 自动化浏览器 | Playwright；必要时使用 `@chrome` 操作真实 Chrome |
| 视觉对比 | pixelmatch、sharp、ssim.js |
| 测试 | Vitest、Playwright Test |
| 报告 | JSON + Markdown + HTML |

## 目录结构

```text
src/
  main.tsx
  App.tsx             # 应用壳与路由入口
  shared/
projects/
  {target-id}/
    page/             # 当前复刻页面源码
    baselines/        # Phase 3 原站截图/DOM 基线
    config/           # 当前 project 的评估配置
    evaluation/       # 当前 project 的评估报告、截图、diff 和历史记录
    logs/             # AI 使用与人工决策记录
evaluator/
  collectors/        # 读取原站基线并采集复刻页
  core/              # 配置、门禁、指标、报告核心逻辑
  reports/           # 报告生成脚本
tests/
  e2e/
  unit/
.codex/
  skills/
    web-replica-workflow/
docs/
```

## 本地启动

首次安装：

```bash
npm install
npx playwright install chromium
```

启动开发服务器：

```bash
npm run dev
```

启动后访问：

```text
http://127.0.0.1:5173
```

快速验证：

```bash
npm run test
npm run build
npm run test:e2e
```

环境依赖说明见 [环境依赖](docs/环境依赖.md)，报告体系说明见 [六维评估报告体系](docs/六维评估报告体系.md)。

## 常用命令

```bash
npm run build       # 构建前端工程
npm run test        # 运行单元测试
npm run test:e2e    # 运行 Playwright 冒烟测试
npm run eval        # 运行一致性评估流程，必须配合 EVAL_TARGET_CONFIG
npm run eval:interactive # 兼容旧命令；当前等同于 npm run eval
```

评估器是通用工具，不内置具体复刻项目。运行评估时必须传入当前 project 的配置：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

具体复刻页面不预置在 `src/pages/` 中，由项目级 skill 在 `projects/{target-id}/page/` 创建页面源码，并在 `projects/{target-id}/` 下管理评估配置和素材基线。

评估结果不写入统一主目录 `reports/latest`，而是写入当前 project：

```text
projects/{target-id}/evaluation/latest/
├── summary.json          # 六维汇总，供 CI 或自动化读取
├── details.json          # 页面、状态、维度、问题、证据的完整详情
├── artifacts-index.json  # 截图、diff、交互失败证据等产物索引
├── report.md             # 六维 Markdown 报告
├── index.html            # 六维 Dashboard 报告
├── captures/             # 原站基线与复刻采集 JSON
└── assets/               # 截图、整页 diff、区域 diff、失败步骤截图
projects/{target-id}/evaluation/history/{timestamp}/
```

## 评估原则

评估体系采用门禁机制：先验证 Phase 3 已保存的原网页截图/DOM 基线是否可信，再计算一致性指标。评估阶段不再交互式打开原站，也不会要求用户在评估过程中处理验证码；如果基线缺失、过期、不完整或无法通过门禁，必须回到素材采集阶段修复。

原网页基线门禁失败时，流程必须输出诊断信息：

- 基线文件路径和读取错误。
- 基线记录中的请求状态码和最终 URL。
- 缺失的关键 selector。
- 页面标题、核心文本或 URL 是否与目标页面匹配。
- 无效截图或错误原因。

禁止把空白页、错误页、拦截页、验证码页或不确定页面作为原网页基准。评估器只使用当前 project 的 `projects/{target-id}/baselines/{state-id}/original-dom.json` 与 `original-{viewport}.png` 作为原站证据；如果这些文件不存在或无法通过门禁，则中断评估。

报告会标明本次评估使用的原站证据来源。当前流程固定为：

- `Phase 3 截图/DOM 基线评估`：评估阶段使用素材采集阶段已经确认的原站截图、DOM、关键 selector 和页面文本，不再访问原站。

报告会按“总览 -> 页面 × 六维矩阵 -> 状态矩阵 -> 六维详情 -> 问题中心 -> 证据中心”的结构展开。每个问题都会归因到六个维度之一，并附带影响分、置信度、证据链接和修复建议。若发现截图伪页面、透明热区、整页图片或核心文本只存在于图片中，评估会直接不通过。

## 评估指标

总分采用 100 分制，默认只评估桌面端页面。硬门禁全部通过后才计算六维总分：

```text
总分 = 功能正确性 * 0.25
     + 交互流程一致性 * 0.20
     + 视觉一致性 * 0.25
     + 结构/语义一致性 * 0.10
     + 内容/数据一致性 * 0.10
     + 工程可维护性 * 0.10
```

| 指标 | 权重 | 评估目标 | 量化标准 |
| --- | ---: | --- | --- |
| 功能正确性 | 25% | 复刻页是否实现原站核心功能和状态输出 | required state 覆盖率、核心功能断言通过率、输出结果正确率、边界/异常态通过率加权计算。 |
| 交互流程一致性 | 20% | 用户操作路径、反馈、键盘/鼠标行为是否一致 | 读取 `target.json` 的 `interactions`，执行真实 Playwright 步骤和断言，按用例权重计算通过率并记录失败步骤。 |
| 视觉一致性 | 25% | 关键区域布局、样式、截图差异是否接近原站 | 优先按 state 的 `regions` 做区域 diff/SSIM/bbox/style 评分，同时保留全页截图兜底。 |
| 结构/语义一致性 | 10% | 用户复刻范围内的 DOM、role、label、列表/表单/分页结构是否像真实网页 | 按 `structureSelectors` 对用户要求的关键结构高权重评分；顶部账户区、应用入口、页脚链接等视觉必需但无需功能实现的区域仍参与视觉/内容/基础结构评分，但不进入功能交互用例。 |
| 内容/数据一致性 | 10% | 用户可见文本、数据、提示语是否一致 | 比较核心文案、结果数据、错误/空状态提示、分页数字、标题和 URL 状态。 |
| 工程可维护性 | 10% | 复刻项目是否可运行、可维护、可复测 | 检查运行状态、project-local 源码组织、状态配置、日志/报告证据和非投机实现。 |

硬门禁：

| 门禁 | 通过条件 |
| --- | --- |
| 配置完整性 | `target.json` 包含目标、状态、viewport、关键 selector、交互用例或状态断言 |
| 原站基线可信 | 每个 required state 都有非空截图、DOM 摘要、关键 selector、核心文本和可信 URL/title |
| 复刻页可运行 | 本地服务和目标路由可访问，核心状态可触发 |
| 无阻断错误 | 页面加载和核心交互无白屏、死循环、uncaught exception |
| 禁止截图伪页面 | 主体 UI 不能由整页截图、大区域截图、canvas 截图、图片热区或截图背景伪装 |
| 报告证据完整 | 输出 summary、details、artifacts-index、report、HTML Dashboard、截图、diff、交互失败证据和问题列表 |

## 评分范围分层

复刻范围不等于功能范围。页面上影响视觉完整性的区域仍然要复刻和评分，但可以不实现真实功能。

`target.json` 可使用 `structureSelectors` 描述结构评分范围：

```json
{
  "selector": ".result-link",
  "purpose": "content",
  "expectedCount": 8,
  "weight": 4
}
```

| purpose | 用途 | 默认权重倾向 |
| --- | --- | --- |
| `functional` | 用户要求真实交互的控件，如搜索框、登录输入框、提交按钮 | 高 |
| `content` | 用户要求展示的数据或文案，如搜索结果、错误提示、统计文案 | 较高 |
| `structural` | 支撑页面形态的结构，如列表、分页、表单容器 | 中 |
| `visual` | 需要出现以保持视觉一致，但无需实现功能的区域，如顶部账户区、应用入口、页脚链接 | 低 |

例如 Google 顶部账户区、应用入口、底部链接不能直接删掉，也不能完全不评分；它们应作为 `visual` 范围参与视觉和基础结构评分。但如果用户没有要求账号菜单、应用面板或页脚链接点击功能，就不把它们加入交互用例。

分项阈值：

| 分项分数 | 解释 | 处理策略 |
| ---: | --- | --- |
| 90-100 | 高一致 | 可进入最终验收或继续做细节优化 |
| 80-89 | 基本一致 | 可提交阶段性结果，但应修复报告列出的低分项 |
| 70-79 | 可运行但需修复 | 优先修复缺失状态、失败交互和明显视觉差异 |
| 0-69 | 不建议提交验收 | 重新采集真实页面并按报告问题迭代 |

说明：本项目以网页复刻一致性为目标，不单独评估 WCAG 可访问性合规。输入框、按钮、分页等控件是否可用，归入功能一致性和交互一致性检查。

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
- [项目级网页复刻 Skill](.codex/skills/web-replica-workflow/SKILL.md)
