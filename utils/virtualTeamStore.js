/**
 * 本地「项目群」「数字员工」及会话摘要（后续可对接后端）
 */
import { t, getLanguage } from "./lang.js";

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

/** 演示数据 id → 语言包键（名称与简介） */
const DEMO_GROUP_KEYS = {
  g_demo_1: { nameKey: "vt_demo_group_mall_name", descKey: "vt_demo_group_mall_desc" },
};
const DEMO_AGENT_KEYS = {
  a_demo_1: { nameKey: "vt_demo_agent_chen_name", roleKey: "role_title_pm" },
  a_demo_2: { nameKey: "vt_demo_agent_xiao_name", roleKey: "role_title_frontend" },
  a_demo_3: { nameKey: "vt_demo_agent_qiang_name", roleKey: "role_title_backend" },
};

const UNNAMED_GROUP_ZH = "未命名项目群";
const DEFAULT_AGENT_NAME_ZH = "数字员工";
const DEFAULT_MEMBER_ZH = "成员";

/** 全员群气泡旁展示名：中/英历史值 → 语言包键 */
const HALL_SENDER_ZH_TO_KEY = {
  系统: "sender_system_name",
  经理总览: "manager_overview_title",
  "陈经理（项目经理）": "vt_hall_sender_1",
  "小艾（前端）": "vt_hall_sender_2",
  "阿强（后端）": "vt_hall_sender_3",
};
const HALL_SENDER_EN_TO_KEY = {
  "Chen (Project Manager)": "vt_hall_sender_1",
  "Aria (Frontend)": "vt_hall_sender_2",
  "Qiang (Backend)": "vt_hall_sender_3",
};

export function displayGroupName(g) {
  if (!g) return "";
  const lang = getLanguage();
  const demo = DEMO_GROUP_KEYS[g.id];
  if (demo && demo.nameKey) {
    const tr = t(demo.nameKey, lang);
    if (tr !== demo.nameKey) return tr;
  }
  const raw = (g.name || "").trim();
  if (raw === UNNAMED_GROUP_ZH) return t("vt_unnamed_group", lang);
  return g.name || "";
}

export function displayGroupDesc(g) {
  if (!g) return "";
  const lang = getLanguage();
  const demo = DEMO_GROUP_KEYS[g.id];
  if (demo && demo.descKey) {
    const tr = t(demo.descKey, lang);
    if (tr !== demo.descKey) return tr;
  }
  return g.desc || "";
}

export function displayAgentName(a) {
  if (!a) return "";
  const lang = getLanguage();
  const demo = DEMO_AGENT_KEYS[a.id];
  if (demo && demo.nameKey) {
    const tr = t(demo.nameKey, lang);
    if (tr !== demo.nameKey) return tr;
  }
  const raw = (a.name || "").trim();
  if (raw === DEFAULT_AGENT_NAME_ZH) return t("vt_default_agent_name", lang);
  return a.name || "";
}

export function displayAgentRole(a) {
  if (!a) return "";
  const lang = getLanguage();
  const demo = DEMO_AGENT_KEYS[a.id];
  if (demo && demo.roleKey) {
    const tr = t(demo.roleKey, lang);
    if (tr !== demo.roleKey) return tr;
  }
  const raw = (a.role || "").trim();
  if (raw === DEFAULT_MEMBER_ZH) return t("vt_member_default", lang);
  return a.role || "";
}

export function formatAgentNavTitle(a) {
  if (!a) return "";
  const lang = getLanguage();
  const name = displayAgentName(a);
  const role = displayAgentRole(a);
  if (!role) return name;
  if (lang === "en") return `${name} (${role})`;
  return `${name}（${role}）`;
}

