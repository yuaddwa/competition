/**
 * 本地「项目群」「数字员工」及会话摘要（后续可对接后端）
 */
const K_GROUPS = "virtualProjectGroups";
const K_AGENTS = "virtualDigitalAgents";
const K_MSG_PREFIX = "virtualChat_";
const K_INIT = "virtualTeamInited";
const K_HALL_DIGEST_DAY = "hall_digest_calendar_day";
/** 全员大群：老板 + 全体数字员工，日报与经理总览发在此 */
export const HQ_KIND = "hq";
export const HQ_ID = "company_hall";

/** 消息列表「经理总览」对应的独立会话（与弹窗同源，微信式点进聊天页） */
export const MANAGER_KIND = "manager";
export const MANAGER_ID = "manager_digest";
const K_MANAGER_UNREAD = "manager_feed_unread";

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try {
    const v = typeof json === "string" ? JSON.parse(json) : json;
    return v != null ? v : fallback;
  } catch {
    return fallback;
  }
}

function seedIfNeeded() {
  if (uni.getStorageSync(K_INIT)) return;
  const groups = [
    {
      id: "g_demo_1",
      name: "示例 · 商城小程序项目群",
      desc: "客户 A 交付群",
      createdAt: nowIso(),
      lastMsg: "项目经理：本周联调窗口已对齐",
      lastTime: nowIso(),
      unread: 1,
    },
  ];
  const agents = [
    {
      id: "a_demo_1",
      name: "陈经理",
      role: "项目经理",
      createdAt: nowIso(),
      lastMsg: "明日站会提前到 10:00",
      lastTime: nowIso(),
      unread: 0,
    },
    {
      id: "a_demo_2",
      name: "小艾",
      role: "前端",
      createdAt: nowIso(),
      lastMsg: "首页骨架屏已提交",
      lastTime: nowIso(),
      unread: 2,
    },
    {
      id: "a_demo_3",
      name: "阿强",
      role: "后端",
      createdAt: nowIso(),
      lastMsg: "订单接口 Swagger 已更新",
      lastTime: nowIso(),
      unread: 0,
    },
  ];
  uni.setStorageSync(K_GROUPS, JSON.stringify(groups));
  uni.setStorageSync(K_AGENTS, JSON.stringify(agents));
  uni.setStorageSync(K_INIT, "1");
}

export function loadProjectGroups() {
  seedIfNeeded();
  return safeParse(uni.getStorageSync(K_GROUPS), []);
}

export function loadDigitalAgents() {
  seedIfNeeded();
  return safeParse(uni.getStorageSync(K_AGENTS), []);
}

function saveGroups(list) {
  uni.setStorageSync(K_GROUPS, JSON.stringify(list));
}

function saveAgents(list) {
  uni.setStorageSync(K_AGENTS, JSON.stringify(list));
}

export function addProjectGroup(payload = {}) {
  const {
    name,
    desc = "",
    clientName = "",
    deliverable = "",
    deadline = "",
    notifyTime = "21:00",
  } = payload;
  const list = loadProjectGroups();
  const id = `g_${Date.now()}`;
  const row = {
    id,
    name: (name || "未命名项目群").trim(),
    desc: (desc || "").trim(),
    clientName: (clientName || "").trim(),
    deliverable: (deliverable || "").trim(),
    deadline: (deadline || "").trim(),
    notifyTime: (notifyTime || "21:00").trim(),
    createdAt: nowIso(),
    lastMsg: "群已创建，开始协作吧",
    lastTime: nowIso(),
    unread: 0,
  };
  list.unshift(row);
  saveGroups(list);
  return row;
}

export function addDigitalAgent(payload = {}) {
  const {
    name,
    role = "成员",
    gender = "保密",
    personality = "",
    hobbies = "",
    experience = "",
    replyStyle = "详细",
    remark = "",
  } = payload;
  const list = loadDigitalAgents();
  const id = `a_${Date.now()}`;
  const row = {
    id,
    name: (name || "数字员工").trim(),
    role: (role || "成员").trim(),
    gender: (gender || "保密").trim(),
    personality: (personality || "").trim(),
    hobbies: (hobbies || "").trim(),
    experience: (experience || "").trim(),
    replyStyle: (replyStyle || "详细").trim(),
    remark: (remark || "").trim(),
    createdAt: nowIso(),
    lastMsg: "已就绪，随时听候安排",
    lastTime: nowIso(),
    unread: 0,
  };
  list.unshift(row);
  saveAgents(list);
  return row;
}

function truncateText(s, max) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function managerFeedSubtitle() {
  seedIfNeeded();
  const list = loadVirtualChatMessages(MANAGER_KIND, MANAGER_ID);
  if (list.length > 0) {
    const last = list[list.length - 1];
    const preview = last.isMine
      ? `我：${last.content}`
      : last.senderName
        ? `${last.senderName}：${last.content}`
        : last.content;
    return truncateText(preview, 72);
  }
  const b = getDailyBriefing();
  return truncateText(b.managerSummary, 72);
}

