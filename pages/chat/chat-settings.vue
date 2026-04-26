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
		<view v-if="mode === 'virtual' && (kind === 'group' || kind === 'hq')" class="group members-card">
			<view class="members-head">
				<text class="members-title">群成员</text>
				<text class="members-count">{{ groupMembers.length }} 人</text>
			</view>
			<view v-if="groupMembers.length === 0" class="members-empty">暂无成员</view>
			<view v-else class="members-grid">
				<view
					v-for="m in groupMembers"
					:key="m.rowKey"
					class="member-item"
					hover-class="member-item-hover"
					@tap="openMemberPrivateChat(m)"
				>
					<image v-if="memberAvatar(m)" class="member-avatar-img" :src="memberAvatar(m)" mode="aspectFill" />
					<view v-else class="member-avatar">{{ memberInitial(m) }}</view>
					<view class="member-name-block">
						<text class="member-name">{{ m.name }}</text>
						<text v-if="m.badgeText" class="member-role-badge">{{ m.badgeText }}</text>
					</view>
					<text v-if="m.modelShort" class="member-model-pill">{{ m.modelShort }}</text>
				</view>
			</view>
		</view>

		<view v-if="mode === 'virtual' && kind === 'group'" class="group">
			<view class="cell" hover-class="cell-hover" @click="goInviteMembers">
				<text class="cell-main">{{ t('cs_group_invite_members') }}</text>
				<text class="cell-arrow">›</text>
			</view>
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
	import { resolveAvatarDisplayUrl } from "@/clientApi/authApi";
	import { getUserInfo } from "@/utils/index";
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
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";

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
			groupMembers() {
				const isHq = String(this.kind || "").trim().toLowerCase() === "hq";
				const arr = isHq
					? loadDigitalAgents().map((a) => ({
							id: a.id,
							name: a.name,
							role: a.role,
							avatar: a.avatar,
							model: a.model,
					  }))
					: (Array.isArray(this.groupDetail?.members) ? this.groupDetail.members : []);
				const u = getUserInfo() || {};
				const meName =
					String(u.nickname || u.name || u.username || t("home_sender_me", getLanguage())).trim() ||
					t("home_sender_me", getLanguage());
				const meAvatar = String(u.avatarUrl || u.avatar || u.avatarURL || u.headImg || u.headimg || "").trim();
				const ownerRow = {
					rowKey: "vt_user_owner",
					id: "",
					name: meName,
					role: "",
					avatar: meAvatar,
					modelShort: "",
					badgeText: t("group_badge_owner", getLanguage()),
					isUserOwner: true,
				};
				const mapped = arr.map((m, idx) => {
					const id = String(m?.id || m?.agentId || "").trim();
					const rowKey = id || `m_${idx}`;
					const stored = String(m?.model || "").trim();
					const full = stored || (id ? getAgentModelOrDefault(id) : "");
					const modelShort = full
						? full.length > 16
							? `${full.slice(0, 14)}…`
							: full
						: "";
					const isAdmin = !!m?.isAdmin;
					let badgeText = "";
					if (isAdmin) badgeText = t("group_badge_admin", getLanguage());
					return {
						rowKey,
						id,
						name: String(m?.name || m?.displayName || "").trim() || "成员",
						role: String(m?.role || m?.jobTitle || "").trim(),
						avatar: String(m?.avatar || m?.avatarUrl || m?.headImg || m?.headimg || "").trim(),
						modelShort,
						badgeText,
						isUserOwner: false,
					};
				});
				return [ownerRow, ...mapped];
			},
		},
		onShow() {
			this.loadDarkMode();
			if (this.mode === "virtual" && this.kind === "group" && this.id) {
				this.groupDetail = getProjectGroupById(this.id);
			}
		},
		onLoad(options) {
			this.loadDarkMode();
			this.mode = (options && options.mode) || "local";
			if (this.mode === "virtual") {
				this.kind = options.kind ? String(decodeURIComponent(options.kind)).trim().toLowerCase() : "";
				this.id = options.id ? String(decodeURIComponent(options.id)).trim() : "";
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
			memberAvatar(m) {
				return resolveAvatarDisplayUrl(String(m?.avatar || "").trim());
			},
			memberInitial(m) {
				return String(m?.name || "员").trim().slice(0, 1);
			},
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
			goInviteMembers() {
				const gid = String(this.id || "").trim();
				if (!gid) return;
				const gname = this.groupDetail ? encodeURIComponent(displayGroupName(this.groupDetail)) : "";
				uni.navigateTo({
					url: `/pages/team/group-add-members?groupId=${encodeURIComponent(gid)}&gname=${gname}`,
				});
			},
			goSearch() {
				uni.navigateTo({ url: `/pages/chat/chat-search?${this.buildSearchQuery()}` });
			},
			openMemberPrivateChat(m) {
				if (m && m.isUserOwner) {
					uni.showToast({ title: this.t("group_owner_is_me"), icon: "none" });
					return;
				}
				const id = String(m?.id || "").trim();
				if (!id) {
					uni.showToast({ title: this.t("toast_group_member_no_agent_id"), icon: "none" });
					return;
				}
				const name = String(m?.name || "").trim() || this.t("digital_employee_fallback");
				const title =
					formatAgentNavTitle({
						name: m?.name,
						role: m?.role,
					}) || name;
				uni.navigateTo({
					url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`,
				});
			},
			openGroupManage() {
				const kindNorm = String(this.kind || "").trim().toLowerCase();
				const resolvedGroupId = String(this.id || this.groupDetail?.id || "").trim();

				if (kindNorm === "group") {
					if (resolvedGroupId) {
						const gname = this.groupDetail ? encodeURIComponent(displayGroupName(this.groupDetail)) : "";
						uni.navigateTo({
							url: `/pages/team/group-manage-members?groupId=${encodeURIComponent(resolvedGroupId)}&gname=${gname}`,
							fail: () => {
								uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
							},
						});
					} else {
						uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
					}
					return;
				}
				if (kindNorm === "hq") {
					uni.navigateTo({
						url: `/pages/team/group-manage-members?kind=hq&id=${encodeURIComponent(this.id || "company_hall")}&gname=${encodeURIComponent(this.pageTitle || this.t("hq_group"))}`,
						fail: () => {
							uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
						},
					});
					return;
				}

				const groupMembers = Array.isArray(this.groupDetail?.members) ? this.groupDetail.members : [];
				const source = groupMembers.length
					? groupMembers.map((m) => ({ name: m.name, role: m.role }))
					: loadDigitalAgents().map((a) => ({ name: a.name, role: a.role }));
				const lines = source
					.map((a) => `· ${formatAgentNavTitle({ name: a.name, role: a.role })}`)
					.join("\n");
				if (kindNorm === "hq") {
					uni.showModal({
						title: this.t("cs_group_manage"),
						content: `${this.t("cs_hq_members_modal", { count: source.length })}\n${lines || this.t("cs_no_members")}`,
						showCancel: false,
					});
					return;
				}
				uni.showModal({
					title: this.t("cs_group_manage"),
					content: lines || this.t("cs_no_members"),
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
	.members-card {
		padding: 24rpx 24rpx 12rpx;
	}
	.members-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 8rpx 18rpx;
	}
	.members-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #111;
	}
	.members-count {
		font-size: 24rpx;
		color: #999;
	}
	.members-empty {
		padding: 16rpx 8rpx 24rpx;
		font-size: 24rpx;
		color: #999;
	}
	.members-grid {
		display: flex;
		flex-wrap: wrap;
	}
	.member-item {
		width: 25%;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20rpx;
		padding: 8rpx 4rpx 12rpx;
		border-radius: 12rpx;
		box-sizing: border-box;
	}

	.member-item-hover {
		background: rgba(37, 99, 235, 0.08);
	}
	.member-avatar-img,
	.member-avatar {
		width: 84rpx;
		height: 84rpx;
		border-radius: 18rpx;
	}
	.member-avatar {
		background: linear-gradient(145deg, #60a5fa, #6366f1);
		color: #fff;
		font-size: 32rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.member-name-block {
		margin-top: 8rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 100%;
		gap: 4rpx;
	}
	.member-name {
		max-width: 100%;
		font-size: 22rpx;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.member-role-badge {
		font-size: 18rpx;
		color: #2563eb;
		background: #eff6ff;
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
		line-height: 1.2;
	}

	.member-model-pill {
		margin-top: 4rpx;
		max-width: 100%;
		font-size: 18rpx;
		color: #64748b;
		background: #f1f5f9;
		padding: 2rpx 8rpx;
		border-radius: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		box-sizing: border-box;
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

	.chat-settings-page.theme-dark .member-name,
	[data-theme="dark"] .chat-settings-page .member-name {
		color: var(--text-primary) !important;
	}

	.chat-settings-page.theme-dark .member-role-badge,
	[data-theme="dark"] .chat-settings-page .member-role-badge {
		color: #93c5fd !important;
		background: rgba(37, 99, 235, 0.2) !important;
	}

	.chat-settings-page.theme-dark .member-model-pill,
	[data-theme="dark"] .chat-settings-page .member-model-pill {
		color: var(--text-secondary) !important;
		background: rgba(51, 65, 85, 0.9) !important;
	}

	.chat-settings-page.theme-dark .member-item-hover,
	[data-theme="dark"] .chat-settings-page .member-item-hover {
		background: rgba(96, 165, 250, 0.12) !important;
	}
</style>
