# 网页复刻与一致性评估

本项目用于完成网页复刻与自动化一致性评估。项目以 AI 辅助复刻为核心流程：先解析用户复刻需求，再采集可信真实网页素材，随后实现可交互的复刻页面，并通过评估器从功能正确性、交互流程一致性、视觉一致性、结构语义一致性、内容数据一致性、工程可维护性六个维度进行量化评分。

项目强调：

- 真实网页素材必须可信；遇到验证码、安全验证、错误页或采集失败时必须暂停处理。
- 最终复刻产物必须是可交互网页，禁止用截图、大图背景、canvas 或图片热区伪装页面。
- 每个复刻目标以独立 `project` 管理，源码、素材、日志和评估报告都放在 `projects/{target-id}/` 下。
- 评估器只评估当前指定项目，不默认评估所有项目。
- 低分项需要根据评估报告迭代修复，并保留 AI 使用记录和人工决策记录。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端工程 | Vite + React + TypeScript |
| 路由 | React Router |
| UI / 图标 | Ant Design、lucide-react |
| 自动化浏览器 | Playwright；必要时使用 Chrome 插件观察真实网页 |
| 视觉对比 | pixelmatch、sharp、ssim.js |
| 测试 | Vitest、Playwright Test |
| 报告输出 | JSON、Markdown、HTML |
| AI 工作流 | `.codex/skills/web-replica-workflow`、`.codex/skills/web-replica-workflow-skip` |

## 目录结构

```text
src/
├── main.tsx             # 前端入口
├── App.tsx              # 应用壳、首页和 /replica/{target-id} 路由
└── shared/              # 共享组件、样式或工具

projects/
└── {target-id}/         # 每个复刻目标一个独立 project
    ├── page/            # 复刻页面源码，最终产品必须由这里的可维护源码实现
    ├── baselines/       # 原站真实截图、可见 DOM 摘要和采集说明
    ├── config/          # 当前 project 的评估配置 target.json
    ├── evaluation/      # 当前 project 的评估报告、截图、diff 和历史记录
    ├── logs/            # AI 使用记录、人工决策和阻塞问题
    ├── prompts/         # 关键 prompt 和复刻过程记录
    └── sources/         # 原站 URL、采集会话和素材来源说明

evaluator/
├── collectors/          # 采集复刻页面截图、DOM、样式和交互结果
├── core/                # 配置读取、门禁校验、指标计算和评分逻辑
└── reports/             # HTML / Markdown 报告生成

tests/
├── unit/                # 单元测试
└── e2e/                 # 端到端测试

docs/                    # 项目说明、环境依赖、实施方案和评估体系文档

.codex/
└── skills/
    ├── web-replica-workflow/       # 需要用户确认的网页复刻流程
    └── web-replica-workflow-skip/  # 跳过强制确认的网页复刻流程
```

## 环境安装

建议使用 Node.js 22.x LTS。

首次安装：

```bash
npm install
npx playwright install chromium
```

启动本地开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173
```

完整的 Node.js、npm、Playwright、系统依赖、环境变量和常见问题说明见 [环境依赖.md](docs/环境依赖.md)。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建前端工程 |
| `npm run test` | 运行单元测试 |
| `npm run test:e2e` | 运行 Playwright 端到端测试 |
| `npm run eval` | 运行当前指定 project 的一致性评估流程 |
| `npm run eval:interactive` | 兼容旧命令，当前等同于 `npm run eval` |

## 当前复刻项目

复刻页面通过统一路由访问：

```text
http://127.0.0.1:5173/replica/{target-id}
```

注意访问地址不能冲突。多个页面可以在同一个 dev server 下通过不同路由统一访问，访问地址均基于 `http://127.0.0.1:5173`。

