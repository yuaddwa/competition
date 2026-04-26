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
<image
v-if="!msg.isMine && avatarSrc(msg, false)"
class="bubble-avatar-img"
:class="{ 'bubble-avatar-tappable': mode === 'virtual' && (virtualKind === 'group' || virtualKind === 'hq') }"
:src="avatarSrc(msg, false)"
mode="aspectFill"
@tap.stop="openPeerAvatarPrivateChat(msg)"
/>
<view
v-else-if="!msg.isMine"
class="bubble-avatar"
:class="{ 'bubble-avatar-tappable': mode === 'virtual' && (virtualKind === 'group' || virtualKind === 'hq') }"
@tap.stop="openPeerAvatarPrivateChat(msg)"
>{{ avatarText(msg, false) }}</view>
<view class="bubble-main">
<view v-if="!msg.isMine && msg.senderName" class="bubble-sender-row">
<text class="bubble-sender">{{ msg.senderName }}</text>
<text v-if="(virtualKind === 'group' || virtualKind === 'hq') && msg.senderModel" class="bubble-model-pill">{{ msg.senderModel }}</text>
</view>
<view
class="message-bubble"
:class="{ 'my-message': msg.isMine }"
@longpress.stop="onBubbleLongPress(msg)"
>
<text class="bubble-text">{{ renderTextContent(msg.content) }}</text>
<view v-if="extractImageUrls(msg.content).length" class="bubble-images">
<image
v-for="(img, idx) in extractImageUrls(msg.content)"
:key="msg.id + '_img_' + idx"
class="bubble-image"
:src="img"
mode="aspectFill"
@tap.stop="previewImages(extractImageUrls(msg.content), idx)"
/>
</view>
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
<input
type="text"
v-model="inputText"
:placeholder="t('chat_input_placeholder')"
class="input-field"
confirm-type="send"
:disabled="sending"
@confirm="sendMessage"
/>
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

