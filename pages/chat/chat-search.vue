<template>
	<view class="page chat-search-page" :class="{ 'theme-dark': isDarkMode }">
		<view class="search-bar">
			<input
				class="search-input"
				type="text"
				v-model="keyword"
				:placeholder="t('chat_search_placeholder')"
				confirm-type="search"
				@input="onInput"
			/>
		</view>
		<view v-if="loading" class="state"><text>{{ t('loading') }}</text></view>
		<view v-else-if="filtered.length === 0" class="state"><text>{{ keyword.trim() ? t('chat_search_no_hits') : t('chat_search_hint') }}</text></view>
		<scroll-view v-else scroll-y class="list">
			<view v-for="row in filtered" :key="row.id" class="hit">
				<text class="hit-time">{{ row.timeLabel }}</text>
				<text class="hit-body">{{ row.preview }}</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { loadChatMessages } from "@/utils/messageUtils";
	import { loadVirtualChatMessages } from "@/utils/virtualTeamStore";
	import * as workflowApi from "@/clientApi/workflowApi";
	import { pickId } from "@/utils/apiHelpers";
	import { getUserInfo } from "@/utils/index";
	import { t, getLanguage } from "@/utils/lang";

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

	function formatTimeLabel(iso) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "";
		const h = date.getHours().toString().padStart(2, "0");
		const m = date.getMinutes().toString().padStart(2, "0");
		const mo = (date.getMonth() + 1).toString().padStart(2, "0");
		const d = date.getDate().toString().padStart(2, "0");
		return `${mo}-${d} ${h}:${m}`;
	}

	export default {
		data() {
			return {
				mode: "local",
				kind: "",
				id: "",
				workflowId: "",
				threadId: "",
				projectName: "",
				keyword: "",
				rawRows: [],
				loading: false,
				isDarkMode: false,
			};
		},
		computed: {
			filtered() {
				const k = (this.keyword || "").trim().toLowerCase();
				if (!k) return [];
				return this.rawRows.filter((r) => (r.searchText || "").toLowerCase().includes(k));
			},
		},
		onShow() {
			this.loadDarkMode();
			try {
				uni.setNavigationBarTitle({ title: this.t("chat_search_nav") });
			} catch (e) {
				//
			}
		},
		onLoad(options) {
			this.loadDarkMode();
			this.mode = (options && options.mode) || "local";
			if (this.mode === "virtual") {
				this.kind = options.kind ? decodeURIComponent(options.kind) : "";
				this.id = options.id ? decodeURIComponent(options.id) : "";
				this.loadVirtual();
			} else if (this.mode === "remote") {
				this.workflowId = options.workflowId ? decodeURIComponent(options.workflowId) : "";
				this.threadId = options.threadId ? decodeURIComponent(options.threadId) : "";
				this.loadRemote();
			} else {
				this.projectName = options.projectName ? decodeURIComponent(options.projectName) : "";
				this.loadLocal();
			}
		},
		methods: {
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
			onInput() {
				// computed filtered updates
			},
			loadLocal() {
				const list = loadChatMessages(this.projectName);
				this.rawRows = list.map((m) => ({
					id: m.id,
					preview: m.content || "",
					searchText: m.content || "",
					timeLabel: formatTimeLabel(m.time),
				}));
			},
			loadVirtual() {
				const list = loadVirtualChatMessages(this.kind, this.id);
				this.rawRows = list.map((m) => {
					const me = this.t("home_sender_me");
					const prefix = m.senderName && !m.isMine ? `${m.senderName}：` : m.isMine ? `${me}：` : "";
					const text = `${prefix}${m.content || ""}`;
					return {
						id: m.id,
						preview: text,
						searchText: text,
						timeLabel: formatTimeLabel(m.time),
					};
				});
			},
			async loadRemote() {
				this.loading = true;
				try {
					const list = await workflowApi.listMessages(this.workflowId, this.threadId);
					const arr = Array.isArray(list) ? list : [];
					const user = getUserInfo();
					this.rawRows = arr.map((m) => {
						const body = messageBody(m) || this.t("message_empty_mark");
						const mine = remoteMessageIsMine(m, user);
						const preview = mine ? `${this.t("home_sender_me")}：${body}` : body;
						return {
							id: pickId(m) || m.messageId || `m-${messageTime(m)}`,
							preview,
							searchText: preview,
							timeLabel: formatTimeLabel(messageTime(m) || new Date().toISOString()),
						};
					});
				} catch (e) {
					console.warn("[chat-search] remote", e);
					this.rawRows = [];
					uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				} finally {
					this.loading = false;
				}
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #ededed;
	}

	.search-bar {
		padding: 16rpx 24rpx;
		background: #fff;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.search-input {
		height: 64rpx;
		background: #f5f5f5;
		border-radius: 8rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}

	.state {
		padding: 80rpx 32rpx;
		text-align: center;
		color: #999;
		font-size: 28rpx;
	}

	.list {
		height: calc(100vh - 120rpx);
		padding: 16rpx 0;
		box-sizing: border-box;
	}

	.hit {
		background: #fff;
		margin: 0 0 2rpx;
		padding: 24rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.hit-time {
		display: block;
		font-size: 22rpx;
		color: #999;
		margin-bottom: 8rpx;
	}

	.hit-body {
		font-size: 28rpx;
		color: #111;
		line-height: 1.45;
		word-break: break-all;
	}
</style>

<style>
	.chat-search-page.theme-dark {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--text-tertiary: #64748b;
		--border-color: #334155;
		--input-bg: #1a2332;
	}

	.chat-search-page.theme-dark,
	[data-theme="dark"] .chat-search-page {
		background: var(--bg-primary) !important;
	}

	.chat-search-page.theme-dark .search-bar,
	[data-theme="dark"] .chat-search-page .search-bar {
		background: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	.chat-search-page.theme-dark .search-input,
	[data-theme="dark"] .chat-search-page .search-input {
		background: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border: 1rpx solid var(--border-color) !important;
	}

	.chat-search-page.theme-dark .state,
	[data-theme="dark"] .chat-search-page .state {
		color: var(--text-tertiary) !important;
	}

	.chat-search-page.theme-dark .hit,
	[data-theme="dark"] .chat-search-page .hit {
		background: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	.chat-search-page.theme-dark .hit-time,
	[data-theme="dark"] .chat-search-page .hit-time {
		color: var(--text-tertiary) !important;
	}

	.chat-search-page.theme-dark .hit-body,
	[data-theme="dark"] .chat-search-page .hit-body {
		color: var(--text-primary) !important;
	}
</style>
