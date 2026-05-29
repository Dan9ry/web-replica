# Web Replica Workflow Skill 中文版

> 本文档是 `.codex/skills/web-replica-workflow/SKILL.md` 的中文说明版，便于阅读和项目交付。实际生效的 Codex skill 仍以 `.codex/skills/web-replica-workflow/SKILL.md` 为准。

## Skill 元信息

```yaml
name: web-replica-workflow
description: 在本仓库中处理任何网页复刻请求时使用，包括规划、project 创建、真实素材采集、实现、评估、清理或流程修订。该 skill 约束自包含的六阶段 project 流程、project 本地文件组织、前置评估模式选择、通用评估器调用，以及复刻网页访问地址汇报。
```

## 网页复刻工作流

本仓库中的每一个网页复刻任务都必须使用这个 skill。

## 不可变规则

1. 在复刻请求、素材/状态范围、评估模式和复刻页面访问地址记录完成之前，不开始实现。
2. 阶段一“复刻请求解析”完成后，必须停止并等待用户明确确认，才能进入阶段二“Project 初始化”。不得把用户沉默、推断范围或默认推荐方案视为确认。
3. 每个复刻目标都创建在 `projects/{target-id}/` 下；project 文件不得散落在 `docs/` 中。
4. skill 负责创建 project 文件和目标配置，然后使用该 project 配置调用通用评估器。
5. 评估器是通用工具，不拥有固定复刻目标，必须通过以下方式调用：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

6. 不提供“评估所有 project”的流程，只评估当前 project。
7. 原站素材采集必须失败即停止。如果真实网站无法验证、要求登录、出现验证码/安全验证，或缺少必要状态，必须暂停并请求用户介入。
8. 评估只使用三个指标：功能一致性、交互一致性、视觉一致性。
9. 每次给出复刻方案或交付更新时，都必须包含本地复刻页面访问地址：

```text
http://127.0.0.1:5173/replica/{target}
```

如果开发服务器还没有启动，还必须同时给出启动命令：

```bash
npm run dev
```

## Project 文件夹约定

每个新的复刻 project 都要创建以下结构：

```text
projects/{target-id}/
├── request.md
├── spec.md
├── logs/
│   ├── ai-log.md
│   ├── decisions.md
│   └── blockers.md
├── prompts/
│   └── replica-prompts.md
├── sources/
│   ├── user-screenshots/
│   └── urls.md
├── baselines/
│   └── {state-id}/
├── captures/
├── evaluation/
│   ├── latest/
│   └── history/
└── config/
    └── target.json
```

页面源码可以生成在 `src/pages/{TargetReplica}/` 下，但 `request`、`spec`、日志、素材、基线、评估报告和配置仍归属于对应的 `projects/{target-id}/`。

## 六阶段流程

### 阶段一：复刻请求解析

创建或更新 `projects/{target-id}/request.md`。

记录以下内容：

- 复刻素材来源：网站 URL、截图或混合来源。
- 原始 URL 或截图列表。
- 复刻页面访问地址。
- 页面范围。
- 状态范围。
- 功能范围。
- 明确不复刻的内容。
- 评估模式。
- 原站证据来源模式。
- 验证/降级行为。
- 验收阈值。

评估模式包括：

- `普通自动评估`：实时采集原站；按配置可在受阻时降级使用最近一次已验证的截图/DOM 基线。
- `交互辅助评估`：使用可见浏览器；需要用户验证时暂停等待。
- `截图来源评估`：使用用户截图或已确认基线；不得推断截图之外的状态。

阶段门禁：复刻请求已记录，复刻方案已展示给用户，并且用户已明确确认。收到确认前必须停在此处；不得创建 project 文件夹、目标配置、源码文件或基线素材。

### 阶段二：Project 初始化

创建上文约定的 project 文件夹结构。

创建 `projects/{target-id}/config/target.json`，写入评估器目标配置。这个配置会传给通用评估器。

阶段门禁：

- project 文件夹已存在。
- `request.md` 已存在。
- `config/target.json` 已存在。
- 本地路由和复刻页面访问地址已明确。

### 阶段三：真实素材采集与状态基线

实现之前，必须采集每一个必需原站状态。

如果素材来源是 URL：

- 打开真实网站。
- 执行状态触发步骤。
- 对可滚动页面采集顶部、中部、底部和当前视口截图。
- 保存 DOM/样式摘要和交互说明。
- 访问或验证失败时暂停。

如果素材来源是截图：

- 将用户截图放入 `sources/user-screenshots/`。
- 按页面和状态标注每张截图。
- 必需状态截图缺失时暂停。

每个必需状态应包含：

```text
projects/{target-id}/baselines/{state-id}/original-desktop.png
projects/{target-id}/baselines/{state-id}/original-top.png
projects/{target-id}/baselines/{state-id}/original-middle.png
projects/{target-id}/baselines/{state-id}/original-bottom.png
projects/{target-id}/baselines/{state-id}/original-dom.json
projects/{target-id}/baselines/{state-id}/capture-notes.md
```

阶段门禁：每个必需状态都有已验证的原站证据。

### 阶段四：复刻策略与规格确认

创建 `projects/{target-id}/spec.md`。

与用户确认以下内容：

- 页面范围。
- 状态范围。
- 功能范围。
- 明确不复刻的内容。
- header、body、footer、弹窗、表单、列表等区域的视觉优先级。
- 组件拆分。
- 路由和复刻页面访问地址。
- 评估模式和降级行为。
- 验收阈值。

阶段门禁：

- 用户确认复刻策略。
- 每个状态都能映射到原站证据。
- 评估模式已锁定。
- `config/target.json` 覆盖所有必需状态。

### 阶段五：复刻实现

只有阶段四锁定后，才开始实现。

需要完成：

- 创建页面路由和源码文件。
- 按状态逐个实现。
- 除非用户明确要求，不实现真实网络请求、登录、支付、上传等能力。
- 在本地自测所有必需状态都能触发。
- 在 `logs/ai-log.md` 和 `logs/decisions.md` 中记录 Prompt、AI 输出、人工修改和 commit。

阶段门禁：

- 复刻页面 URL 可在本地打开。
- 必需状态都可以触发。
- header、body、footer 或截图覆盖区域已实现。
- 已遵守不复刻范围。

### 阶段六：评估迭代与交付

只运行当前 project 的评估：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

交互辅助评估使用：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval:interactive
```

评估报告必须包含：

- 已锁定的评估模式。
- 实际使用的原站证据。
- 总分。
- 功能一致性分数。
- 交互一致性分数。
- 视觉一致性分数。
- 视觉差异图。
- 问题列表。
- 低分项修改建议。

报告归档位置：

```text
projects/{target-id}/evaluation/latest/
projects/{target-id}/evaluation/history/{timestamp}/
```

阶段门禁：

- 报告只包含功能一致性、交互一致性和视觉一致性三类分数。
- 报告标明原站证据来源和评估模式。
- 低分项包含修改建议。
- 结果只对应当前 project。
- 分数达到目标，或下一轮修复事项已记录。

## 复刻方案必须包含的内容

给出复刻方案时，必须包含：

- 素材来源。
- 复刻页面访问地址。
- 页面范围。
- 状态范围。
- 功能范围。
- 不复刻范围。
- 评估模式和降级行为。
- 必需原站截图/基线。
- project 文件夹路径。
- 评估器配置路径。
- 验收阈值。
