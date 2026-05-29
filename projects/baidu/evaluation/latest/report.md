# 一致性评估报告

生成时间：2026-05-29T09:16:27.970Z

## 百度首页

- 页面 ID：`baidu`
- 原始地址：https://www.baidu.com
- 复刻地址：http://127.0.0.1:5173/replica/baidu
- 原网页门禁：passed
- 评估方式：实时原站采集评估
- 最终 URL：https://www.baidu.com/

- 总分：90 / 100
- 结论：高一致

### 分项得分

| 维度 | 分数 |
| --- | ---: |
| 功能一致性 | 100 |
| 交互一致性 | 100 |
| 视觉一致性 | 74.9 |

### 原站状态门禁

| 状态 | 结果 | 最终 URL |
| --- | --- | --- |
| 首页初始态 `home` | passed | https://www.baidu.com/ |
| 搜索结果展示态 `search-results` | passed | https://www.baidu.com/s?wd=%E7%BD%91%E9%A1%B5%E5%A4%8D%E5%88%BB |
| 搜索结果翻页态 `pagination` | passed | https://www.baidu.com/s?wd=%E7%BD%91%E9%A1%B5%E5%A4%8D%E5%88%BB&pn=10 |

### 评估产物

- 采集数据：projects/baidu/evaluation/latest/captures/baidu-source.json
- 视觉差异图：projects/baidu/evaluation/latest/assets/baidu/home/diff-desktop.png
- 视觉差异图：projects/baidu/evaluation/latest/assets/baidu/search-results/diff-desktop.png
- 视觉差异图：projects/baidu/evaluation/latest/assets/baidu/pagination/diff-desktop.png

### 问题列表

- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#kw
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#su
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#kw
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#su
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#kw
- [warning] HIDDEN_CRITICAL_SELECTOR: 关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：#su
- [warning] LOW_VISUAL_SCORE: 视觉一致性偏低：请优先查看 projects/baidu/evaluation/latest/assets 下对应状态的视觉差异图，修复页面整体布局、搜索框尺寸、结果页左右栏宽度、字体字号、间距和颜色。
