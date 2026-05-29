# 一致性评估报告

生成时间：2026-05-29T12:34:25.387Z

## Google Search Replica

- 页面 ID：`google-search`
- 原始地址：https://www.google.com/
- 复刻地址：http://127.0.0.1:5173/replica/google-search
- 原网页门禁：passed
- 评估方式：Phase 3 截图/DOM 基线评估
- 最终 URL：https://www.google.com/

- 总分：94.6 / 100
- 结论：高一致

### 分项得分

| 维度 | 分数 |
| --- | ---: |
| 功能一致性 | 100 |
| 交互一致性 | 100 |
| 视觉一致性 | 86.4 |

### 原站状态门禁

| 状态 | 结果 | 最终 URL |
| --- | --- | --- |
| Initial search home `home` | passed | https://www.google.com/ |
| Search results page one `results-page-1` | passed | https://www.google.com/search?q=tencent |
| Search results pagination `results-page-2` | passed | https://www.google.com/search?q=tencent&start=10 |

### 评估产物

- 采集数据：reports/latest/captures/google-search-source.json
- 视觉差异图：reports/latest/assets/google-search/home/diff-desktop.png
- 视觉差异图：reports/latest/assets/google-search/results-page-1/diff-desktop.png
- 视觉差异图：reports/latest/assets/google-search/results-page-2/diff-desktop.png

### 问题列表

- [info] PROJECT_BASELINE_SOURCE: 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/google-search/baselines/home/original-dom.json
- [info] PROJECT_BASELINE_SOURCE: 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/google-search/baselines/results-page-1/original-dom.json
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#result-stats
- [info] PROJECT_BASELINE_SOURCE: 原网页证据来自 Phase 3 已确认截图/DOM 基线：/Users/dangry/Documents/try/tencent/projects/google-search/baselines/results-page-2/original-dom.json