/** 会话列表副标题：系统占位与「我：」前缀随语言切换 */
export function translateVirtualLastMsgPreview(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  const lang = getLanguage();
  if (s === "暂无消息") return t("chat_no_messages", lang);
  if (s === "群已创建，开始协作吧") return t("vt_group_created_toast", lang);
  if (s === "已就绪，随时听候安排") return t("vt_agent_ready_hint", lang);
  if (s === t("vt_demo_group_last_preview", "zh") || s === t("vt_demo_group_last_preview", "en")) {
    return t("vt_demo_group_last_preview", lang);
  }
  if (s === t("vt_demo_agent1_last_preview", "zh") || s === t("vt_demo_agent1_last_preview", "en")) {
    return t("vt_demo_agent1_last_preview", lang);
  }
  if (s === t("vt_demo_agent2_last_preview", "zh") || s === t("vt_demo_agent2_last_preview", "en")) {
    return t("vt_demo_agent2_last_preview", lang);
  }
  if (s === t("vt_demo_agent3_last_preview", "zh") || s === t("vt_demo_agent3_last_preview", "en")) {
    return t("vt_demo_agent3_last_preview", lang);
  }
  const meZh = "我：";
  const meEn = "Me: ";
  if (s.startsWith(meZh)) {
    const me = t("vt_preview_me_prefix", lang);
    return me + s.slice(meZh.length);
  }
  if (s.startsWith(meEn)) {
    const me = t("vt_preview_me_prefix", lang);
    return me + s.slice(meEn.length);
  }
  return text;
}

/** 首页全员群：发送者展示名（兼容已写入的中/英文） */
export function resolveHallSenderDisplay(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lang = getLanguage();
  if (s === t("manager_overview_title", "zh") || s === t("manager_overview_title", "en")) {
    return t("manager_overview_title", lang);
  }
  if (s === t("sender_system_name", "zh") || s === t("sender_system_name", "en")) {
    return t("sender_system_name", lang);
  }
  const key = HALL_SENDER_ZH_TO_KEY[s] || HALL_SENDER_EN_TO_KEY[s];
  if (key) {
    const tr = t(key, lang);
    if (tr !== key) return tr;
  }
  return raw;
}

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
  const groups = [];
  const agents = [];
  uni.setStorageSync(K_GROUPS, JSON.stringify(groups));
  uni.setStorageSync(K_AGENTS, JSON.stringify(agents));
  uni.setStorageSync(K_INIT, "1");
}

function removeDemoRows(list = [], prefix = "") {
  const arr = Array.isArray(list) ? list : [];
  const cleaned = arr.filter((x) => !String(x?.id || "").startsWith(prefix));
  return cleaned;
}

export function loadProjectGroups() {
  seedIfNeeded();
  const list = safeParse(uni.getStorageSync(K_GROUPS), []);
  const cleaned = removeDemoRows(list, "g_demo_");
  if ((Array.isArray(list) ? list.length : 0) !== cleaned.length) saveGroups(cleaned);
  return cleaned;
}

export function loadDigitalAgents() {
  seedIfNeeded();
  const list = safeParse(uni.getStorageSync(K_AGENTS), []);
  const cleaned = removeDemoRows(list, "a_demo_");
  if ((Array.isArray(list) ? list.length : 0) !== cleaned.length) saveAgents(cleaned);
  return cleaned;
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
    members = [],
  } = payload;
  const list = loadProjectGroups();
  const id = `g_${Date.now()}`;
  const safeMembers = (Array.isArray(members) ? members : [])
    .map((m) => ({
      id: String(m?.id || m?.agentId || "").trim(),
      name: String(m?.name || m?.displayName || "").trim(),
      role: String(m?.role || m?.jobTitle || "").trim(),
      department: String(m?.department || "").trim(),
      avatar: String(m?.avatar || m?.avatarUrl || m?.headImg || m?.headimg || "").trim(),
      model: String(m?.model || "").trim(),
      isAdmin: !!m?.isAdmin,
    }))
    .filter((m) => m.id && m.name);
  const row = {
    id,
    name: (name || t("vt_unnamed_group", getLanguage())).trim(),
    desc: (desc || "").trim(),
    clientName: (clientName || "").trim(),
    deliverable: (deliverable || "").trim(),
    deadline: (deadline || "").trim(),
    notifyTime: (notifyTime || "21:00").trim(),
    createdAt: nowIso(),
    lastMsg: t("vt_group_created_toast", getLanguage()),
    lastTime: nowIso(),
    unread: 0,
    ownerAgentId: safeMembers[0] ? String(safeMembers[0].id).trim() : "",
    members: safeMembers,
  };
  list.unshift(row);
  saveGroups(list);
  return row;
}

