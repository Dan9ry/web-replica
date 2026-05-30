# Web Replica Workflow Skill 中文版

> 本文档是 `.codex/skills/web-replica-workflow/SKILL.md` 的中文说明版，便于阅读和项目交付。实际生效的 Codex skill 仍以 `.codex/skills/web-replica-workflow/SKILL.md` 为准。

## Skill 元信息

```yaml
name: web-replica-workflow
description: 在本仓库中处理任何网页复刻请求时使用，包括请求解析、project 创建、真实素材采集、实现、评估、清理或流程修订。该 skill 强制执行严格串行的六阶段流程，包含显式 Gate、阻塞式用户确认、project 本地文件组织、通用评估器调用、原站采集失败即停止，以及复刻页面访问地址汇报。
```

# 网页复刻工作流

本仓库中的每一个网页复刻任务都必须使用这个 skill。

**核心流程**：`复刻请求 → ⛔ 用户确认 → 创建 Project → 原站基线采集 → ⛔ 规格确认 → 复刻实现 → 一致性评估`

> [!CAUTION]
> ## 全局执行纪律（强制）
>
> 本流程是严格串行流程。违反以下任意一条都视为执行失败：
>
> 1. **串行执行**：所有阶段必须按顺序执行；前一阶段的输出是后一阶段的输入。
> 2. **BLOCKING = 硬停止**：标记为 ⛔ BLOCKING 的阶段必须完全停止，等待用户明确回复后才能继续。
> 3. **禁止静默确认**：用户沉默、推断意图、历史偏好或推荐默认方案，都不能视为确认。
> 4. **进入前先检查 Gate**：每个阶段都有 🚧 GATE，必须先验证 Gate，再进入该阶段。
> 5. **禁止跨阶段打包**：不得把请求解析、project 创建、原站采集、实现和评估混在一次未确认流程中完成。
> 6. **禁止推测性执行**：未满足阶段 Gate 前，不得提前创建 project 文件、目标配置、源码、基线或实现内容。
> 7. **原站采集失败即停止**：真实页面无法确认、出现验证码/安全验证、要求登录、进入错误页或缺少必需状态时，必须暂停并请求用户介入，不得猜测。
> 8. **头部 / 中部 / 尾部完整覆盖**：交互式获取网站素材时，每个必需状态都必须采集网页头部、中部和尾部。若网站没有稳定尾部，因为向下滚动会不断加载新内容，必须记录该例外，并采集有代表性的下方已加载内容。
> 9. **截图必须和策略一起展示**：阶段四必须把原站截图/基线和复刻策略一起展示。只给复刻策略文字是不允许的。
> 10. **评估阶段禁止重新交互式采集原站素材**：阶段六评估必须使用阶段三已经采集的截图/基线作为原站证据。不得在评估时再次交互式打开原站采集素材。若基线缺失或过期，必须回到阶段三。
> 11. **只评估当前 Project**：评估永远只针对当前复刻 project，不提供“评估全部”。
> 12. **只使用通用评估器**：评估器不内置固定目标，必须通过当前 project 配置调用：
>
> ```bash
> EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
> ```
>
> 13. **六维评估指标**：评估包含功能正确性、交互流程一致性、视觉一致性、结构/语义一致性、内容/数据一致性和工程可维护性。除非用户明确要求，不新增性能、响应式、SEO 或完整 WCAG 合规指标。
> 14. **必须汇报访问地址**：每次复刻方案和交付更新都必须包含复刻页面访问地址。阶段一可以给出默认计划地址：
>
> ```text
> http://127.0.0.1:5173/replica/{target}
> ```
>
> 开发服务器启动后，必须以 dev server 输出的实际端口为准，因为 `5173` 不一定可用。如果开发服务器还没有启动，还必须给出：
>
> ```bash
> npm run dev
> ```
> 15. **页面源码必须归属 Project**：生成出来的复刻页面源码必须放在当前 `projects/{target-id}/` 中，不能放在 `src/pages/`。`src/` 只保留共享应用壳、路由入口和通用基础设施。
> 16. **验证交接契约**：如果阶段三可能遇到验证码、安全验证、登录或 AI 校验，采集浏览器必须是可见会话，并严格执行下文的 Verification Handoff Contract。禁止只给用户 URL，禁止把非 TTY 的 `Press Enter` 作为唯一恢复信号，禁止验证出现后切换浏览器或 profile。
> 17. **禁止参考旧 Project**：新复刻 project 不得参考任何旧 project，包括目录形状、文件命名、组件拆分、Prompt、mock 数据、CSS、页面逻辑、交互实现或视觉实现。只能依据本 skill、当前用户请求和当前采集到的原站基线/截图。
> 18. **产物必须可维护且可独立运行**：复刻产物必须是完整、可长期维护的源码，并能在本地或线上独立运行；指定核心功能和交互不能依赖原站后端。
> 19. **最终产物只能是可交互网页，绝不能截图当网页**：原站截图只能作为证据和实现参考。最终复刻产物必须是由 DOM/CSS/JS 行为构成的可交互网页。不得使用整页截图、大块区域截图、图片热区、纯 canvas 截图渲染或截图背景来充当网页。不得因为评估分数不达标而改用截图当网页；如果分数仍未达标，也必须交付当前最好的可交互网页，并如实附上报告和剩余问题。

