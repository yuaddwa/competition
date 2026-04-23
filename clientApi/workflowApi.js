import request from "@/utils/request";
import { unwrapData, unwrapList } from "@/utils/apiHelpers";

export async function listWorkflows() {
  const r = await request.get("/api/workflows", {}, { needAuth: true, showError: false });
  return unwrapList(r);
}

export async function createWorkflow(payload) {
  const r = await request.post("/api/workflows", payload, { needAuth: true });
  return unwrapData(r);
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
  try {
    const r = await request.post(`/api/workflows/${workflowId}/command`, body, { needAuth: true });
    return unwrapData(r);
  } catch (err) {
    // 兼容旧后端路径
    const r = await request.post(`/api/workflows/${workflowId}/commands`, body, {
      needAuth: true,
      showError: false,
    });
    return unwrapData(r);
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