/** 向已有项目群追加成员（按 id 去重）；返回真正新加入的成员列表 */
export function addMembersToProjectGroup(groupId, newMembers = []) {
  if (!groupId) return { ok: false, added: [], group: null };
  const list = loadProjectGroups();
  const i = list.findIndex((x) => x.id === groupId);
  if (i < 0) return { ok: false, added: [], group: null };
  const cur = Array.isArray(list[i].members) ? [...list[i].members] : [];
  const seen = new Set(
    cur.map((m) => String(m?.id || m?.agentId || "").trim()).filter(Boolean)
  );
  const normalized = (Array.isArray(newMembers) ? newMembers : [])
    .map((m) => ({
      id: String(m?.id || m?.agentId || "").trim(),
      name: String(m?.name || m?.displayName || "").trim(),
      role: String(m?.role || m?.jobTitle || "").trim(),
      department: String(m?.department || "").trim(),
      avatar: String(m?.avatar || m?.avatarUrl || m?.headImg || m?.headimg || "").trim(),
      model: String(m?.model || "").trim(),
      isAdmin: !!m?.isAdmin,
    }))
    .filter((m) => m.id && m.name);
  const added = [];
  for (const m of normalized) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    cur.push(m);
    added.push(m);
  }
  if (added.length === 0) {
    return { ok: true, added: [], group: { ...list[i], members: cur } };
  }
  list[i].members = cur;
  saveGroups(list);
  return { ok: true, added, group: list[i] };
}

function normalizeAgentGender(g) {
  const s = String(g || "").trim();
  const legacy = { 保密: "unspecified", 男: "male", 女: "female" };
  if (legacy[s]) return legacy[s];
  if (["unspecified", "male", "female"].includes(s)) return s;
  return "unspecified";
}

function normalizeAgentReplyStyle(r) {
  const s = String(r || "").trim();
  const legacy = { 简洁: "brief", 详细: "detailed", 先说结论再展开: "bluf_first" };
  if (legacy[s]) return legacy[s];
  if (["brief", "detailed", "bluf_first"].includes(s)) return s;
  return "detailed";
}

