/**
 * 将「消息」Tab 与工作流 comms（threads + messages）对齐：登录后从 API 聚合会话列表。
 */
import * as workflowApi from "@/api/workflowApi";
import { getToken } from "@/utils/index";
import { pickId } from "@/utils/apiHelpers";

const READ_PREFIX = "commsRead_";

function messageBody(m) {
  if (!m || typeof m !== "object") return "";
  return m.body || m.content || m.text || "";
}

function messageTime(m) {
  if (!m || typeof m !== "object") return "";
  return m.createdAt || m.time || m.timestamp || "";
}

function messageSortKey(m) {
  const t = messageTime(m);
  const d = t ? new Date(t).getTime() : 0;
  return Number.isFinite(d) ? d : 0;
}

/**
 * @returns {Promise<Array<{ projectName: string; workflowId: string; threadId: string; workflowTitle: string; threadTitle: string; title: string; content: string; time: string; read: boolean; id: string; sender: string; remote: boolean }>>}
 */
export async function listCommsInboxFromApi(options = {}) {
  const { maxWorkflows = 20, maxThreads = 40 } = options;
  if (!getToken()) return [];

  const workflows = await workflowApi.listWorkflows();
  const wfList = Array.isArray(workflows) ? workflows : [];
  const sliced = wfList.slice(0, maxWorkflows);

  const threadRows = [];
  for (const w of sliced) {
    const wid = pickId(w) || w.workflowId;
    if (!wid) continue;
    const wtitle = w.title || w.name || "工作流";
    let threads = [];
    try {
      await workflowApi.commsBootstrap(wid);
      const list = await workflowApi.listThreads(wid);
      threads = Array.isArray(list) ? list : [];
    } catch {
      threads = [];
    }
    for (const th of threads) {
      const tid = pickId(th) || th.threadId;
      if (!tid) continue;
      threadRows.push({
        workflowId: wid,
        workflowTitle: wtitle,
        threadId: tid,
        threadTitle: th.title || th.name || th.topic || "线程",
      });
    }
  }

  const limited = threadRows.slice(0, maxThreads);
  const results = await Promise.all(
    limited.map(async (r) => {
      const base = {
        projectName: `${r.workflowTitle} · ${r.threadTitle}`,
        workflowId: r.workflowId,
        threadId: r.threadId,
        workflowTitle: r.workflowTitle,
        threadTitle: r.threadTitle,
        title: r.threadTitle,
        remote: true,
        sender: "remote",
      };
      try {
        const msgs = await workflowApi.listMessages(r.workflowId, r.threadId);
        const arr = Array.isArray(msgs) ? msgs : [];
        const sorted = [...arr].sort((a, b) => messageSortKey(a) - messageSortKey(b));
        const last = sorted.length ? sorted[sorted.length - 1] : null;
        const body = last ? messageBody(last) : "";
        const time = last ? messageTime(last) : "";
        const mid = last ? pickId(last) || last.messageId || "" : "";
        const tIso = time || new Date(0).toISOString();
        return {
          ...base,
          content: body || "（暂无消息）",
          time: tIso,
          read: isThreadRead(r.workflowId, r.threadId, tIso),
          id: mid || `remote-${r.workflowId}-${r.threadId}`,
        };
      } catch {
        return {
          ...base,
          content: "（加载失败）",
          time: new Date(0).toISOString(),
          read: true,
          id: `remote-${r.workflowId}-${r.threadId}`,
        };
      }
    }),
  );

  return results.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function isThreadRead(workflowId, threadId, latestIso) {
  const key = `${READ_PREFIX}${workflowId}_${threadId}`;
  const lastRead = uni.getStorageSync(key) || "";
  if (!latestIso) return true;
  return String(lastRead) >= String(latestIso);
}

/** 进入会话或发送后调用，标记已读到指定时间 */
export function markCommsThreadRead(workflowId, threadId, atIso) {
  const t = atIso || new Date().toISOString();
  uni.setStorageSync(`${READ_PREFIX}${workflowId}_${threadId}`, t);
}
