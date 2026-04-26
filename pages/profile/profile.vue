<template>
	<view class="profile-page">
		<view class="main-scroll">
			<view class="header-section" :style="{ paddingTop: statusBarPx + 'px' }">
				<view class="profile-header" @click="onHeaderTap">
					<view class="header-left">
						<view class="avatar-wrap">
							<image v-if="avatarImg" class="avatar-img" :src="avatarImg" mode="aspectFill" />
							<text v-else class="avatar-text">{{ avatarChar }}</text>
						</view>
						<view class="header-main">
							<view class="name-row">
								<text class="nick">{{ displayName }}</text>
								<view class="ceo-badge">
									<text class="ceo-badge-icon">👑</text>
									<text class="ceo-badge-text">CEO</text>
								</view>
							</view>
							<text class="account-line">{{ accountSubLine }}</text>
						</view>
					</view>
					<text class="header-arrow">›</text>
				</view>

				<view class="team-overview">
					<view class="stat-card" hover-class="stat-card-hover" @tap="showAgentList">
						<view class="stat-card-top">
							<view class="stat-ico bg-agents">
								<text class="stat-ico-emoji">🤖</text>
							</view>
							<text class="team-stat-num">{{ agentCount }}</text>
						</view>
						<text class="team-stat-label">{{ t('digital_employee_fallback') }}</text>
					</view>
					<view class="stat-card" hover-class="stat-card-hover" @click="goCreateGroup">
						<view class="stat-card-top">
							<view class="stat-ico bg-groups">
								<text class="stat-ico-emoji">👥</text>
							</view>
							<text class="team-stat-num">{{ groupCount }}</text>
						</view>
						<text class="team-stat-label">{{ t('project_group_fallback') }}</text>
					</view>
				</view>
			</view>

			<view class="menu-section">
				<view class="menu-card">
					<view class="menu-row" hover-class="menu-row-hover" @click="goCreateAgent">
						<view class="menu-row-icon"><text class="menu-row-emoji">⚡</text></view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('profile_quick_hire_title') }}</text>
							<text class="menu-row-sub">{{ t('profile_quick_hire_sub') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-row" hover-class="menu-row-hover" @click="goCreateGroup">
						<view class="menu-row-icon"><text class="menu-row-emoji">🚀</text></view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('profile_quick_group_title') }}</text>
							<text class="menu-row-sub">{{ t('profile_quick_group_sub') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
				</view>

				<view class="menu-card">
					<view class="menu-row" hover-class="menu-row-hover" @click="showDailyReport">
						<view class="menu-row-icon"><text class="menu-row-emoji">📊</text></view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('profile_daily_report') }}</text>
							<text class="menu-row-sub">{{ t('profile_daily_report_sub') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
				</view>

				<view v-if="loggedIn" class="menu-card">
					<view class="menu-row" hover-class="menu-row-hover" @click="goPage('/pages/profile/agent-model-assign')">
						<view class="menu-row-icon"><text class="menu-row-emoji">🔗</text></view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('agent_model_assign_nav') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-row" hover-class="menu-row-hover" @click="goChangePassword">
						<view class="menu-row-icon menu-row-icon-mono">
							<text class="iconfont menu-row-ico">&#xe78f;</text>
						</view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('change_password') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
				</view>

				<view class="menu-card">
					<view class="menu-row" hover-class="menu-row-hover" @click="goSettings">
						<view class="menu-row-icon menu-row-icon-mono">
							<text class="iconfont menu-row-ico">&#xe654;</text>
						</view>
						<view class="menu-row-body">
							<text class="menu-row-title">{{ t('settings') }}</text>
						</view>
						<text class="menu-row-chev">›</text>
					</view>
				</view>

				<view class="menu-card menu-card-muted">
					<view class="menu-row menu-row-static">
						<text class="menu-row-title menu-row-title-only">{{ t('about') }}</text>
						<text class="menu-row-extra">{{ t('version') }}</text>
					</view>
					<view class="about-foot">
						<text class="about-foot-line">{{ t('profile_about_tagline') }}</text>
						<text class="about-foot-line sub">{{ t('profile_about_sub') }}</text>
					</view>
				</view>
			</view>

			<view class="scroll-pad" />
		</view>
		<AppTabBar current="profile" />

		<view v-if="showAgentPopup" class="mask" @click="closeAgentPopup">
			<view class="agent-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ t('profile_popup_my_team') }}</text>
					<view class="popup-header-right">
						<text class="popup-count">{{ t('profile_team_count', { count: agentList.length }) }}</text>
						<text class="popup-close" @click="closeAgentPopup">×</text>
					</view>
				</view>
				<scroll-view scroll-y class="agent-list">
					<view v-if="agentList.length === 0" class="agent-empty">
						<text class="agent-empty-icon">🤖</text>
						<text class="agent-empty-text">{{ t('profile_agents_empty') }}</text>
						<text class="agent-empty-sub">{{ t('profile_agents_empty_sub') }}</text>
					</view>
					<view
						v-for="agent in agentList"
						:key="agent.id"
						class="agent-item"
						hover-class="agent-item-hover"
						@click="onAgentTap(agent)"
					>
						<view class="agent-avatar" :style="{ background: avatarColor(agent.name) }">
							<text class="agent-avatar-text">{{ avatarLetter(agent.name) }}</text>
						</view>
						<view class="agent-info">
							<view class="agent-top">
								<text class="agent-name">{{ agent.name }}</text>
								<text class="agent-role">{{ agent.role }}</text>
							</view>
							<text class="agent-last-msg">{{ agent.lastMsg || t('vt_agent_ready_hint') }}</text>
						</view>
						<view class="agent-right">
							<text v-if="agent.unread > 0" class="agent-badge">{{ agent.unread > 9 ? '9+' : agent.unread }}</text>
							<text class="agent-arrow">›</text>
						</view>
					</view>
				</scroll-view>
				<view class="popup-footer">
					<button class="popup-btn" @click="goCreateAgent">{{ t('profile_hire_new_cta') }}</button>
				</view>
			</view>
		</view>

		<view v-if="showDailyReportPopup" class="mask" @click="closeDailyReportPopup">
			<view class="report-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ t('profile_daily_report') }}</text>
					<view class="popup-header-right">
						<text class="popup-count">{{ dailyReport ? dailyReport.date : '' }}</text>
						<text class="popup-close" @click="closeDailyReportPopup">×</text>
					</view>
				</view>
				<scroll-view scroll-y class="report-list">
					<view v-if="dailyReport" class="report-content">
						<view class="report-summary">
							<view class="summary-item">
								<text class="summary-num">{{ dailyReport.agentCount }}</text>
								<text class="summary-label">{{ t('digital_employee_fallback') }}</text>
							</view>
							<view class="summary-item">
								<text class="summary-num">{{ dailyReport.groupCount }}</text>
								<text class="summary-label">{{ t('project_group_fallback') }}</text>
							</view>
						</view>
						<view class="report-divider" />
						<view class="report-section">
							<text class="section-title">{{ t('profile_report_team_status') }}</text>
							<view v-if="dailyReport.agentList.length === 0" class="report-empty">
								<text class="report-empty-text">{{ t('profile_report_no_agents') }}</text>
							</view>
							<view v-for="agent in dailyReport.agentList" :key="agent.name" class="report-agent">
								<view class="report-agent-avatar" :style="{ background: avatarColor(agent.name) }">
									<text class="report-agent-text">{{ avatarLetter(agent.name) }}</text>
								</view>
								<view class="report-agent-info">
									<text class="report-agent-name">{{ agent.name }}</text>
									<text class="report-agent-role">{{ agent.role }}</text>
								</view>
								<view class="report-agent-status" :class="{ busy: agent.status === 'busy' }">
									<text>{{ agent.status === 'busy' ? t('agent_status_busy') : t('agent_status_ready') }}</text>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getToken, getUserInfo, setUserInfo } from "@/utils/index";
	import { switchMainTab } from "@/utils/tabNav";
	import { t as translate, getLanguage } from "@/utils/lang";
	import AppTabBar from "@/components/AppTabBar.vue";
	import { getAuthProfile, mergeProfileIntoUser, resolveAvatarDisplayUrl } from "@/clientApi/authApi";
	import { listMyUserAgents } from "@/clientApi/agentsApi";
	import { loadProjectGroups } from "@/utils/virtualTeamStore";

	export default {
		components: { AppTabBar },
		data() {
			return {
				loggedIn: false,
				user: null,
				statusBarPx: 20,
				showAgentPopup: false,
				showDailyReportPopup: false,
				dailyReport: null,
				remoteAgents: [],
			};
		},
		computed: {
			displayName() {
				const _ = this.currentLanguage;
				if (!this.loggedIn) return this.t('not_logged_in');
				const u = this.user || {};
				const nick = u.nickname != null ? String(u.nickname).trim() : "";
				if (nick) return nick;
				const phone = u.phone || u.mobile || u.username || "";
				if (phone && String(phone).length >= 7) {
					const p = String(phone);
					return `${p.slice(0, 3)}****${p.slice(-4)}`;
				}
				return u.name || this.t('my_account');
			},
			accountSubLine() {
				const _ = this.currentLanguage;
				if (!this.loggedIn) return this.t("account_sub_guest");
				return this.t("account_sub_logged");
			},
			avatarChar() {
				const _ = this.currentLanguage;
				const n = this.displayName;
				if (!this.loggedIn) return this.t("profile_avatar_guest");
				return n && n.length ? n.slice(0, 1) : this.t("profile_avatar_guest");
			},
			avatarImg() {
				if (!this.loggedIn || !this.user) return "";
				return resolveAvatarDisplayUrl(this.user.avatarUrl);
			},
			agentList() {
				return this.remoteAgents;
			},
			agentCount() {
				return this.remoteAgents.length;
			},
			groupCount() {
				return loadProjectGroups().length;
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.currentLanguage = getLanguage();
			try {
				uni.setNavigationBarTitle({ title: translate("profile", this.currentLanguage) });
			} catch (e) {
				//
			}
			this.refreshAuth();
			this.loadRemoteAgents();
		},
		methods: {
			t(key, params = {}) {
				return translate(key, this.currentLanguage, params);
			},
			refreshAuth() {
				const token = getToken();
				this.loggedIn = !!token;
				this.user = getUserInfo();
				if (!token) {
					this.remoteAgents = [];
					return;
				}
				getAuthProfile()
					.then((profile) => {
						if (!profile || typeof profile !== "object") return;
						const merged = mergeProfileIntoUser(getUserInfo() || {}, profile);
						setUserInfo(merged);
						this.user = merged;
					})
					.catch(() => {});
			},
			async loadRemoteAgents() {
				if (!this.loggedIn) {
					this.remoteAgents = [];
					return;
				}
				try {
					const list = await listMyUserAgents();
					const rows = Array.isArray(list) ? list : [];
					this.remoteAgents = rows.map((a, idx) => ({
						id: a.id || String(idx),
						name: a.displayName || a.name || "未命名 Agent",
						role: a.jobTitle || a.rolePosition || "-",
						lastMsg: a.mainWork || "",
						unread: 0,
					}));
				} catch {
					this.remoteAgents = [];
				}
			},
			showAgentList() {
				uni.navigateTo({
					url: "/pages/team/my-team",
					fail: () => {
						uni.showToast({ title: "打开团队页失败，请重试", icon: "none" });
					},
				});
			},
			closeAgentPopup() {
				this.showAgentPopup = false;
			},
			showDailyReport() {
				this.generateDailyReport();
				this.showDailyReportPopup = true;
			},
			closeDailyReportPopup() {
				this.showDailyReportPopup = false;
			},
			generateDailyReport() {
				const today = new Date();
				const lang = getLanguage();
				const y = today.getFullYear();
				const m = today.getMonth() + 1;
				const d = today.getDate();
				const dateStr = translate("profile_report_date", lang, { y, m, d });
				const agents = this.remoteAgents;
				const groups = loadProjectGroups();
				try {
					this.dailyReport = {
						date: dateStr,
						agentCount: agents.length,
						groupCount: groups.length,
						agentList: agents.map(a => ({
							name: a.name,
							role: a.role,
							status: a.unread > 0 ? "busy" : "ready",
						})),
					};
				} catch {
					this.dailyReport = {
						date: dateStr,
						agentCount: agents.length,
						groupCount: groups.length,
						agentList: agents.map(a => ({
							name: a.name,
							role: a.role,
							status: "ready",
						})),
					};
				}
			},
			onAgentTap(agent) {
				if (!agent || !agent.id) return;
				this.showAgentPopup = false;
				const title = `${agent.name}（${agent.role}）`;
				uni.navigateTo({
					url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(agent.id)}&title=${encodeURIComponent(title)}`,
				});
			},
			avatarColor(name) {
				const colors = ["#07c160", "#10aeff", "#576b95", "#fa9d3b", "#1485ee", "#9a6bff"];
				let h = 0;
				const s = String(name || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(agent) {
				const n = (agent && agent.name) || "";
				if (n && String(n).trim()) return String(n).trim().slice(0, 1);
				return translate("profile_agent_char_fallback", getLanguage());
			},
			onHeaderTap() {
				if (this.loggedIn) {
					this.goProfileInfo();
				} else {
					this.goLogin();
				}
			},
			goPage(url) {
				const tabKey = {
					"/pages/home/home": "home",
					"/pages/project/project": "project",
					"/pages/add/add": "add",
					"/pages/chat/chat": "message",
				}[url];
				if (tabKey) {
					switchMainTab(tabKey);
					return;
				}
				uni.navigateTo({ url });
			},
			goLogin() {
				uni.navigateTo({ url: "/pages/login/login" });
			},
			goRegister() {
				uni.navigateTo({ url: "/pages/register/register" });
			},
			goChangePassword() {
				uni.navigateTo({ url: "/pages/profile/change-password" });
			},
			goSettings() {
				uni.navigateTo({ url: "/pages/profile/settings" });
			},
			goProfileInfo() {
				uni.navigateTo({ url: "/pages/profile/profile-info" });
			},
			goCreateAgent() {
				this.showAgentPopup = false;
				uni.navigateTo({ url: "/pages/team/create-agent" });
			},
			goCreateGroup() {
				uni.navigateTo({ url: "/pages/team/create-group" });
			},
		},
	};
</script>

<style scoped>
	.profile-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f2f2f7;
		box-sizing: border-box;
		font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		padding: 0;
		box-sizing: border-box;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.header-section {
		background: #fff;
		padding: 24rpx 20rpx 28rpx;
		border-bottom: 1rpx solid #e8e8ed;
	}

	.profile-header {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.profile-header:active {
		opacity: 0.92;
	}

	.header-arrow {
		font-size: 40rpx;
		color: #94a3b8;
		font-weight: 300;
		flex-shrink: 0;
		padding-left: 8rpx;
	}

	.header-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex: 1;
		min-width: 0;
		margin-right: 16rpx;
	}

	.avatar-wrap {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #e8ecf1;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 1rpx solid #e0e0e6;
	}

	.avatar-img {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
	}

	.avatar-text {
		font-size: 36rpx;
		font-weight: 600;
		color: #64748b;
	}

	.header-main {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
	}

	.name-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.nick {
		font-size: 34rpx;
		font-weight: 600;
		color: #111;
		line-height: 1.25;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ceo-badge {
		display: flex;
		align-items: center;
		gap: 6rpx;
		flex-shrink: 0;
	}

	.ceo-badge-icon {
		font-size: 24rpx;
	}

	.ceo-badge-text {
		font-size: 20rpx;
		font-weight: 600;
		color: #64748b;
		background: #f1f5f9;
		padding: 4rpx 10rpx;
		border-radius: 6rpx;
		letter-spacing: 0;
	}

	.account-line {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #475569;
		line-height: 1.35;
	}

	.team-overview {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		gap: 12rpx;
		margin-top: 24rpx;
		padding: 0;
	}

	.stat-card {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20rpx 10rpx 18rpx;
		box-sizing: border-box;
		border-radius: 12rpx;
		background: #fafafa;
		border: 1rpx solid #ececf0;
	}

	.stat-card-hover {
		background: #f4f4f6;
	}

	.stat-card-top {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		margin-bottom: 10rpx;
	}

	.stat-ico {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0;
		flex-shrink: 0;
	}

	.stat-ico-emoji {
		font-size: 30rpx;
		line-height: 1;
	}

	.bg-agents,
	.bg-groups {
		background: #eef0f3;
	}

	.team-stat-num {
		font-size: 30rpx;
		font-weight: 600;
		color: #111;
		line-height: 1;
		letter-spacing: -0.5rpx;
	}

	.team-stat-label {
		font-size: 22rpx;
		color: #8e8e93;
		font-weight: 500;
		text-align: center;
		line-height: 1.35;
		max-width: 100%;
		padding: 0 4rpx;
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		word-break: break-word;
	}

	.menu-section {
		padding: 16rpx 20rpx 0;
	}

	.menu-card {
		background: #fff;
		border-radius: 12rpx;
		border: 1rpx solid #e8e8ed;
		overflow: hidden;
		margin-bottom: 12rpx;
	}

	.menu-card-muted {
		background: #fafafa;
		border-color: #ececf0;
	}

	.menu-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-height: 96rpx;
		padding: 18rpx 20rpx;
		box-sizing: border-box;
	}

	.menu-row-hover {
		background: #f7f7f8;
	}

	.menu-row-static {
		min-height: 72rpx;
		padding-bottom: 12rpx;
	}

	.menu-row-icon {
		width: 44rpx;
		height: 44rpx;
		border-radius: 10rpx;
		background: #f2f2f7;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.menu-row-icon-mono {
		background: #f2f2f7;
	}

	.menu-row-emoji {
		font-size: 22rpx;
		line-height: 1;
	}

	.menu-row-ico {
		font-size: 28rpx;
		color: #64748b;
		line-height: 1;
	}

	.menu-row-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.menu-row-title {
		font-size: 30rpx;
		font-weight: 500;
		color: #111;
		line-height: 1.3;
	}

	.menu-row-title-only {
		flex: 1;
	}

	.menu-row-sub {
		font-size: 24rpx;
		color: #8e8e93;
		line-height: 1.35;
	}

	.menu-row-chev {
		flex-shrink: 0;
		font-size: 32rpx;
		color: #c7c7cc;
		font-weight: 300;
		padding-left: 8rpx;
	}

	.menu-row-extra {
		font-size: 26rpx;
		color: #8e8e93;
	}

	.menu-divider {
		height: 1rpx;
		background: #ececf0;
		margin-left: 80rpx;
	}

	.about-foot {
		padding: 0 20rpx 20rpx;
	}

	.about-foot-line {
		display: block;
		font-size: 24rpx;
		color: #8e8e93;
		line-height: 1.45;
	}

	.about-foot-line.sub {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #aeaeb2;
	}

	.scroll-pad {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #f2f2f7;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 100000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.agent-popup {
		width: 100%;
		max-height: 75vh;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.popup-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx 28rpx 24rpx;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.popup-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.popup-header-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 20rpx;
	}

	.popup-close {
		font-size: 48rpx;
		color: #94a3b8;
		font-weight: 300;
		line-height: 1;
		padding: 0 8rpx;
	}

	.popup-count {
		font-size: 26rpx;
		color: #64748b;
	}

	.agent-list {
		flex: 1;
		height: 0;
		min-height: 400rpx;
	}

	.agent-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 40rpx;
		text-align: center;
	}

	.agent-empty-icon {
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.agent-empty-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 12rpx;
	}

	.agent-empty-sub {
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.agent-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 24rpx 28rpx;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.agent-item-hover {
		background: #f8fafc;
	}

	.agent-avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 16rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.agent-avatar-text {
		font-size: 36rpx;
		font-weight: 700;
		color: #fff;
	}

	.agent-info {
		flex: 1;
		min-width: 0;
	}

	.agent-top {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		margin-bottom: 8rpx;
	}

	.agent-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.agent-role {
		font-size: 22rpx;
		color: #64748b;
		background: #f1f5f9;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
	}

	.agent-last-msg {
		font-size: 24rpx;
		color: #94a3b8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.agent-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.agent-badge {
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: #fa5151;
		color: #fff;
		font-size: 20rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.agent-arrow {
		font-size: 36rpx;
		color: #cbd5e1;
		font-weight: 300;
	}

	.popup-footer {
		padding: 20rpx 28rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #e2e8f0;
	}

	.report-popup {
		width: 100%;
		max-height: 75vh;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.report-list {
		flex: 1;
		height: 0;
		min-height: 500rpx;
	}

	.report-content {
		padding: 24rpx 28rpx;
	}

	.report-summary {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
	}

	.summary-item {
		flex: 1;
		background: linear-gradient(135deg, #eff6ff, #dbeafe);
		border-radius: 16rpx;
		padding: 20rpx 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
	}

	.summary-num {
		font-size: 40rpx;
		font-weight: 800;
		color: #1e40af;
	}

	.summary-label {
		font-size: 22rpx;
		color: #64748b;
	}

	.report-divider {
		height: 1rpx;
		background: #e2e8f0;
		margin: 24rpx 0;
	}

	.report-section {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1e293b;
	}

	.report-empty {
		padding: 40rpx 0;
		text-align: center;
	}

	.report-empty-text {
		font-size: 26rpx;
		color: #94a3b8;
	}

	.report-agent {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.report-agent:last-child {
		border-bottom: none;
	}

	.report-agent-avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}

	.report-agent-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #fff;
	}

	.report-agent-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.report-agent-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.report-agent-role {
		font-size: 22rpx;
		color: #64748b;
	}

	.report-agent-status {
		font-size: 22rpx;
		color: #07c160;
		background: #dcfce7;
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
	}

	.report-agent-status.busy {
		color: #f59e0b;
		background: #fef3c7;
	}

	.popup-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		border-radius: 44rpx;
		border: none;
	}
</style>

<style>
	/*
	 * 「我的」页大量样式在 scoped 内写死浅色；全局 App.vue 的 .page .cell 等选择器无法命中本页。
	 * 在深色模式下用 html[data-theme=dark] 下的选择器 + !important 统一覆盖。
	 */
	[data-theme="dark"] .profile-page {
		background-color: var(--bg-primary) !important;
	}

	[data-theme="dark"] .header-section {
		background: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .header-arrow {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .nick {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .account-line {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .ceo-badge-text {
		color: var(--text-secondary) !important;
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .stat-card {
		background: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: none !important;
	}

	[data-theme="dark"] .stat-card-hover {
		background: var(--cell-hover) !important;
	}

	[data-theme="dark"] .bg-agents,
	[data-theme="dark"] .bg-groups {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .team-stat-num {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .team-stat-label {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .menu-card {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .menu-card-muted {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .menu-row-hover {
		background: var(--cell-hover) !important;
	}

	[data-theme="dark"] .menu-row-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .menu-row-sub {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .menu-row-chev,
	[data-theme="dark"] .menu-row-extra {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .menu-divider {
		background: var(--border-color) !important;
	}

	[data-theme="dark"] .menu-row-icon,
	[data-theme="dark"] .menu-row-icon-mono {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .menu-row-ico {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .about-foot-line {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .about-foot-line.sub {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .scroll-pad {
		background-color: var(--bg-primary) !important;
	}

	[data-theme="dark"] .agent-popup,
	[data-theme="dark"] .report-popup {
		background: var(--bg-secondary) !important;
	}

	[data-theme="dark"] .popup-header {
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .popup-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .popup-close,
	[data-theme="dark"] .popup-count {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .agent-empty-text {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .agent-empty-sub {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .agent-item {
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .agent-item-hover {
		background: var(--cell-hover) !important;
	}

	[data-theme="dark"] .agent-name {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .agent-role {
		color: var(--text-secondary) !important;
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .agent-last-msg {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .agent-arrow {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .popup-footer {
		border-top-color: var(--border-color) !important;
	}

	[data-theme="dark"] .summary-item {
		background: rgba(37, 99, 235, 0.14) !important;
	}

	[data-theme="dark"] .summary-num {
		color: #93c5fd !important;
	}

	[data-theme="dark"] .summary-label {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .report-divider {
		background: var(--border-color) !important;
	}

	[data-theme="dark"] .section-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .report-empty-text {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .report-agent {
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .report-agent-name {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .report-agent-role {
		color: var(--text-secondary) !important;
	}
</style>

<style>
	@font-face {
		font-family: 'iconfont';
		src: url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 36rpx;
	}
</style>
