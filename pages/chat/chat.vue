<template>
<view class="chat-page" :class="{ 'theme-dark': isDarkMode }">
<view class="chat-header-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
<view class="chat-header">
<NavBackClick />
<text v-if="headerIsBoss" class="avatar-icon iconfont icon-laoban"></text>
<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
<text class="chat-title">{{ headerTitle }}</text>
<text class="chat-more" @click="openSettings">⋯</text>
</view>
</view>

<view v-if="loading" class="chat-empty">
<text>{{ t('loading') }}</text>
</view>

<view v-else-if="chatMessages.length > 0" class="chat-scroll-wrap">
<scroll-view
scroll-y
class="chat-scroll"
:scroll-into-view="scrollIntoView"
scroll-with-animation
:show-scrollbar="false"
@scroll="onChatScroll"
@scrolltolower="onScrollToLower"
>
<view class="chat-scroll-inner">
<view
v-for="msg in chatMessages"
:key="msg.id"
:id="safeScrollId(msg.id)"
class="bubble-row"
:class="{
'my-message': msg.isMine,
'multi-on': multiSelectMode,
'msg-selected': isMsgSelected(msg.id),
}"
@click="onBubbleRowTap(msg)"
>
<view class="bubble-line" :class="{ 'bubble-line-mine': msg.isMine }">
<image v-if="!msg.isMine && avatarSrc(msg, false)" class="bubble-avatar-img" :src="avatarSrc(msg, false)" mode="aspectFill" />
<view v-else-if="!msg.isMine" class="bubble-avatar">{{ avatarText(msg, false) }}</view>
<view class="bubble-main">
<text v-if="!msg.isMine && msg.senderName" class="bubble-sender">{{ msg.senderName }}</text>
<view
class="message-bubble"
:class="{ 'my-message': msg.isMine }"
@longpress.stop="onBubbleLongPress(msg)"
>
<text class="bubble-text">{{ msg.content }}</text>
</view>
<text class="bubble-meta-time">{{ formatTime(msg.time) }}</text>
</view>
<image v-if="msg.isMine && avatarSrc(msg, true)" class="bubble-avatar-img bubble-avatar-img-mine" :src="avatarSrc(msg, true)" mode="aspectFill" />
<view v-else-if="msg.isMine" class="bubble-avatar bubble-avatar-mine">{{ avatarText(msg, true) }}</view>
</view>
</view>
<view id="chat-bottom-anchor" class="bottom-anchor"></view>
</view>
</scroll-view>

<view v-if="showStickBottom && !multiSelectMode" class="float-to-bottom" @click="scrollToBottom">
<text class="float-to-bottom-icon">⌄</text>
</view>
</view>

<view v-else class="chat-empty chat-empty-flex">
<text>{{ t('chat_no_messages') }}</text>
</view>

<view v-if="!loading && multiSelectMode" class="multi-bar safe-bottom">
<text class="multi-cancel" @click="exitMultiSelect">{{ t('multi_cancel') }}</text>
<text class="multi-count">{{ t('multi_selected', { count: selectedIds.length }) }}</text>
<view class="multi-actions">
<text class="multi-link" @click="batchCopy">{{ t('action_copy') }}</text>
<text class="multi-link" @click="batchForward">{{ t('action_forward') }}</text>
<text class="multi-link multi-link-danger" @click="batchDelete">{{ t('action_delete') }}</text>
</view>
</view>

<view v-else-if="!loading" class="chat-input safe-bottom">
<input type="text" v-model="inputText" :placeholder="t('chat_input_placeholder')" class="input-field" confirm-type="send" :disabled="sending" @confirm="sendMessage" />
<view class="send-button" :class="{ 'send-disabled': sending }" @click="sendMessage"><text>{{ sending ? t('chat_requesting') : t('send') }}</text></view>
</view>

<view v-if="showBubbleMenu" class="bubble-menu-mask" @tap.self="closeBubbleMenu">
<view class="bubble-menu-panel" @tap.stop>
<view
v-for="item in bubbleMenuItems"
:key="item.key"
class="bubble-menu-row"
@tap="onBubbleMenuSelect(item.key)"
>
<text class="bubble-menu-row-t">{{ item.label }}</text>
</view>
<view class="bubble-menu-cancel" @tap="closeBubbleMenu">
<text class="bubble-menu-cancel-t">{{ t('cancel') }}</text>
</view>
</view>
</view>
</view>
</template>

<script>
import { loadChatMessages, markMessagesAsRead, removeLocalProjectMessage, removeLocalProjectMessagesByIds } from "@/utils/messageUtils";
import { ensurePersonaChatSeed } from "@/utils/personaChatSeed";
import { markCommsThreadRead } from "@/utils/commsInbox";
import {
loadVirtualChatMessages,
appendVirtualChat,
clearGroupUnread,
clearAgentUnread,
clearManagerFeedUnread,
ensureAgentChatSeed,
ensureManagerChatSeed,
removeVirtualChatMessage,
removeVirtualChatMessagesByIds,
getDigitalAgentById,
loadDigitalAgents,
getProjectGroupById,
displayAgentName,
displayAgentRole,
formatAgentNavTitle,
} from "@/utils/virtualTeamStore";
import * as workflowApi from "@/clientApi/workflowApi";
import { pickId } from "@/utils/apiHelpers";
import { getUserInfo } from "@/utils/index";
import { getAgentById } from "@/clientApi/agentsApi";
import { resolveAvatarDisplayUrl } from "@/clientApi/authApi";
import { getPersonaById } from "@/utils/agentPersonaCatalog";
import { getLlmSettings } from "@/utils/llmSettings";
import { getAgentModelOrDefault } from "@/utils/agentModelMap";
import { chatCompletion } from "@/utils/openaiCompatible";
import { extractAssistantText } from "@/utils/openaiResponse";
import NavBackClick from "@/components/NavBackClick.vue";
import { t, getLanguage } from "@/utils/lang";

const RECALL_MS = 2 * 60 * 1000;

function messageBody(m) {
if (!m || typeof m !== "object") return "";
return m.body || m.content || m.text || "";
}

function messageTime(m) {
if (!m || typeof m !== "object") return "";
return m.createdAt || m.time || m.timestamp || "";
}

