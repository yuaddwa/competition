<template>
<view class="chat-page">
<view class="chat-header-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
<view class="chat-header">
<text class="back-button iconfont" @click="goBack">&#xe602;</text>
<text v-if="headerIsBoss" class="avatar-icon iconfont icon-laoban"></text>
<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
<text class="chat-title">{{ headerTitle }}</text>
<text class="chat-more" @click="openSettings">⋯</text>
</view>
</view>

<view v-if="loading" class="chat-empty">
<text>加载中…</text>
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
<view id="chat-bottom-anchor" class="bottom-anchor"></view>
</view>
</scroll-view>

<view v-if="showStickBottom && !multiSelectMode" class="float-to-bottom" @click="scrollToBottom">
<text class="float-to-bottom-icon">⌄</text>
</view>
</view>

<view v-else class="chat-empty chat-empty-flex">
<text>暂无消息</text>
</view>

<view v-if="!loading && multiSelectMode" class="multi-bar safe-bottom">
<text class="multi-cancel" @click="exitMultiSelect">取消</text>
<text class="multi-count">已选 {{ selectedIds.length }} 条</text>
<view class="multi-actions">
<text class="multi-link" @click="batchCopy">复制</text>
<text class="multi-link" @click="batchForward">转发</text>
<text class="multi-link multi-link-danger" @click="batchDelete">删除</text>
</view>
</view>

<view v-else-if="!loading" class="chat-input safe-bottom">
<input type="text" v-model="inputText" placeholder="输入消息..." class="input-field" confirm-type="send" :disabled="sending" @confirm="sendMessage" />
<view class="send-button" :class="{ 'send-disabled': sending }" @click="sendMessage"><text>{{ sending ? "请求中…" : "发送" }}</text></view>
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
} from "@/utils/virtualTeamStore";
import * as workflowApi from "@/clientApi/workflowApi";
import { pickId } from "@/utils/apiHelpers";
import { getUserInfo } from "@/utils/index";
import { getAgentById } from "@/clientApi/agentsApi";
import { getPersonaById } from "@/utils/agentPersonaCatalog";
import { getLlmSettings } from "@/utils/llmSettings";
import { chatCompletion } from "@/utils/openaiCompatible";
import { extractAssistantText } from "@/utils/openaiResponse";

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

const ID_TOKEN_CN_MAP = {
eng: "工程",
des: "设计",
paid: "付费媒体",
sales: "销售",
mkt: "市场",
prd: "产品",
pm: "项目管理",
qa: "测试",
sup: "支援",
spatial: "空间计算",
sp: "专业",
fin: "财务",
ac: "学术",
frontend: "前端",
backend: "后端",
mobile: "移动应用",
ai: "人工智能",
ui: "界面设计",
ux: "用户体验",
arch: "架构",
ppc: "PPC投放",
tracking: "跟踪测量",
creative: "创意",
outbound: "外联",
deal: "交易",
se: "销售工程",
growth: "增长",
content: "内容",
seo: "搜索优化",
feedback: "反馈",
pri: "优先级",
shepherd: "项目牧羊人",
experiment: "实验追踪",
jira: "Jira流程",
evidence: "证据收集",
api: "接口测试",
perf: "性能测试",
response: "响应支持",
analytics: "分析",
compliance: "合规",
xr: "XR交互",
vision: "visionOS",
metal: "Metal渲染",
orchestrator: "编排",
mcp: "MCP",
doc: "文档",
bookkeeper: "账务控制",
fpa: "财务规划分析",
tax: "税务",
anthro: "人类学",
history: "历史学",
psych: "心理学"
};

function translateIdToChinese(id) {
if (!id) return "";
return id
.split("-")
.map(token => ID_TOKEN_CN_MAP[token] || token.toUpperCase())
.join("·");
}

function normalizeDepartmentName(name) {
return (name || "")
.replace(/^[^\s\u4e00-\u9fa5A-Za-z]+/, "")
.replace(/\s+/g, "")
.trim();
}

const UI_DESIGNER_EMPLOYEE_ID = "des-ui";
const UI_DESIGNER_DEPARTMENT = "设计部";

