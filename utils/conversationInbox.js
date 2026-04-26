/**
 * 消息列表：仅使用前端本地会话（项目群 / 数字员工）。
 */
import {
  loadProjectGroups,
  loadDigitalAgents,
  displayGroupName,
  formatAgentNavTitle,
  translateVirtualLastMsgPreview,
} from "@/utils/virtualTeamStore";

export async function loadUnifiedConversationList() {
  const groupRows = loadProjectGroups().map((g) => ({
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

  const agentRows = loadDigitalAgents().map((a) => ({
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

  const merged = [...groupRows, ...agentRows];
  merged.sort((a, b) => new Date(b.time) - new Date(a.time));
  return merged;
}
