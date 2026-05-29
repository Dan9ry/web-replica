# 百度首页复刻规格确认

> 阶段四阻塞点：请用户确认本规格后，才能进入复刻实现。

## 复刻访问地址

```text
http://127.0.0.1:5173/replica/baidu
```

若开发服务器未启动：

```bash
npm run dev
```

## 已采集原站基线

| 状态 | 原站证据 | 状态 |
| --- | --- | --- |
| `home` 首页初始态 | `projects/baidu/baselines/home/original-desktop.png` | 已通过实时原站采集门禁 |
| `search-results` 搜索结果展示态 | `projects/baidu/baselines/search-results/original-desktop.png` | 已通过实时原站采集门禁 |
| `pagination` 搜索结果翻页态 | `projects/baidu/baselines/pagination/original-desktop.png` | 已通过实时原站采集门禁 |

说明：百度搜索结果页曾触发 `wappass.baidu.com` 验证页，已通过交互辅助方式由用户完成验证后继续采集。任何验证码页、错误页、空白页都未被作为基线。

## 页面范围

- 首页初始态。
- 搜索结果展示态。
- 搜索结果翻页态。

## 功能范围

- 搜索输入框输入关键词。
- 点击“百度一下”触发搜索。
- 按 Enter 触发搜索。
- 展示搜索结果文案。
- 展示结果列表。
- 支持结果列表翻页。

## 用户新增观察

用户补充：百度搜索框输入内容时会实时进行搜索/联想。

确认结果：

- 本次不纳入输入实时搜索/联想效果。
- 只实现搜索输入、点击搜索、Enter 搜索、结果展示和翻页。

## 不复刻范围

- 不调用百度真实搜索接口。
- 不实现真实登录、账号菜单、广告投放、个性化推荐。
- 不实现图片/语音/文件上传真实能力，只做视觉占位。
- 不复刻移动端，仅复刻桌面端。
- 不保证搜索结果内容与百度实时结果一致，结果数据使用本地 mock。

## 视觉优先级

1. 首页顶部导航、Logo、搜索框、搜索按钮、热榜区域。
2. 搜索结果页顶部搜索栏、结果分类导航、左侧结果列表。
3. 结果页右侧相关搜索和热榜。
4. 分页区域与页码状态。

## 组件拆分建议

- 页面源码位置：`projects/baidu/page/`。
- `BaiduReplicaPage`：页面状态容器。
- `HomeSearchPanel`：首页搜索区域。
- `SearchSuggestPanel`：输入实时联想下拉层。
- `ResultsHeader`：结果页顶部搜索栏和导航。
- `SearchResultsList`：结果列表。
- `SideRecommendations`：右侧相关搜索和热榜。
- `PaginationBar`：分页交互。

## 评估模式

- 锁定模式：`Phase 3 截图/DOM 基线评估`。
- 评估阶段只使用 `projects/baidu/baselines/` 下已确认的原站基线，不再交互式打开原站。
- 评估命令：

```bash
EVAL_TARGET_CONFIG=projects/baidu/config/target.json npm run eval
```

## 验收阈值

| 指标 | 阈值 |
| --- | ---: |
| 功能一致性 | >= 90 |
| 交互一致性 | >= 90 |
| 视觉一致性 | >= 85 |
| 总分 | >= 88 |

## 阶段四确认结果

- 用户确认不实现“输入时实时搜索/联想”。
- 用户确认进入阶段五复刻实现。