export default {
data() {
return {
statusBarPx: 20,
projectName: "",
mode: "local",
workflowId: "",
threadId: "",
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
};
},
computed: {
headerTitle() {
if (this.mode === "virtual") {
return (this.virtualTitle || "").trim() || "聊天";
}
if (this.mode === "remote") {
const a = (this.workflowTitle || "").trim();
const b = (this.threadTitle || "").trim();
if (a && b) return `${a} · ${b}`;
return a || b || "工作流沟通";
}
return this.projectName || "聊天";
},
headerIsBoss() {
return this.mode === "local" && this.projectName === "老板";
},
},
onLoad(options) {
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
safeScrollId(id) {
return "sm-" + String(id == null ? "x" : id).replace(/[^a-zA-Z0-9_-]/g, "_");
},
goBack() {
uni.navigateBack();
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
success: () => uni.showToast({ title: "已复制", icon: "none" }),
});
},
forwardMessage(msg) {
const t = msg && msg.content ? String(msg.content) : "";
if (!t) return;
uni.setStorageSync("chat_forward_draft", t);
uni.setClipboardData({
data: t,
success: () => uni.showToast({ title: "已复制，可粘贴到其他会话", icon: "none", duration: 2200 }),
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
uni.showToast({ title: "请先选择消息", icon: "none" });
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
uni.showToast({ title: "请先选择消息", icon: "none" });
return;
}
const text = list
.map((m) => m.content || "")
.filter(Boolean)
.join("\n");
uni.setStorageSync("chat_forward_draft", text);
uni.setClipboardData({
data: text,
success: () => uni.showToast({ title: "已复制合并内容，可粘贴到其他会话", icon: "none", duration: 2200 }),
});
},
batchDelete() {
if (this.mode === "remote") {
uni.showToast({ title: "远程会话暂不支持删除", icon: "none" });
return;
}
const list = this.selectedMessagesList();
if (!list.length) {
uni.showToast({ title: "请先选择消息", icon: "none" });
return;
}
uni.showModal({
title: "删除消息",
content: `将删除已选的 ${list.length} 条消息（仅本机）`,
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
uni.showToast({ title: "远程消息暂不支持撤回", icon: "none" });
return;
}
if (this.mode === "virtual") {
removeVirtualChatMessage(this.virtualKind, this.virtualId, msg.id);
this.loadVirtualMessages(false);
} else {
removeLocalProjectMessage(this.projectName, msg.id);
this.loadChatMessages(false);
}
uni.showToast({ title: "已撤回", icon: "none" });
this.$nextTick(() => this.scrollToBottom());
},
deleteMessage(msg) {
if (!msg) return;
if (this.mode === "remote") {
uni.showToast({ title: "远程消息无法删除", icon: "none" });
return;
}
uni.showModal({
title: "删除消息",
content: "从本机删除该条消息？",
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
const handlers = [];
const push = (label, fn) => {
itemList.push(label);
handlers.push(fn);
};
push("复制", () => this.copyText(msg.content));
if (!isRemote) {
if (msg.isMine && this.canRecall(msg)) {
push("撤回", () => this.recallMessage(msg));
}
push("删除", () => this.deleteMessage(msg));
}
push("转发", () => this.forwardMessage(msg));
push("多选", () => this.enterMultiSelect(msg));
uni.showActionSheet({
itemList,
success: (res) => {
const fn = handlers[res.tapIndex];
if (fn) fn();
},
});
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
const list = await workflowApi.listMessages(this.workflowId, this.threadId);
const arr = Array.isArray(list) ? list : [];
const sorted = [...arr].sort((a, b) => {
const ta = new Date(messageTime(a) || 0).getTime();
const tb = new Date(messageTime(b) || 0).getTime();
return ta - tb;
});
const user = getUserInfo();
this.chatMessages = sorted.map((m) => ({
id: pickId(m) || m.messageId || `m-${messageTime(m)}`,
content: messageBody(m) || "（空）",
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
ensureAgentChatSeed(this.virtualId);
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
async sendPersonaMessage() {
const body = (this.inputText || "").trim();
if (!body || this.sending) return;
const { apiKey, baseUrl, model } = getLlmSettings();
if (!apiKey) {
uni.showToast({ title: "请先在「我的 → 模型与 API」填写密钥", icon: "none" });
return;
}
if (!this.personaSystemPrompt || !String(this.personaSystemPrompt).trim()) {
await this.fetchPersonaMaterial();
}
if (!this.personaSystemPrompt || !String(this.personaSystemPrompt).trim()) {
uni.showToast({ title: "未获取到人设正文，请确认后端 /api/agents 可用", icon: "none" });
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
senderName: ((this.virtualTitle || "助手").slice(0, 16)),
});
} catch (e) {
console.warn("[chat] persona llm", e);
const errMsg = (e && e.message) || String(e || "");
uni.showToast({
title: errMsg.length > 36 ? "模型请求失败，请检查密钥与合法域名" : errMsg,
icon: "none",
duration: 2800,
});
appendVirtualChat("persona", this.virtualId, {
content: "（模型调用失败：请检查密钥、接口地址，且小程序需配置 request 合法域名）",
isMine: false,
senderName: "系统",
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
const body = userContent;
appendVirtualChat(this.virtualKind, this.virtualId, {
content: body,
isMine: true,
senderName: "",
});
this.inputText = "";
this.loadVirtualMessages(false);
this.$nextTick(() => this.scrollToBottom());
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
title: "消息",
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

if (
this.projectName === UI_DESIGNER_DEPARTMENT &&
this.selectedEmployeeId === UI_DESIGNER_EMPLOYEE_ID
) {
this.replyFromUiDesignerApi(userContent);
return;
}

if (this.projectName === "工程部" && this.selectedEmployeeId) {
setTimeout(() => {
const replyMessage = {
id: "msg-" + Date.now(),
projectName: "工程部",
employeeId: this.selectedEmployeeId,
title: "回复",
content: "好的，我知道了",
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
this.sending = true;
try {
await workflowApi.sendMessage(this.workflowId, this.threadId, {
content: body,
body,
});
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
background-color: #ededed;
}

.chat-header-wrap {
background-color: #ededed;
flex-shrink: 0;
border-bottom: 1rpx solid #d9d9d9;
}

.chat-header {
min-height: 88rpx;
background-color: #ededed;
display: flex;
align-items: center;
padding: 8rpx 24rpx 12rpx;
box-sizing: border-box;
}

.back-button {
font-size: 32rpx;
margin-right: 30rpx;
}

.avatar-icon {
font-family: "iconfont" !important;
font-size: 40rpx;
margin-right: 16rpx;
}

.chat-title {
font-size: 34rpx;
font-weight: 600;
flex: 1;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
text-align: center;
padding: 0 8rpx;
}

.chat-more {
font-size: 44rpx;
line-height: 1;
color: #111;
padding: 8rpx 0 8rpx 16rpx;
font-weight: 600;
letter-spacing: 2rpx;
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
padding: 20rpx;
padding-bottom: 24rpx;
}

.bottom-anchor {
height: 1px;
width: 100%;
}

.float-to-bottom {
position: absolute;
right: 28rpx;
bottom: 32rpx;
width: 72rpx;
height: 72rpx;
border-radius: 50%;
background: rgba(255, 255, 255, 0.96);
box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
display: flex;
align-items: center;
justify-content: center;
z-index: 50;
border: 1rpx solid #e0e0e0;
}

.float-to-bottom-icon {
font-size: 40rpx;
color: #576b95;
line-height: 1;
font-weight: 600;
}

.chat-empty {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
color: #999;
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
margin-bottom: 20rpx;
align-items: flex-start;
width: 100%;
box-sizing: border-box;
}

.bubble-row.my-message {
align-items: flex-end;
}

.bubble-row.multi-on.msg-selected .message-bubble {
box-shadow: 0 0 0 4rpx #07c160;
}

.bubble-sender {
font-size: 22rpx;
color: #888;
margin-bottom: 6rpx;
margin-left: 4rpx;
}

.bubble-row.my-message .bubble-sender {
display: none;
}

.message-bubble {
max-width: 70%;
padding: 16rpx 20rpx;
border-radius: 16rpx;
background-color: #fff;
box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
box-sizing: border-box;
word-break: break-word;
}

.message-bubble.my-message {
background-color: #007aff;
color: #fff;
}

.bubble-text {
font-size: 24rpx;
line-height: 1.5;
}

.message-bubble.my-message .bubble-text {
color: #fff;
}

.bubble-meta-time {
font-size: 20rpx;
color: #999;
margin-top: 8rpx;
}

.safe-bottom {
padding-bottom: env(safe-area-inset-bottom);
}

.chat-input {
min-height: 100rpx;
background-color: #fff;
border-top: 1rpx solid #e8e8e8;
display: flex;
align-items: center;
padding-left: 30rpx;
padding-right: 30rpx;
padding-top: 20rpx;
flex-shrink: 0;
gap: 20rpx;
z-index: 100;
box-sizing: border-box;
}

.input-field {
flex: 1;
height: 60rpx;
border: 1rpx solid #e8e8e8;
border-radius: 30rpx;
padding: 0 20rpx;
font-size: 24rpx;
}

.send-button {
padding: 12rpx 30rpx;
background-color: #007aff;
color: #fff;
border-radius: 30rpx;
font-size: 24rpx;
font-weight: 600;
}

.send-disabled {
opacity: 0.55;
pointer-events: none;
}

.multi-bar {
min-height: 100rpx;
background: #f7f7f7;
border-top: 1rpx solid #e0e0e0;
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
color: #576b95;
}

.multi-count {
flex: 1;
font-size: 26rpx;
color: #888;
}

.multi-actions {
display: flex;
flex-direction: row;
gap: 24rpx;
}

.multi-link {
font-size: 28rpx;
color: #576b95;
}

.multi-link-danger {
color: #fa5151;
}
</style>