export function addDigitalAgent(payload = {}) {
  const lang = getLanguage();
  const {
    name,
    role,
    gender,
    personality = "",
    hobbies = "",
    experience = "",
    replyStyle,
    remark = "",
  } = payload;
  const list = loadDigitalAgents();
  const id = `a_${Date.now()}`;
  const row = {
    id,
    name: (name || t("vt_default_agent_name", lang)).trim(),
    role: (role || t("vt_member_default", lang)).trim(),
    gender: normalizeAgentGender(gender),
    personality: (personality || "").trim(),
    hobbies: (hobbies || "").trim(),
    experience: (experience || "").trim(),
    replyStyle: normalizeAgentReplyStyle(replyStyle),
    remark: (remark || "").trim(),
    createdAt: nowIso(),
    lastMsg: t("vt_agent_ready_hint", lang),
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
  const lang = getLanguage();
  const b = getDailyBriefing();
  const groups = loadProjectGroups();
  const rows = [];

  rows.push({
    id: "home_manager",
    rowKind: "manager",
    title: t("manager_overview_title", lang),
    subtitle: managerFeedSubtitle(),
    time: b.managerTime,
    unread: getManagerFeedUnread(),
    badge: t("feed_badge_must_read", lang),
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
      title: displayGroupName(g),
      subtitle: truncateText(translateVirtualLastMsgPreview(g.lastMsg || ""), 80),
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
  const lang = getLanguage();
  const msg = {
    id: `hq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content,
    time: nowIso(),
    isMine,
    senderName: senderName || (isMine ? t("home_sender_me", lang) : ""),
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
  const lang = getLanguage();
  appendHQMessage({
    content: t("hall_welcome_body", lang),
    isMine: false,
    senderName: t("sender_system_name", lang),
  });
}

/** 每个自然日注入一次：员工日报 + 经理总览（与消息列表摘要同源） */
export function ensureHallDailyDigest() {
  seedIfNeeded();
  const today = new Date().toDateString();
  const last = uni.getStorageSync(K_HALL_DIGEST_DAY);
  if (last === today) return;

  const lang = getLanguage();
  const b = getDailyBriefing();
  appendHQMessage({
    content: t("hall_digest_start", lang),
    isMine: false,
    senderName: t("sender_system_name", lang),
  });

  const agents = loadDigitalAgents();
  for (const line of b.employeeLines) {
    const agent = agents.find((x) => x.id === line.id);
    appendHQMessage({
      content: `${t("hall_daily_prefix", lang)}${line.summary}`,
      isMine: false,
      senderName: agent ? formatAgentNavTitle(agent) : formatAgentNavTitle({ id: line.id, name: line.name, role: line.role }),
    });
  }

  appendHQMessage({
    content: b.managerSummary,
    isMine: false,
    senderName: t("manager_overview_title", lang),
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
  const lang = getLanguage();
  const agents = loadDigitalAgents();
  const a = agents.find((x) => x.id === agentId);
  const name = a ? displayAgentName(a) : t("vt_default_agent_name", lang);
  const role = a ? displayAgentRole(a) : "";
  const line = getDailyBriefing().employeeLines.find((x) => x.id === agentId);
  const roleDisp = role || t("agent_seed_role_fallback", lang);
  const summary = line
    ? line.summary
    : t("agent_seed_ready_line", lang, { role: roleDisp });

  appendVirtualChat("agent", agentId, {
    content: t("agent_chat_seed_body", lang, { name, role: roleDisp, summary }),
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

export function deleteProjectGroupById(id) {
  if (!id) return false;
  const list = loadProjectGroups();
  const next = list.filter((x) => x.id !== id);
  if (next.length === list.length) return false;
  saveGroups(next);
  clearVirtualChatMessages("group", id);
  return true;
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

/** 群主 id：显式 ownerAgentId，否则默认首位成员（兼容旧数据） */
export function resolveGroupOwnerAgentId(g) {
  if (!g || typeof g !== "object") return "";
  const o = String(g.ownerAgentId || "").trim();
  if (o) return o;
  const m0 = Array.isArray(g.members) && g.members[0] ? String(g.members[0].id || g.members[0].agentId || "").trim() : "";
  return m0 || "";
}

export function getProjectGroupById(id) {
  if (id == null || id === "") return null;
  const needle = String(id).trim();
  if (!needle) return null;
  const list = loadProjectGroups();
  const i = list.findIndex((x) => String(x?.id ?? "").trim() === needle);
  if (i < 0) return null;
  const g = list[i];
  let dirty = false;
  if (!String(g.ownerAgentId || "").trim()) {
    const m0 = Array.isArray(g.members) && g.members[0] ? String(g.members[0].id || g.members[0].agentId || "").trim() : "";
    if (m0) {
      g.ownerAgentId = m0;
      dirty = true;
    }
  }
  if (Array.isArray(g.members)) {
    for (let k = 0; k < g.members.length; k++) {
      const m = g.members[k];
      if (m && m.isAdmin === undefined) {
        g.members[k] = { ...m, isAdmin: false };
        dirty = true;
      }
    }
  }
  if (dirty) saveGroups(list);
  return g;
}

/** 移出群成员（不可移群主；至少保留 1 人） */
export function removeGroupMember(groupId, memberAgentId) {
  const gid = String(groupId || "").trim();
  const mid = String(memberAgentId || "").trim();
  if (!gid || !mid) return { ok: false, code: "BAD_INPUT" };
  const list = loadProjectGroups();
  const idx = list.findIndex((x) => x.id === gid);
  if (idx < 0) return { ok: false, code: "NOT_FOUND" };
  const g = list[idx];
  const owner = resolveGroupOwnerAgentId(g);
  if (mid === owner) return { ok: false, code: "OWNER" };
  const members = Array.isArray(g.members) ? [...g.members] : [];
  if (members.length <= 1) return { ok: false, code: "LAST_MEMBER" };
  const victim = members.find((m) => String(m?.id || m?.agentId || "").trim() === mid);
  if (!victim) return { ok: false, code: "NOT_IN_GROUP" };
  const next = members.filter((m) => String(m?.id || m?.agentId || "").trim() !== mid);
  if (next.length < 1) return { ok: false, code: "LAST_MEMBER" };
  g.members = next;
  saveGroups(list);
  const lang = getLanguage();
  const display =
    formatAgentNavTitle({ name: victim.name, role: victim.role }) || displayAgentName(victim) || victim.name || mid;
  appendVirtualChat("group", gid, {
    content: t("vt_group_member_removed_system", lang, { name: display }),
    isMine: false,
    senderName: t("sender_system_name", lang),
  });
  return { ok: true };
}

/** 设置 / 取消群管理员（不可对群主操作） */
export function setGroupMemberAdminFlag(groupId, memberAgentId, isAdmin) {
  const gid = String(groupId || "").trim();
  const mid = String(memberAgentId || "").trim();
  if (!gid || !mid) return { ok: false, code: "BAD_INPUT" };
  const list = loadProjectGroups();
  const idx = list.findIndex((x) => x.id === gid);
  if (idx < 0) return { ok: false, code: "NOT_FOUND" };
  const g = list[idx];
  const owner = resolveGroupOwnerAgentId(g);
  if (mid === owner) return { ok: false, code: "OWNER" };
  const members = Array.isArray(g.members) ? [...g.members] : [];
  const j = members.findIndex((m) => String(m?.id || m?.agentId || "").trim() === mid);
  if (j < 0) return { ok: false, code: "NOT_IN_GROUP" };
  const prev = members[j];
  const nextFlag = !!isAdmin;
  if (!!prev.isAdmin === nextFlag) return { ok: true, unchanged: true };
  members[j] = { ...prev, isAdmin: nextFlag };
  g.members = members;
  saveGroups(list);
  const lang = getLanguage();
  const display =
    formatAgentNavTitle({ name: prev.name, role: prev.role }) || displayAgentName(prev) || prev.name || mid;
  const key = nextFlag ? "vt_group_admin_set_system" : "vt_group_admin_unset_system";
  appendVirtualChat("group", gid, {
    content: t(key, lang, { name: display }),
    isMine: false,
    senderName: t("sender_system_name", lang),
  });
  return { ok: true };
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
  const lang = getLanguage();
  const list = loadVirtualChatMessages(kind, id);
  const last = list[list.length - 1];
  if (!last) {
    const stub = t("chat_no_messages", lang);
    if (kind === "group") touchGroupLastMsg(id, stub);
    if (kind === "agent") touchAgentLastMsg(id, stub);
    return;
  }
  const preview = last.isMine
    ? `${t("vt_preview_me_prefix", lang)}${last.content}`
    : last.senderName
      ? `${last.senderName}: ${last.content}`
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

export function appendVirtualChat(
  kind,
  id,
  { content, isMine = true, senderName = "", senderAvatar = "", senderId = "", senderModel = "" }
) {
  const list = loadVirtualChatMessages(kind, id);
  const msg = {
    id: `vm_${Date.now()}`,
    content,
    time: nowIso(),
    isMine,
    senderName: senderName || "",
    senderAvatar: String(senderAvatar || "").trim(),
    senderId: String(senderId || "").trim(),
    senderModel: String(senderModel || "").trim(),
  };
  list.push(msg);
  saveVirtualChatMessages(kind, id, list);
  if (kind === "agent" && isMine) clearAgentChatClearedFlag(id);
  const lang = getLanguage();
  const preview = isMine
    ? `${t("vt_preview_me_prefix", lang)}${content}`
    : senderName
      ? `${senderName}: ${content}`
      : content;
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
    senderName: t("sender_system_name", getLanguage()),
  });
  appendVirtualChat(MANAGER_KIND, MANAGER_ID, {
    content: b.managerSummary,
    isMine: false,
    senderName: t("manager_overview_title", getLanguage()),
  });
}

/** 首页：经理总结 + 各员工日报（演示数据，可替换为定时任务写入） */
export function getDailyBriefing() {
  seedIfNeeded();
  const lang = getLanguage();
  const agents = loadDigitalAgents();
  const scheduleNote = t("briefing_schedule_note", lang);
  const employeeLines = agents.slice(0, 8).map((a) => ({
    id: a.id,
    name: displayAgentName(a),
    role: displayAgentRole(a),
    summary: t("briefing_employee_summary", lang, { role: displayAgentRole(a) }),
    time: t("briefing_time_2100", lang),
  }));
  const managerSummary = t("briefing_manager_summary", lang, { schedule: scheduleNote });
  return {
    scheduleNote,
    managerSummary,
    managerTime: t("briefing_time_2130", lang),
    employeeLines,
  };
}
