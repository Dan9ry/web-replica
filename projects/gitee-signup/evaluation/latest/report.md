# 网页复刻一致性评估报告

生成时间：2026-05-30T02:15:14.288Z
评估体系：六维评估体系 v2.0
目标配置：projects/gitee-signup/config/target.json
浏览器：Chromium
视口：desktop 1365x768

## 1. 总览

总分：93.6 / 100
结论：excellent
门禁：passed
核心维度最低分：视觉一致性 79.7
页面数：1
状态数：3
失败状态数：0
高危问题数：0

| 维度 | 权重 | 分数 | 加权贡献 | 状态 | 问题数 |
| --- | ---: | ---: | ---: | --- | ---: |
| 功能正确性 | 25% | 99.2 | 24.8 | excellent | 0 |
| 交互流程一致性 | 20% | 100 | 20 | excellent | 0 |
| 视觉一致性 | 25% | 79.7 | 19.9 | warning | 4 |
| 结构语义一致性 | 10% | 92.6 | 9.3 | excellent | 0 |
| 内容数据一致性 | 10% | 95.8 | 9.6 | excellent | 0 |
| 工程可维护性 | 10% | 100 | 10 | excellent | 0 |

## 2. 页面 × 六维矩阵

| 页面 | 总分 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 | 评估方式 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Gitee Signup Replica | 93.6 | 99.2 | 100 | 79.7 | 92.6 | 95.8 | 100 | 高一致 | Phase 3 截图/DOM 基线评估 |

## 3. 高优先级问题

| 优先级 | 维度 | 严重级别 | 页面 | 状态 | 问题 | 影响分 | 置信度 | 建议 |
| ---: | --- | --- | --- | --- | --- | ---: | ---: | --- |
| P0 | 视觉一致性 | warning | gitee-signup | - | 视觉一致性偏低 | -4 | 78% | 按区域 diff 调整布局、字号、颜色、间距和关键控件尺寸，优先修复低分区域。 |
| P1 | 视觉一致性 | info | gitee-signup | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |
| P2 | 视觉一致性 | info | gitee-signup | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |
| P3 | 视觉一致性 | info | gitee-signup | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |

## 4. 六维详情

### 4.1 功能正确性

分数：99.2 / 100
权重：25%
加权贡献：24.8
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| required 状态覆盖率 | 25% | 100 | required 状态是否有可信原站基线和复刻状态。 |
| 核心用例断言通过率 | 35% | 100 | 核心交互断言是否通过。 |
| 输出结果正确率 | 20% | 95.8 | 结果文案、列表和状态输出是否正确。 |
| 边界/异常态通过率 | 20% | 99.2 | 空输入、错误态、无结果态等边界行为。 |

### 4.2 交互流程一致性

分数：100 / 100
权重：20%
加权贡献：20
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 交互用例通过率 | 40% | 100 | 交互用例整体通过情况。 |
| 步骤断言通过率 | 30% | 100 | 动作后的可见状态断言是否通过。 |
| 反馈状态一致性 | 20% | 97.9 | loading、error、disabled、即时反馈等状态是否一致。 |
| 键盘/鼠标细节一致性 | 10% | 100 | Enter、hover、focus、blur 等细节。 |

### 4.3 视觉一致性

分数：79.7 / 100
权重：25%
加权贡献：19.9
状态：warning
修复建议：优先查看区域 diff 和整页 diff，按页面头、中、尾逐段修正布局、字体、颜色和间距。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 整页视觉 | 20% | 79.7 | 整页截图 diff 与 SSIM 综合分。 |
| 区域加权视觉 | 45% | 79.7 | 关键区域截图、区域 diff、bbox 和样式综合分。未配置区域时会低于整页分，提示补充 regions。 |
| 关键元素样式 | 20% | 86.2 | 字体、颜色、圆角、控件尺寸等样式对齐。 |
| 布局盒模型 | 15% | 74.7 | 关键元素坐标、宽高、间距对齐。 |

### 4.4 结构语义一致性