function remoteMessageIsMine(m, user) {
if (!m || !user) return false;
const phone = user.phone || user.mobile || user.username || "";
if (phone && (m.senderPhone === phone || m.fromPhone === phone || m.phone === phone)) return true;
const uid = user.id ?? user.userId;
if (uid != null && (m.fromUserId === uid || m.senderId === uid || m.userId === uid)) return true;
return false;
}

function normalizeDepartmentName(name) {
return (name || "")
.replace(/^[^\s\u4e00-\u9fa5A-Za-z]+/, "")
.replace(/\s+/g, "")
.trim();
}

const UI_DESIGNER_EMPLOYEE_ID = "des-ui";

export default {
components: { NavBackClick },
data() {
return {
statusBarPx: 20,
projectName: "",
mode: "local",
workflowId: "",
threadId: "",
threadKind: "",
workflowTitle: "",
threadTitle: "",
inputText: "",
chatMessages: [],
loading: false,
sending: false,
virtualKind: "",
virtualId: "",
virtualTitle: "",
_chatShownOnce: false,
scrollIntoView: "",
showStickBottom: false,
multiSelectMode: false,
selectedIds: [],
personaSystemPrompt: "",
agentProfileForPrompt: null,
isDarkMode: false,
groupReplying: false,
showBubbleMenu: false,
bubbleMenuItems: [],
activeBubbleMenuMsg: null,
};
},
computed: {
headerTitle() {
const lang = getLanguage();
if (this.mode === "virtual") {
return (this.virtualTitle || "").trim() || t("chat_title_fallback", lang);
}
if (this.mode === "remote") {
const a = (this.workflowTitle || "").trim();
const b = (this.threadTitle || "").trim();
if (a && b) return `${a} · ${b}`;
return a || b || t("workflow_chat_title", lang);
}
return this.projectName || t("chat_title_fallback", lang);
},
headerIsBoss() {
if (this.mode !== "local") return false;
const n = (this.projectName || "").trim();
return n === t("boss_chat_name", "zh") || n === t("boss_chat_name", "en") || n === "老板";
},
},
onLoad(options) {
this.loadDarkMode();
try {
const sys = uni.getSystemInfoSync();
this.statusBarPx = sys.statusBarHeight || 20;
} catch (e) {
this.statusBarPx = 20;
}
const vm = options && options.mode === "virtual";
if (vm) {
this.mode = "virtual";
this.virtualKind = options.kind ? decodeURIComponent(options.kind) : "";
this.virtualId = options.id ? decodeURIComponent(options.id) : "";
this.virtualTitle = options.title ? decodeURIComponent(options.title) : "";
if (this.virtualKind === "persona") {
this.fetchPersonaMaterial().finally(() => {
this.loadVirtualMessages(true);
});
} else {
if (this.virtualKind === "agent" && this.virtualId) {
this.fetchUserAgentForPrompt();
}
this.loadVirtualMessages(true);
}
return;
}
const wf = options && options.workflowId ? decodeURIComponent(options.workflowId) : "";
const th = options && options.threadId ? decodeURIComponent(options.threadId) : "";
if (wf && th) {
this.mode = "remote";
this.workflowId = wf;
this.threadId = th;
this.threadKind = options.threadKind ? decodeURIComponent(options.threadKind) : "";
this.workflowTitle = options.workflowTitle ? decodeURIComponent(options.workflowTitle) : "";
this.threadTitle = options.threadTitle ? decodeURIComponent(options.threadTitle) : "";
this.loadRemoteMessages(true);
return;
}
const raw = options && options.projectName;
if (raw) {
this.mode = "local";
this.projectName = decodeURIComponent(raw);
this.loadChatMessages(true);
this.markAsRead();
}
},
onShow() {
this.loadDarkMode();
if (this.mode === "virtual" && this.virtualId) {
if (this.virtualKind === "group") clearGroupUnread(this.virtualId);
if (this.virtualKind === "agent") clearAgentUnread(this.virtualId);
if (this.virtualKind === "manager") clearManagerFeedUnread();
}
const first = !this._chatShownOnce;
this._chatShownOnce = true;
if (first) return;
if (this.mode === "virtual" && this.virtualId) {
this.loadVirtualMessages(false);
} else if (this.mode === "remote" && this.workflowId && this.threadId) {
this.loadRemoteMessages(false);
} else if (this.mode === "local" && this.projectName) {
this.loadChatMessages(false);
this.markAsRead();
}
},
methods: {
avatarText(msg, isMine) {
if (isMine) {
const me = getUserInfo() || {};
const nick = String(me.nickname || me.name || me.username || "我").trim();
return (nick || "我").slice(0, 1);
}
const sender = String(msg?.senderName || "").trim();
return (sender || "A").slice(0, 1);
},
avatarSrc(msg, isMine) {
if (isMine) {
const me = getUserInfo() || {};
const raw = String(me.avatarUrl || me.avatar || me.avatarURL || me.headImg || me.headimg || "").trim();
return resolveAvatarDisplayUrl(raw);
}
const raw = String(msg?.senderAvatar || "").trim();
return resolveAvatarDisplayUrl(raw);
},
buildAgentSystemPrompt(agentInfo = {}, fallbackName = "", fallbackRole = "") {
const name = String(agentInfo.displayName || agentInfo.name || fallbackName || "").trim() || this.t("digital_employee_fallback");
const role = String(agentInfo.jobTitle || agentInfo.rolePosition || fallbackRole || "").trim() || this.t("agent_seed_role_fallback");
const department = String(agentInfo.department || "").trim();
const mainWork = String(agentInfo.mainWork || agentInfo.description || "").trim();
const goals = String(agentInfo.workGoal || agentInfo.goal || "").trim();
const constraints = String(agentInfo.constraints || "").trim();
const pieces = [
`你是团队中的数字员工「${name}」，岗位：${role}。`,
department ? `所属部门：${department}。` : "",
mainWork ? `主要工作：${mainWork}。` : "",
goals ? `工作目标：${goals}。` : "",
constraints ? `约束与边界：${constraints}。` : "",
"请基于以上身份信息回答，保持角色一致，回复简洁、可执行，不要编造未提供的团队事实。",
];
return pieces.filter(Boolean).join("\n");
},
async fetchUserAgentForPrompt() {
if (this.virtualKind !== "agent" || !this.virtualId) return null;
try {
const local = getDigitalAgentById(this.virtualId);
if (local && typeof local === "object") {
this.agentProfileForPrompt = local;
return local;
}
} catch (e) {
console.warn("[chat] local digital agent fallback", e);
}
return null;
},
buildGroupAutoReplyContent(agentName, agentRole, userText, idx) {
const brief = String(userText || "").trim().slice(0, 26);
const templates = [
`${agentName}已收到，我这边先按「${brief}」推进，30分钟内回传进展。`,
`收到，我负责${agentRole || "该模块"}，先拆分任务并同步风险点。`,
`我先给出可执行方案：先确认范围，再给里程碑和交付时间。`,
`${agentName}这边补充：如果优先级最高，我可以先交付最小可用版本。`,
];
return templates[idx % templates.length];
},
buildGroupAgentSystemPrompt(member, groupTitle = "") {
const name = String(member?.name || member?.displayName || "").trim() || this.t("digital_employee_fallback");
const role = String(member?.role || member?.jobTitle || "").trim() || this.t("agent_seed_role_fallback");
const dept = String(member?.department || "").trim();
const group = String(groupTitle || this.virtualTitle || "").trim();
return [
`你是项目群成员「${name}」，职责：${role}。`,
dept ? `所属部门：${dept}。` : "",
group ? `当前群聊：${group}。` : "",
"请在群聊中用简洁中文回复，聚焦执行方案、风险、协作对象。",
"每次回复 1-3 句，避免空话。"
].filter(Boolean).join("\n");
},
buildGroupApiMessages(extraUserPrompt = "") {
const recent = (Array.isArray(this.chatMessages) ? this.chatMessages : []).slice(-18);
const msgs = recent
  .filter((m) => m && String(m.content || "").trim())
  .map((m) => {
    if (m.isMine) return { role: "user", content: String(m.content).trim() };
    const speaker = String(m.senderName || "成员").trim();
    return { role: "assistant", content: `${speaker}：${String(m.content).trim()}` };
  });
if (extraUserPrompt) msgs.push({ role: "user", content: extraUserPrompt });
return msgs;
},
async triggerVirtualGroupAutoReplies(userText) {
if (this.groupReplying) return;
const g = getProjectGroupById(this.virtualId);
const pickedMembers = Array.isArray(g?.members) ? g.members : [];
const candidates = pickedMembers.length ? pickedMembers : loadDigitalAgents();
const picked = candidates.slice(0, Math.min(3, candidates.length));
if (!Array.isArray(picked) || picked.length === 0) return;
const { apiKey, baseUrl, model } = getLlmSettings();
if (!apiKey) {
  uni.showToast({ title: this.t("toast_set_api_key_in_profile"), icon: "none" });
  picked.forEach((a, idx) => {
    const name = String(a?.name || a?.displayName || "").trim() || displayAgentName(a) || this.t("digital_employee_fallback");
    const role = String(a?.role || a?.jobTitle || "").trim() || displayAgentRole(a);
    appendVirtualChat("group", this.virtualId, {
      content: this.buildGroupAutoReplyContent(name, role, userText, idx),
      isMine: false,
      senderName: formatAgentNavTitle({ name, role }) || name,
      senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
    });
  });
  this.loadVirtualMessages(false);
  this.$nextTick(() => this.scrollToBottom());
  return;
}
this.groupReplying = true;
try {
  for (let idx = 0; idx < picked.length; idx++) {
    const a = picked[idx] || {};
    const name = String(a?.name || a?.displayName || "").trim() || displayAgentName(a) || this.t("digital_employee_fallback");
    const role = String(a?.role || a?.jobTitle || "").trim() || displayAgentRole(a);
    const senderName = formatAgentNavTitle({ name, role }) || name;
    const system = this.buildGroupAgentSystemPrompt(a, g?.name || this.virtualTitle || "");
    const msgs = this.buildGroupApiMessages();
    try {
      const res = await chatCompletion({ apiKey, baseUrl, model, system, messages: msgs });
      const text = extractAssistantText(res) || this.buildGroupAutoReplyContent(name, role, userText, idx);
      appendVirtualChat("group", this.virtualId, {
        content: text,
        isMine: false,
        senderName,
        senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
      });
    } catch {
      appendVirtualChat("group", this.virtualId, {
        content: this.buildGroupAutoReplyContent(name, role, userText, idx),
        isMine: false,
        senderName,
        senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
      });
    }
    this.loadVirtualMessages(false);
    this.$nextTick(() => this.scrollToBottom());
    await new Promise((r) => setTimeout(r, 260));
  }
  // 第二轮：让成员基于上一轮观点进行简短协作回应（模拟群内互相交流）
  for (let idx = 1; idx < Math.min(3, picked.length); idx++) {
    const a = picked[idx] || {};
    const name = String(a?.name || a?.displayName || "").trim() || displayAgentName(a) || this.t("digital_employee_fallback");
    const role = String(a?.role || a?.jobTitle || "").trim() || displayAgentRole(a);
    const senderName = formatAgentNavTitle({ name, role }) || name;
    const system = this.buildGroupAgentSystemPrompt(a, g?.name || this.virtualTitle || "");
    const msgs = this.buildGroupApiMessages("请基于上一位成员的观点补充一句协作建议，并点名需要配合的角色。");
    try {
      const res = await chatCompletion({ apiKey, baseUrl, model, system, messages: msgs });
      const text = extractAssistantText(res);
      if (text) {
        appendVirtualChat("group", this.virtualId, {
          content: text,
          isMine: false,
          senderName,
          senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
        });
        this.loadVirtualMessages(false);
        this.$nextTick(() => this.scrollToBottom());
      }
    } catch {
      //
    }
    await new Promise((r) => setTimeout(r, 220));
  }
} finally {
  this.groupReplying = false;
}
},
loadDarkMode() {
try {
const settings = uni.getStorageSync("userSettings");
let parsed = {};
if (settings) {
parsed = typeof settings === "string" ? JSON.parse(settings) : settings;
}
this.isDarkMode = !!parsed.isDarkMode;
} catch {
this.isDarkMode = false;
}
},
updateTheme(isDark) {
this.isDarkMode = !!isDark;
},
t(key, params = {}) {
return t(key, getLanguage(), params);
},
safeScrollId(id) {
return "sm-" + String(id == null ? "x" : id).replace(/[^a-zA-Z0-9_-]/g, "_");
},
openSettings() {
const q = [];
if (this.mode === "virtual") {
q.push("mode=virtual");
q.push(`kind=${encodeURIComponent(this.virtualKind)}`);
q.push(`id=${encodeURIComponent(this.virtualId)}`);
q.push(`title=${encodeURIComponent(this.virtualTitle || this.headerTitle)}`);
} else if (this.mode === "remote") {
q.push("mode=remote");
q.push(`workflowId=${encodeURIComponent(this.workflowId)}`);
q.push(`threadId=${encodeURIComponent(this.threadId)}`);
q.push(`title=${encodeURIComponent(this.headerTitle)}`);
q.push(`workflowTitle=${encodeURIComponent(this.workflowTitle)}`);
q.push(`threadTitle=${encodeURIComponent(this.threadTitle)}`);
} else {
q.push("mode=local");
q.push(`projectName=${encodeURIComponent(this.projectName)}`);
}
uni.navigateTo({ url: `/pages/chat/chat-settings?${q.join("&")}` });
},
scrollToBottom() {
this.showStickBottom = false;
this.$nextTick(() => {
this.scrollIntoView = "chat-bottom-anchor";
setTimeout(() => {
this.scrollIntoView = "";
}, 400);
});
},
onChatScroll(e) {
const d = (e && e.detail) || {};
const top = typeof d.scrollTop === "number" ? d.scrollTop : 0;
this.showStickBottom = top > 120;
},
onScrollToLower() {
this.showStickBottom = false;
},
isMsgSelected(id) {
return this.selectedIds.indexOf(id) >= 0;
},
onBubbleRowTap(msg) {
if (!this.multiSelectMode) return;
const i = this.selectedIds.indexOf(msg.id);
if (i >= 0) this.selectedIds.splice(i, 1);
else this.selectedIds.push(msg.id);
},
onBubbleLongPress(msg) {
if (this.multiSelectMode) return;
this.openBubbleMenu(msg);
},
canRecall(msg) {
if (!msg || !msg.isMine) return false;
if (this.mode === "remote") return false;
const t = new Date(msg.time).getTime();
if (Number.isNaN(t)) return false;
return Date.now() - t <= RECALL_MS;
},
copyText(text) {
const t = (text || "").trim();
if (!t) return;
uni.setClipboardData({
data: t,
success: () => uni.showToast({ title: this.t("toast_copied"), icon: "none" }),
});
},
forwardMessage(msg) {
const t = msg && msg.content ? String(msg.content) : "";
if (!t) return;
uni.setStorageSync("chat_forward_draft", t);
uni.setClipboardData({
data: t,
success: () => uni.showToast({ title: this.t("toast_copied_paste"), icon: "none", duration: 2200 }),
});
},
enterMultiSelect(msg) {
this.multiSelectMode = true;
this.selectedIds = msg && msg.id ? [msg.id] : [];
},
exitMultiSelect() {
this.multiSelectMode = false;
this.selectedIds = [];
},
selectedMessagesList() {
const set = new Set(this.selectedIds);
return this.chatMessages.filter((m) => set.has(m.id));
},
batchCopy() {
const list = this.selectedMessagesList();
if (!list.length) {
uni.showToast({ title: this.t("toast_select_msg_first"), icon: "none" });
return;
}
const text = list
.map((m) => m.content || "")
.filter(Boolean)
.join("\n");
this.copyText(text);
},
batchForward() {
const list = this.selectedMessagesList();
if (!list.length) {
uni.showToast({ title: this.t("toast_select_msg_first"), icon: "none" });
return;
}
const text = list
.map((m) => m.content || "")
.filter(Boolean)
.join("\n");
uni.setStorageSync("chat_forward_draft", text);
uni.setClipboardData({
data: text,
success: () => uni.showToast({ title: this.t("toast_copied_merge"), icon: "none", duration: 2200 }),
});
},
batchDelete() {
if (this.mode === "remote") {
uni.showToast({ title: this.t("toast_remote_no_delete"), icon: "none" });
return;
}
const list = this.selectedMessagesList();
if (!list.length) {
uni.showToast({ title: this.t("toast_select_msg_first"), icon: "none" });
return;
}
uni.showModal({
title: this.t("delete_messages_title"),
content: this.t("delete_messages_body", { count: list.length }),
success: (res) => {
if (!res.confirm) return;
const ids = list.map((m) => m.id);
if (this.mode === "virtual") {
removeVirtualChatMessagesByIds(this.virtualKind, this.virtualId, ids);
this.loadVirtualMessages(false);
} else {
removeLocalProjectMessagesByIds(this.projectName, ids);
this.loadChatMessages(false);
}
this.exitMultiSelect();
this.$nextTick(() => this.scrollToBottom());
},
});
},
recallMessage(msg) {
if (!msg || !msg.isMine) return;
if (this.mode === "remote") {
uni.showToast({ title: this.t("toast_remote_no_recall"), icon: "none" });
return;
}
if (this.mode === "virtual") {
removeVirtualChatMessage(this.virtualKind, this.virtualId, msg.id);
this.loadVirtualMessages(false);
} else {
removeLocalProjectMessage(this.projectName, msg.id);
this.loadChatMessages(false);
}
uni.showToast({ title: this.t("toast_recalled"), icon: "none" });
this.$nextTick(() => this.scrollToBottom());
},
deleteMessage(msg) {
if (!msg) return;
if (this.mode === "remote") {
uni.showToast({ title: this.t("toast_remote_cannot_delete"), icon: "none" });
return;
}
uni.showModal({
title: this.t("delete_one_title"),
content: this.t("delete_one_body"),
success: (res) => {
if (!res.confirm) return;
if (this.mode === "virtual") {
removeVirtualChatMessage(this.virtualKind, this.virtualId, msg.id);
this.loadVirtualMessages(false);
} else {
removeLocalProjectMessage(this.projectName, msg.id);
this.loadChatMessages(false);
}
this.$nextTick(() => this.scrollToBottom());
},
});
},
openBubbleMenu(msg) {
const isRemote = this.mode === "remote";
const itemList = [];
const push = (key, label) => {
itemList.push({ key, label });
};
push("copy", this.t("menu_copy"));
if (!isRemote) {
if (msg.isMine && this.canRecall(msg)) {
push("recall", this.t("menu_recall"));
}
push("delete", this.t("menu_delete"));
}
push("forward", this.t("menu_forward"));
push("multiselect", this.t("menu_multiselect"));
this.activeBubbleMenuMsg = msg;
this.bubbleMenuItems = itemList;
this.showBubbleMenu = true;
},
closeBubbleMenu() {
this.showBubbleMenu = false;
this.bubbleMenuItems = [];
this.activeBubbleMenuMsg = null;
},
onBubbleMenuSelect(action) {
const msg = this.activeBubbleMenuMsg;
this.closeBubbleMenu();
if (!msg) return;
if (action === "copy") {
this.copyText(msg.content);
return;
}
if (action === "recall") {
this.recallMessage(msg);
return;
}
if (action === "delete") {
this.deleteMessage(msg);
return;
}
if (action === "forward") {
this.forwardMessage(msg);
return;
}
if (action === "multiselect") {
this.enterMultiSelect(msg);
}
},
loadChatMessages(alsoScroll) {
this.chatMessages = loadChatMessages(this.projectName);
if (alsoScroll) this.$nextTick(() => this.scrollToBottom());
},
markAsRead() {
markMessagesAsRead(this.projectName);
},
async loadRemoteMessages(alsoScroll) {
this.loading = true;
try {
const isProjectGroup = (this.threadKind || "").toUpperCase() === "PROJECT_GROUP";
const list = isProjectGroup
? await workflowApi.listProjectGroupMessages(this.workflowId, this.threadId, { limit: 200 })
: await workflowApi.listMessages(this.workflowId, this.threadId);
const arr = Array.isArray(list) ? list : [];
const sorted = [...arr].sort((a, b) => {
const ta = new Date(messageTime(a) || 0).getTime();
const tb = new Date(messageTime(b) || 0).getTime();
return ta - tb;
});
const user = getUserInfo();
this.chatMessages = sorted.map((m) => ({
id: pickId(m) || m.messageId || `m-${messageTime(m)}`,
content: messageBody(m) || this.t("message_empty_mark"),
time: messageTime(m) || new Date().toISOString(),
isMine: remoteMessageIsMine(m, user),
}));
const last = sorted.length ? sorted[sorted.length - 1] : null;
const lastIso = last ? messageTime(last) : new Date().toISOString();
markCommsThreadRead(this.workflowId, this.threadId, lastIso);
} catch (e) {
console.warn("[chat] remote load", e);
this.chatMessages = [];
} finally {
this.loading = false;
}
if (alsoScroll) this.$nextTick(() => this.scrollToBottom());
},
loadVirtualMessages(alsoScroll) {
this.loading = true;
try {
if (this.virtualKind === "agent" && this.virtualId) {
const localAgent = getDigitalAgentById(this.virtualId);
if (localAgent) ensureAgentChatSeed(this.virtualId);
}
if (this.virtualKind === "persona" && this.virtualId) {
const exists = loadVirtualChatMessages("persona", this.virtualId);
if (exists.length === 0) {
ensurePersonaChatSeed(this.virtualId);
}
}
if (this.virtualKind === "manager") {
ensureManagerChatSeed();
}
const list = loadVirtualChatMessages(this.virtualKind, this.virtualId);
this.chatMessages = list.map((m) => ({
id: m.id,
content: m.content,
time: m.time,
isMine: !!m.isMine,
senderName: m.senderName || "",
senderAvatar: m.senderAvatar || "",
}));
} finally {
this.loading = false;
}
if (alsoScroll) this.$nextTick(() => this.scrollToBottom());
},
async fetchPersonaMaterial() {
if (this.virtualKind !== "persona" || !this.virtualId) return;
try {
const data = await getAgentById(this.virtualId);
if (data && typeof data === "object") {
const c = data.content != null ? String(data.content) : "";
if (c.trim()) {
this.personaSystemPrompt = c.trim();
return;
}
}
} catch (e) {
console.warn("[chat] GET /api/agents/:id", e);
}
const local = getPersonaById(this.virtualId);
if (local && local.snippet) {
this.personaSystemPrompt = String(local.snippet).trim();
}
},
async sendAgentMessage() {
const body = (this.inputText || "").trim();
if (!body || this.sending) return;
const { apiKey, baseUrl, model: globalModel } = getLlmSettings();
if (!apiKey) {
uni.showToast({ title: this.t("toast_set_api_key_in_profile"), icon: "none" });
return;
}
const model = getAgentModelOrDefault(this.virtualId) || globalModel;
const agent = getDigitalAgentById(this.virtualId);
const liveAgent = (await this.fetchUserAgentForPrompt()) || this.agentProfileForPrompt || null;
const name = agent
? displayAgentName(agent)
: (this.virtualTitle || "").trim() || this.t("digital_employee_fallback");
const role = agent ? displayAgentRole(agent) : "";
const system = this.buildAgentSystemPrompt(liveAgent || {}, name, role);
this.sending = true;
appendVirtualChat("agent", this.virtualId, {
content: body,
isMine: true,
senderName: "",
});
this.inputText = "";
this.loadVirtualMessages(false);
try {
const slice = this.chatMessages
.filter((m) => m.content && String(m.content).trim())
.filter((m) => {
const s = String(m.content || "").trim();
if (!s) return false;
if (s.includes("数字员工（岗位）")) return false;
if (s.includes("【岗位】")) return false;
return true;
})
.slice(-24);
const apiMsgs = slice.map((m) => ({
role: m.isMine ? "user" : "assistant",
content: String(m.content).trim(),
}));
const res = await chatCompletion({
apiKey,
baseUrl,
model,
system,
messages: apiMsgs,
});
const text = extractAssistantText(res);
if (!text) throw new Error("empty reply");
const navTitle = liveAgent
? formatAgentNavTitle({
name: liveAgent.displayName || liveAgent.name || name,
role: liveAgent.jobTitle || liveAgent.rolePosition || role,
})
: (agent ? formatAgentNavTitle(agent) : name);
const senderName = (navTitle || name).slice(0, 24);
appendVirtualChat("agent", this.virtualId, {
content: text,
isMine: false,
senderName,
});
} catch (e) {
console.warn("[chat] agent llm", e);
const errMsg = (e && e.message) || String(e || "");
uni.showToast({
title: errMsg.length > 36 ? this.t("model_err_title") : errMsg,
icon: "none",
duration: 2800,
});
appendVirtualChat("agent", this.virtualId, {
content: this.t("model_err_body"),
isMine: false,
senderName: this.t("sender_system_name"),
});
} finally {
this.sending = false;
this.loadVirtualMessages(false);
this.$nextTick(() => this.scrollToBottom());
}
},
async sendPersonaMessage() {
const body = (this.inputText || "").trim();
if (!body || this.sending) return;
const { apiKey, baseUrl, model } = getLlmSettings();
if (!apiKey) {
uni.showToast({ title: this.t("toast_set_api_key_in_profile"), icon: "none" });
return;
}
if (!this.personaSystemPrompt || !String(this.personaSystemPrompt).trim()) {
await this.fetchPersonaMaterial();
}
if (!this.personaSystemPrompt || !String(this.personaSystemPrompt).trim()) {
uni.showToast({ title: this.t("toast_agent_content_missing"), icon: "none" });
return;
}
this.sending = true;
appendVirtualChat("persona", this.virtualId, {
content: body,
isMine: true,
senderName: "",
});
this.inputText = "";
this.loadVirtualMessages(false);
try {
const slice = this.chatMessages
.filter((m) => m.content && String(m.content).trim())
.slice(-24);
const apiMsgs = slice.map((m) => ({
role: m.isMine ? "user" : "assistant",
content: String(m.content).trim(),
}));
const res = await chatCompletion({
apiKey,
baseUrl,
model,
system: this.personaSystemPrompt,
messages: apiMsgs,
});
const text = extractAssistantText(res);
if (!text) throw new Error("empty reply");
appendVirtualChat("persona", this.virtualId, {
content: text,
isMine: false,
senderName: ((this.virtualTitle || this.t("assistant_name_short")).slice(0, 16)),
});
} catch (e) {
console.warn("[chat] persona llm", e);
const errMsg = (e && e.message) || String(e || "");
uni.showToast({
title: errMsg.length > 36 ? this.t("model_err_title") : errMsg,
icon: "none",
duration: 2800,
});
appendVirtualChat("persona", this.virtualId, {
content: this.t("model_err_body"),
isMine: false,
senderName: this.t("sender_system_name"),
});
} finally {
this.sending = false;
this.loadVirtualMessages(false);
this.$nextTick(() => this.scrollToBottom());
}
},
sendMessage() {
const userContent = (this.inputText || "").trim();
if (!userContent) return;
if (this.mode === "virtual") {
if (this.virtualKind === "persona") {
this.sendPersonaMessage();
return;
}
if (this.virtualKind === "agent") {
this.sendAgentMessage();
return;
}
const body = userContent;
appendVirtualChat(this.virtualKind, this.virtualId, {
content: body,
isMine: true,
senderName: "",
});
this.inputText = "";
this.loadVirtualMessages(false);
this.$nextTick(() => this.scrollToBottom());
if (this.virtualKind === "group") {
this.triggerVirtualGroupAutoReplies(body);
}
return;
}
if (this.mode === "remote") {
this.sendRemote();
return;
}
const newMessage = {
id: "msg-" + Date.now(),
projectName: this.projectName,
employeeId: this.selectedEmployeeId || "",
title: this.t("chat_list_title"),
content: userContent,
time: new Date().toISOString(),
sender: "me",
read: true,
};

const allMessages = uni.getStorageSync("projectMessages") || [];
allMessages.unshift(newMessage);
uni.setStorageSync("projectMessages", allMessages);

this.inputText = "";
this.loadChatMessages(false);
this.$nextTick(() => this.scrollToBottom());

const pn = (this.projectName || "").trim();
const isDesignDept =
pn === t("msg_dept_design_title", "zh") || pn === t("msg_dept_design_title", "en") || pn === "设计部";
if (isDesignDept && this.selectedEmployeeId === UI_DESIGNER_EMPLOYEE_ID) {
this.replyFromUiDesignerApi(userContent);
return;
}

const isEng =
pn === t("engineering_department", "zh") || pn === t("engineering_department", "en") || pn === "工程部";
if (isEng && this.selectedEmployeeId) {
setTimeout(() => {
const replyMessage = {
id: "msg-" + Date.now(),
projectName: this.projectName,
employeeId: this.selectedEmployeeId,
title: this.t("reply_ok_title"),
content: this.t("reply_ok_content"),
time: new Date().toISOString(),
read: false,
};
const updatedMessages = uni.getStorageSync("projectMessages") || [];
updatedMessages.unshift(replyMessage);
uni.setStorageSync("projectMessages", updatedMessages);
this.loadChatMessages(false);
this.$nextTick(() => this.scrollToBottom());
}, 1000);
}
},
async sendRemote() {
if (this.sending) return;
const body = this.inputText.trim();
if (!body) return;
const user = getUserInfo() || {};
const authorId =
String(
user.department ||
user.departmentId ||
user.dept ||
user.deptId ||
"产品部"
).trim() || "产品部";
const authorLabel = authorId;
const payload = {
text: body,
content: body,
body,
author: {
type: "INTERNAL_DEPARTMENT",
id: authorId,
label: authorLabel,
},
fromDepartment: authorId,
toDepartment: "",
};
this.sending = true;
try {
const isProjectGroup = (this.threadKind || "").toUpperCase() === "PROJECT_GROUP";
if (isProjectGroup) {
await workflowApi.sendProjectGroupMessage(this.workflowId, this.threadId, payload);
} else {
await workflowApi.sendMessage(this.workflowId, this.threadId, payload);
}
this.inputText = "";
await this.loadRemoteMessages(false);
this.$nextTick(() => this.scrollToBottom());
} catch (e) {
console.warn("[chat] send", e);
} finally {
this.sending = false;
}
},
formatTime(time) {
const date = new Date(time);
if (Number.isNaN(date.getTime())) return "";
const hour = date.getHours().toString().padStart(2, "0");
const minute = date.getMinutes().toString().padStart(2, "0");
return `${hour}:${minute}`;
},
},
};
</script>

