# 一致性评估报告

生成时间：2026-05-29T12:59:12.754Z

## Weixin Pay Login Replica

- 页面 ID：`weixin-pay-login`
- 原始地址：https://pay.weixin.qq.com/index.php/core/home/login
- 复刻地址：http://127.0.0.1:5173/replica/weixin-pay-login
- 原网页门禁：passed
- 评估方式：Phase 3 截图/DOM 基线评估
- 最终 URL：https://pay.weixin.qq.com/index.php/core/home/login

- 总分：90.4 / 100
- 结论：高一致

### 分项得分

| 维度 | 分数 |
| --- | ---: |
| 功能一致性 | 100 |
| 交互一致性 | 100 |
| 视觉一致性 | 76.1 |

### 原站状态门禁

| 状态 | 结果 | 最终 URL |
| --- | --- | --- |
| Login form initial state `login-initial` | passed | https://pay.weixin.qq.com/index.php/core/home/login |
| Login button validation state `login-validation` | passed | https://pay.weixin.qq.com/index.php/core/home/login |

### 评估产物

- 采集数据：reports/latest/captures/weixin-pay-login-source.json
- 视觉差异图：reports/latest/assets/weixin-pay-login/login-initial/diff-desktop.png
- 视觉差异图：reports/latest/assets/weixin-pay-login/login-validation/diff-desktop.png

### 问题列表

- [info] PROJECT_BASELINE_SOURCE: 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/weixin-pay-login/baselines/login-initial/original-dom.json
- [info] PROJECT_BASELINE_SOURCE: 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/weixin-pay-login/baselines/login-validation/original-dom.json
- [warning] LOW_VISUAL_SCORE: 视觉一致性偏低：请优先查看 reports/latest/assets 下对应状态的视觉差异图，修复页面整体布局、搜索框尺寸、结果页左右栏宽度、字体字号、间距和颜色。

