# 演示脚本与接口说明

本文档供比赛答辩与联调使用：基址以 `.env` 中 `VITE_API_BASE_URL` 为准（默认与 `.env.example` 一致），请求前缀一般为 `/api`。

## 一、推荐演示路径（约 3～5 分钟）

1. **注册 / 登录**  
   - 打开「登录」页，使用手机号 + 密码登录；或从「我的」进入注册。  
   - 成功后会写入本地 Token，后续接口带 `Authorization: Bearer <token>`。

2. **创建工作流**  
   - 底部 Tab「项目」→「＋ 新建工作流」→ 填写名称（必填）、描述（可选）→ 创建。  
   - 在列表中点击该工作流进入**工作台**。

3. **工作台：沟通初始化**  
   - 切到「沟通」→ 若无线程，可点「初始化线程」。  
   - 选择内部/客户线程，发送一条消息，确认列表与发送成功提示。

4. **布置任务**  
   - Tab「布置」→ 选择工作流 → 填写任务内容、优先级 →「下发任务」。  
   - 回到「项目」进入同一工作流工作台 →「任务」页应出现对应任务；可切换「按部门 / 看板 / 列表」。

5. **更新进度**  
   - 在工作台点击任务 →「更新进度」→ 拖动滑块并保存。

6. **消息 Tab（与后端对齐）**  
   - 登录状态下，「消息」从各工作流的 **comms 线程**聚合会话；点进会话可在「聊天」页继续收发（与工作台同源 API）。

7. **可选：实时刷新**  
   - 若后端提供 WebSocket，在 `.env` 配置 `VITE_WS_URL`；工作台在收到推送时会刷新任务/动态/当前线程消息。未配置时仍依赖页面内轮询。

---

## 二、主要 HTTP 接口（前端封装位置）

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | `/api/auth/login` | 登录， body：`phone`, `password` |
| 认证 | POST | `/api/auth/register` | 注册 |
| 认证 | POST | `/api/auth/change-password` | 改密（需登录） |
| 认证 | GET | `/api/auth/me` | 当前用户（需登录） |
| 工作流 | GET/POST | `/api/workflows` | 列表 / 创建 |
| 工作流 | GET | `/api/workflows/{id}` | 详情 |
| 工作流 | POST | `/api/workflows/{id}/commands` | 指令下发（布置任务等） |
| 工作流 | GET | `/api/workflows/{id}/tasks` | 任务列表 |
| 工作流 | POST | `/api/workflows/{id}/tasks/{taskId}/progress` | 更新进度 |
| 工作流 | GET | `/api/workflows/{id}/collaboration-graph` | 协作图谱 |
| 工作流 | GET | `/api/workflows/{id}/events` | 动态事件 |
| 沟通 | POST | `/api/workflows/{id}/comms/bootstrap` | 初始化沟通 |
| 沟通 | GET | `/api/workflows/{id}/comms/threads` | 线程列表 |
| 沟通 | GET/POST | `/api/workflows/{id}/comms/threads/{threadId}/messages` | 消息列表 / 发送 |
| 沟通 | POST | `/api/workflows/{id}/comms/broadcast` | 播报 |
| 沟通 | POST | `/api/workflows/{id}/comms/messages/{messageId}/link-task` | 消息关联任务 |

前端封装见：`api/authApi.js`、`api/workflowApi.js`；统一请求：`utils/request.js`。

---

## 三、环境与排错摘要

- **401**：需登录的接口返回 401 时，客户端会清除会话并跳转登录页。  
- **404**：检查 `VITE_API_BASE_URL` 是否多写了 `/api`；对照后端 Swagger 路径。  
- **跨域**：H5 开发可用 Vite 代理（`VITE_PROXY_TARGET`），与直连二选一配置清晰即可。  
- **WebSocket**：`VITE_WS_URL` 可选；推送 JSON 建议包含 `workflowId` 以便只刷新对应工作台。

---

## 四、Swagger

以后端部署的 Swagger / OpenAPI 文档为准，路径与字段名若有出入，以 `workflowApi.js` / `authApi.js` 中注释「兼容多种包装」的解析逻辑为准。