> [!IMPORTANT]
> ## 沟通规则
>
> 匹配用户语言。本仓库中，面向用户的方案、检查点、报告和问题默认使用中文，除非用户明确要求其他语言。

## Project 文件夹约定

阶段一获得用户明确确认后，每个复刻目标都创建以下 project 文件夹：

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
│   ├── urls.md
│   └── capture-session.md
├── page/
│   ├── {TargetReplica}Page.tsx
│   ├── {TargetReplica}Page.module.css
│   ├── components/
│   ├── data/
│   ├── hooks/
│   └── utils/
├── baselines/
│   └── {state-id}/
├── captures/
├── evaluation/
│   ├── latest/
│   └── history/
└── config/
    └── target.json
```

复刻页面源码必须放在 `projects/{target-id}/page/` 下。不得把复刻 UI 生成到 `src/pages/`。`src` 目录只允许用于注册路由、共享样式或运行 project 页面所需的通用应用基础设施。

默认实现技术栈是 **React + TypeScript + CSS Modules**。除非用户明确改变技术栈，否则不得切换到 Vue、Next.js、纯静态 HTML、Tailwind 或其他 UI 技术栈。优先使用项目已有依赖；只有在能明显提升可维护性或复刻一致性时才新增依赖，并在 `logs/decisions.md` 中记录原因。

复刻源码必须面向长期维护组织。必要时使用 `page/components/` 放置有意义的 UI 区域组件，`page/data/` 放置本地 mock/结果数据，`page/hooks/` 放置可复用的本地交互状态，`page/utils/` 放置纯工具函数。页面包含多个区域或状态时，不得把 JSX、mock 数据、交互逻辑和样式全部塞进一个巨大的文件。

`baselines/` 和 `sources/user-screenshots/` 中的截图不是页面实现素材。它们可以用于视觉对齐和评估，但不得被放进复刻页面中代替真实文本、控件、布局、表单、列表、分页或交互状态。只有当原站本身包含 logo、照片、图标或插画等真实图片内容时，才允许使用图片资产；图片资产不能替代 DOM/CSS 对网页的重建。

创建新 project 时，不得查看、复制、改写或套用任何旧 `projects/*` 项目。如果某个经验应该通用，必须已经写入本 skill；否则不能作为新 project 的输入。

## 网站类型模板

以下模板只作为通用检查清单，不覆盖当前用户请求和当前原站基线。

**内容展示/搜索型页面**，例如 Google 搜索、百度搜索、Bing 搜索：

- 采集状态：入口页、查询/结果页、分页或更多结果状态、空查询/无结果状态（如在范围内）。
- 核心区域：头部、搜索框、分类/筛选导航、结果列表、存在时的侧栏、分页、尾部。
- 核心交互：输入、点击提交、Enter 提交、结果文案展示、分页或更多结果导航。

**表单交互型页面**，例如登录、注册、找回密码：

- 采集状态：初始表单、输入态、校验错误态、提交 loading/失败态、存在时的验证码/安全验证态。
- 核心区域：表单容器、标签、输入框、辅助文本、验证码块、提交按钮、错误提示、尾部。
- 核心交互：focus/blur、输入、清空、校验、提交按钮启用/禁用、本地失败反馈。除非用户明确要求，不调用真实登录、支付或上传接口。
- 敏感页面采集规则：在支付、登录、账号、安全验证类页面上，只采集可见 UI 证据；不要 dump 完整 DOM、隐藏 input、cookie、localStorage、sessionStorage 或 token 字段。若表单被扫码/二维码模式遮住，先通过可见按钮、链接、图标或截图坐标触发模式切换，再采集可见表单。

**二维码-only 登录模式恢复规则**：

当登录、支付、账号类页面只显示二维码面板，且没有发现用户要求的用户名、密码、验证码等输入框时，不得立刻失败。

必须执行：

1. 先截取当前页面可见状态。
2. 基于截图进行视觉判断，寻找二维码面板附近可能的登录方式切换入口。
3. 候选入口不限于文字链接，也可以是右上角折角、小图标、二维码/账号切换图形、tab、文字链接、按钮、可点击装饰区域或面板附近的交互暗示区域。
4. 只对少量高置信候选点进行点击尝试。
5. 每次点击后，重新检测用户名、密码、验证码、手机号、邮箱、提交按钮等目标表单元素是否出现。
6. 如果目标表单出现，在同一浏览器会话中继续阶段三采集。
7. 如果所有候选都失败，记录截图路径、候选点击点或 selector、每次尝试后的结果和 blocker 原因。
8. 禁止凭记忆或主观猜测伪造账号密码表单。

## Verification Handoff Contract（验证交接契约）

当阶段三 URL 采集可能遇到验证码、安全验证、AI 校验、登录挑战或访问限制时，必须执行本契约。

**可见浏览器要求**：

- 采集浏览器必须可见：Playwright 必须使用 `headless: false`，或使用真实可见的 Browser/Chrome 标签页。
- 禁止只给用户一个 URL。验证交接的含义是把当前正在采集的可见浏览器窗口/标签页交给用户。
- 检测到验证页后，必须保持浏览器和页面打开，并尽可能把这个确切窗口/标签页置于前台可见状态。
- 如果浏览器无法弹出或被沙箱/系统权限阻拦，必须申请沙箱外权限后以可见模式重跑采集，不得继续无头采集。
- `projects/{target-id}/sources/capture-session.md` 必须记录 browser provider、profile/session path、当前验证 URL，以及“用户必须在已打开窗口完成验证”的说明。

脚本层面必须有这个断言：

```js
if (captureMayNeedVerification && headless !== false) {
  throw new Error("Verification handoff requires a visible headed browser window.");
}
```

**恢复信号要求**：

- 只有当采集进程明确检测到 `process.stdin.isTTY === true` 时，才允许把 `Press Enter` 作为恢复方式。
- 在 Codex/自动化环境中，默认恢复信号是文件：`projects/{target-id}/captures/verification-resume.json`。
- 等待恢复信号期间，脚本必须保持同一个 browser context 和 page 存活。
- 收到恢复信号后，必须删除信号文件，在同一个 page/context 中重新访问或刷新目标 URL，并重新检查验证信号后才能采集。
- 如果用户交接后验证仍然存在，必须 fail closed：记录 blocker 并停止。

推荐状态机：

```text
open target
  -> verification detected
  -> write capture-session.md
  -> keep browser alive
  -> wait for verification-resume.json
  -> reload/revisit target in same page/context
  -> re-check verification signal
  -> capture baseline or fail closed
```

推荐恢复逻辑：

```js
while (!(await fileExists(resumeSignalFile))) {
  await sleep(2000);
}

await removeFile(resumeSignalFile);
await page.goto(targetUrl);
const stillBlocked = await detectVerification(page);

if (stillBlocked) {
  throw new Error("Verification still present after user handoff.");
}
```

**同会话锁定要求**：

- 阶段三必须在打开目标站点前选择采集 provider，并写入 `capture-session.md`。
- 一旦采集开始，禁止关闭当前浏览器、创建另一个 Playwright context、切换到用户普通 Chrome，或让用户去另一个浏览器/profile 完成验证。
- 如果确实要使用普通 Chrome，必须在阶段三开始前选择；一旦开始采集，provider 就被锁定。
- 如果同一会话验证失败，只能记录 blocker 并停止，不能静默换路径。

推荐会话记录：

```js
const sessionId = {
  provider: "playwright-headed",
  profileDir,
  pageId: state.id,
};

await writeCaptureSession(sessionId);

// Later:
assertSameSession(currentSession, sessionId);
```

最关键规则：验证交接不是“给用户一个地址”，而是“把当前正在采集的可见浏览器窗口交给用户，用户完成后用可见恢复信号让同一会话继续”。

## 工作流

### 阶段一：复刻请求解析（⛔ BLOCKING）

🚧 **GATE**：用户已经提供至少一种复刻素材来源：

- 网站 URL。
- 用户提供的网站截图。
- URL + 截图混合素材。

**动作**：

1. 将用户请求解析成拟定复刻方案。
2. 识别缺失信息；在可以保守判断时给出推荐值。
3. 向用户展示复刻方案，然后停止。
4. 本阶段不得创建 `projects/{target-id}/`、`request.md`、`target.json`、基线或源码文件。

**复刻方案必须包含**：

- 素材来源：URL、截图或混合来源。
- 原始 URL 或截图列表。
- 推荐 target id。
- 复刻页面访问地址。
- 页面范围。
- 状态范围。
- 功能范围。
- 明确不复刻内容。
- 阶段三素材采集模式。
- 阶段六评估只使用既有基线。
- 原站证据来源模式。
- 同浏览器验证交接方案。
- 必需原站截图或基线。
- project 文件夹路径。
- 评估器配置路径。
- 验收阈值。

默认验收阈值：

- 总分 >= 85。
- 功能正确性 >= 85。
- 交互流程一致性 >= 85。
- 视觉一致性 >= 60。
- 结构/语义一致性 >= 80。
- 内容/数据一致性 >= 80。
- 工程可维护性 >= 80。

如果用户要求更严格的阈值，使用更严格值。除非用户明确接受更低目标，否则不得降低这些默认值。

**阶段三素材采集模式**：

- `普通自动采集`：实时采集原站；按配置可在受阻时降级使用最近一次已验证的截图/DOM 基线。
- `交互辅助采集`：仅阶段三使用可见浏览器；需要用户验证时暂停等待。
- `截图来源采集`：使用用户截图或已确认基线；不得推断截图之外的状态。

阶段六评估不得交互式采集原站素材，只能使用阶段三基线。

✅ **Checkpoint**：

```markdown
## 阶段一完成
- [x] 复刻请求已解析
- [x] 复刻方案已展示
- [x] 评估模式已推荐
- [ ] BLOCKING：等待用户明确确认后才能进入阶段二
```

⛔ **硬停止**：等待用户明确确认，例如“确认”“可以，继续”或同等表达。

### 阶段二：Project 初始化

🚧 **GATE**：阶段一完成，且用户已经明确确认复刻方案。

**动作**：

1. 在 `projects/{target-id}/` 下创建 project 文件夹结构。
2. 将已确认请求写入 `projects/{target-id}/request.md`。
3. 创建用于通用评估器的 `projects/{target-id}/config/target.json`。
4. 创建 `logs/` 初始日志和 `prompts/` Prompt 追踪文件。
5. 确认路由计划和复刻页面访问地址已记录。
6. 创建 `projects/{target-id}/page/` 作为页面实现目录。
7. 不得从任何旧 `projects/*` 目录复制或推断文件。

**本阶段不得**采集原站基线或实现 UI。

✅ **Checkpoint**：

```markdown
## 阶段二完成
- [x] Project 文件夹已创建
- [x] request.md 已写入
- [x] config/target.json 已创建
- [x] 日志和 Prompt 文件夹已初始化
- [x] page/ 源码目录已初始化
- [ ] 下一步：进入阶段三原站采集
```

默认：除非用户要求暂停，否则自动进入阶段三。

### 阶段三：真实素材采集与状态基线

🚧 **GATE**：阶段二完成；`projects/{target-id}/config/target.json` 已存在；必需状态已明确。

**URL 来源动作**：

- 打开真实网站前，先确定并记录本次采集使用的浏览器/会话。
- 需要用户正常 Chrome profile、Cookie、扩展或本机可见验证时，优先使用 `@chrome`。
- 如果使用 Playwright 或其他自动化浏览器，必须启动可见的持久化浏览器/上下文（`headless: false`），确保可以把同一个会话交给用户。
- 打开真实网站。
- 执行状态触发步骤。
- 对每个必需状态采集网页头部/顶部、中部、尾部/底部和当前视口截图。
- 如果页面是无限滚动且没有稳定尾部，采集有代表性的下方已加载区域，并记录为什么没有尾部。
- 保存 DOM/样式摘要和交互说明。
- 将阻塞问题记录到 `logs/blockers.md`。
- 访问或验证失败时暂停。

**登录/支付/账号类页面的二维码-only 恢复流程**：

1. 先检测用户要求的可见输入框。
2. 如果输入框不可见，且页面主要显示二维码面板，先执行二维码-only 登录模式恢复规则，再决定是否标记 blocker。
3. 每次候选切换点击后，重新检测目标输入框。
4. 只有恢复尝试失败后，才能把该状态标记为 blocker。
5. 不得带着猜测出来的表单基线进入实现阶段。

**同浏览器验证交接协议**：

1. 严格执行 Verification Handoff Contract。
2. 通过 URL、标题、正文、关键 selector 缺失等信号识别验证码、安全验证、AI 校验、访问受限或登录挑战。
3. 保持失败的标签页/会话打开，不得关闭、重建或切换到另一个浏览器 profile。
4. 将这个确切的浏览器窗口/标签页置前。禁止只给用户一个 URL。
5. 告诉用户：“请在这个已经打开的浏览器窗口/标签页中完成验证。完成后告诉我，我会创建 `projects/{target-id}/captures/verification-resume.json`，并在同一会话中继续采集。”
6. 默认使用文件信号恢复：`projects/{target-id}/captures/verification-resume.json`。只有 `process.stdin.isTTY === true` 时才允许使用终端 `Enter`。
7. 在同一个 browser context/page 中继续采集，重新访问或刷新目标 URL，并重新运行验证门禁和状态门禁。
8. 如果同一会话仍然失败，记录阻塞并停止。不得猜测，也不得静默改用另一个浏览器。

在 `projects/{target-id}/sources/capture-session.md` 中记录验证交接：

- 浏览器来源：`@chrome`、Playwright headed、远程 live-view browser 或截图来源。
- profile/session 路径或 live-view URL（如可用）。
- 锁定的 session id/provider 和 state id。
- 目标状态和 URL。
- 当前验证 URL。
- 触发的验证信号。
- 恢复信号文件或 TTY 继续命令。
- 明确记录：“用户必须在已打开的浏览器窗口/标签页中完成验证”。
- 用户交接时间和结果。
- 验证后的门禁结果。

**截图来源动作**：

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

`capture-notes.md` 必须明确标记：

- 头部/顶部已采集。
- 中部已采集。
- 尾部/底部已采集。
- 使用的浏览器/会话。
- 或 `no-stable-footer`，并写明原因和下方已加载内容证据。

**禁止行为**：

- 不得把空白页、错误页、验证码页或安全验证页作为原站基线。
- 不得猜测缺失的中部、底部或后续状态。
- 任一必需状态没有检查头部、中部和尾部覆盖前，不得进入下一阶段。
- 任一必需状态未验证前，不得开始实现。

✅ **Checkpoint**：

```markdown
## 阶段三完成
- [x] 必需原站状态已采集，或截图基线已标注
- [x] 每个必需状态都已检查头部/中部/尾部覆盖
- [x] DOM/样式摘要已保存
- [x] 采集说明已记录
- [ ] 下一步：进入阶段四规格确认
```

默认：除非原站采集失败或用户要求暂停，否则自动进入阶段四。

### 阶段四：复刻策略与规格确认（⛔ BLOCKING）

🚧 **GATE**：阶段三完成；每个必需状态都有已验证的原站证据。

**动作**：

1. 创建 `projects/{target-id}/spec.md`。
2. 将每个必需状态映射到对应原站证据。
3. 嵌入或链接每个必需状态的原站截图，包括头部、中部和尾部证据。
4. 创建区域/组件拆解表，将每个复刻范围内的区域绑定到真实截图或 DOM 证据。
5. 提出实现策略。
6. 将截图证据、区域/组件拆解表和复刻策略一起展示，然后停止等待确认。

**区域/组件拆解表**：

`spec.md` 必须包含一张表，列包括：

- 区域/模块。
- 原站状态与截图证据。
- 关键元素。
- 视觉要求。
- 交互要求。
- 评估角色：`functional`、`content`、`structural` 或 `visual`。
- 建议的 `structureSelectors` selector、数量和权重。
- 实现组件/文件。

每个在范围内的 header、body 区块、footer、表单、列表、分页控件、弹窗、空状态、加载态和错误态都必须出现在表中。每一行都必须引用真实的阶段三证据。没有原站证据的区域不得凭空创造。

评估范围必须分层：

- `functional`：用户要求真实交互的控件。结构权重高，并且必须进入功能/交互测试。
- `content`：用户要求展示的数据或文案。结构和内容权重较高。
- `structural`：支撑页面形态的容器，例如表单、列表、分页、头部/尾部容器。
- `visual`：为了视觉一致必须出现，但用户没有要求其功能的区域，例如账户链接、应用入口、页脚链接。它们仍参与视觉、内容和基础结构评分，但除非用户要求，不需要进入功能交互用例。

不得因为某个区域的功能不在范围内，就把它标成“不评分”。只要它影响截图视觉，就必须参与视觉评分。

**规格确认必须覆盖**：

- 页面范围。
- 状态范围。
- 功能范围。
- 明确不复刻内容。
- header、body、footer、弹窗、表单、列表等区域的视觉优先级。
- header/body/footer 截图证据，或已记录的无稳定尾部例外。
- 绑定原站证据的区域/组件拆解表。
- 组件拆分。
- 路由和复刻页面访问地址。
- 可维护源码方案。
- 本地/线上独立运行方案。
- 阶段三素材采集模式，以及阶段六只使用既有基线的评估行为。
- 验收阈值。

✅ **Checkpoint**：

```markdown
## 阶段四完成
- [x] spec.md 已起草
- [x] 状态与基线映射已完成
- [x] 原站截图/基线已和实现策略一起展示
- [x] 区域/组件拆解表已完成，且每项都绑定原站证据
- [ ] BLOCKING：等待用户明确确认后才能开始实现
```

⛔ **硬停止**：用户明确确认实现策略前，不得开始编码实现。

### 阶段五：复刻实现

🚧 **GATE**：阶段四完成，且用户已经明确确认复刻策略。

**动作**：

- 仅在必要时在 `src` 中创建页面路由注册。
- 所有复刻页面源码都创建在 `projects/{target-id}/page/` 下。
- 除非用户明确确认其他技术栈，否则使用 React + TypeScript + CSS Modules 实现。
- 创建完整可维护源码，不得只是一次性静态 HTML。
- 文本、控件、布局、表单、列表、分页和状态切换必须由真实 DOM/CSS/JS 交互实现；截图只能作为参考。
- 在有助于维护时，拆分组件、本地状态/hooks、mock 数据、工具函数和样式。
- 组件和文件命名要与已确认的区域/组件拆解表对齐。
- 按状态逐个实现。
- 除非用户明确要求，不实现真实网络请求、登录、支付、上传等能力。
- 指定核心功能和交互必须能在本地闭环运行，不依赖原站后端。
- 在本地自测所有必需状态都能触发。
- 启动开发服务器，并汇报实际可访问 URL/端口。
- 持续更新 `logs/ai-log.md`、`logs/decisions.md` 和 `prompts/replica-prompts.md`。

**禁止行为**：

- 不得实现未包含在确认范围内的状态。
- 不得把生成的复刻 UI 文件放入 `src/pages/`。
- 不得参考或复制任何旧 project 实现。
- 不得在没有明确必要性和决策记录的情况下切换前端技术栈或新增 UI/依赖膨胀。
- 当多个区域或状态在范围内时，不得交付单个静态 HTML dump 或巨大的单文件页面。
- 不得使用整页截图、裁剪后的页面区域截图、图片热区、纯 canvas 截图渲染或截图背景作为复刻网页。
- 不得为了提高视觉分数而把低分的可交互实现替换成截图网页。
- 除非用户明确要求，不得调用真实支付、登录或上传接口。
- 不得删除或覆盖无关的用户改动。

✅ **Checkpoint**：

```markdown
## 阶段五完成
- [x] 复刻页面可在本地打开
- [x] 必需状态都可以触发
- [x] 已汇报实际本地访问 URL/端口
- [x] 源码可维护且归属当前 project
- [x] 已使用 React + TypeScript + CSS Modules，或已记录用户批准的例外
- [x] 源码文件遵循已确认的区域/组件拆解
- [x] 最终产物是可交互网页，不是截图网页
- [x] 核心功能不依赖原站后端即可运行
- [x] header/body/footer 或截图覆盖区域已实现
- [x] AI 使用过程和人工决策已记录
- [ ] 下一步：进入阶段六评估
```

默认：除非用户要求暂停，否则自动进入阶段六。

### 阶段六：评估迭代与交付

🚧 **GATE**：阶段五完成；复刻页面可本地运行；`config/target.json` 指向当前 project；所有必需状态都有阶段三基线。

只运行当前 project 的评估：

```bash
EVAL_TARGET_CONFIG=projects/{target-id}/config/target.json npm run eval
```

评估原站证据规则：

- 使用阶段三截图/基线作为原站证据。
- 评估阶段不得再次交互式打开原站采集素材。
- 评估阶段不得要求用户再次处理验证码或安全验证。
- 如果原站基线缺失、不完整或过期，必须停止并回到阶段三重新采集，再评估。

评估报告必须包含：

- `summary.json`：供自动化/CI 读取的六维汇总。
- `details.json`：页面、状态、视口、维度、问题和证据详情。
- `artifacts-index.json`：按维度和页面索引的截图、diff、交互失败截图、采集数据和报告产物。
- `report.md`：可读的六维 Markdown 报告。
- `index.html`：六维 Dashboard，包含总览卡片、页面矩阵、状态矩阵、问题中心、维度详情、证据中心和历史对比入口。
- 已锁定的评估模式。
- 实际使用的原站证据。
- 是否使用阶段三截图基线评估。
- 总分。
- 功能一致性分数。
- 交互一致性分数。
- 视觉一致性分数。
- 结构/语义一致性分数。
- 内容/数据一致性分数。
- 工程可维护性分数。
- 视觉差异图。
- 问题列表。
- 低分项修改建议。

报告归档位置：

```text
projects/{target-id}/evaluation/latest/
projects/{target-id}/evaluation/history/{timestamp}/
```

**迭代规则**：

- 如果评估未达到已确认的目标分数，必须根据报告修复低分项。
- 每轮修复后，只重新评估当前 project。
- 每一轮都必须记录到 `projects/{target-id}/logs/decisions.md` 或 `logs/ai-log.md`，包括低分项、修改内容、运行命令、分数变化和剩余问题。
- 达到目标分数后立即停止迭代。
- 同一次阶段六最多进行 3 轮“修复 + 重新评估”。
- 如果 3 轮后仍未达标，必须停止，并交付最新分数、报告和剩余问题清单，不得无限继续。
- 如果仍未达标，不得使用截图当网页，也不得为了提高视觉评分牺牲交互能力。最终交付仍然是当前最好的可交互网页，并如实报告分数和问题。

同类型稳定性验证：

- 交付项目达到目标分数或到达 3 轮上限后，在可行时选择一个新的同类型页面做轻量稳定性检查。
- 检查只能从用户式初始需求和本 skill 出发，不得使用旧 project 文件。
- 对内容展示/搜索型页面，选择另一个搜索或内容展示页面，验证请求解析、状态规划、素材采集计划和实现策略可以在无额外用户干预下推进。
- 对表单交互型页面，选择另一个登录、注册或找回密码类页面，验证同样流程稳定性。
- 将稳定性结果记录到 `projects/{target-id}/logs/decisions.md`。

✅ **Checkpoint**：

```markdown
## 阶段六完成
- [x] 只评估了当前 project
- [x] 报告标明原站证据来源和评估模式
- [x] 功能/交互/视觉/结构/内容/工程分数已输出
- [x] 低分项修改建议已列出
- [x] 修复/评估轮次已记录，最多 3 轮
- [x] 可行时已记录同类型稳定性检查
- [x] 即使分数低于目标，最终交付仍保持为可交互网页
- [x] 复刻页面访问地址已汇报
```
