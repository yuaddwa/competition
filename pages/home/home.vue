<template>
	<view class="page-root">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="navbar">
				<view class="navbar-side" />
				<view class="navbar-center">
					<text class="navbar-title">{{ t('hq_group') }}</text>
					<text class="navbar-sub">{{ t('hq_subtitle', { count: agentCount }) }}</text>
				</view>
				<view class="navbar-side navbar-side-right" @click="openHallSettings">
					<text class="navbar-more">⋯</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="chat-scroll" :scroll-into-view="scrollToId" scroll-with-animation>
			<view v-if="loading" class="chat-empty"><text>{{ t('loading') }}</text></view>
			<view v-else class="chat-inner">
				<view
					v-for="msg in hallMessages"
					:key="msg.id"
					:id="'m-' + msg.id"
					class="hall-row"
					:class="{ 'is-mine': msg.isMine }"
				>
					<view v-if="!msg.isMine" class="hall-left">
						<view class="hall-av" :style="{ background: avatarColor(msg.senderName || '') }">
							<text class="hall-av-t">{{ avatarLetter(msg) }}</text>
						</view>
						<view class="hall-bubble-wrap">
							<text v-if="msg.senderName" class="hall-name">{{ hallSenderLabel(msg.senderName) }}</text>
							<view class="hall-bubble" :class="{ manager: msg.isManager }">
								<text class="hall-text">{{ msg.content }}</text>
							</view>
							<text class="hall-time">{{ formatTime(msg.time) }}</text>
						</view>
					</view>
					<view v-else class="hall-right">
						<view class="hall-bubble mine">
							<text class="hall-text">{{ msg.content }}</text>
						</view>
						<text class="hall-time">{{ formatTime(msg.time) }}</text>
					</view>
				</view>
			</view>
			<view id="bottom-anchor" class="bottom-anchor" />
		</scroll-view>

		<view class="chat-input">
			<input type="text" v-model="inputText" class="input-field" :placeholder="t('send_message')" placeholder-class="iph" />
			<view class="send-button" @click="sendHall">{{ t('send') }}</view>
		</view>

		<AppTabBar current="home" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import { t, getLanguage } from "@/utils/lang";
	import { getLlmSettings } from "@/utils/llmSettings";
	import { chatCompletion } from "@/utils/openaiCompatible";
	import { extractAssistantText } from "@/utils/openaiResponse";
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";
	import {
		loadHQChatMessages,
		appendHQMessage,
		ensureHallWelcome,
		clearHQChatMessages,
		ensureHallLiveBroadcast,
		loadDigitalAgents,
		replaceDigitalAgentsFromUserAgents,
		resolveHallSenderDisplay,
		stripAgentMessageBodyPrefix,
		HQ_ID,
	} from "@/utils/virtualTeamStore";
	import { listMyUserAgents, listUserAgents } from "@/clientApi/agentsApi";

	export default {
		components: { AppTabBar },
		data() {
			return {
				statusBarPx: 20,
				hallMessages: [],
				loading: true,
				inputText: "",
				scrollToId: "",
				broadcasting: false,
				broadcastPollTimer: null,
			};
		},
		computed: {
			agentCount() {
				return loadDigitalAgents().length;
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.bootstrapHall();
		},
		onHide() {
			this.stopBroadcastPolling();
		},
		onUnload() {
			this.stopBroadcastPolling();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			openHallSettings() {
				uni.navigateTo({
					url: `/pages/chat/chat-settings?mode=virtual&kind=hq&id=${encodeURIComponent(HQ_ID)}&title=${encodeURIComponent(this.t('hq_group'))}`,
				});
			},
			async bootstrapHall() {
				this.loading = true;
				try {
					// 每次进入首页都重置会话，不加载历史，保持轻量流畅
					clearHQChatMessages();
					ensureHallWelcome();
					this.hallMessages = loadHQChatMessages();
					this.$nextTick(() => this.scrollToBottom());
					this.loading = false;

					// 后台分步刷新：先同步 Agent，再追加播报，不阻塞 UI
					try {
						let mine = await listMyUserAgents();
						if (!Array.isArray(mine) || mine.length === 0) mine = await listUserAgents();
						replaceDigitalAgentsFromUserAgents(mine);
					} catch {
						//
					}
					this.startBroadcastPolling();
					this.broadcasting = true;
					ensureHallLiveBroadcast()
						.catch(() => {
							//
						})
						.finally(() => {
							this.broadcasting = false;
							this.stopBroadcastPolling();
							this.hallMessages = loadHQChatMessages();
							this.$nextTick(() => this.scrollToBottom());
						});
				} finally {
					this.loading = false;
				}
			},
			startBroadcastPolling() {
				this.stopBroadcastPolling();
				this.broadcastPollTimer = setInterval(() => {
					const next = loadHQChatMessages();
					if (next.length !== this.hallMessages.length) {
						this.hallMessages = next;
						this.$nextTick(() => this.scrollToBottom());
					}
					if (!this.broadcasting) this.stopBroadcastPolling();
				}, 260);
			},
			stopBroadcastPolling() {
				if (this.broadcastPollTimer) clearInterval(this.broadcastPollTimer);
				this.broadcastPollTimer = null;
			},
			scrollToBottom() {
				// 先清空再设置，确保同一个锚点连续触发也能滚动
				this.scrollToId = "";
				this.$nextTick(() => {
					this.scrollToId = "bottom-anchor";
					setTimeout(() => {
						this.scrollToId = "";
					}, 220);
				});
			},
			sendHall() {
				const t = (this.inputText || "").trim();
				if (!t) return;
				appendHQMessage({ content: t, isMine: true, senderName: this.t("home_sender_me") });
				this.inputText = "";
				this.hallMessages = loadHQChatMessages();
				this.$nextTick(() => this.scrollToBottom());
				this.triggerHallAutoReplies(t);
			},
			buildHallFallbackReply(agent, userText, idx) {
				const lang = getLanguage();
				if (lang === "en") {
					const templates = [
						`Noted—I'll break down your note on "${userText.slice(0, 18)}" and share an action list within ~10 minutes.`,
						`I'll own this: I'll add risks and priorities, then reply here with conclusions.`,
						`One suggestion: ship a minimal version first, then iterate once we see impact.`,
						`Seen—I'll align details and come back with a steadier recommendation.`,
					];
					return templates[idx % templates.length];
				}
				const templates = [
					`收到，我先按您这条「${userText.slice(0, 18)}」拆解执行项，约 10 分钟内给您一版可落地清单。`,
					`这条我来跟进：我先补充关键风险和优先级，稍后在群里向您汇报结论。`,
					`我补一句：建议先做最小可用版本，把效果跑起来再迭代。`,
					`已看到，我这边先拉齐相关信息，再向您汇报一版更稳的推进建议。`,
				];
				return templates[idx % templates.length];
			},
			async triggerHallAutoReplies(userText) {
				// 控制节奏：避免一口气刷太多消息导致页面连续跳动
				const agents = loadDigitalAgents().slice(0, 3);
				if (!agents.length) return;
				const { apiKey, baseUrl, model } = getLlmSettings();
				if (!apiKey) {
					for (let idx = 0; idx < agents.length; idx++) {
						const a = agents[idx];
						appendHQMessage({
							content: this.buildHallFallbackReply(a, userText, idx),
							isMine: false,
							senderName: a.name,
						});
						this.hallMessages = loadHQChatMessages();
						this.$nextTick(() => this.scrollToBottom());
						await new Promise((r) => setTimeout(r, 380));
					}
					return;
				}
				const recent = loadHQChatMessages().slice(-18);
				const msgs = recent.map((m) => ({
					role: m.isMine ? "user" : "assistant",
					content: `${m.senderName || "成员"}：${m.content || ""}`,
				}));
				const lang = getLanguage();
				const bossCtx =
					lang === "en"
						? "The human who posts in this thread is the company owner or leader (your boss). Be respectful and execution-focused; never call them a new colleague, new hire, or welcome them as if they just joined."
						: "在群里发消息的真人用户是本公司的老板/负责人。你是下属数字员工：称呼用「您」或「老板」，语气尊重、简洁执行；绝对不要用「新同事」「新人」「欢迎加入团队」等把对方当成刚入职员工的说法。";
				for (let i = 0; i < agents.length; i++) {
					const a = agents[i];
					const aid = String(a?.id || "").trim();
					const senderName = String(a?.name || "").trim() || this.t("digital_employee_fallback");
					const system = [
						`你是全员群数字员工：${senderName}。`,
						bossCtx,
						lang === "en"
							? "Speak only as yourself in 1–3 short sentences; keep it concise and professional."
							: "只代表你自己发言，口吻自然、像向负责人汇报，1～3 句，80 字以内。",
						lang === "en"
							? "Do not repeat others verbatim; add your own takeaway or next step."
							: "不要复述他人整段内容，给出推进建议或结论。",
						lang === "en"
							? "Do not start the message body with your own name or nickname followed by a colon; the UI already shows who is speaking."
							: "【格式】正文开头不要写本人姓名或昵称加冒号（如不要「某某：…」），发送者已在气泡旁展示。",
					].join("\n");
					try {
						const res = await chatCompletion({
							apiKey,
							baseUrl,
							model: getAgentModelOrDefault(aid) || model,
							system,
							messages: msgs,
							timeoutMs: 14000,
						});
						const text = String(extractAssistantText(res) || "").trim();
						appendHQMessage({
							content:
								stripAgentMessageBodyPrefix(text, a) ||
								this.buildHallFallbackReply(a, userText, i),
							isMine: false,
							senderName,
						});
					} catch {
						appendHQMessage({
							content: this.buildHallFallbackReply(a, userText, i),
							isMine: false,
							senderName,
						});
					}
					this.hallMessages = loadHQChatMessages();
					this.$nextTick(() => this.scrollToBottom());
					await new Promise((r) => setTimeout(r, 420));
				}
			},
			avatarColor(name) {
				const colors = ["#07c160", "#10aeff", "#576b95", "#fa9d3b", "#1485ee", "#9a6bff"];
				let h = 0;
				const s = String(name || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			hallSenderLabel(raw) {
				return resolveHallSenderDisplay(raw);
			},
			avatarLetter(msg) {
				const lang = getLanguage();
				const fallback = t("profile_agent_char_fallback", lang);
				const raw = (msg.senderName || "").trim() || fallback;
				const shown = resolveHallSenderDisplay(raw);
				return shown.slice(0, 1);
			},
			formatTime(time) {
				const date = new Date(time);
				if (Number.isNaN(date.getTime())) return "";
				const h = date.getHours().toString().padStart(2, "0");
				const m = date.getMinutes().toString().padStart(2, "0");
				return `${h}:${m}`;
			},
		},
	};
</script>

<style>
	.page-root {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #ededed;
		box-sizing: border-box;
	}

	.navbar-wrap {
		background: #ededed;
		flex-shrink: 0;
		border-bottom: 1rpx solid #d9d9d9;
	}

	.navbar {
		min-height: 88rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 8rpx 16rpx 12rpx;
	}

	.navbar-side {
		width: 24rpx;
		min-width: 56rpx;
	}

	.navbar-side-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.navbar-more {
		font-size: 44rpx;
		font-weight: 600;
		color: #111;
		padding: 8rpx 8rpx 8rpx 16rpx;
		line-height: 1;
	}

	.navbar-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.navbar-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #000;
	}

	.navbar-sub {
		font-size: 22rpx;
		color: #888;
		margin-top: 4rpx;
		text-align: center;
		line-height: 1.35;
	}

	.chat-scroll {
		flex: 1;
		height: 0;
	}

	.chat-inner {
		padding: 20rpx 24rpx 24rpx;
	}

	.chat-empty {
		padding: 80rpx;
		text-align: center;
		color: #999;
		font-size: 28rpx;
	}

	.hall-row {
		margin-bottom: 28rpx;
	}

	.hall-row.is-mine {
		display: flex;
		justify-content: flex-end;
	}

	.hall-left {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.hall-av {
		width: 72rpx;
		height: 72rpx;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.hall-av-t {
		font-size: 28rpx;
		font-weight: 600;
		color: #fff;
	}

	.hall-bubble-wrap {
		max-width: 75%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.hall-name {
		font-size: 22rpx;
		color: #888;
		margin-bottom: 6rpx;
	}

	.hall-bubble {
		background: #fff;
		padding: 16rpx 20rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
	}

	.hall-bubble.manager {
		background: #e8f5e9;
		border: 1rpx solid #c8e6c9;
	}

	.hall-bubble.mine {
		background: #95ec69;
	}

	.hall-text {
		font-size: 28rpx;
		color: #191919;
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.hall-bubble.mine .hall-text {
		color: #191919;
	}

	.hall-time {
		font-size: 20rpx;
		color: #b2b2b2;
		margin-top: 8rpx;
	}

	.hall-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		max-width: 85%;
		margin-left: auto;
	}

	.bottom-anchor {
		height: 2rpx;
	}

	.chat-input {
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background: #f7f7f7;
		border-top: 1rpx solid #dcdcdc;
		display: flex;
		align-items: center;
		padding: 16rpx 24rpx;
		gap: 16rpx;
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.input-field {
		flex: 1;
		height: 72rpx;
		background: #fff;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}

	.iph {
		color: #bbb;
	}

	.send-button {
		padding: 16rpx 28rpx;
		background: #07c160;
		color: #fff;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 600;
	}

</style>