/** 消息列表「经理总览」未读角标（进入聊天页后清零） */
export function getManagerFeedUnread() {
  const v = uni.getStorageSync(K_MANAGER_UNREAD);
  if (v === undefined || v === null || v === "") return 1;
  return Number(v) || 0;
}

export function clearManagerFeedUnread() {
  uni.setStorageSync(K_MANAGER_UNREAD, "0");
}

/**
 * 消息页微信式列表：经理总览置顶 → 各员工日报行 → 各项目群
 */
export function buildMessageFeedRows() {
  seedIfNeeded();
  const b = getDailyBriefing();
  const groups = loadProjectGroups();
  const rows = [];

  rows.push({
    id: "home_manager",
    rowKind: "manager",
    title: "经理总览",
    subtitle: managerFeedSubtitle(),
    time: b.managerTime,
    unread: getManagerFeedUnread(),
    badge: "主读",
  });

  for (const line of b.employeeLines) {
    rows.push({
      id: `daily_${line.id}`,
      rowKind: "daily_agent",
      agentId: line.id,
      title: `${line.name} · ${line.role}`,
      subtitle: truncateText(line.summary, 80),
      time: line.time,
      unread: 0,
    });
  }

  for (const g of groups) {
    rows.push({
      id: `g_${g.id}`,
      rowKind: "group",
      groupId: g.id,
      title: g.name,
      subtitle: truncateText(g.lastMsg || "", 80),
      time: g.lastTime || nowIso(),
      unread: Number(g.unread) || 0,
    });
  }

  return rows;
}

/** @deprecated 使用 buildMessageFeedRows */
export function buildHomeFeedRows() {
  return buildMessageFeedRows();
}

export function loadHQChatMessages() {
  return loadVirtualChatMessages(HQ_KIND, HQ_ID);
}

