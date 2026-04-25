/**
 * 消息列表：仅使用后端真实会话（工作流线程 + 项目群）。
 */
import { listCommsInboxFromApi } from "@/utils/commsInbox";

export async function loadUnifiedConversationList() {
  let remote = [];
  try {
    const rows = await listCommsInboxFromApi();
    remote = rows.map((r) => ({
      id: `wf_${r.workflowId}_${r.threadId}`,
      convType: "workflow",
      title: r.kind === "PROJECT_GROUP" ? r.threadTitle : r.projectName,
      subtitle: r.content || "",
      time: r.time || new Date(0).toISOString(),
      unread: r.read ? 0 : 1,
      navigate: {
        mode: "remote",
        kind: r.kind || "THREAD",
        workflowId: r.workflowId,
        threadId: r.threadId,
        workflowTitle: r.workflowTitle,
        threadTitle: r.threadTitle,
      },
    }));
  } catch {
    remote = [];
  }
  remote.sort((a, b) => new Date(b.time) - new Date(a.time));
  return remote;
}
