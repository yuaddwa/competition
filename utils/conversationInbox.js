/**
 * 消息列表：工作流远程会话 + 本地项目群/数字员工 + 旧版本地演示会话
 */
import { listCommsInboxFromApi } from "@/utils/commsInbox";
import {
  loadProjectGroups,
  loadDigitalAgents,
  displayGroupName,
  formatAgentNavTitle,
  translateVirtualLastMsgPreview,
} from "@/utils/virtualTeamStore";
import { groupMessagesByProject, loadMessages } from "@/utils/messageUtils";

export async function loadUnifiedConversationList() {
  const virtualGroups = loadProjectGroups().map((g) => ({
    id: `vgroup_${g.id}`,
    convType: "vgroup",
    title: displayGroupName(g),
    subtitle: translateVirtualLastMsgPreview(g.lastMsg || ""),
    time: g.lastTime || new Date(0).toISOString(),
    unread: Number(g.unread) || 0,
    navigate: {
      mode: "virtual",
      kind: "group",
      id: g.id,
      title: displayGroupName(g),
    },
  }));

  const virtualAgents = loadDigitalAgents().map((a) => ({
    id: `vagent_${a.id}`,
    convType: "vagent",
    title: formatAgentNavTitle(a),
    subtitle: translateVirtualLastMsgPreview(a.lastMsg || ""),
    time: a.lastTime || new Date(0).toISOString(),
    unread: Number(a.unread) || 0,
    navigate: {
      mode: "virtual",
      kind: "agent",
      id: a.id,
      title: formatAgentNavTitle(a),
    },
  }));

  let remote = [];
  try {
    const rows = await listCommsInboxFromApi();
    remote = rows.map((r) => ({
      id: `wf_${r.workflowId}_${r.threadId}`,
      convType: "workflow",
      title: r.projectName,
      subtitle: r.content || "",
      time: r.time || new Date(0).toISOString(),
      unread: r.read ? 0 : 1,
      navigate: {
        mode: "remote",
        workflowId: r.workflowId,
        threadId: r.threadId,
        workflowTitle: r.workflowTitle,
        threadTitle: r.threadTitle,
      },
    }));
  } catch {
    remote = [];
  }

  const legacy = loadMessages();
  const grouped = groupMessagesByProject(legacy);
  const localRows = grouped.map((g) => ({
    id: `local_${g.projectName}`,
    convType: "local",
    title: g.projectName,
    subtitle: g.latestMessage ? g.latestMessage.content : "",
    time: g.latestMessage ? g.latestMessage.time : new Date(0).toISOString(),
    unread: g.unread || 0,
    navigate: { mode: "local", projectName: g.projectName },
  }));

  const merged = [...remote, ...virtualGroups, ...virtualAgents, ...localRows];
  merged.sort((a, b) => new Date(b.time) - new Date(a.time));
  return merged;
}