<style>
@font-face {
font-family: "iconfont";
src: url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2") format("woff2"),
url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff") format("woff"),
url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf") format("truetype");
}

.iconfont {
font-family: "iconfont" !important;
font-size: 36rpx;
}

.chat-page {
display: flex;
flex-direction: column;
height: 100vh;
background: linear-gradient(180deg, #dce4f0 0%, #e8edf4 32%, #eef2f7 100%) !important;
background-color: #eef2f7 !important;
}

.chat-header-wrap {
flex-shrink: 0;
background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.chat-header {
min-height: 92rpx;
background: transparent;
display: flex;
align-items: center;
padding: 10rpx 20rpx 14rpx;
box-sizing: border-box;
}

.avatar-icon {
font-family: "iconfont" !important;
font-size: 42rpx;
margin-right: 12rpx;
color: #2563eb;
}

.chat-title {
font-size: 32rpx;
font-weight: 600;
flex: 1;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
text-align: center;
padding: 0 12rpx;
color: #0f172a;
letter-spacing: 0.2rpx;
}

.chat-more {
font-size: 40rpx;
line-height: 1;
color: #475569;
padding: 8rpx 4rpx 8rpx 20rpx;
font-weight: 600;
letter-spacing: 0;
opacity: 0.9;
}

.chat-scroll-wrap {
flex: 1;
min-height: 0;
position: relative;
display: flex;
flex-direction: column;
}

.chat-scroll {
flex: 1;
height: 100%;
min-height: 0;
width: 100%;
box-sizing: border-box;
background: transparent !important;
}

.employee-panel {
padding: 20rpx;
background: #f8faff;
border-bottom: 1rpx solid #e8edf7;
}

.employee-item {
background: #fff;
border-radius: 12rpx;
padding: 24rpx 22rpx;
margin-bottom: 16rpx;
min-height: 96rpx;
display: flex;
align-items: center;
gap: 8rpx;
}

.employee-id {
font-size: 24rpx;
color: #333;
font-weight: 600;
}

.employee-raw {
font-size: 22rpx;
color: #999;
}

.employee-empty {
display: block;
font-size: 24rpx;
color: #999;
padding: 12rpx 0;
}

.chat-scroll-inner {
padding: 28rpx 24rpx 36rpx;
}

.bottom-anchor {
height: 1px;
width: 100%;
}

.float-to-bottom {
position: absolute;
right: 28rpx;
bottom: 32rpx;
width: 76rpx;
height: 76rpx;
border-radius: 50%;
background: #ffffff;
box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.12);
display: flex;
align-items: center;
justify-content: center;
z-index: 50;
border: 1rpx solid rgba(148, 163, 184, 0.35);
}

.float-to-bottom-icon {
font-size: 36rpx;
color: #2563eb;
line-height: 1;
font-weight: 700;
}

.chat-empty {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
color: #64748b;
font-size: 28rpx;
min-height: 0;
}

.chat-empty-flex {
flex: 1;
min-height: 0;
}

.bubble-row {
display: flex;
flex-direction: column;
margin-bottom: 28rpx;
align-items: flex-start;
width: 100%;
box-sizing: border-box;
}
.bubble-line {
display: flex;
align-items: flex-start;
gap: 12rpx;
width: 100%;
}
.bubble-line-mine {
justify-content: flex-end;
}
.bubble-main {
display: flex;
flex-direction: column;
max-width: 72%;
min-width: 0;
}
.bubble-avatar {
width: 56rpx;
height: 56rpx;
border-radius: 50%;
background: linear-gradient(145deg, #8b5cf6, #2563eb);
color: #fff;
font-size: 24rpx;
font-weight: 700;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
}
.bubble-avatar-img {
width: 56rpx;
height: 56rpx;
border-radius: 50%;
flex-shrink: 0;
background: #e2e8f0;
}
.bubble-avatar-img-mine {
background: #bbf7d0;
}
.bubble-avatar-mine {
background: linear-gradient(145deg, #10b981, #059669);
}

.bubble-row.my-message {
align-items: flex-end;
}

.bubble-row.multi-on.msg-selected .message-bubble {
box-shadow: 0 0 0 4rpx rgba(34, 197, 94, 0.45) !important;
}

.bubble-sender {
font-size: 22rpx;
color: #64748b;
margin-bottom: 8rpx;
margin-left: 6rpx;
font-weight: 500;
}

.bubble-row.my-message .bubble-sender {
display: none;
}

.message-bubble {
max-width: 100%;
padding: 20rpx 24rpx;
border-radius: 18rpx 18rpx 18rpx 6rpx;
background-color: #ffffff;
border: 1rpx solid rgba(148, 163, 184, 0.28);
box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.07);
box-sizing: border-box;
word-break: break-word;
}

.message-bubble.my-message {
border-radius: 18rpx 18rpx 6rpx 18rpx;
background: linear-gradient(145deg, #a3f08f 0%, #95ec69 52%, #8edd62 100%);
border: 1rpx solid rgba(34, 197, 94, 0.35);
box-shadow: 0 4rpx 18rpx rgba(34, 197, 94, 0.2);
color: #191919;
}

.bubble-text {
font-size: 28rpx;
line-height: 1.55;
letter-spacing: 0.2rpx;
color: #1e293b;
white-space: pre-wrap;
word-break: break-word;
writing-mode: horizontal-tb;
}

.message-bubble.my-message .bubble-text {
color: #191919;
}

.bubble-meta-time {
font-size: 22rpx;
color: #94a3b8;
margin-top: 8rpx;
opacity: 0.95;
}

.safe-bottom {
padding-bottom: env(safe-area-inset-bottom);
}

.chat-input {
min-height: 100rpx;
background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
display: flex;
align-items: center;
padding-left: 24rpx;
padding-right: 24rpx;
padding-top: 16rpx;
padding-bottom: 16rpx;
flex-shrink: 0;
gap: 16rpx;
z-index: 100;
box-sizing: border-box;
}

.input-field {
flex: 1;
height: 72rpx;
border: 1rpx solid #e2e8f0;
border-radius: 36rpx;
padding: 0 28rpx;
font-size: 28rpx;
background-color: #f1f5f9;
color: #0f172a;
box-sizing: border-box;
}

.send-button {
display: flex;
align-items: center;
justify-content: center;
min-height: 72rpx;
padding: 0 32rpx;
background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
color: #fff;
border-radius: 36rpx;
font-size: 28rpx;
font-weight: 600;
box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.28);
}

.send-disabled {
opacity: 0.55;
pointer-events: none;
}

.multi-bar {
min-height: 100rpx;
background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
border-top: 1rpx solid rgba(148, 163, 184, 0.28);
display: flex;
flex-direction: row;
align-items: center;
padding: 16rpx 24rpx;
flex-shrink: 0;
z-index: 100;
gap: 16rpx;
}

.multi-cancel {
font-size: 28rpx;
color: #2563eb;
font-weight: 500;
}

.multi-count {
flex: 1;
font-size: 26rpx;
color: #64748b;
}

.multi-actions {
display: flex;
flex-direction: row;
gap: 28rpx;
}

.multi-link {
font-size: 28rpx;
color: #2563eb;
font-weight: 500;
}

.multi-link-danger {
color: #dc2626;
}

.bubble-menu-mask {
position: fixed;
left: 0;
right: 0;
top: 0;
bottom: 0;
background: rgba(15, 23, 42, 0.14);
z-index: 12000;
display: flex;
align-items: flex-end;
}

.bubble-menu-panel {
width: 100%;
background: #eef2ff;
padding-bottom: env(safe-area-inset-bottom);
border-radius: 24rpx 24rpx 0 0;
overflow: hidden;
}

.bubble-menu-row {
background: #fff;
padding: 28rpx 32rpx;
border-top: 1rpx solid #eef2f7;
display: flex;
justify-content: center;
align-items: center;
}

.bubble-menu-row-t {
font-size: 30rpx;
color: #0f172a;
font-weight: 600;
}

.bubble-menu-cancel {
margin-top: 14rpx;
background: #fff;
padding: 26rpx 32rpx;
display: flex;
justify-content: center;
}

.bubble-menu-cancel-t {
font-size: 30rpx;
color: #64748b;
font-weight: 600;
}

/* 深色：小程序无 document，需根节点 .theme-dark；对方气泡避免白底/白边 */
.chat-page.theme-dark {
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-tertiary: #64748b;
--border-color: #334155;
--input-bg: #1a2332;
--input-border: #3f4f63;
--primary-color: #2563eb;
background-image: linear-gradient(180deg, #0c1222 0%, #0f172a 40%, #111c2e 100%) !important;
background-color: #0f172a !important;
}

.chat-page.theme-dark .chat-header-wrap {
background: linear-gradient(180deg, #1e293b 0%, #172033 100%) !important;
box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.25) !important;
}

.chat-page.theme-dark,
.chat-page.theme-dark .chat-header {
background-color: transparent !important;
border-bottom-color: var(--border-color) !important;
}

.chat-page.theme-dark .chat-title {
color: var(--text-primary) !important;
}

.chat-page.theme-dark .chat-more {
color: var(--text-primary) !important;
}

.chat-page.theme-dark .chat-header .avatar-icon {
color: #7dd3fc !important;
}

.chat-page.theme-dark .message-bubble:not(.my-message) {
border-radius: 18rpx 18rpx 18rpx 6rpx !important;
background: linear-gradient(180deg, #243146 0%, #1e293b 100%) !important;
border: 1rpx solid rgba(51, 65, 85, 0.95) !important;
box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.22) !important;
}

.chat-page.theme-dark .message-bubble:not(.my-message) .bubble-text {
color: var(--text-primary) !important;
}

.chat-page.theme-dark .message-bubble.my-message {
background: linear-gradient(145deg, #86efac 0%, #95ec69 55%, #7dd87a 100%) !important;
border: 1rpx solid rgba(34, 197, 94, 0.45) !important;
box-shadow: 0 6rpx 22rpx rgba(34, 197, 94, 0.18) !important;
}

.chat-page.theme-dark .bubble-sender,
.chat-page.theme-dark .bubble-meta-time {
color: var(--text-tertiary) !important;
}

.chat-page.theme-dark .chat-empty {
color: var(--text-tertiary) !important;
}

.chat-page.theme-dark .chat-input {
background: linear-gradient(180deg, #1a2332 0%, #1e293b 100%) !important;
border-top-color: var(--border-color) !important;
}

.chat-page.theme-dark .input-field {
background-color: var(--input-bg) !important;
color: var(--text-primary) !important;
border-color: var(--input-border) !important;
box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.25) !important;
}

.chat-page.theme-dark .send-button {
background: linear-gradient(135deg, #2563eb 0%, #6366f1 100%) !important;
box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.35) !important;
}

.chat-page.theme-dark .multi-bar {
background: linear-gradient(180deg, #1a2332 0%, #1e293b 100%) !important;
border-top-color: var(--border-color) !important;
}

.chat-page.theme-dark .multi-count {
color: var(--text-secondary) !important;
}

.chat-page.theme-dark .float-to-bottom {
background: rgba(30, 41, 59, 0.92) !important;
border-color: var(--border-color) !important;
}

.chat-page.theme-dark .float-to-bottom-icon {
color: var(--text-secondary) !important;
}

.chat-page.theme-dark .employee-panel {
background: var(--bg-primary) !important;
border-bottom-color: var(--border-color) !important;
}

.chat-page.theme-dark .employee-item {
background: var(--bg-secondary) !important;
border: 1rpx solid var(--border-color) !important;
}

.chat-page.theme-dark .employee-id {
color: var(--text-primary) !important;
}

.chat-page.theme-dark .employee-raw,
.chat-page.theme-dark .employee-empty {
color: var(--text-tertiary) !important;
}
</style>