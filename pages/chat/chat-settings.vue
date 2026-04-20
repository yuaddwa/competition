<template>
	<view class="page chat-settings-page" :class="{ 'theme-dark': isDarkMode }">
		<view v-if="mode === 'virtual' && kind === 'group' && groupDetail" class="hero">
			<text class="hero-title">{{ displayGroupName(groupDetail) }}</text>
			<text class="hero-desc">{{ groupHeroDesc }}</text>
			<text v-if="groupDetail.clientName" class="hero-meta">{{ t('cs_client_prefix') }}{{ groupDetail.clientName }}</text>
			<text v-if="groupDetail.deadline" class="hero-meta">{{ t('cs_delivery_prefix') }}{{ groupDetail.deadline }}</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'agent' && agentDetail" class="hero">
			<text class="hero-title">{{ displayAgentName(agentDetail) }}</text>
			<text class="hero-desc">{{ agentHeroRoleLine }}</text>
			<text class="hero-meta">{{ t('cs_one_on_one') }}</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'hq'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">{{ t('cs_hq_desc') }}</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'manager'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">{{ t('cs_manager_desc') }}</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'persona'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">{{ t('cs_persona_desc') }}</text>
		</view>

		<view v-else-if="mode === 'remote'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">{{ t('workflow_thread_hero') }}</text>
			<text class="hero-meta mono">{{ t('workflow_id_prefix') }}{{ workflowId }}</text>
		</view>

		<view v-else class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">{{ t('cs_local_session') }}</text>
		</view>

		<view class="group">
			<view class="cell" hover-class="cell-hover" @click="goSearch">
				<text class="cell-main">{{ t('cs_find_chat_history') }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view v-if="showGroupManage" class="cell" hover-class="cell-hover" @click="openGroupManage">
				<text class="cell-main">{{ t('cs_group_manage') }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view v-if="showGroupManage" class="cell" hover-class="cell-hover" @click="openGroupNotice">
				<text class="cell-main">{{ t('cs_group_notice') }}</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<view class="group">
			<view class="cell cell-row">
				<text class="cell-main">{{ t('cs_pin_chat') }}</text>
				<switch :checked="pinned" color="#07c160" @change="onPinChange" />
			</view>
			<view class="cell cell-row">
				<text class="cell-main">{{ t('cs_mute') }}</text>
				<switch :checked="muted" color="#07c160" @change="onMuteChange" />
			</view>
		</view>

		<view class="group">
			<view class="cell cell-danger" hover-class="cell-hover" @click="confirmClear">
				<text class="cell-main">{{ t('cs_clear_history') }}</text>
			</view>
		</view>

		<text v-if="mode === 'remote'" class="foot-tip">{{ t('workflow_remote_storage_tip') }}</text>
	</view>
</template>

<script>
	import {
		clearVirtualChatMessages,
		getProjectGroupById,
		getDigitalAgentById,
		touchGroupLastMsg,
		touchAgentLastMsg,
		markAgentChatCleared,
		loadDigitalAgents,
		displayGroupName,
		displayGroupDesc,
		displayAgentName,
		displayAgentRole,
		formatAgentNavTitle,
	} from "@/utils/virtualTeamStore";
	import { clearLocalProjectChat } from "@/utils/messageUtils";
	import { t, getLanguage } from "@/utils/lang";

	function storageSessionKey(vm) {
		if (vm.mode === "virtual") return `v_${vm.kind}_${vm.id}`;
		if (vm.mode === "remote") return `r_${vm.workflowId}_${vm.threadId}`;
		return `l_${vm.projectName}`;
	}

	export default {
		data() {
			return {
				mode: "local",
				kind: "",
				id: "",
				pageTitle: "",
				workflowId: "",
				threadId: "",
				workflowTitle: "",
				threadTitle: "",
				projectName: "",
				groupDetail: null,
				agentDetail: null,
				pinned: false,
				muted: false,
				isDarkMode: false,
			};
		},
		created() {
			this.pageTitle = t("chat_settings_title", getLanguage());
		},
		computed: {
			showGroupManage() {
				return this.mode === "virtual" && (this.kind === "group" || this.kind === "hq");
			},
			groupHeroDesc() {
				const d = this.groupDetail && displayGroupDesc(this.groupDetail);
				return d || this.t("cs_no_desc");
			},
			agentHeroRoleLine() {
				const r = this.agentDetail && displayAgentRole(this.agentDetail);
				return r || this.t("cs_digital_employee_role");
			},
		},
		onShow() {
			this.loadDarkMode();
			this.$forceUpdate();
		},
		onLoad(options) {
			this.loadDarkMode();
			this.mode = (options && options.mode) || "local";
			if (this.mode === "virtual") {
				this.kind = options.kind ? decodeURIComponent(options.kind) : "";
				this.id = options.id ? decodeURIComponent(options.id) : "";
				this.pageTitle = options.title ? decodeURIComponent(options.title) : t("chat_settings_title", getLanguage());
				if (this.kind === "group" && this.id) {
					this.groupDetail = getProjectGroupById(this.id);
				}
				if (this.kind === "agent" && this.id) {
					this.agentDetail = getDigitalAgentById(this.id);
				}
			} else if (this.mode === "remote") {
				this.workflowId = options.workflowId ? decodeURIComponent(options.workflowId) : "";
				this.threadId = options.threadId ? decodeURIComponent(options.threadId) : "";
				this.workflowTitle = options.workflowTitle ? decodeURIComponent(options.workflowTitle) : "";
				this.threadTitle = options.threadTitle ? decodeURIComponent(options.threadTitle) : "";
				const a = (this.workflowTitle || "").trim();
				const b = (this.threadTitle || "").trim();
				this.pageTitle = a && b ? `${a} · ${b}` : a || b || t("workflow_chat_title", getLanguage());
			} else {
				this.projectName = options.projectName ? decodeURIComponent(options.projectName) : "";
				this.pageTitle = this.projectName || t("chat_settings_title", getLanguage());
			}
			this.loadPrefs();
			try {
				uni.setNavigationBarTitle({ title: t("chat_settings_title", getLanguage()) });
			} catch (e) {
				//
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
			displayGroupName,
			displayAgentName,
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			loadPrefs() {
				const key = storageSessionKey(this);
				this.pinned = uni.getStorageSync(`chat_pin_${key}`) === "1";
				this.muted = uni.getStorageSync(`chat_mute_${key}`) === "1";
			},
			savePin() {
				const key = storageSessionKey(this);
				if (this.pinned) uni.setStorageSync(`chat_pin_${key}`, "1");
				else uni.removeStorageSync(`chat_pin_${key}`);
			},
			saveMute() {
				const key = storageSessionKey(this);
				if (this.muted) uni.setStorageSync(`chat_mute_${key}`, "1");
				else uni.removeStorageSync(`chat_mute_${key}`);
			},
			onPinChange(e) {
				this.pinned = !!(e.detail && e.detail.value);
				this.savePin();
			},
			onMuteChange(e) {
				this.muted = !!(e.detail && e.detail.value);
				this.saveMute();
			},
			buildSearchQuery() {
				const p = [];
				p.push(`mode=${encodeURIComponent(this.mode)}`);
				if (this.mode === "virtual") {
					p.push(`kind=${encodeURIComponent(this.kind)}`);
					p.push(`id=${encodeURIComponent(this.id)}`);
					p.push(`title=${encodeURIComponent(this.pageTitle)}`);
				} else if (this.mode === "remote") {
					p.push(`workflowId=${encodeURIComponent(this.workflowId)}`);
					p.push(`threadId=${encodeURIComponent(this.threadId)}`);
					p.push(`workflowTitle=${encodeURIComponent(this.workflowTitle)}`);
					p.push(`threadTitle=${encodeURIComponent(this.threadTitle)}`);
				} else {
					p.push(`projectName=${encodeURIComponent(this.projectName)}`);
				}
				return p.join("&");
			},
			goSearch() {
				uni.navigateTo({ url: `/pages/chat/chat-search?${this.buildSearchQuery()}` });
			},
			openGroupManage() {
				const agents = loadDigitalAgents();
				const lines = agents.map((a) => `· ${formatAgentNavTitle(a)}`).join("\n");
				if (this.kind === "hq") {
					uni.showModal({
						title: this.t("cs_group_manage"),
						content: `${this.t("cs_hq_members_modal", { count: agents.length })}\n${lines || this.t("cs_no_members")}`,
						showCancel: false,
					});
					return;
				}
				const g = this.groupDetail;
				const head = g
					? `${this.t("cs_collab_members_named", { name: displayGroupName(g) })}\n`
					: `${this.t("cs_collab_members_plain")}\n`;
				uni.showModal({
					title: this.t("cs_group_manage"),
					content: `${head}${lines || this.t("cs_no_members")}`,
					showCancel: false,
				});
			},
			openGroupNotice() {
				if (this.kind === "hq") {
					uni.showModal({
						title: this.t("cs_group_notice"),
						content: this.t("cs_notice_hq_body"),
						showCancel: false,
					});
					return;
				}
				const g = this.groupDetail;
				const notice = g && displayGroupDesc(g) ? displayGroupDesc(g) : this.t("cs_notice_empty");
				uni.showModal({ title: this.t("cs_group_notice"), content: notice, showCancel: false });
			},
			confirmClear() {
				uni.showModal({
					title: this.t("cs_clear_modal_title"),
					content: this.t("cs_clear_modal_body"),
					success: (res) => {
						if (res.confirm) this.doClear();
					},
				});
			},
			doClear() {
				if (this.mode === "virtual") {
					clearVirtualChatMessages(this.kind, this.id);
					if (this.kind === "group") touchGroupLastMsg(this.id, this.t("cs_no_message_stub"));
					if (this.kind === "agent") {
						markAgentChatCleared(this.id);
						touchAgentLastMsg(this.id, this.t("cs_no_message_stub"));
					}
				} else if (this.mode === "local") {
					clearLocalProjectChat(this.projectName);
				} else {
					uni.showToast({ title: this.t("cs_cleared_remote_cache"), icon: "none" });
					uni.navigateBack();
					return;
				}
				uni.showToast({ title: this.t("cs_cleared"), icon: "success" });
				setTimeout(() => uni.navigateBack(), 400);
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #ededed;
		padding: 24rpx 0 48rpx;
		box-sizing: border-box;
	}

	.hero {
		background: #fff;
		margin: 0 0 24rpx;
		padding: 40rpx 32rpx 36rpx;
		border-top: 1rpx solid #e5e5e5;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.hero-title {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #111;
		margin-bottom: 12rpx;
	}

	.hero-desc {
		display: block;
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
	}

	.hero-meta {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-top: 12rpx;
	}

	.hero-meta.mono {
		word-break: break-all;
	}

	.group {
		background: #fff;
		margin-bottom: 24rpx;
		border-top: 1rpx solid #e5e5e5;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.cell {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
		font-size: 32rpx;
		color: #111;
	}

	.cell:last-child {
		border-bottom: none;
	}

	.cell-hover {
		background: #f5f5f5;
	}

	.cell-main {
		flex: 1;
	}

	.cell-arrow {
		color: #c7c7cc;
		font-size: 40rpx;
		font-weight: 300;
		margin-left: 16rpx;
	}

	.cell-row {
		justify-content: space-between;
	}

	.cell-danger .cell-main {
		text-align: center;
		color: #fa5151;
		width: 100%;
	}

	.foot-tip {
		display: block;
		padding: 0 32rpx;
		font-size: 24rpx;
		color: #999;
		line-height: 1.5;
	}
</style>

<style>
	/* 小程序无 html[data-theme]：用根节点 .theme-dark；H5 双写 [data-theme="dark"] */
	.chat-settings-page.theme-dark {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--text-tertiary: #64748b;
		--border-color: #334155;
		--cell-hover: #334155;
	}

	.chat-settings-page.theme-dark,
	[data-theme="dark"] .chat-settings-page {
		background: var(--bg-primary) !important;
	}

	.chat-settings-page.theme-dark .hero,
	.chat-settings-page.theme-dark .group,
	[data-theme="dark"] .chat-settings-page .hero,
	[data-theme="dark"] .chat-settings-page .group {
		background: var(--bg-secondary) !important;
		border-top-color: var(--border-color) !important;
		border-bottom-color: var(--border-color) !important;
	}

	.chat-settings-page.theme-dark .hero-title,
	.chat-settings-page.theme-dark .cell,
	[data-theme="dark"] .chat-settings-page .hero-title,
	[data-theme="dark"] .chat-settings-page .cell {
		color: var(--text-primary) !important;
	}

	.chat-settings-page.theme-dark .hero-desc,
	[data-theme="dark"] .chat-settings-page .hero-desc {
		color: var(--text-secondary) !important;
	}

	.chat-settings-page.theme-dark .hero-meta,
	[data-theme="dark"] .chat-settings-page .hero-meta {
		color: var(--text-tertiary) !important;
	}

	.chat-settings-page.theme-dark .cell,
	[data-theme="dark"] .chat-settings-page .cell {
		border-bottom-color: rgba(51, 65, 85, 0.85) !important;
	}

	.chat-settings-page.theme-dark .cell-hover,
	[data-theme="dark"] .chat-settings-page .cell-hover {
		background: var(--cell-hover) !important;
	}

	.chat-settings-page.theme-dark .cell-arrow,
	[data-theme="dark"] .chat-settings-page .cell-arrow {
		color: var(--text-tertiary) !important;
	}

	.chat-settings-page.theme-dark .foot-tip,
	[data-theme="dark"] .chat-settings-page .foot-tip {
		color: var(--text-tertiary) !important;
	}

	.chat-settings-page.theme-dark .cell-danger .cell-main,
	[data-theme="dark"] .chat-settings-page .cell-danger .cell-main {
		color: #f87171 !important;
	}
</style>