function escapeRegExp(s) {
return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWs(s) {
return String(s || "")
.replace(/\s+/g, " ")
.replace(/[（]/g, "(")
.replace(/[）]/g, ")")
.trim();
}

/** 收集当前发言者之外、最近几条同伴气泡正文，用于去掉模型整段复述 */
function recentPeerMessageBodies(chatMessages, excludeMember, maxCount = 8) {
const sid = String(excludeMember?.id || excludeMember?.agentId || "").trim();
const out = [];
const arr = Array.isArray(chatMessages) ? chatMessages : [];
for (let i = arr.length - 1; i >= 0 && out.length < maxCount; i--) {
const m = arr[i];
if (!m || m.isMine) continue;
const mid = String(m.senderId || m.agentId || "").trim();
if (sid && mid && mid === sid) continue;
const body = String(m.content || m.body || m.text || "").trim();
if (body.length >= 12) out.push(body);
}
return out;
}

/** 去掉正文开头对同伴上一条（或几条）气泡的整段复制，常见于模型把历史 assistant 又写了一遍 */
function stripVerbatimEchoFromPriorPeers(text, peerBodies, minLen = 20) {
let t = String(text || "").trim();
if (!t || !Array.isArray(peerBodies) || peerBodies.length === 0) return t;
const bodies = [...new Set(peerBodies.map((b) => String(b || "").trim()).filter((b) => b.length >= minLen))].sort((a, b) => b.length - a.length);
for (let guard = 0; guard < 6; guard++) {
let changed = false;
const chunks = t.split(/\n\n+/);
if (chunks.length >= 2) {
const head = chunks[0].trim();
for (const b of bodies) {
if (head === b || normalizeWs(head) === normalizeWs(b)) {
t = chunks.slice(1).join("\n\n").trim();
changed = true;
break;
}
}
if (changed) continue;
}
if (!changed) {
const lines = t.split(/\n/);
if (lines.length >= 2) {
const head = lines[0].trim();
for (const b of bodies) {
if (head.length >= minLen && (head === b || normalizeWs(head) === normalizeWs(b))) {
t = lines.slice(1).join("\n").trim();
changed = true;
break;
}
}
}
if (changed) continue;
}
for (const b of bodies) {
if (b && t.startsWith(b)) {
t = t.slice(b.length).replace(/^[\s:：;；,，。.!?！？]+/, "").trim();
changed = true;
break;
}
const nb = normalizeWs(b);
const nt = normalizeWs(t);
if (nb.length >= minLen && nt.startsWith(nb)) {
let cut = 0;
for (let i = 1; i <= t.length; i++) {
if (normalizeWs(t.slice(0, i)) === nb) {
cut = i;
break;
}
}
if (cut > 0) {
t = t.slice(cut).replace(/^[\s:：;；,，。.!?！？]+/, "").trim();
changed = true;
break;
}
}
}
if (!changed) break;
}
return t;
}

/** 去掉正文开头「某成员名：」式重复抬头（气泡上方已有发送者，勿再写一遍） */
function stripLeadingRosterSpeakerPrefix(raw, roster) {
const orig = String(raw || "").trim();
let text = orig;
if (!text || !Array.isArray(roster) || roster.length === 0) return text;
const labels = new Set();
for (const m of roster) {
const n = String(m?.name || m?.displayName || "").trim();
if (n.length >= 2) labels.add(n);
const nn = String(m?.name || m?.displayName || "").trim();
const role = String(m?.role || m?.jobTitle || "").trim();
const nav = formatAgentNavTitle({ name: nn, role });
if (nav && String(nav).trim().length >= 2) labels.add(String(nav).trim());
if (nn && role) {
labels.add(`${nn} (${role})`);
labels.add(`${nn}（${role}）`);
}
}
const sorted = [...labels].sort((a, b) => b.length - a.length);
for (let loop = 0; loop < 6; loop++) {
let changed = false;
for (const label of sorted) {
const re = new RegExp(`^(?:\\*\\*)?${escapeRegExp(label)}(?:\\*\\*)?\\s*[:：]\\s*`, "i");
if (re.test(text)) {
text = text.replace(re, "").trim();
changed = true;
}
}
if (!changed) break;
}
return text || orig;
}

/** 同一条气泡里若新起一行写成「其他同事名：」代他人说话，从该行起整段丢弃 */
function stripOtherSpeakerLines(raw, member, roster) {
const full = String(raw || "").trim();
if (!full || !Array.isArray(roster) || roster.length === 0) return full;
const sid = String(member?.id || member?.agentId || "").trim();
const myPlain = String(member?.name || member?.displayName || "").trim();
const myNav = formatAgentNavTitle({
name: member?.name || member?.displayName,
role: member?.role || member?.jobTitle,
});
const selfLabels = new Set([myPlain, myNav].map((s) => String(s).trim()).filter(Boolean));
const peerPrefixes = [];
for (const m of roster) {
const pid = String(m?.id || m?.agentId || "").trim();
if (sid && pid && sid === pid) continue;
const plain = String(m?.name || m?.displayName || "").trim();
const nav = formatAgentNavTitle({
name: m?.name || m?.displayName,
role: m?.role || m?.jobTitle,
});
if (plain && !selfLabels.has(plain)) peerPrefixes.push(plain);
if (nav && !selfLabels.has(nav)) peerPrefixes.push(nav);
}
const uniq = [...new Set(peerPrefixes)].sort((a, b) => b.length - a.length);
const lines = full.split(/\n+/);
const out = [];
for (const line of lines) {
const t = line.trim();
if (!t) continue;
let stolen = false;
for (const p of uniq) {
if (p.length < 2) continue;
const re = new RegExp(`^(?:\\*\\*)?${escapeRegExp(p)}(?:\\*\\*)?\\s*[:：]`, "i");
if (re.test(t)) {
stolen = true;
break;
}
}
if (stolen) break;
out.push(line);
}
const joined = out.join("\n").trim();
return joined || full.split(/\n/)[0].trim() || full;
}

/** 控制单条气泡长度，避免一屏刷满 */
function clampGroupReplyLength(text, maxChars = 200) {
const s = String(text || "").trim();
if (s.length <= maxChars) return s;
const cut = s.slice(0, maxChars);
const idx = Math.max(
cut.lastIndexOf("。"),
cut.lastIndexOf("！"),
cut.lastIndexOf("？"),
cut.lastIndexOf("；")
);
if (idx >= 48) return `${cut.slice(0, idx + 1)}…`;
return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}

/** 群聊是纯线上协作，移除拟人化“线下实体行动”描述 */
function sanitizeGroupVirtualTone(raw) {
let s = String(raw || "").trim();
if (!s) return s;
const replacers = [
[/线下回合/g, "下一步协作"],
[/线下沟通/g, "群内沟通"],
[/线下对齐/g, "在线对齐"],
[/当面(?:沟通|确认|同步|讨论)?/g, "在线沟通"],
[/见面(?:沟通|确认|同步|讨论)?/g, "在线沟通"],
[/约个会(?:议)?(?:室)?/g, "开个线上会"],
[/去会议室/g, "线上开会"],
[/到现场/g, "在线处理"],
[/跑一趟/g, "跟进处理"],
];
for (const [re, to] of replacers) s = s.replace(re, to);
s = s.replace(/(?:我们|我)(?:先)?线下(?:再)?聊(?:一下)?/g, "我们在线上继续聊");
s = s.replace(/\s{2,}/g, " ").trim();
return s;
}

/** 群聊接续轮：模型表示无需再说话时，不落气泡 */
function isContinuationSkipToken(text) {
const s = String(text || "").trim();
if (!s) return true;
const one = s
.replace(/^[（(]\s*/, "")
.replace(/\s*[）)]$/, "")
.replace(/[。….!！?？.]+$/g, "")
.trim()
.toLowerCase();
if (!one) return true;
if (/^(无|没有|不用|不需要|跳过|略|沒|無)$/.test(one)) return true;
if (/^(none|no|n\/a|skip|pass|nothing)$/i.test(one)) return true;
return false;
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
this.virtualKind = options.kind ? String(decodeURIComponent(options.kind)).trim().toLowerCase() : "";
this.virtualId = options.id ? String(decodeURIComponent(options.id)).trim() : "";
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
`收到哈，我这边先按「${brief}」往前推，有进展马上群里说。`,
`行，${agentRole || "这块"}我盯着，先把事拆开，风险点我同步一下。`,
`我先说个能落地的：范围先对齐，再给节点和大概交付时间哈。`,
`我补一句啊，要是这事最急，我可以先搞个最小能用的版本出来。`,
];
return templates[idx % templates.length];
},
buildGroupAgentSystemPrompt(member, groupTitle = "", roster = [], opts = {}) {
const continuation = !!(opts && opts.continuation);
const name = String(member?.name || member?.displayName || "").trim() || this.t("digital_employee_fallback");
const role = String(member?.role || member?.jobTitle || "").trim() || this.t("agent_seed_role_fallback");
const dept = String(member?.department || "").trim();
const group = String(groupTitle || this.virtualTitle || "").trim();
const rosterLines = (Array.isArray(roster) ? roster : [])
  .map((m) => {
    const display = String(m?.name || m?.displayName || "").trim();
    if (!display) return "";
    const rid = String(m?.id || m?.agentId || "").trim();
    const rrole = String(m?.role || m?.jobTitle || "").trim() || "成员";
    return `- @${display}（${rrole}）${rid ? ` id:${rid}` : ""}`;
  })
  .filter(Boolean);
const rosterBlock =
  rosterLines.length > 0
    ? [
        "群内成员（称呼同事时必须使用 @显示名，例如 @张三；不要用 Markdown **姓名:** 或加粗行首当称呼；需要对方配合时请写出 @对方显示名）：",
        rosterLines.join("\n"),
      ].join("\n")
    : "";
const parts = [
`你是项目群成员「${name}」本人，职责：${role}。`,
dept ? `所属部门：${dept}。` : "",
group ? `当前群聊：${group}。` : "",
rosterBlock,
"【身份】你只能代表自己发言，一条消息里禁止替其他同事代写、禁止分段扮演多人；不要出现「某某：」另起一段假装别人说话；其他人的话会由他们自己发一条气泡。",
"【禁止复述】不要整段复制或复述上一位同事刚发过的气泡内容；若认同对方，用一两句自己的话接一下即可。",
"【协作介质】你是纯数字员工，没有线下实体行动；禁止使用“线下回合/当面聊/见面/去会议室/到现场/跑一趟”等措辞，统一使用“线上/群内/文档/接口/异步同步”等表达。",
continuation
  ? "【长度·接续】若需要接话，控制在约 1～3 句、中文总字数尽量不超过 120 字。"
  : "【长度】口语自然即可；整段控制在约 2～4 句、中文总字数尽量不超过 160 字，手机上一眼能扫完。",
"【协作】需要谁配合只用句内 @显示名 点一下即可，不要写长串角色扮演。",
continuation ? "" : "【收尾】用一句说清楚你这边下一步或待确认点即可，别堆大段背景。",
continuation ? this.t("group_prompt_continuation_suffix") : "",
];
return parts.filter(Boolean).join("\n");
},
buildGroupApiMessages(extraUserPrompt = "") {
const recent = (Array.isArray(this.chatMessages) ? this.chatMessages : []).slice(-26);
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
const isHq = this.virtualKind === "hq";
const g = isHq ? null : getProjectGroupById(this.virtualId);
const pickedMembers = isHq ? loadDigitalAgents() : (Array.isArray(g?.members) ? g.members : []);
const candidates = pickedMembers.length ? pickedMembers : loadDigitalAgents();
const roster = candidates;
const maxAgents = Math.min(Math.max(1, candidates.length), 8);
const picked = candidates.slice(0, maxAgents);
if (!Array.isArray(picked) || picked.length === 0) return;
const { apiKey, baseUrl, model } = getLlmSettings();
if (!apiKey) {
  uni.showToast({ title: this.t("toast_set_api_key_in_profile"), icon: "none" });
  picked.forEach((a, idx) => {
    const name = String(a?.name || a?.displayName || "").trim() || displayAgentName(a) || this.t("digital_employee_fallback");
    const role = String(a?.role || a?.jobTitle || "").trim() || displayAgentRole(a);
    const aid = String(a?.id || a?.agentId || "").trim();
    const agentModel = (aid && getAgentModelOrDefault(aid)) || model;
    appendVirtualChat(this.virtualKind, this.virtualId, {
      content:
        this.buildGroupAutoReplyContent(name, role, userText, idx) +
        ((this.virtualKind === "hq" || /新闻|news|天气|weather|全球|前沿|趋势/i.test(userText))
          ? this.buildImageBundleForReply(userText)
          : ""),
      isMine: false,
      senderName: formatAgentNavTitle({ name, role }) || name,
      senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
      senderId: aid,
      senderModel: agentModel,
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
    const aid = String(a?.id || a?.agentId || "").trim();
    const agentModel = (aid && getAgentModelOrDefault(aid)) || model;
    const system = this.buildGroupAgentSystemPrompt(a, (isHq ? this.virtualTitle : g?.name) || this.virtualTitle || "", roster);
    const msgs = this.buildGroupApiMessages();
    try {
      const res = await chatCompletion({ apiKey, baseUrl, model: agentModel, system, messages: msgs });
      const raw = extractAssistantText(res) || this.buildGroupAutoReplyContent(name, role, userText, idx);
      let text = stripLeadingRosterSpeakerPrefix(raw, roster) || raw;
      text = stripVerbatimEchoFromPriorPeers(text, recentPeerMessageBodies(this.chatMessages, a, 8));
      text = stripOtherSpeakerLines(text, a, roster);
      text = sanitizeGroupVirtualTone(text);
      text = clampGroupReplyLength(text, 200);
      if (!String(text || "").trim()) {
        text = this.buildGroupAutoReplyContent(name, role, userText, idx);
      }
      if (this.virtualKind === "hq" || /新闻|news|天气|weather|全球|前沿|趋势/i.test(userText)) {
        text += this.buildImageBundleForReply(`${userText}\n${text}`);
      }
      appendVirtualChat(this.virtualKind, this.virtualId, {
        content: text,
        isMine: false,
        senderName,
        senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
        senderId: aid,
        senderModel: agentModel,
      });
    } catch {
      appendVirtualChat(this.virtualKind, this.virtualId, {
        content:
          this.buildGroupAutoReplyContent(name, role, userText, idx) +
          ((this.virtualKind === "hq" || /新闻|news|天气|weather|全球|前沿|趋势/i.test(userText))
            ? this.buildImageBundleForReply(userText)
            : ""),
        isMine: false,
        senderName,
        senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
        senderId: aid,
        senderModel: agentModel,
      });
    }
    this.loadVirtualMessages(false);
    this.$nextTick(() => this.scrollToBottom());
    await new Promise((r) => setTimeout(r, 900));
  }
  // 第二轮：同伴互问 / @ 之后可再简短接一句，避免话头悬在半空
  if (picked.length >= 2) {
    await new Promise((r) => setTimeout(r, 550));
    for (let idx = 0; idx < picked.length; idx++) {
      const a = picked[idx] || {};
      const name = String(a?.name || a?.displayName || "").trim() || displayAgentName(a) || this.t("digital_employee_fallback");
      const role = String(a?.role || a?.jobTitle || "").trim() || displayAgentRole(a);
      const senderName = formatAgentNavTitle({ name, role }) || name;
      const aid = String(a?.id || a?.agentId || "").trim();
      const agentModel = (aid && getAgentModelOrDefault(aid)) || model;
      const system = this.buildGroupAgentSystemPrompt(a, (isHq ? this.virtualTitle : g?.name) || this.virtualTitle || "", roster, { continuation: true });
      const msgs = this.buildGroupApiMessages();
      try {
        const res = await chatCompletion({ apiKey, baseUrl, model: agentModel, system, messages: msgs });
        const raw = extractAssistantText(res);
        let text = raw ? stripLeadingRosterSpeakerPrefix(raw, roster) || raw : "";
        text = stripVerbatimEchoFromPriorPeers(text, recentPeerMessageBodies(this.chatMessages, a, 8));
        text = stripOtherSpeakerLines(text, a, roster);
        text = sanitizeGroupVirtualTone(text);
        text = text ? clampGroupReplyLength(text, 140) : "";
        if (isContinuationSkipToken(text)) continue;
        if (!String(text || "").trim()) continue;
        if (this.virtualKind === "hq" || /新闻|news|天气|weather|全球|前沿|趋势/i.test(userText)) {
          text += this.buildImageBundleForReply(`${userText}\n${text}`);
        }
        appendVirtualChat(this.virtualKind, this.virtualId, {
          content: text,
          isMine: false,
          senderName,
          senderAvatar: String(a?.avatar || a?.avatarUrl || a?.headImg || a?.headimg || "").trim(),
          senderId: aid,
          senderModel: agentModel,
        });
        this.loadVirtualMessages(false);
        this.$nextTick(() => this.scrollToBottom());
      } catch {
        //
      }
      await new Promise((r) => setTimeout(r, 750));
    }
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
extractImageUrls(content) {
const s = String(content || "");
const re = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))(?:\?[^\s]*)?/gi;
const out = [];
let m;
while ((m = re.exec(s)) !== null) {
const u = String(m[0] || "").trim();
if (u) out.push(u);
}
return [...new Set(out)].slice(0, 4);
},
renderTextContent(content) {
const s = String(content || "").trim();
if (!s) return "";
return s.replace(/(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))(?:\?[^\s]*)?/gi, "").trim();
},
previewImages(urls, current = 0) {
const arr = Array.isArray(urls) ? urls.filter(Boolean) : [];
if (!arr.length) return;
uni.previewImage({ urls: arr, current: arr[Math.max(0, Math.min(current, arr.length - 1))] });
},
buildImageBundleForReply(seed = "") {
const text = String(seed || "");
const tech = [
"https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=60",
"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=60",
"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=60",
];
const world = [
"https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1200&q=60",
"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=60",
];
const weather = [
"https://images.unsplash.com/photo-1500740516770-92bd004b996e?auto=format&fit=crop&w=1200&q=60",
"https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=60",
];
let pool = tech;
if (/天气|weather|气温|降雨|晴|阴|云|风/i.test(text)) pool = weather;
else if (/全球|国际|world|economy|policy|地缘|宏观/i.test(text)) pool = world;
const one = pool[Math.floor(Math.random() * pool.length)];
const two = pool[(Math.floor(Math.random() * pool.length) + 1) % pool.length];
return `\n图片参考：\n${one}\n${two}`;
},
safeScrollId(id) {
return "sm-" + String(id == null ? "x" : id).replace(/[^a-zA-Z0-9_-]/g, "_");
},
resolveGroupMessageAgentId(msg) {
const sid = String(msg?.senderId || "").trim();
if (sid) return sid;
if (this.mode !== "virtual" || !this.virtualId) return "";
let members = [];
if (this.virtualKind === "group") {
const g = getProjectGroupById(this.virtualId);
members = Array.isArray(g?.members) ? g.members : [];
} else if (this.virtualKind === "hq") {
members = loadDigitalAgents();
}
const want = String(msg?.senderName || "").trim();
if (!want || !members.length) return "";
for (const m of members) {
const name = String(m?.name || m?.displayName || "").trim();
const nav = formatAgentNavTitle({
name: m?.name || m?.displayName,
role: m?.role || m?.jobTitle,
});
if (nav && want === nav) return String(m?.id || m?.agentId || "").trim();
if (name && want === name) return String(m?.id || m?.agentId || "").trim();
}
return "";
},
openPeerAvatarPrivateChat(msg) {
if (this.mode !== "virtual" || !["group", "hq"].includes(this.virtualKind) || !msg || msg.isMine) return;
if (this.multiSelectMode) return;
const agentId = this.resolveGroupMessageAgentId(msg);
if (!agentId) {
uni.showToast({ title: this.t("toast_group_member_no_agent_id"), icon: "none" });
return;
}
const local = getDigitalAgentById(agentId);
const g = this.virtualKind === "group" ? getProjectGroupById(this.virtualId) : null;
const row = (this.virtualKind === "hq" ? loadDigitalAgents() : (Array.isArray(g?.members) ? g.members : [])).find(
(r) => String(r?.id || r?.agentId || "").trim() === agentId
);
let title = "";
if (local) {
title =
formatAgentNavTitle({
name: displayAgentName(local),
role: displayAgentRole(local),
}) || displayAgentName(local);
} else if (row) {
title =
formatAgentNavTitle({
name: row.name || row.displayName,
role: row.role || row.jobTitle,
}) || String(msg.senderName || "").trim();
} else {
title = String(msg.senderName || "").trim() || this.t("digital_employee_fallback");
}
uni.navigateTo({
url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(agentId)}&title=${encodeURIComponent(title)}`,
});
},
openSettings() {
const q = [];
if (this.mode === "virtual") {
q.push("mode=virtual");
const vk = String(this.virtualKind || "").trim().toLowerCase();
const vid = String(this.virtualId || "").trim();
q.push(`kind=${encodeURIComponent(vk)}`);
q.push(`id=${encodeURIComponent(vid)}`);
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
let groupRoster = [];
if ((this.virtualKind === "group" || this.virtualKind === "hq") && this.virtualId) {
if (this.virtualKind === "hq") {
groupRoster = loadDigitalAgents();
} else {
const gd = getProjectGroupById(this.virtualId);
groupRoster = Array.isArray(gd?.members) ? gd.members : [];
}
}
this.chatMessages = list.map((m) => {
const sid = String(m.senderId || "").trim();
const storedModel = String(m.senderModel || "").trim();
const senderModel =
  storedModel ||
  ((this.virtualKind === "group" || this.virtualKind === "hq") && sid ? getAgentModelOrDefault(sid) : "");
let content = m.content;
if ((this.virtualKind === "group" || this.virtualKind === "hq") && groupRoster.length && !m.isMine) {
content = stripLeadingRosterSpeakerPrefix(m.content, groupRoster) || m.content;
}
return {
id: m.id,
content,
time: m.time,
isMine: !!m.isMine,
senderName: m.senderName || "",
senderAvatar: m.senderAvatar || "",
senderId: sid,
senderModel,
};
});
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
if (this.virtualKind === "group" || this.virtualKind === "hq") {
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

.bubble-avatar-tappable {
position: relative;
}

.bubble-avatar-tappable:active {
opacity: 0.82;
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

.bubble-sender-row {
display: flex;
flex-wrap: wrap;
align-items: center;
gap: 8rpx;
margin-bottom: 8rpx;
margin-left: 6rpx;
max-width: 100%;
}

.bubble-sender {
font-size: 22rpx;
color: #64748b;
font-weight: 500;
}

.bubble-model-pill {
font-size: 18rpx;
color: #475569;
background: #f1f5f9;
padding: 2rpx 12rpx;
border-radius: 999rpx;
max-width: 70%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
border: 1rpx solid rgba(148, 163, 184, 0.35);
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

.bubble-images {
display: flex;
flex-direction: row;
flex-wrap: wrap;
gap: 10rpx;
margin-top: 10rpx;
}

.bubble-image {
width: 180rpx;
height: 132rpx;
border-radius: 10rpx;
background: #e2e8f0;
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

.chat-page.theme-dark .bubble-model-pill {
color: var(--text-secondary) !important;
background: rgba(51, 65, 85, 0.85) !important;
border-color: var(--border-color) !important;
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