# 开源代码及组件使用说明

本文说明本作品所依赖的开源项目、第三方服务与自研模块边界，便于竞赛评审、合规审计与后续贡献者上手。**若与贵队实际部署的 fork 或版本不一致，请以仓库内 `package.json` / 后端依赖清单及部署文档为准，并更新本节链接。**

---

## 1. 后端素材库：agency-agents

### 1.1 项目说明

**agency-agents**（社区常称 *The Agency*）是 GitHub 上的开源 **AI Agent 人设与专家角色素材库**：以 Markdown 等形式提供多领域「数字专家」的身份、工作流与交付物描述，可用于 IDE 插件、编排系统或**后端人设/素材库**的初始化与扩展。

本作品中，**后端「人设 / 素材库」**在建设与同步时参考或引用了该类开源素材（具体集成方式由后端实现：如定时拉取、镜像入库、或经审批后人工裁剪入库）。

### 1.2 参考仓库（请按实际使用的 fork 填写）

| 说明 | 地址 |
|------|------|
| 常见上游示例（RobinGitHub） | https://github.com/RobinGitHub/agency-agents |
| 其他社区 fork | 在 GitHub 搜索 `agency-agents`，以贵队锁定的仓库为准 |

### 1.3 许可证

上述 **agency-agents** 类仓库通常采用 **MIT License**（以各仓库根目录 `LICENSE` 为准）：允许商业与个人使用；**建议**在作品说明或答辩材料中保留致谢与来源链接。

### 1.4 使用边界建议

- 人设文案、分类结构若经本队**二次编辑、翻译或裁剪**，须在文档中区分「原始开源素材」与「本队衍生内容」。
- 若仅使用其**分类思想**而内容为完全自撰，亦建议注明「灵感来源」以体现学术诚信。

---

## 2. 前端工程与构建链（开源）

| 组件 / 框架 | 用途 | 说明 |
|-------------|------|------|
| **uni-app** | 跨端应用框架 | 一套代码多端发布（如 App、小程序、H5 等，以 `manifest.json` 配置为准） |
| **Vue** | 视图层 | 与 uni-app 组合开发页面与组件 |
| **Vite** | 构建工具 | 开发期 Dev Server、打包与资源处理 |
| **@dcloudio/vite-plugin-uni** | uni 的 Vite 插件 | 见根目录 `vite.config.js` |

许可证以各官方仓库为准（DCloud/uni-app、Vue、Vite 等）。

---

## 3. 前端自研与封装模块（非 npm 独立包，随仓库分发）

以下为本项目源码内主要逻辑模块，**与 agency-agents 无直接运行时依赖**；与后端通过自有 REST API 等协作。

| 路径 / 模块 | 作用 |
|-------------|------|
| `utils/openaiCompatible.js` | 调用 **OpenAI 兼容** 的 `chat/completions` 接口（可对接官方或兼容网关） |
| `utils/openaiResponse.js` | 解析助手回复文本 |
| `utils/llmSettings.js` | 模型 Base URL、API Key、默认模型等本地配置 |
| `utils/virtualTeamStore.js` | 虚拟团队、全员群 HQ、本地会话与播报逻辑 |
| `utils/lang.js` | 中英文案与插值 |
| `utils/request.js` | `uni.request` 封装、开发环境代理约定 |
| `clientApi/*.js` | 与后端业务接口（如用户 Agent 列表） |
| `data/agentDepartments.js` | 前端部门与角色展示数据（可与后端/素材库对齐字段） |
| `components/` | 如 `AppTabBar.vue`、各部门展示子组件等 |

---

## 4. 第三方网络服务（运行时可选）

| 服务 | 用途 | 说明 |
|------|------|------|
| **OpenAI 兼容 API** | 大模型对话、播报、工作流文案等 | Base URL 须包含 `/v1`；密钥由用户在本应用内配置，不随仓库分发 |
| **rss2json.com** 等 | RSS 转 JSON（全员播报资讯摘要） | 见 `utils/virtualTeamStore.js` 中新闻拉取逻辑；若赛方要求离线演示，可关闭或替换为自建代理 |

使用前请阅读各服务条款与数据出境合规要求。

---

## 5. 组件使用说明（前端）

### 5.1 全局与页面

- **入口**：`main.js`、`App.vue` 全局样式与主题。
- **底部导航**：`components/AppTabBar.vue`，在首页、消息等页通过 `current` 属性切换高亮。
- **全员群**：`pages/home/home.vue`，依赖 `virtualTeamStore` 中 HQ 相关 API。
- **聊天**：`pages/chat/chat.vue`，支持虚拟群、一对一等模式（由路由参数区分）。

### 5.2 与后端、素材库的关系

- **数字员工列表 / 用户 Agent**：一般由 `clientApi/agentsApi.js` 请求后端，与**后端库中人设 ID、展示名、部门**等字段对齐。
- **部门与角色卡片**：`pages/department/department.vue` + `components/department/*` 分支渲染；数据源可来自 `data/agentDepartments.js` 或接口，**若与 agency-agents 分类对应，建议在接口文档中维护映射表**（如 `eng-frontend` ↔ 某专家 slug）。

### 5.3 环境变量（H5 开发）

- 见 `vite.config.js` 注释：`VITE_PROXY_TARGET`、`VITE_API_STRIP_PREFIX` 等与后端联调相关。
- 勿将生产密钥写入仓库；使用本地或 CI 注入。

---

## 6. 合规清单（提交前自检）

- [ ] `agency-agents` 所使用仓库 URL、commit 或版本号已写明  
- [ ] 各开源依赖 LICENSE 已核对，答辩材料含致谢页  
- [ ] 本队衍生内容与原始素材区分说明已具备  
- [ ] API Key、内网地址等未出现在公开分支  

---

**文档版本**：随仓库维护；最后更新可与提交说明或 Tag 对齐。