| 序号 | 原始网址 | 复刻需求描述 | 复刻产物前端代码 | 访问路由 | 一致性评估结论 |
| ---- | -------- | ------------ | ---------------- | -------- | -------------- |
| 1 | [Google](https://www.google.com/) | 搜索输入框、搜索按钮点击交互、搜索结果文案展示、结果列表翻页功能。 | `projects/google-search/page/` | `/replica/google-search` | 总分 91.9，门禁通过，结论 excellent。 |
| 2 | [Gitee 注册页](https://gitee.com/signup) | 复刻注册页面，包括点击输入框离开后的必填项提示，各个输入框，注册按钮交互提示。 | `projects/gitee-signup/page/` | `/replica/gitee-signup` | 总分 93.6，门禁通过，结论 excellent。 |
| 3 | [微信支付商户登录页](https://pay.weixin.qq.com/index.php/core/home/login) | 仅复刻用户名、密码、验证码输入区域，以及登录按钮的点击交互。 | `projects/wechat-pay-login/page/` | `/replica/wechat-pay-login` | 总分 92.5，门禁通过，结论 excellent。 |

## 复刻项目流程

使用方法：

1. 克隆项目并进入仓库。
2. 按 [环境依赖.md](docs/环境依赖.md) 安装依赖。
3. 在 Codex 中输入复刻需求。其他 AI 工具暂未试验。

推荐输入格式：

```text
复刻网页
是否需要用户确认需求：是/否
网站：
复刻范围：
```

Codex 会根据用户是否需要确认需求，自动选取对应的工作流。

### 需要用户确认的流程

适用于正式复刻任务，使用 `.codex/skills/web-replica-workflow/SKILL.md`。

1. 解析复刻请求：明确素材来源、目标网站、复刻页面、功能范围、交互范围和评估方式。
2. 等待用户确认：需求解析和复刻方案必须经用户确认后才能进入下一阶段。
3. 建立 project：在 `projects/{target-id}/` 下创建源码、配置、素材、日志和报告目录。
4. 采集真实素材：获取网页头部、中部、底部以及各个关键状态的真实截图和可见 DOM 证据。
5. 实现复刻页面：在 `projects/{target-id}/page/` 中编写可长期维护的源码。
6. 运行评估：只评估当前 project，生成六维评估报告。
7. 迭代修复：根据低分项修复并重新评估，最多迭代三轮。
8. 记录过程：保留关键 prompt、AI 对话片段、人工修改说明和评估结果。

### 不需要强制确认的流程

适用于用户明确希望快速推进、跳过确认门槛的任务，使用 `.codex/skills/web-replica-workflow-skip/SKILL.md`。

1. 自动解析复刻请求，并生成 project 规格说明。
2. 不等待用户确认，直接进入素材采集、实现和评估流程。
3. 仍然必须遵守可信采集、可交互源码、项目目录隔离和六维评估要求。
4. 遇到验证码、安全验证、页面异常、素材不可信或浏览器阻塞时，必须暂停并让用户处理。
5. 最终仍需提供复刻页面访问地址、评估报告地址和关键过程记录。

## 评估指南

评估器是通用工具，不内置具体复刻目标。每次评估必须指定当前 project：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

评估结果写入当前 project：

```text
projects/{target-id}/evaluation/latest/
├── summary.json          # 六维汇总，供 CI 或自动化读取
├── details.json          # 页面、状态、维度、问题、证据的完整详情
├── artifacts-index.json  # 截图、diff、交互失败证据等产物索引
├── report.md             # 六维 Markdown 报告
├── index.html            # 六维 Dashboard 报告
├── captures/             # 原站基线与复刻采集 JSON
└── assets/               # 截图、整页 diff、区域 diff、失败步骤截图
```

主要报告文件：

| 文件 | 说明 |
| --- | --- |
| `summary.json` | 总分、六维分数和门禁状态摘要 |
| `details.json` | 页面、状态、维度、问题和证据的完整详情 |
| `artifacts-index.json` | 截图、diff、区域对比和交互失败证据索引 |
| `report.md` | Markdown 评估报告 |
| `index.html` | 可视化 HTML 评估报告 |
| `captures/` | 原站基线与复刻页面采集结果 |
| `assets/` | 截图、整页 diff、区域 diff 和失败步骤截图 |

报告查看方式：

```text
projects/{target-id}/evaluation/latest/index.html
```

可以在浏览器中直接打开该文件，也可以从命令行查看 `report.md` 和 `summary.json`。

详细评分标准、六维公式、门禁规则和低分项处理方式见 [六维评估体系.md](docs/六维评估体系.md)。

## 验收标准

当前默认验收阈值：

| 指标 | 阈值 |
| --- | ---: |
| 总分 | 85 |
| 功能正确性 | 85 |
| 交互流程一致性 | 85 |
| 视觉一致性 | 60 |
| 结构语义一致性 | 80 |
| 内容数据一致性 | 80 |
| 工程可维护性 | 80 |

如果用户提出更高标准，则使用更高标准。即使分数暂时不达标，也不能为了提高分数而把截图当作网页。

## 素材采集与安全约束

- 如果素材来源是网站地址，必须访问真实网页并采集真实截图、可见 DOM 摘要、关键 selector 和状态证据。
- 如果素材来源是截图，则只能基于用户提供的截图复刻，并在报告中标明基线来源。
- 采集真实网站时必须覆盖网页头部、中部、底部；除非页面本身是无限滚动且没有固定尾部。
- 遇到验证码、安全验证、登录阻拦、错误页、空白页或无法确认目标页面时，必须暂停流程并交给用户处理。
- 支付、登录、账号、安全验证类页面只采集可见 UI 证据，不采集隐藏 input、cookie、localStorage、sessionStorage 或 token 字段。
- 评估阶段不重新交互式采集原站，只使用已经确认的基线证据。

## 相关文档

- [环境依赖.md](docs/环境依赖.md)
- [六维评估体系.md](docs/六维评估体系.md)
- [网页复刻与一致性评估实施方案.md](docs/网页复刻与一致性评估实施方案.md)
- [web-replica-workflow-SKILL-中文版.md](docs/web-replica-workflow-SKILL-中文版.md)
- [web-replica-workflow-skip-SKILL-中文版.md](docs/web-replica-workflow-skip-SKILL-中文版.md)
- [题目原文](docs/微信支付后台开发实习岗-基于%20AI%20工具的网页复刻与一致性评估.md)
