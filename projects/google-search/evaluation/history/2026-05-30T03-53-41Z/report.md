# 网页复刻一致性评估报告

生成时间：2026-05-30T03:55:03.921Z
评估体系：六维评估体系 v2.0
目标配置：projects/google-search/config/target.json
浏览器：Chromium
视口：desktop 1365x768

## 1. 总览

总分：91.9 / 100
结论：excellent
门禁：passed
核心维度最低分：视觉一致性 76.7
页面数：1
状态数：3
失败状态数：0
高危问题数：0

| 维度 | 权重 | 分数 | 加权贡献 | 状态 | 问题数 |
| --- | ---: | ---: | ---: | --- | ---: |
| 功能正确性 | 25% | 97.5 | 24.4 | excellent | 0 |
| 交互流程一致性 | 20% | 100 | 20 | excellent | 0 |
| 视觉一致性 | 25% | 76.7 | 19.2 | warning | 4 |
| 结构语义一致性 | 10% | 95.9 | 9.6 | excellent | 0 |
| 内容数据一致性 | 10% | 87.4 | 8.7 | pass | 0 |
| 工程可维护性 | 10% | 100 | 10 | excellent | 0 |

## 2. 页面 × 六维矩阵

| 页面 | 总分 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 | 评估方式 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Google Search Replica | 91.9 | 97.5 | 100 | 76.7 | 95.9 | 87.4 | 100 | 高一致 | Phase 3 截图/DOM 基线评估 |

## 3. 高优先级问题

| 优先级 | 维度 | 严重级别 | 页面 | 状态 | 问题 | 影响分 | 置信度 | 建议 |
| ---: | --- | --- | --- | --- | --- | ---: | ---: | --- |
| P0 | 视觉一致性 | warning | google-search | - | 视觉一致性偏低 | -4 | 78% | 按区域 diff 调整布局、字号、颜色、间距和关键控件尺寸，优先修复低分区域。 |
| P1 | 视觉一致性 | info | google-search | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |
| P2 | 视觉一致性 | info | google-search | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |
| P3 | 视觉一致性 | info | google-search | - | PROJECT_BASELINE_SOURCE | -1 | 90% | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 |

## 4. 六维详情

### 4.1 功能正确性

分数：97.5 / 100
权重：25%
加权贡献：24.4
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| required 状态覆盖率 | 25% | 100 | required 状态是否有可信原站基线和复刻状态。 |
| 核心用例断言通过率 | 35% | 100 | 核心交互断言是否通过。 |
| 输出结果正确率 | 20% | 87.4 | 结果文案、列表和状态输出是否正确。 |
| 边界/异常态通过率 | 20% | 97.5 | 空输入、错误态、无结果态等边界行为。 |

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
| 反馈状态一致性 | 20% | 93.7 | loading、error、disabled、即时反馈等状态是否一致。 |
| 键盘/鼠标细节一致性 | 10% | 100 | Enter、hover、focus、blur 等细节。 |

### 4.3 视觉一致性

分数：76.7 / 100
权重：25%
加权贡献：19.2
状态：warning
修复建议：优先查看区域 diff 和整页 diff，按页面头、中、尾逐段修正布局、字体、颜色和间距。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 整页视觉 | 20% | 76.7 | 整页截图 diff 与 SSIM 综合分。 |
| 区域加权视觉 | 45% | 76.7 | 关键区域截图、区域 diff、bbox 和样式综合分。未配置区域时会低于整页分，提示补充 regions。 |
| 关键元素样式 | 20% | 86.3 | 字体、颜色、圆角、控件尺寸等样式对齐。 |
| 布局盒模型 | 15% | 71.7 | 关键元素坐标、宽高、间距对齐。 |

### 4.4 结构语义一致性

分数：95.9 / 100
权重：10%
加权贡献：9.6
状态：excellent
修复建议：保持当前实现，后续只需防止回归。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 关键 DOM 结构 | 30% | 95.9 | 用户复刻范围内 functional/content/structural/visual selector 按权重匹配情况。 |
| 关键控件语义 | 25% | 98 | 用户要求交互的 input、button、a、form 等控件是否真实可操作。 |
| 基础语义一致性 | 20% | 91.7 | 视觉必需区域、基础语义、焦点和可见文本是否合理。 |
| 反截图伪页面检查 | 10% | 100 | 是否存在整页截图、大面积 canvas 或不可交互伪装。 |

### 4.5 内容数据一致性

