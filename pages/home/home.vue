<template>
	<view class="page-root">
		<view class="workspace" :style="{ paddingTop: statusBarPx + 'px' }">
			<!-- 左侧全局导航 -->
			<view class="left-rail">
				<view class="rail-scroll">
					<view class="rail-logo">
						<text class="rail-logo-ico">☁</text>
					</view>
					<view class="rail-item rail-on" @tap="goLeftNav('home')">
						<text class="rail-ico">🏠</text>
						<text class="rail-label">{{ t("home") }}</text>
					</view>
					<view class="rail-item" @tap="goLeftNav('message')">
						<view class="rail-ico-wrap">
							<text class="rail-ico">💬</text>
							<view v-if="msgBadge > 0" class="rail-badge"><text class="rail-badge-t">{{ msgBadge > 99 ? "99+" : msgBadge }}</text></view>
						</view>
						<text class="rail-label">{{ t("message") }}</text>
					</view>
					<view class="rail-item" @tap="goLeftNav('project')">
						<text class="rail-ico">📁</text>
						<text class="rail-label">{{ t("project") }}</text>
					</view>
					<view class="rail-item" @tap="placeholderNav">
						<text class="rail-ico">📚</text>
						<text class="rail-label">{{ t("home_nav_knowledge") }}</text>
					</view>
					<view class="rail-item" @tap="placeholderNav">
						<text class="rail-ico">📅</text>
						<text class="rail-label">{{ t("home_nav_calendar") }}</text>
					</view>
					<view class="rail-item" @tap="placeholderNav">
						<view class="rail-ico-wrap">
							<text class="rail-ico">✅</text>
							<view v-if="taskBadge > 0" class="rail-badge"><text class="rail-badge-t">{{ taskBadge }}</text></view>
						</view>
						<text class="rail-label">{{ t("home_nav_tasks") }}</text>
					</view>
					<view class="rail-item" @tap="placeholderNav">
						<text class="rail-ico">📊</text>
						<text class="rail-label">{{ t("home_nav_reports") }}</text>
					</view>
					<view class="rail-item" @tap="placeholderNav">
						<text class="rail-ico">⚡</text>
						<text class="rail-label">{{ t("home_nav_automation") }}</text>
					</view>
					<view class="rail-item rail-app" @tap="placeholderNav">
						<text class="rail-ico">🧩</text>
						<text class="rail-label">{{ t("home_nav_app") }}</text>
						<view class="rail-new-pill"><text class="rail-new-t">{{ t("home_new_badge") }}</text></view>
					</view>
				</view>
				<view class="rail-footer" @tap="goLeftNav('profile')">
					<view class="rail-av-wrap">
						<image v-if="railAvatar" class="rail-av-img" :src="railAvatar" mode="aspectFill" />
						<text v-else class="rail-av-fallback">{{ railAvatarChar }}</text>
						<view class="rail-online" />
					</view>
				</view>
			</view>

			<!-- 中间 + 顶栏 + 分栏内容 -->
			<view class="main-column">
				<view class="group-header">
					<view class="gh-left">
						<view class="gh-group-ico">
							<text class="gh-group-ico-i">👥</text>
						</view>
						<view class="gh-texts">
							<text class="gh-title">{{ t("hq_group") }}</text>
						</view>
					</view>
					<view class="gh-right">
						<view class="gh-pill" @tap="placeholderNav">
							<text class="gh-pill-t">{{ t("home_ann_dropdown") }}</text>
							<text class="gh-pill-arrow">▼</text>
						</view>
						<text class="gh-icon-btn" @tap="placeholderNav">🔍</text>
						<text class="gh-icon-btn" @tap="placeholderNav">📌</text>
						<text class="gh-icon-btn" @tap="openHallSettings">⋯</text>
					</view>
				</view>

				<view class="feed-tabs">
					<view class="feed-tab-inner">
						<view
							v-for="(tab, ti) in feedTabs"
							:key="tab.key"
							class="ft-item"
							:class="{ 'ft-on': homeFeedTab === ti }"
							@tap="homeFeedTab = ti"
						>
							<text class="ft-t">{{ tab.label }}</text>
							<view v-if="homeFeedTab === ti" class="ft-line" />
						</view>
					</view>
					<view class="ft-tools">
						<text class="ft-tool" @tap="placeholderNav">⚙</text>
						<text class="ft-tool" @tap="placeholderNav">☰</text>
					</view>
				</view>

				<view class="content-split">
					<scroll-view scroll-y class="feed-scroll" :scroll-into-view="scrollToId" scroll-with-animation>
						<view v-if="loading" class="chat-empty"><text>{{ t("loading") }}</text></view>
						<view v-else class="feed-inner">
							<view v-if="visibleMessages.length === 0" class="feed-empty"><text>{{ t("home_toast_soon") }}</text></view>
							<view
								v-for="(msg, mi) in visibleMessages"
								v-else
								:key="msg.id"
								:id="'m-' + msg.id"
								class="feed-msg"
							>
								<template v-if="msg.isMine">
									<view class="mine-row">
										<view class="mine-card">
											<text class="mine-text">{{ msg.content }}</text>
										</view>
										<text class="mine-time">{{ formatTime(msg.time) }}</text>
									</view>
								</template>
								<template v-else>
									<view class="card-meta">
										<view class="card-av" :style="{ background: avatarGradient(msg.senderName) }">
											<text class="card-av-t">{{ avatarLetter(msg) }}</text>
										</view>
										<text class="card-name">{{ hallSenderLabel(msg.senderName) }}</text>
										<text class="card-time">{{ formatTime(msg.time) }}</text>
									</view>

									<!-- 系统 -->
									<view v-if="messageCardKind(msg, mi) === 'system'" class="bubble-card bubble-system">
										<view class="bc-head">
											<text class="bc-sys-ico">📢</text>
											<text class="bc-sys-title">{{ t("home_system_title") }}</text>
										</view>
										<text class="bc-body">{{ msg.content }}</text>
									</view>

									<!-- 进度 -->
									<view v-else-if="messageCardKind(msg, mi) === 'progress'" class="bubble-card bubble-progress">
										<view class="bc-head">
											<text class="bc-pr-ico">🎯</text>
											<text class="bc-pr-title">{{ t("home_progress_title") }}</text>
										</view>
										<text class="bc-body">{{ msg.content }}</text>
										<view class="prog-bar-bg">
											<view class="prog-bar-fill" :style="{ width: progressPct(msg) + '%' }" />
										</view>
										<text class="prog-pct">{{ progressPct(msg) }}%</text>
									</view>

									<!-- 知识 -->
									<view v-else-if="messageCardKind(msg, mi) === 'knowledge'" class="bubble-card bubble-know">
										<view class="bc-head">
											<text class="bc-kn-ico">📈</text>
											<text class="bc-kn-title">{{ t("home_knowledge_title") }}</text>
										</view>
										<text class="bc-body">{{ msg.content }}</text>
									</view>

									<!-- 默认 -->
									<view v-else class="bubble-card bubble-default">
										<text class="bc-body">{{ msg.content }}</text>
									</view>

									<view class="react-row">
										<view class="react-pill"><text class="react-e">👍</text><text class="react-n">{{ reactionPick(msg, 0) }}</text></view>
										<view class="react-pill"><text class="react-e">🎉</text><text class="react-n">{{ reactionPick(msg, 1) }}</text></view>
										<view class="react-pill"><text class="react-e">🔥</text><text class="react-n">{{ reactionPick(msg, 2) }}</text></view>
										<view class="react-plus"><text>+</text></view>
									</view>
								</template>
							</view>
						</view>
						<view id="bottom-anchor" class="bottom-anchor" />
					</scroll-view>

					<scroll-view scroll-y class="widget-col" :show-scrollbar="false">
						<view class="w-card w-stats">
							<text class="w-card-h">{{ t("home_widget_stats") }}</text>
							<view class="stat-grid">
								<view class="stat-cell">
									<text class="stat-k">{{ t("home_stat_online") }}</text>
									<view class="stat-num-row">
										<text class="stat-v">128</text>
										<text class="stat-up">+12</text>
									</view>
								</view>
								<view class="stat-cell">
									<text class="stat-k">{{ t("home_stat_report") }}</text>
									<view class="stat-num-row">
										<text class="stat-v">86%</text>
										<text class="stat-up">+8%</text>
									</view>
								</view>
								<view class="stat-cell">
									<text class="stat-k">{{ t("home_stat_tasks") }}</text>
									<view class="stat-num-row">
										<text class="stat-v">32</text>
										<text class="stat-up">+5</text>
									</view>
								</view>
								<view class="stat-cell">
									<text class="stat-k">{{ t("home_stat_projects") }}</text>
									<view class="stat-num-row">
										<text class="stat-v">6</text>
										<text class="stat-up">+1</text>
									</view>
								</view>
							</view>
						</view>

						<view class="w-card w-card-compact">
							<text class="w-card-h sm">{{ t("home_common_funcs") }}</text>
							<view class="func-grid">
								<view v-for="(f, fi) in commonFuncs" :key="fi" class="func-cell" @tap="placeholderNav">
									<text class="func-emoji">{{ f.icon }}</text>
									<text class="func-name">{{ f.label }}</text>
								</view>
							</view>
						</view>

						<view class="w-card w-ai w-card-compact">
							<view class="w-ai-top">
								<text class="w-ai-emoji">🤖</text>
								<view class="w-ai-head-text">
									<text class="w-ai-title">{{ t("home_ai_assistant") }}</text>
									<view class="w-ai-beta"><text>{{ t("home_ai_beta") }}</text></view>
								</view>
							</view>
							<view class="w-ai-btn" @tap="placeholderNav">{{ t("home_ai_action_1") }}</view>
							<view class="w-ai-row2">
								<view class="w-ai-btn half" @tap="placeholderNav">{{ t("home_ai_action_2") }}</view>
								<view class="w-ai-btn half" @tap="placeholderNav">{{ t("home_ai_action_3") }}</view>
							</view>
						</view>

						<view class="w-card w-card-compact">
							<text class="w-card-h sm">{{ t("home_quick_links") }}</text>
							<view class="qk-row" @tap="placeholderNav">
								<text class="qk-ico">📝</text>
								<text class="qk-t">{{ t("home_quick_todos") }}</text>
								<view class="qk-badge"><text>8</text></view>
							</view>
							<view class="qk-row" @tap="goLeftNav('project')">
								<text class="qk-ico">📂</text>
								<text class="qk-t">{{ t("home_quick_projects") }}</text>
								<view class="qk-badge"><text>3</text></view>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</view>

		<view class="composer-wrap">
			<scroll-view scroll-x class="chips-scroll" :show-scrollbar="false">
				<view class="chips-row">
					<view class="chip-pill" @tap="placeholderNav">{{ t("home_quick_at") }}</view>
					<view class="chip-pill" @tap="placeholderNav">{{ t("home_quick_launch_task") }}</view>
					<view class="chip-pill" @tap="placeholderNav">{{ t("home_quick_poll") }}</view>
					<view class="chip-pill" @tap="placeholderNav">{{ t("home_quick_file") }}</view>
					<view class="chip-pill" @tap="placeholderNav">{{ t("home_quick_more") }}</view>
				</view>
			</scroll-view>
			<view class="chat-input">
				<text class="inp-tool" @tap="placeholderNav">😊</text>
				<text class="inp-tool" @tap="placeholderNav">@</text>
				<text class="inp-tool" @tap="placeholderNav">🖼</text>
				<text class="inp-tool" @tap="placeholderNav">📎</text>
				<input
					type="text"
					v-model="inputText"
					class="input-field"
					:placeholder="t('home_input_ph')"
					placeholder-class="iph"
					:adjust-position="false"
				/>
				<view class="send-button" @click="sendHall">{{ t("send") }}</view>
			</view>
		</view>

		<AppTabBar current="home" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import { t, getLanguage } from "@/utils/lang";
	import { getToken, getUserInfo } from "@/utils/index";
	import { resolveAvatarDisplayUrl } from "@/clientApi/authApi";
	import { getLlmSettings } from "@/utils/llmSettings";
	import { chatCompletion } from "@/utils/openaiCompatible";
	import { extractAssistantText } from "@/utils/openaiResponse";
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";
	import { switchMainTab } from "@/utils/tabNav";
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
				homeFeedTab: 0,
				msgBadge: 0,
				taskBadge: 8,
				commonFuncs: [
					{ icon: "🚀", label: "发起任务" },
					{ icon: "📋", label: "日报汇总" },
					{ icon: "📌", label: "项目看板" },
					{ icon: "📎", label: "文件库" },
				],
			};
		},
		computed: {
			feedTabs() {
				return [
					{ key: "all", label: this.t("home_tab_all") },
					{ key: "at", label: this.t("home_tab_at_me") },
					{ key: "later", label: this.t("home_tab_later") },
					{ key: "done", label: this.t("home_tab_done") },
				];
			},
			visibleMessages() {
				const list = this.hallMessages || [];
				if (this.homeFeedTab === 0) return list;
				if (this.homeFeedTab === 1) {
					return list.filter((m) => /[@＠]|老板|您/.test(`${m.content || ""}${m.senderName || ""}`));
				}
				if (this.homeFeedTab === 2) {
					return list.filter((m) => /稍后|待办|TODO/i.test(m.content || ""));
				}
				if (this.homeFeedTab === 3) {
					return list.filter((m) => /完成|已办|已结|done/i.test(m.content || ""));
				}
				return list;
			},
			railAvatar() {
				if (!getToken()) return "";
				const u = getUserInfo();
				return u ? resolveAvatarDisplayUrl(u.avatarUrl) : "";
			},
			railAvatarChar() {
				const u = getUserInfo();
				const n = (u && (u.nickname || u.name || u.phone || "")) || "";
				const c = String(n).trim().slice(0, 1);
				return c || (getLanguage() === "en" ? "U" : "我");
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
			try {
				uni.$on("app-tab-badge-refresh", this.refreshBadges);
			} catch {
				//
			}
		},
		onUnload() {
			try {
				uni.$off("app-tab-badge-refresh", this.refreshBadges);
			} catch {
				//
			}
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.refreshBadges();
			this.bootstrapHall();
		},
		onHide() {
			this.stopBroadcastPolling();
		},
		methods: {
			refreshBadges() {
				try {
					const n = Number(uni.getStorageSync("tab_message_badge") || 0);
					this.msgBadge = n > 99 ? 99 : n;
				} catch {
					this.msgBadge = 0;
				}
			},
			goLeftNav(key) {
				if (key === "home") return;
				switchMainTab(key);
			},
			placeholderNav() {
				uni.showToast({ title: this.t("home_toast_soon"), icon: "none" });
			},
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			isSystemMsg(msg) {
				const sys = this.t("sender_system_name");
				const shown = resolveHallSenderDisplay(msg.senderName || "");
				return shown === sys || (msg.senderName || "") === sys;
			},
			messageCardKind(msg, idx) {
				if (msg.isMine) return "mine";
				if (this.isSystemMsg(msg)) return "system";
				if (msg.isManager) return "progress";
				if (idx % 4 === 1 && !this.isSystemMsg(msg)) return "knowledge";
				return "default";
			},
			hashNum(str, mod) {
				let h = 0;
				const s = String(str || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return mod ? h % mod : h;
			},
			progressPct(msg) {
				return 55 + (this.hashNum(msg.id, 34) || 0);
			},
			reactionPick(msg, i) {
				const base = [12, 3, 5, 8, 2][i] || 1;
				return base + (this.hashNum(msg.id + ":" + i, 7) || 0);
			},
			avatarGradient(name) {
				const colors = [
					"linear-gradient(145deg,#22c55e,#4ade80)",
					"linear-gradient(145deg,#3b82f6,#60a5fa)",
					"linear-gradient(145deg,#8b5cf6,#c084fc)",
					"linear-gradient(145deg,#f59e0b,#fbbf24)",
				];
				return colors[this.hashNum(name, colors.length)];
			},
			openHallSettings() {
				uni.navigateTo({
					url: `/pages/chat/chat-settings?mode=virtual&kind=hq&id=${encodeURIComponent(HQ_ID)}&title=${encodeURIComponent(this.t("hq_group"))}`,
				});
			},
			async bootstrapHall() {
				this.loading = true;
				try {
					clearHQChatMessages();
					ensureHallWelcome();
					this.hallMessages = loadHQChatMessages();
					this.$nextTick(() => this.scrollToBottom());
					this.loading = false;

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
				this.scrollToId = "";
				this.$nextTick(() => {
					this.scrollToId = "bottom-anchor";
					setTimeout(() => {
						this.scrollToId = "";
					}, 220);
				});
			},
			sendHall() {
				const text = (this.inputText || "").trim();
				if (!text) return;
				appendHQMessage({ content: text, isMine: true, senderName: this.t("home_sender_me") });
				this.inputText = "";
				this.hallMessages = loadHQChatMessages();
				this.$nextTick(() => this.scrollToBottom());
				this.triggerHallAutoReplies(text);
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
		min-height: 100vh;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f5f7fa;
		box-sizing: border-box;
		/* 仅预留自定义 Tab 高度（含安全区），与 AppTabBar tab-container 一致；勿在 composer 再叠一层 safe */
		padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
	}

	/* #ifdef MP-WEIXIN */
	.page-root {
		/* 小程序 window 常已不含系统 Tab，略收紧与底栏的视觉缝 */
		padding-bottom: calc(92rpx + env(safe-area-inset-bottom));
	}
	/* #endif */

	.workspace {
		flex: 1;
		height: 0;
		display: flex;
		flex-direction: row;
		min-height: 0;
	}

	/* ---------- 左侧导航 ---------- */
	.left-rail {
		width: 112rpx;
		flex-shrink: 0;
		background: #fff;
		display: flex;
		flex-direction: column;
		border-right: 1rpx solid #e8ecf1;
		box-shadow: 4rpx 0 24rpx rgba(15, 23, 42, 0.04);
	}

	.rail-scroll {
		flex: 1;
		height: 0;
		overflow-y: auto;
		padding: 12rpx 0 16rpx;
	}

	.rail-logo {
		width: 64rpx;
		height: 64rpx;
		margin: 8rpx auto 20rpx;
		border-radius: 50%;
		background: linear-gradient(145deg, #3b82f6, #2563eb);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.35);
	}

	.rail-logo-ico {
		font-size: 30rpx;
		color: #fff;
	}

	.rail-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 14rpx 4rpx;
		margin: 0 8rpx 4rpx;
		border-radius: 16rpx;
		position: relative;
	}

	.rail-on {
		background: rgba(37, 99, 235, 0.1);
	}

	.rail-on .rail-ico,
	.rail-on .rail-label {
		color: #2563eb;
	}

	.rail-ico-wrap {
		position: relative;
	}

	.rail-ico {
		font-size: 34rpx;
		line-height: 1;
	}

	.rail-label {
		font-size: 16rpx;
		color: #64748b;
		margin-top: 6rpx;
		text-align: center;
		line-height: 1.15;
		max-width: 100rpx;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.rail-badge {
		position: absolute;
		top: -10rpx;
		right: -18rpx;
		min-width: 28rpx;
		height: 28rpx;
		padding: 0 6rpx;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx solid #fff;
		box-sizing: border-box;
	}

	.rail-badge-t {
		font-size: 16rpx;
		font-weight: 800;
		color: #fff;
	}

	.rail-app .rail-new-pill {
		position: absolute;
		top: 4rpx;
		right: 0;
		padding: 2rpx 8rpx;
		border-radius: 8rpx;
		background: linear-gradient(135deg, #7c3aed, #a855f7);
	}

	.rail-new-t {
		font-size: 14rpx;
		font-weight: 800;
		color: #fff;
	}

	.rail-footer {
		padding: 16rpx 0 calc(12rpx + env(safe-area-inset-bottom));
		display: flex;
		justify-content: center;
		border-top: 1rpx solid #f1f5f9;
	}

	.rail-av-wrap {
		width: 64rpx;
		height: 64rpx;
		position: relative;
		border-radius: 50%;
		background: #e8ecf1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.rail-av-img {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
	}

	.rail-av-fallback {
		font-size: 28rpx;
		font-weight: 700;
		color: #64748b;
	}

	.rail-online {
		position: absolute;
		right: 2rpx;
		bottom: 2rpx;
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #22c55e;
		border: 3rpx solid #fff;
		box-sizing: border-box;
	}

	/* ---------- 主列 ---------- */
	.main-column {
		flex: 1;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: #f5f7fa;
	}

	.group-header {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 12rpx 16rpx 8rpx 12rpx;
		background: #fff;
		border-bottom: 1rpx solid #eef2f7;
	}

	.gh-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex: 1;
		min-width: 0;
		gap: 12rpx;
	}

	.gh-group-ico {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: linear-gradient(145deg, #3b82f6, #1d4ed8);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.gh-group-ico-i {
		font-size: 28rpx;
	}

	.gh-texts {
		flex: 1;
		min-width: 0;
	}

	.gh-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.gh-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		flex-shrink: 0;
	}

	.gh-pill {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		padding: 8rpx 14rpx;
		background: #f1f5f9;
		border-radius: 999rpx;
		max-width: 200rpx;
	}

	.gh-pill-t {
		font-size: 20rpx;
		color: #475569;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gh-pill-arrow {
		font-size: 16rpx;
		color: #94a3b8;
	}

	.gh-icon-btn {
		font-size: 32rpx;
		padding: 8rpx;
		line-height: 1;
	}

	.feed-tabs {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		justify-content: space-between;
		padding: 0 12rpx;
		background: #fff;
		border-bottom: 1rpx solid #eef2f7;
	}

	.feed-tab-inner {
		display: flex;
		flex-direction: row;
		flex: 1;
		min-width: 0;
	}

	.ft-item {
		position: relative;
		padding: 18rpx 14rpx 16rpx;
		margin-right: 4rpx;
	}

	.ft-on .ft-t {
		color: #2563eb;
		font-weight: 800;
	}

	.ft-t {
		font-size: 24rpx;
		color: #64748b;
	}

	.ft-line {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 40rpx;
		height: 6rpx;
		background: #2563eb;
		border-radius: 3rpx;
	}

	.ft-tools {
		display: flex;
		flex-direction: row;
		gap: 12rpx;
		padding-bottom: 14rpx;
	}

	.ft-tool {
		font-size: 28rpx;
		color: #94a3b8;
	}

	.content-split {
		flex: 1;
		min-height: 0;
		height: 0;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.feed-scroll {
		flex: 1;
		min-width: 0;
		min-height: 0;
		height: 100%;
	}

	.feed-inner {
		padding: 8rpx 12rpx 16rpx;
	}

	.chat-empty,
	.feed-empty {
		padding: 60rpx 24rpx;
		text-align: center;
		color: #94a3b8;
		font-size: 26rpx;
	}

	.feed-msg {
		margin-bottom: 28rpx;
	}

	.card-meta {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 10rpx;
	}

	.card-av {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.card-av-t {
		font-size: 22rpx;
		font-weight: 800;
		color: #fff;
	}

	.card-name {
		font-size: 24rpx;
		font-weight: 700;
		color: #334155;
		flex: 1;
		min-width: 0;
	}

	.card-time {
		font-size: 20rpx;
		color: #94a3b8;
	}

	.bubble-card {
		border-radius: 16rpx;
		padding: 18rpx 16rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
	}

	.bc-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 10rpx;
	}

	.bc-body {
		font-size: 26rpx;
		color: #1e293b;
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.bubble-system {
		background: linear-gradient(180deg, #eff6ff, #f8fafc);
		border: 1rpx solid #bfdbfe;
	}

	.bc-sys-title {
		font-size: 26rpx;
		font-weight: 800;
		color: #1d4ed8;
	}

	.bubble-progress {
		background: #fff;
		border: 2rpx solid #86efac;
	}

	.bc-pr-title {
		font-size: 26rpx;
		font-weight: 800;
		color: #15803d;
	}

	.prog-bar-bg {
		height: 12rpx;
		background: #ecfdf5;
		border-radius: 6rpx;
		margin-top: 14rpx;
		overflow: hidden;
	}

	.prog-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #22c55e, #4ade80);
		border-radius: 6rpx;
	}

	.prog-pct {
		display: block;
		text-align: right;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #16a34a;
		font-weight: 700;
	}

	.bubble-know {
		background: #fff;
		border: 2rpx solid #93c5fd;
	}

	.bc-kn-title {
		font-size: 26rpx;
		font-weight: 800;
		color: #1d4ed8;
	}

	.bubble-default {
		background: #fff;
		border: 1rpx solid #f1f5f9;
	}

	.react-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 10rpx;
		margin-top: 12rpx;
		align-items: center;
	}

	.react-pill {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		padding: 6rpx 14rpx;
		background: #f1f5f9;
		border-radius: 999rpx;
	}

	.react-e {
		font-size: 24rpx;
	}

	.react-n {
		font-size: 22rpx;
		color: #64748b;
		font-weight: 600;
	}

	.react-plus {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		border: 2rpx dashed #cbd5e1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #94a3b8;
	}

	.mine-row {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.mine-card {
		max-width: 85%;
		background: linear-gradient(145deg, #dbeafe, #e0e7ff);
		padding: 16rpx 18rpx;
		border-radius: 16rpx 16rpx 4rpx 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.12);
	}

	.mine-text {
		font-size: 26rpx;
		color: #1e293b;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.mine-time {
		font-size: 20rpx;
		color: #94a3b8;
		margin-top: 6rpx;
	}

	.bottom-anchor {
		height: 2rpx;
	}

	/* 右侧.widget */
	.widget-col {
		width: 228rpx;
		flex-shrink: 0;
		min-height: 0;
		height: 100%;
		background: #f5f7fa;
		border-left: 1rpx solid #e8ecf1;
	}

	.w-card {
		background: #fff;
		border-radius: 14rpx;
		padding: 12rpx 10rpx;
		margin: 8rpx 8rpx 0;
		box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.05);
	}

	.w-card-compact {
		padding: 10rpx 8rpx;
		margin-top: 6rpx;
	}

	.w-stats {
		padding-top: 12rpx;
		background: linear-gradient(180deg, #dbeafe 0%, #fff 40%);
		border: 1rpx solid #bfdbfe;
	}

	.w-card-h {
		display: block;
		font-size: 24rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 10rpx;
	}

	.w-card-h.sm {
		font-size: 22rpx;
		margin-bottom: 8rpx;
	}

	.stat-grid {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.stat-cell {
		width: calc(50% - 4rpx);
		box-sizing: border-box;
		padding: 8rpx 6rpx;
		background: #f8fafc;
		border-radius: 10rpx;
	}

	.stat-cell .stat-k {
		display: block;
		font-size: 20rpx;
		color: #64748b;
		line-height: 1.2;
		margin-bottom: 4rpx;
	}

	.stat-num-row {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: 6rpx;
	}

	.stat-num-row .stat-v {
		font-size: 24rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.stat-num-row .stat-up {
		font-size: 18rpx;
		color: #16a34a;
		font-weight: 700;
	}

	.func-grid {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.func-cell {
		width: calc(50% - 4rpx);
		box-sizing: border-box;
		padding: 10rpx 4rpx;
		background: #f8fafc;
		border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.func-emoji {
		font-size: 28rpx;
		margin-bottom: 4rpx;
	}

	.func-name {
		font-size: 19rpx;
		color: #475569;
		line-height: 1.2;
	}

	.w-ai {
		background: linear-gradient(180deg, #f5f3ff, #fff);
		border: 1rpx solid #ddd6fe;
	}

	.w-ai-top {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 8rpx;
	}

	.w-ai-head-text {
		flex: 1;
		min-width: 0;
	}

	.w-ai-emoji {
		font-size: 36rpx;
	}

	.w-ai-title {
		font-size: 22rpx;
		font-weight: 800;
		color: #5b21b6;
	}

	.w-ai-beta {
		margin-top: 4rpx;
		align-self: flex-start;
		padding: 2rpx 6rpx;
		background: #ede9fe;
		border-radius: 6rpx;
	}

	.w-ai-beta text {
		font-size: 16rpx;
		font-weight: 800;
		color: #7c3aed;
	}

	.w-ai-btn {
		font-size: 20rpx;
		color: #4c1d95;
		background: #fff;
		border: 1rpx solid #e9d5ff;
		padding: 10rpx 8rpx;
		border-radius: 10rpx;
		margin-bottom: 0;
		font-weight: 600;
		text-align: center;
		box-sizing: border-box;
	}

	.w-ai-row2 {
		display: flex;
		flex-direction: row;
		gap: 6rpx;
		margin-top: 6rpx;
	}

	.w-ai-btn.half {
		flex: 1;
		min-width: 0;
		font-size: 18rpx;
		padding: 8rpx 6rpx;
		line-height: 1.25;
	}

	.w-ai > .w-ai-btn:not(.half) {
		margin-bottom: 6rpx;
	}

	.qk-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 10rpx 0;
		border-top: 1rpx solid #f1f5f9;
		gap: 8rpx;
	}

	.qk-row:first-of-type {
		border-top: none;
	}

	.qk-ico {
		font-size: 28rpx;
	}

	.qk-t {
		flex: 1;
		font-size: 24rpx;
		color: #334155;
		font-weight: 600;
	}

	.qk-badge {
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: #ef4444;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qk-badge text {
		font-size: 20rpx;
		font-weight: 800;
		color: #fff;
	}

	/* 底部输入 */
	.composer-wrap {
		flex-shrink: 0;
		background: #fff;
		border-top: 1rpx solid #e8ecf1;
	}

	.chips-scroll {
		white-space: nowrap;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.chips-row {
		display: inline-flex;
		flex-direction: row;
		gap: 12rpx;
		padding: 12rpx 16rpx;
	}

	.chip-pill {
		display: inline-flex;
		padding: 10rpx 20rpx;
		background: #f1f5f9;
		border-radius: 999rpx;
		font-size: 22rpx;
		color: #475569;
		font-weight: 600;
	}

	.chat-input {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12rpx 16rpx;
		gap: 8rpx;
	}

	.inp-tool {
		font-size: 30rpx;
		padding: 4rpx;
		line-height: 1;
		opacity: 0.85;
	}

	.input-field {
		flex: 1;
		min-height: 72rpx;
		background: #f1f5f9;
		border-radius: 999rpx;
		padding: 0 24rpx;
		font-size: 26rpx;
	}

	.iph {
		color: #94a3b8;
	}

	.send-button {
		padding: 16rpx 28rpx;
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		color: #fff;
		border-radius: 999rpx;
		font-size: 26rpx;
		font-weight: 700;
		box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.3);
	}
</style>