export function appendHQMessage({ content, isMine = false, senderName = "", isManager = false }) {
  const list = loadVirtualChatMessages(HQ_KIND, HQ_ID);
  const msg = {
    id: `hq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content,
    time: nowIso(),
    isMine,
    senderName: senderName || (isMine ? "我" : ""),
    isManager: !!isManager,
  };
  list.push(msg);
  saveVirtualChatMessages(HQ_KIND, HQ_ID, list);
  return msg;
}

/** 首次进入全员群：欢迎语 */
export function ensureHallWelcome() {
  seedIfNeeded();
  const list = loadHQChatMessages();
  if (list.length > 0) return;
  appendHQMessage({
    content:
      "欢迎加入【公司全员群】。每日 21:00 各数字员工在此提交日报，21:30 经理推送总览。您可随时 @ 员工安排工作。",
    isMine: false,
    senderName: "系统",
  });
}

/** 每个自然日注入一次：员工日报 + 经理总览（与消息列表摘要同源） */
export function ensureHallDailyDigest() {
  seedIfNeeded();
  const today = new Date().toDateString();
  const last = uni.getStorageSync(K_HALL_DIGEST_DAY);
  if (last === today) return;

  const b = getDailyBriefing();
  appendHQMessage({
    content: "—— 今日 21:00 日报开始 ——",
    isMine: false,
    senderName: "系统",
  });

  for (const line of b.employeeLines) {
    appendHQMessage({
      content: `【日报】${line.summary}`,
      isMine: false,
      senderName: `${line.name}（${line.role}）`,
    });
  }

  appendHQMessage({
    content: `【经理总览】${b.managerSummary}`,
    isMine: false,
    senderName: "经理总览",
    isManager: true,
  });

  uni.setStorageSync(K_HALL_DIGEST_DAY, today);
}

/** 进入 1 对 1 员工聊天时，若无记录则写入可读的对话气泡 */
export function ensureAgentChatSeed(agentId) {
  if (!agentId) return;
  if (uni.getStorageSync(`${K_AGENT_CLEARED}${agentId}`)) return;
  const list = loadVirtualChatMessages("agent", agentId);
  if (list.length > 0) return;
  const agents = loadDigitalAgents();
  const a = agents.find((x) => x.id === agentId);
  const name = a ? a.name : "员工";
  const role = a ? a.role : "";
  const line = getDailyBriefing().employeeLines.find((x) => x.id === agentId);
  const summary = line ? line.summary : `【${role || "岗位"}】已就绪，听候安排。`;

  appendVirtualChat("agent", agentId, {
    content: `你好，我是${name}（${role}）。下面是我的今日日报摘要。\n${summary}`,
    isMine: false,
    senderName: name,
  });
}

export function touchGroupLastMsg(id, lastMsg) {
  const list = loadProjectGroups();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  list[i].lastMsg = lastMsg;
  list[i].lastTime = nowIso();
  saveGroups(list);
}

export function touchAgentLastMsg(id, lastMsg) {
  const list = loadDigitalAgents();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  list[i].lastMsg = lastMsg;
  list[i].lastTime = nowIso();
  saveAgents(list);
}

export function clearGroupUnread(id) {
  const list = loadProjectGroups();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  list[i].unread = 0;
  saveGroups(list);
}

export function clearAgentUnread(id) {
  const list = loadDigitalAgents();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  list[i].unread = 0;
  saveAgents(list);
}

function chatKey(kind, id) {
  return `${K_MSG_PREFIX}${kind}_${id}`;
}

/** 清空某虚拟会话的本地消息（项目群 / 数字员工 / hq） */
export function clearVirtualChatMessages(kind, id) {
  try {
    uni.removeStorageSync(chatKey(kind, id));
  } catch (e) {
    console.warn("[virtualTeamStore] clearVirtualChatMessages", e);
  }
}

export function getProjectGroupById(id) {
  if (!id) return null;
  return loadProjectGroups().find((x) => x.id === id) || null;
}

export function getDigitalAgentById(id) {
  if (!id) return null;
  return loadDigitalAgents().find((x) => x.id === id) || null;
}

export function clearHQChatMessages() {
  clearVirtualChatMessages(HQ_KIND, HQ_ID);
}

const K_AGENT_CLEARED = "virtualAgent_cleared_";

export function markAgentChatCleared(agentId) {
  if (!agentId) return;
  uni.setStorageSync(`${K_AGENT_CLEARED}${agentId}`, "1");
}

export function clearAgentChatClearedFlag(agentId) {
  if (!agentId) return;
  try {
    uni.removeStorageSync(`${K_AGENT_CLEARED}${agentId}`);
  } catch (e) {
    console.warn(e);
  }
}

export function loadVirtualChatMessages(kind, id) {
  const key = chatKey(kind, id);
  const raw = uni.getStorageSync(key);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveVirtualChatMessages(kind, id, messages) {
  uni.setStorageSync(chatKey(kind, id), JSON.stringify(messages));
}

function recomputeVirtualChatLastPreview(kind, id) {
  const list = loadVirtualChatMessages(kind, id);
  const last = list[list.length - 1];
  if (!last) {
    if (kind === "group") touchGroupLastMsg(id, "暂无消息");
    if (kind === "agent") touchAgentLastMsg(id, "暂无消息");
    return;
  }
  const preview = last.isMine
    ? `我：${last.content}`
    : last.senderName
      ? `${last.senderName}：${last.content}`
      : last.content;
  if (kind === "group") touchGroupLastMsg(id, preview);
  if (kind === "agent") touchAgentLastMsg(id, preview);
}

/** 撤回 / 删除单条虚拟会话消息 */
export function removeVirtualChatMessage(kind, id, messageId) {
  const list = loadVirtualChatMessages(kind, id).filter((m) => m.id !== messageId);
  saveVirtualChatMessages(kind, id, list);
  recomputeVirtualChatLastPreview(kind, id);
}

/** 批量删除（多选） */
export function removeVirtualChatMessagesByIds(kind, id, messageIds) {
  const set = new Set(messageIds);
  const list = loadVirtualChatMessages(kind, id).filter((m) => !set.has(m.id));
  saveVirtualChatMessages(kind, id, list);
  recomputeVirtualChatLastPreview(kind, id);
}

export function appendVirtualChat(kind, id, { content, isMine = true, senderName = "" }) {
  const list = loadVirtualChatMessages(kind, id);
  const msg = {
    id: `vm_${Date.now()}`,
    content,
    time: nowIso(),
    isMine,
    senderName: senderName || "",
  };
  list.push(msg);
  saveVirtualChatMessages(kind, id, list);
  if (kind === "agent" && isMine) clearAgentChatClearedFlag(id);
  const preview = isMine ? `我：${content}` : senderName ? `${senderName}：${content}` : content;
  if (kind === "group") touchGroupLastMsg(id, preview);
  if (kind === "agent") touchAgentLastMsg(id, preview);
  return msg;
}

/** 经理总览独立会话：无记录时写入与列表摘要同源的说明 + 总览气泡 */
export function ensureManagerChatSeed() {
  seedIfNeeded();
  const list = loadVirtualChatMessages(MANAGER_KIND, MANAGER_ID);
  if (list.length > 0) return;
  const b = getDailyBriefing();
  appendVirtualChat(MANAGER_KIND, MANAGER_ID, {
    content: b.scheduleNote,
    isMine: false,
    senderName: "系统",
  });
  appendVirtualChat(MANAGER_KIND, MANAGER_ID, {
    content: b.managerSummary,
    isMine: false,
    senderName: "经理总览",
  });
}

/** 首页：经理总结 + 各员工日报（演示数据，可替换为定时任务写入） */
export function getDailyBriefing() {
  seedIfNeeded();
  const agents = loadDigitalAgents();
  const scheduleNote = "每日 21:00 各员工自动提交日报，21:30 经理生成总览";
  const employeeLines = agents.slice(0, 8).map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    summary: `【${a.role}】今日完成例行推进；风险：无阻塞；明日：继续当前迭代。`,
    time: "今日 21:00",
  }));
  const managerSummary = `【经理总览】今日整体进度正常。重点：客户侧验收清单已对齐；明日优先联调支付链路。${scheduleNote}`;
  return {
    scheduleNote,
    managerSummary,
    managerTime: "今日 21:30",
    employeeLines,
  };
}
