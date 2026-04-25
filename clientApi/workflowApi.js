import request from "@/utils/request";
import { unwrapData, unwrapList, unwrapDataOrThrowBusinessError } from "@/utils/apiHelpers";
import { getUserInfo } from "@/utils/index";

/** 与 Swagger `POST /api/workflows` 一致：每条约束任务需唯一 `clientTaskId` */
function newClientTaskId() {
  return `ct-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * POST /api/workflows 请求体（见 Swagger：创建工作流）
 * 顶层：title, goal, routingRootLevel；tasks[] 内：clientTaskId, department, title, description, hierarchyLevel，可 parentClientTaskId / dependsOnClientTaskIds
 * @param {{ name?: string, title?: string, description?: string, goal?: string }} input
 */
export function buildWorkflowCreatePayload(input) {
  const nameRaw = (input && (input.name != null ? input.name : input.title)) || "";
  const title = String(nameRaw).trim() || "未命名项目";
  const desc = String((input && input.description) || "").trim();
  const goalText =
    (input && String(input.goal || "").trim()) ||
    (desc
      ? `项目：${title}。说明：${desc}`
      : `项目「${title}」的协作目标可在工作台中继续完善。`);
  const taskLineTitle = `【${title}】部门任务`;
  const taskLineDesc = desc
    ? `按项目说明执行：${desc.slice(0, 500)}${desc.length > 500 ? "…" : ""}`
    : "由产品到工程的协同与落地，可在工作台继续细化。";

  const out = {
    title,
    goal: goalText,
    /** 与文档示例值一致（根路由层级/位标志，勿随意改为 1） */
    routingRootLevel: 1073741824,
    tasks: [
      {
        clientTaskId: newClientTaskId(),
        /** 与布置任务/部门 ID 约定一致；若你们后端是中文部门名，再改此处 */
        department: "engineering",
        title: taskLineTitle,
        description: taskLineDesc,
        hierarchyLevel: 1,
        dependsOnClientTaskIds: [],
      },
    ],
  };
  if (desc) {
    out.description = desc;
  }
  if (import.meta.env.MODE === "development") {
    console.log("[createWorkflow] POST /api/workflows", JSON.stringify(out));
  }
  return out;
}

export async function listWorkflows() {
  const tryGet = async (url) => {
    const r = await request.get(url, {}, { needAuth: true, showError: false });
    return unwrapList(r);
  };
  const tryPost = async (url, body = {}) => {
    const r = await request.post(url, body, { needAuth: true, showError: false });
    return unwrapList(r);
  };
  const candidates = [
    () => tryGet("/api/workflows"),
    () => tryGet("/api/workflows/"),
    () => tryGet("/api/workflows/list"),
    () => tryGet("/api/workflow/list"),
    () => tryPost("/api/workflows/query", { page: 1, pageSize: 200 }),
  ];
  let lastErr = null;
  for (const run of candidates) {
    try {
      const list = await run();
      if (Array.isArray(list)) return list;
    } catch (e) {
      lastErr = e;
    }
  }
  if (import.meta.env.MODE === "development" && lastErr) {
    console.warn("[listWorkflows] all candidates failed", lastErr);
  }
  return [];
}

export async function createWorkflow(input) {
  const payload =
    input && typeof input === "object" ? buildWorkflowCreatePayload(input) : buildWorkflowCreatePayload({ name: String(input) });
  const r = await request.post("/api/workflows", payload, { needAuth: true, showError: false });
  return unwrapDataOrThrowBusinessError(r);
}

/**
 * 一句话自动创建并分配工作流
 * POST /api/workflows/ai-one-shot
 */
export async function aiOneShot(body = {}) {
  const payload = {
    brief: String(body.brief || "").trim(),
    title: String(body.title || "").trim(),
    fromDepartment: String(body.fromDepartment || "").trim(),
    fromLevel: Number.isFinite(Number(body.fromLevel)) ? Number(body.fromLevel) : 0,
    toLevel: Number.isFinite(Number(body.toLevel)) ? Number(body.toLevel) : 1,
    maxTasks: Number.isFinite(Number(body.maxTasks)) ? Number(body.maxTasks) : 6,
  };
  if (!payload.brief) throw new Error("brief 不能为空");
  if (!payload.title) delete payload.title;
  if (!payload.fromDepartment) delete payload.fromDepartment;
  const r = await request.post("/api/workflows/ai-one-shot", payload, {
    needAuth: true,
    showError: false,
    header: { "Content-Type": "application/json" },
  });
  return unwrapDataOrThrowBusinessError(r);
}

/**
 * 对已有 workflow 进行 AI 自动拆解
 * POST /api/workflows/{workflowId}/commands/ai-auto
 */
export async function aiAuto(workflowId, body = {}) {
  if (!workflowId) throw new Error("workflowId 不能为空");
  const payload = {
    brief: String(body.brief || "").trim(),
    title: String(body.title || "").trim(),
    fromDepartment: String(body.fromDepartment || "").trim(),
    fromLevel: Number.isFinite(Number(body.fromLevel)) ? Number(body.fromLevel) : 0,
    toLevel: Number.isFinite(Number(body.toLevel)) ? Number(body.toLevel) : 1,
    maxTasks: Number.isFinite(Number(body.maxTasks)) ? Number(body.maxTasks) : 6,
  };
  if (!payload.brief) throw new Error("brief 不能为空");
  if (!payload.title) delete payload.title;
  if (!payload.fromDepartment) delete payload.fromDepartment;
  const r = await request.post(`/api/workflows/${workflowId}/commands/ai-auto`, payload, {
    needAuth: true,
    showError: false,
    header: { "Content-Type": "application/json" },
  });
  return unwrapDataOrThrowBusinessError(r);
}

export async function getWorkflow(workflowId) {
  try {
    const r = await request.get(`/api/workflows/${workflowId}`, {}, { needAuth: true, showError: false });
    return unwrapData(r);
  } catch {
    return null;
  }
}

/** 指令下发（字段名可按 Swagger 在调用处调整） */
export async function postCommand(workflowId, body) {
  const normalizeLevel = (raw, fallback = 0) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(10, Math.floor(n)));
  };
  const normalizeDepartmentId = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    const lc = s.toLowerCase();
    const dict = {
      engineering: "engineering",
      eng: "engineering",
      "工程": "engineering",
      "研发": "engineering",
      product: "product",
      prd: "product",
      "产品": "product",
      pm: "pm",
      "项目": "pm",
      marketing: "marketing",
      mkt: "marketing",
      "市场": "marketing",
      sales: "sales",
      "销售": "sales",
      design: "design",
      "设计": "design",
      qa: "qa",
      test: "qa",
      "测试": "qa",
      support: "support",
      "支援": "support",
      "客服": "support",
      finance: "finance",
      fin: "finance",
      "财务": "finance",
      paid: "paid",
      "付费": "paid",
    };
    if (dict[lc]) return dict[lc];
    const compact = lc.replace(/\s+/g, "");
    if (dict[compact]) return dict[compact];
    for (const [k, v] of Object.entries(dict)) {
      if (s.includes(k) || k.includes(s)) return v;
    }
    return lc;
  };
  const pickUserDepartment = () => {
    const u = getUserInfo() || {};
    const raw =
      u.department ||
      u.departmentId ||
      u.dept ||
      u.deptId ||
      u.team ||
      u.org ||
      u.orgUnit ||
      "";
    return normalizeDepartmentId(raw);
  };
  const text =
    String(
      (body && (body.commandText || body.content || body.body || body.text || body.goal)) || ""
    ).trim();
  const normalizedBody = {
    fromDepartment: (body && (body.fromDepartment || body.sourceDepartment)) || "product",
    // Swagger 示例包含 fromLevel=0，范围按 0~10 兜底
    fromLevel: normalizeLevel(body && (body.fromLevel ?? body.sourceLevel), 0),
    toDepartment: (body && (body.toDepartment || body.targetDepartment)) || "engineering",
    toLevel: normalizeLevel(body && (body.toLevel ?? body.hierarchyLevel), 1),
    commandText: text,
    createTaskTitle:
      (body && body.createTaskTitle) || (text ? text.slice(0, 28) : "新任务"),
    createTaskDescription:
      (body && (body.createTaskDescription || body.content || body.body)) || text,
    dependsOnTaskIds: Array.isArray(body && body.dependsOnTaskIds)
      ? body.dependsOnTaskIds
      : [],
    autoRun:
      body && Object.prototype.hasOwnProperty.call(body, "autoRun")
        ? !!body.autoRun
        : true,
  };
  if (body && body.parentTaskId) {
    normalizedBody.parentTaskId = body.parentTaskId;
  }
  const isNoPermissionFromLevel = (err) => {
    const msg = String(
      (err && (err.message || (err.data && (err.data.message || err.data.msg)))) || ""
    );
    return Number(err && err.statusCode) === 401 && /(无权|forbidden|permission|层级|fromlevel)/i.test(msg);
  };
  const userDept = pickUserDepartment();
  const deptCandidates = [
    normalizeDepartmentId(normalizedBody.fromDepartment),
    userDept,
    "product",
    "pm",
    "engineering",
  ].filter((d, i, arr) => d && arr.indexOf(d) === i);
  const levelCandidates = [normalizedBody.fromLevel, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].filter(
    (n, idx, arr) => arr.indexOf(n) === idx
  );
  const tryWithPath = async (path) => {
    let lastErr = null;
    for (const dept of deptCandidates) {
      for (const lvl of levelCandidates) {
        try {
          const payload = { ...normalizedBody, fromDepartment: dept, fromLevel: lvl };
          if (import.meta.env.MODE === "development") {
            console.log("[postCommand] try", path, {
              workflowId,
              fromDepartment: payload.fromDepartment,
              fromLevel: payload.fromLevel,
              toDepartment: payload.toDepartment,
              toLevel: payload.toLevel,
            });
          }
          const r = await request.post(path, payload, {
            needAuth: true,
            showError: false,
          });
          if (import.meta.env.MODE === "development") {
            console.log("[postCommand] success", path, {
              fromDepartment: payload.fromDepartment,
              fromLevel: payload.fromLevel,
            });
          }
          return unwrapData(r);
        } catch (err) {
          lastErr = err;
          if (import.meta.env.MODE === "development") {
            const msg =
              (err && (err.message || (err.data && (err.data.message || err.data.msg)))) || "";
            console.warn("[postCommand] failed", path, {
              fromDepartment: dept,
              fromLevel: lvl,
              statusCode: err && err.statusCode,
              message: String(msg || ""),
            });
          }
          if (!isNoPermissionFromLevel(err)) break;
        }
      }
    }
    throw lastErr || new Error("post command failed");
  };
  try {
    // Swagger: POST /api/workflows/{workflowId}/commands
    return await tryWithPath(`/api/workflows/${workflowId}/commands`);
  } catch (err) {
    // 仅在新接口不存在时回退旧路径（单数）
    if (Number(err && err.statusCode) === 404) {
      return await tryWithPath(`/api/workflows/${workflowId}/command`);
    }
    throw err;
  }
}

export async function listTasks(workflowId) {
  const r = await request.get(`/api/workflows/${workflowId}/tasks`, {}, { needAuth: true });
  return unwrapList(r);
}

export async function updateTaskProgress(workflowId, taskId, body) {
  const r = await request.post(
    `/api/workflows/${workflowId}/tasks/${taskId}/progress`,
    body,
    { needAuth: true }
  );
  return unwrapData(r);
}

export async function getCollaborationGraph(workflowId) {
  const r = await request.get(`/api/workflows/${workflowId}/collaboration-graph`, {}, { needAuth: true });
  return unwrapData(r);
}

export async function listEvents(workflowId, params = {}) {
  try {
    const nextParams = { limit: 50, ...params };
    const r = await request.get(`/api/workflows/${workflowId}/events`, nextParams, {
      needAuth: true,
      showError: false,
    });
    const d = unwrapData(r);
    if (Array.isArray(d)) return d;
    if (d && typeof d === "object") {
      if (Array.isArray(d.events)) return d.events;
      if (Array.isArray(d.items)) return d.items;
    }
    return unwrapList(r);
  } catch {
    return [];
  }
}

/** SSE 地址（前端可用 EventSource 或小程序插件消费） */
export function getWorkflowEventsStreamUrl(workflowId) {
  if (!workflowId) return "";
  return `/api/workflows/${workflowId}/events/stream`;
}

export async function commsBootstrap(workflowId) {
  try {
    const r = await request.post(`/api/workflows/${workflowId}/comms/bootstrap`, {}, { needAuth: true, showError: false });
    return unwrapData(r);
  } catch {
    return null;
  }
}

export async function listThreads(workflowId, params = {}) {
  const r = await request.get(`/api/workflows/${workflowId}/comms/threads`, params, { needAuth: true });
  return unwrapList(r);
}

export async function createThread(workflowId, body) {
  const r = await request.post(`/api/workflows/${workflowId}/comms/threads`, body, { needAuth: true });
  return unwrapData(r);
}

export async function listMessages(workflowId, threadId, params = {}) {
  const nextParams = { limit: 200, ...params };
  const r = await request.get(
    `/api/workflows/${workflowId}/comms/threads/${threadId}/messages`,
    nextParams,
    { needAuth: true }
  );
  return unwrapList(r);
}

export async function sendMessage(workflowId, threadId, body) {
  const r = await request.post(
    `/api/workflows/${workflowId}/comms/threads/${threadId}/messages`,
    body,
    { needAuth: true }
  );
  return unwrapData(r);
}

export async function linkMessageToTask(workflowId, messageId, body) {
  const r = await request.post(
    `/api/workflows/${workflowId}/comms/messages/${messageId}/link-task`,
    body,
    { needAuth: true }
  );
  return unwrapData(r);
}

export async function broadcastComms(workflowId, body) {
  const r = await request.post(`/api/workflows/${workflowId}/comms/broadcast`, body, { needAuth: true });
  return unwrapData(r);
}

/** 创建项目群 */
export async function createProjectGroup(workflowId, body = {}) {
  const payload = {
    title: String(body.title || "").trim(),
  };
  const r = await request.post(`/api/workflows/${workflowId}/comms/project-groups`, payload, { needAuth: true });
  return unwrapData(r);
}

/** 查询项目群列表 */
export async function listProjectGroups(workflowId) {
  const r = await request.get(`/api/workflows/${workflowId}/comms/project-groups`, {}, { needAuth: true, showError: false });
  return unwrapList(r);
}

/** 项目群成员列表 */
export async function listProjectGroupMembers(workflowId, groupId) {
  const r = await request.get(
    `/api/workflows/${workflowId}/comms/project-groups/${groupId}/members`,
    {},
    { needAuth: true, showError: false }
  );
  return unwrapList(r);
}

/** 向项目群发送消息 */
export async function sendProjectGroupMessage(workflowId, groupId, body = {}) {
  const r = await request.post(
    `/api/workflows/${workflowId}/comms/project-groups/${groupId}/messages`,
    body,
    { needAuth: true }
  );
  return unwrapData(r);
}

/** 查询项目群消息 */
export async function listProjectGroupMessages(workflowId, groupId, params = {}) {
  const nextParams = { limit: 200, ...params };
  const r = await request.get(
    `/api/workflows/${workflowId}/comms/project-groups/${groupId}/messages`,
    nextParams,
    { needAuth: true }
  );
  return unwrapList(r);
}

/** 手动触发自动推进（兜底） */
export async function autoRunTask(workflowId, taskId) {
  const r = await request.post(`/api/workflows/${workflowId}/auto-run/${taskId}`, {}, { needAuth: true });
  return unwrapData(r);
}

/** 删除项目（工作流） */
export async function deleteWorkflow(workflowId) {
  if (!workflowId) throw new Error("workflowId 不能为空");
  const r = await request.delete(`/api/workflows/${workflowId}`, {}, { needAuth: true });
  return unwrapData(r);
}