分数：92.6 / 100
权重：10%
加权贡献：9.3
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 关键 DOM 结构 | 30% | 92.6 | 用户复刻范围内 functional/content/structural/visual selector 按权重匹配情况。 |
| 关键控件语义 | 25% | 96.3 | 用户要求交互的 input、button、a、form 等控件是否真实可操作。 |
| 基础语义一致性 | 20% | 94.2 | 视觉必需区域、基础语义、焦点和可见文本是否合理。 |
| 反截图伪页面检查 | 10% | 100 | 是否存在整页截图、大面积 canvas 或不可交互伪装。 |

### 4.5 内容数据一致性

分数：95.8 / 100
权重：10%
加权贡献：9.6
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 核心文本覆盖 | 30% | 95.8 | 标题、按钮、提示、结果等核心文本覆盖率。 |
| 表单文案 | 20% | 94.2 | label、placeholder、helper text 是否一致。 |
| 错误/空态/loading 文案 | 20% | 99.2 | 状态文案是否与原站可见 UI 对齐。 |
| 列表/表格/卡片数据结构 | 20% | 97.5 | 结果项字段、数量和结构是否一致。 |

### 4.6 工程可维护性

分数：100 / 100
权重：10%
加权贡献：10
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 构建/启动/测试 | 25% | 100 | 复刻工程是否可构建、可启动、可评估。 |
| 组件拆分与代码组织 | 20% | 100 | 源码是否位于 project/page 并按组件、数据、状态、样式组织。 |
| 样式隔离与可维护性 | 15% | 89.9 | 样式是否隔离、命名清晰、便于维护。 |
| 评估产物与日志完整性 | 20% | 100 | summary、details、report、截图、diff 等产物是否完整。 |

## 5. 页面详情

| 页面 | 状态 | required | 原站/复刻门禁 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Gitee Signup Replica | Signup form initial state `signup-initial` | 是 | passed | 99.2 | 100 | 79.7 | 92.6 | 95.8 | 100 | 高一致 |
| Gitee Signup Replica | Required prompts after blur `signup-blur-required` | 是 | passed | 99.2 | 100 | 79.7 | 92.6 | 95.8 | 100 | 高一致 |
| Gitee Signup Replica | Signup button validation state `signup-submit-validation` | 是 | passed | 99.2 | 100 | 79.7 | 92.6 | 95.8 | 100 | 高一致 |

### Gitee Signup Replica

- 页面 ID：`gitee-signup`
- 原始地址：https://gitee.com/signup
- 复刻地址：http://127.0.0.1:5173/replica/gitee-signup
- 最终 URL：https://gitee.com/signup
- 评估方式：Phase 3 截图/DOM 基线评估
- 门禁：passed

#### 视觉证据

- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-signup-form-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-first-input-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-submit-button-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-signup-form-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-first-input-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-submit-button-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-signup-form-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-first-input-desktop.png
- /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-submit-button-desktop.png

#### 问题与修复建议

| 维度 | 严重级别 | 问题 | 建议 | 证据 |
| --- | --- | --- | --- | --- |
| 视觉一致性 | warning | 视觉一致性偏低：请优先查看当前 project/evaluation/latest/assets 下对应状态的视觉差异图，修复区域布局、字体字号、间距、颜色和控件尺寸。 | 按区域 diff 调整布局、字号、颜色、间距和关键控件尺寸，优先修复低分区域。 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-submit-button-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/gitee-signup/baselines/signup-initial/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-submit-button-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/gitee-signup/baselines/signup-blur-required/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-submit-button-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/gitee-signup/baselines/signup-submit-validation/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/regions/diff-submit-button-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-signup-form-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-first-input-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/regions/diff-submit-button-desktop.png |

## 6. 历史对比

当前版本尚未接入历史归档对比；报告保留六维历史对比入口。

## 7. 证据中心

| 维度 | 证据数量 | 代表产物 |
| --- | ---: | --- |
| 功能正确性 | 1 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/captures/gitee-signup-source.json |
| 交互流程一致性 | 0 | - |
| 视觉一致性 | 12 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-initial/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-blur-required/diff-desktop.png<br>/Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/assets/gitee-signup/signup-submit-validation/diff-desktop.png |
| 结构语义一致性 | 1 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/captures/gitee-signup-source.json |
| 内容数据一致性 | 1 | /Users/dangry/Documents/try/tencent/projects/gitee-signup/evaluation/latest/captures/gitee-signup-source.json |
| 工程可维护性 | 5 | summary.json<br>details.json<br>artifacts-index.json |