分数：87.4 / 100
权重：10%
加权贡献：8.7
状态：pass
修复建议：对齐原站可见文案、错误提示、列表字段、表格字段和状态文案。

| 子项 | 权重 | 分数 | 说明 |
| --- | ---: | ---: | --- |
| 核心文本覆盖 | 30% | 87.4 | 标题、按钮、提示、结果等核心文本覆盖率。 |
| 表单文案 | 20% | 91.7 | label、placeholder、helper text 是否一致。 |
| 错误/空态/loading 文案 | 20% | 97.5 | 状态文案是否与原站可见 UI 对齐。 |
| 列表/表格/卡片数据结构 | 20% | 92.5 | 结果项字段、数量和结构是否一致。 |

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
| 样式隔离与可维护性 | 15% | 88.4 | 样式是否隔离、命名清晰、便于维护。 |
| 评估产物与日志完整性 | 20% | 100 | summary、details、report、截图、diff 等产物是否完整。 |

## 5. 页面详情

| 页面 | 状态 | required | 原站/复刻门禁 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Google Search Replica | Initial Search Page `initial` | 是 | passed | 97.5 | 100 | 76.7 | 95.9 | 87.4 | 100 | 高一致 |
| Google Search Replica | Search Results Page `results` | 是 | passed | 97.5 | 100 | 76.7 | 95.9 | 87.4 | 100 | 高一致 |
| Google Search Replica | Second Results Page `page-2` | 是 | passed | 97.5 | 100 | 76.7 | 95.9 | 87.4 | 100 | 高一致 |

### Google Search Replica

- 页面 ID：`google-search`
- 原始地址：https://www.google.com/
- 复刻地址：http://127.0.0.1:5173/replica/google-search
- 最终 URL：https://www.google.com/
- 评估方式：Phase 3 截图/DOM 基线评估
- 门禁：passed

#### 交互用例

| 用例 | 状态 | 失败步骤 | 说明 | 证据 |
| --- | --- | ---: | --- | --- |
| Search button submits query | 通过 |  |  |  |
| Enter key submits query | 通过 |  |  |  |
| Pagination moves to next page | 通过 |  |  |  |

#### 视觉证据

- projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-shell-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-form-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-footer-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/results/regions/diff-results-header-desktop.png
- projects/google-search/evaluation/latest/assets/google-search/page-2/regions/diff-results-header-desktop.png

#### 问题与修复建议

| 维度 | 严重级别 | 问题 | 建议 | 证据 |
| --- | --- | --- | --- | --- |
| 视觉一致性 | warning | 视觉一致性偏低：请优先查看当前 project/evaluation/latest/assets 下对应状态的视觉差异图，修复区域布局、字体字号、间距、颜色和控件尺寸。 | 按区域 diff 调整布局、字号、颜色、间距和关键控件尺寸，优先修复低分区域。 | projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-shell-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-form-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-footer-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/regions/diff-results-header-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/regions/diff-results-header-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：projects/google-search/baselines/initial/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-shell-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-form-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-footer-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/regions/diff-results-header-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/regions/diff-results-header-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：projects/google-search/baselines/results/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-shell-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-form-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-footer-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/regions/diff-results-header-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/regions/diff-results-header-desktop.png |
| 视觉一致性 | info | 原网页证据来自 Phase 3 已确认截图/DOM 基线：projects/google-search/baselines/page-2/original-dom.json | 打开对应截图、diff 或区域 diff，对照修复布局与样式差异。 | projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-shell-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-search-form-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/initial/regions/diff-footer-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/regions/diff-results-header-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/regions/diff-results-header-desktop.png |

## 6. 历史对比

当前版本尚未接入历史归档对比；报告保留六维历史对比入口。

## 7. 证据中心

| 维度 | 证据数量 | 代表产物 |
| --- | ---: | --- |
| 功能正确性 | 1 | projects/google-search/evaluation/latest/captures/google-search-source.json |
| 交互流程一致性 | 0 | - |
| 视觉一致性 | 8 | projects/google-search/evaluation/latest/assets/google-search/initial/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/results/diff-desktop.png<br>projects/google-search/evaluation/latest/assets/google-search/page-2/diff-desktop.png |
| 结构语义一致性 | 1 | projects/google-search/evaluation/latest/captures/google-search-source.json |
| 内容数据一致性 | 1 | projects/google-search/evaluation/latest/captures/google-search-source.json |
| 工程可维护性 | 5 | summary.json<br>details.json<br>artifacts-index.json |
