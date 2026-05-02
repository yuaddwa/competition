<template>
	<view class="profile-page">
		<scroll-view scroll-y class="main-scroll">
			<view class="hero-block" :style="{ paddingTop: statusBarPx + 'px' }">
				<view class="top-bar">
					<view class="top-bar-left">
						<view class="title-row">
							<text class="page-title">{{ t("profile") }}</text>
							<view class="blue-dot" />
						</view>
						<text class="page-sub">{{ t("profile_page_subtitle") }}</text>
					</view>
					<view class="top-bar-right">
						<view class="sq-btn" @tap="onScanTap">
							<text class="sq-ico">⎕</text>
						</view>
						<view class="sq-btn sq-btn-bell" @tap="goSettings">
							<text class="sq-ico">🔔</text>
							<view v-if="loggedIn" class="bell-badge"><text class="bell-badge-t">3</text></view>
						</view>
					</view>
				</view>

				<view class="user-glass" @tap="onHeaderTap">
					<view class="user-glass-row">
						<view class="avatar-wrap">
							<image v-if="avatarImg" class="avatar-img" :src="avatarImg" mode="aspectFill" />
							<text v-else class="avatar-text">{{ avatarChar }}</text>
						</view>
						<view class="user-main">
							<view class="name-row">
								<text class="nick">{{ displayName }}</text>
								<text class="crown">👑</text>
								<view class="ceo-pill" v-if="loggedIn">
									<text class="ceo-pill-t">CEO</text>
								</view>
							</view>
							<text class="tagline">{{ accountSubLine }}</text>
							<view v-if="loggedIn" class="chip-tags">
								<view class="chip-tag"><text class="chip-tag-ico">🤖</text><text class="chip-tag-t">{{ t("profile_tag_ai") }}</text></view>
								<view class="chip-tag"><text class="chip-tag-ico">⚡</text><text class="chip-tag-t">{{ t("profile_tag_collab") }}</text></view>
								<view class="chip-tag"><text class="chip-tag-ico">📈</text><text class="chip-tag-t">{{ t("profile_tag_growth") }}</text></view>
							</view>
						</view>
						<text class="chev-right">›</text>
					</view>

					<view class="stats-dual">
						<view class="stat-card" hover-class="stat-card-hover" @tap.stop="showAgentList">
							<view class="stat-icon-box stat-icon-blue">
								<text class="stat-icon-emoji">👥</text>
							</view>
							<view class="stat-body">
								<text class="stat-label">{{ t("profile_stat_digital") }}</text>
								<text class="stat-num">{{ agentCount }}</text>
							</view>
							<view class="stat-side">
								<text class="stat-trend-up">↑ 1</text>
								<text class="stat-trend-sub">{{ t("profile_stat_vs_week") }}</text>
							</view>
						</view>
						<view class="stat-card" hover-class="stat-card-hover" @tap.stop="goCreateGroup">
							<view class="stat-icon-box stat-icon-purple">
								<text class="stat-icon-emoji">📁</text>
							</view>
							<view class="stat-body">
								<text class="stat-label">{{ t("profile_stat_groups") }}</text>
								<text class="stat-num">{{ groupCount }}</text>
							</view>
							<view class="stat-side">
								<text class="stat-trend-flat">-</text>
								<text class="stat-trend-sub">{{ t("profile_stat_in_progress") }}</text>
							</view>
						</view>
					</view>
				</view>

				<scroll-view scroll-x class="quick-scroll" :show-scrollbar="false">
					<view class="quick-row">
						<view class="qcard qcard-a" @tap="goCreateAgent">
							<view class="qcard-top">
								<text class="qcard-ico">👤+</text>
								<view class="qcard-go"><text class="qcard-go-i">→</text></view>
							</view>
							<text class="qcard-t">{{ t("profile_quick_card_1_t") }}</text>
							<text class="qcard-s">{{ t("profile_quick_card_1_sub") }}</text>
						</view>
						<view class="qcard qcard-b" @tap="goCreateGroup">
							<view class="qcard-top">
								<text class="qcard-ico">👥</text>
								<view class="qcard-go"><text class="qcard-go-i">→</text></view>
							</view>
							<text class="qcard-t">{{ t("profile_quick_card_2_t") }}</text>
							<text class="qcard-s">{{ t("profile_quick_card_2_sub") }}</text>
						</view>
						<view class="qcard qcard-c" @tap="goPage('/pages/worklog/worklog')">
							<view class="qcard-top">
								<text class="qcard-ico">📊</text>
								<view class="qcard-go"><text class="qcard-go-i">→</text></view>
							</view>
							<text class="qcard-t">{{ t("profile_quick_card_3_t") }}</text>
							<text class="qcard-s">{{ t("profile_quick_card_3_sub") }}</text>
						</view>
						<view class="qcard qcard-d" @tap="goPage('/pages/profile/settings')">
							<view class="qcard-top">
								<text class="qcard-ico">🏅</text>
								<view class="qcard-go"><text class="qcard-go-i">→</text></view>
							</view>
							<text class="qcard-t">{{ t("profile_quick_card_4_t") }}</text>
							<text class="qcard-s">{{ t("profile_quick_card_4_sub") }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view class="menu-section">
				<view class="settings-card">
					<view v-if="loggedIn" class="set-row" hover-class="set-row-hover" @click="goPage('/pages/profile/agent-model-assign')">
						<view class="set-icon set-icon-blue"><text class="set-emoji">🔗</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("agent_model_assign_nav") }}</text>
							<text class="set-sub">{{ t("profile_menu_models_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
					<view v-if="loggedIn" class="set-divider" />

					<view v-if="loggedIn" class="set-row" hover-class="set-row-hover" @click="goChangePassword">
						<view class="set-icon set-icon-purple"><text class="iconfont set-ico-font">&#xe78f;</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("change_password") }}</text>
							<text class="set-sub">{{ t("profile_menu_pass_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
					<view v-if="loggedIn" class="set-divider" />

					<view class="set-row" hover-class="set-row-hover" @click="goSettings">
						<view class="set-icon set-icon-gray"><text class="iconfont set-ico-font">&#xe654;</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("settings") }}</text>
							<text class="set-sub">{{ t("profile_menu_settings_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
					<view class="set-divider" />

					<view class="set-row" hover-class="set-row-hover" @click="goSettings">
						<view class="set-icon set-icon-orange"><text class="set-emoji">🔔</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("notification_settings") }}</text>
							<text class="set-sub">{{ t("profile_menu_notify_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
					<view class="set-divider" />

					<view class="set-row" hover-class="set-row-hover" @click="goProfileInfo">
						<view class="set-icon set-icon-green"><text class="set-emoji">🛡</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("data_privacy") }}</text>
							<text class="set-sub">{{ t("profile_menu_privacy_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
					<view class="set-divider" />

					<view class="set-row set-row-last" hover-class="set-row-hover" @click="goSettings">
						<view class="set-icon set-icon-sky"><text class="set-emoji">❓</text></view>
						<view class="set-mid">
							<text class="set-title">{{ t("help_feedback") }}</text>
							<text class="set-sub">{{ t("profile_menu_help_sub") }}</text>
						</view>
						<text class="set-chev">›</text>
					</view>
				</view>

				<view class="about-card">
					<view class="about-logo"><text class="about-logo-t">AI</text></view>
					<view class="about-texts">
						<text class="about-title">{{ t("profile_about_card_title") }}</text>
						<text class="about-desc">{{ t("profile_about_card_desc") }}</text>
					</view>
					<text class="about-deco">◆</text>
				</view>
			</view>

			<view class="scroll-pad" />
		</scroll-view>
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
				return this.t("profile_tagline_logged");
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
				if (url === "/pages/profile/agent-model-assign" && !this.loggedIn) {
					uni.showToast({ title: "未登录时不可用", icon: "none" });
					return;
				}
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
				uni.navigateTo({
					url,
					fail: () => {
						uni.showToast({ title: translate("load_failed_short", getLanguage()), icon: "none" });
					},
				});
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
				const loginFlag = this.loggedIn ? "1" : "0";
				uni.navigateTo({ url: `/pages/profile/settings?loggedIn=${loginFlag}` });
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
			onScanTap() {
				uni.scanCode({
					success: () => {},
					fail: () => {
						uni.showToast({ title: "扫码功能暂不可用", icon: "none" });
					},
				});
			},
		},
	};
</script>

<style scoped>
	.profile-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
<<<<<<< HEAD
		background: linear-gradient(180deg, #e8eeff 0%, #f5f7fa 28%, #f5f7fa 100%);
=======
		background-color: transparent;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		box-sizing: border-box;
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

<<<<<<< HEAD
	.hero-block {
		padding: 16rpx 24rpx 8rpx;
=======
	.header-section {
		background: var(--bg-secondary);
		padding: 24rpx 20rpx 28rpx;
		border-bottom: 1rpx solid var(--border-color);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.top-bar {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}

	.top-bar-left {
		flex: 1;
		min-width: 0;
	}

	.title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.page-title {
		font-size: 48rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.blue-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #2563eb;
		box-shadow: 0 0 12rpx rgba(37, 99, 235, 0.45);
	}

	.page-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.4;
	}

	.top-bar-right {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
		padding-top: 8rpx;
	}

	.sq-btn {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: #fff;
		box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.sq-ico {
		font-size: 32rpx;
		color: #0f172a;
		font-weight: 600;
	}

	.sq-btn-bell .sq-ico {
		font-size: 28rpx;
	}

	.bell-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid #f5f7fa;
		box-sizing: border-box;
	}

	.bell-badge-t {
		font-size: 20rpx;
		font-weight: 800;
		color: #fff;
	}

	.user-glass {
		border-radius: 36rpx;
		padding: 28rpx 24rpx 24rpx;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 255, 0.92));
		box-shadow: 0 12rpx 48rpx rgba(99, 102, 241, 0.12), 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		margin-bottom: 24rpx;
	}

	.user-glass:active {
		opacity: 0.96;
	}

	.user-glass-row {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.avatar-wrap {
		width: 112rpx;
		height: 112rpx;
		border-radius: 50%;
		background: #e8ecf1;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 4rpx solid #fff;
		box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.08);
	}

	.avatar-img {
		width: 112rpx;
		height: 112rpx;
		border-radius: 50%;
	}

	.avatar-text {
		font-size: 40rpx;
		font-weight: 700;
		color: #64748b;
	}

	.user-main {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
	}

	.name-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 10rpx;
	}

	.nick {
<<<<<<< HEAD
		font-size: 36rpx;
		font-weight: 800;
		color: #0f172a;
		max-width: 100%;
=======
		font-size: 34rpx;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.25;
		flex: 1;
		min-width: 0;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.crown {
		font-size: 28rpx;
	}

	.ceo-pill {
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #7c3aed, #6366f1);
	}

	.ceo-pill-t {
		font-size: 20rpx;
		font-weight: 800;
		color: #fff;
	}

	.tagline {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #64748b;
	}

	.chip-tags {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.chip-tag {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		padding: 8rpx 14rpx;
		background: #f1f5f9;
		border-radius: 12rpx;
	}

	.chip-tag-ico {
		font-size: 22rpx;
	}

	.chip-tag-t {
		font-size: 22rpx;
		color: #475569;
		font-weight: 600;
	}

	.chev-right {
		font-size: 40rpx;
		color: #cbd5e1;
		font-weight: 300;
		align-self: center;
	}

	.stats-dual {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
		margin-top: 28rpx;
	}

	.stat-card {
		flex: 1;
		min-width: 0;
		background: #fff;
		border-radius: 24rpx;
		padding: 20rpx 16rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
	}

	.stat-card-hover {
		opacity: 0.92;
	}

	.stat-icon-box {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-icon-blue {
		background: rgba(59, 130, 246, 0.12);
	}

	.stat-icon-purple {
		background: rgba(139, 92, 246, 0.12);
	}

	.stat-icon-emoji {
		font-size: 30rpx;
	}

	.stat-body {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		font-weight: 600;
	}

	.stat-num {
		display: block;
		font-size: 36rpx;
		font-weight: 800;
		color: #0f172a;
		margin-top: 4rpx;
	}

	.stat-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-shrink: 0;
	}

	.stat-trend-up {
		font-size: 24rpx;
<<<<<<< HEAD
		font-weight: 800;
		color: #16a34a;
	}

	.stat-trend-flat {
		font-size: 28rpx;
		font-weight: 600;
		color: #94a3b8;
	}

	.stat-trend-sub {
		font-size: 20rpx;
		color: #94a3b8;
		margin-top: 4rpx;
	}

	.quick-scroll {
		width: 100%;
		white-space: nowrap;
		padding-bottom: 8rpx;
	}

	.quick-row {
		display: inline-flex;
		flex-direction: row;
		gap: 16rpx;
		padding: 4rpx 2rpx 8rpx;
	}

	.qcard {
		display: inline-flex;
		flex-direction: column;
		width: 240rpx;
		min-height: 200rpx;
		padding: 20rpx 18rpx 18rpx;
		border-radius: 28rpx;
		box-sizing: border-box;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.1);
		vertical-align: top;
	}

	.qcard-a {
		background: linear-gradient(145deg, #3b82f6, #1d4ed8);
	}
	.qcard-b {
		background: linear-gradient(145deg, #8b5cf6, #6d28d9);
	}
	.qcard-c {
		background: linear-gradient(145deg, #14b8a6, #0d9488);
	}
	.qcard-d {
		background: linear-gradient(145deg, #f97316, #ea580c);
	}

	.qcard-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16rpx;
	}

	.qcard-ico {
		font-size: 36rpx;
		line-height: 1;
	}

	.qcard-go {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qcard-go-i {
		font-size: 24rpx;
		color: #fff;
		font-weight: 700;
	}

	.qcard-t {
		font-size: 28rpx;
		font-weight: 800;
		color: #fff;
		line-height: 1.35;
	}

	.qcard-s {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.88);
		line-height: 1.4;
		white-space: normal;
=======
		color: var(--text-secondary);
		line-height: 1.35;
	}

	.team-overview {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		margin-top: 24rpx;
		padding: 0;
		border-radius: 16rpx;
		background: var(--bg-tertiary);
		border: 1rpx solid var(--border-color);
		overflow: hidden;
	}

	.team-strip-half {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 14rpx;
		padding: 22rpx 16rpx;
		box-sizing: border-box;
	}

	.team-strip-half-hover {
		background: rgba(0, 0, 0, 0.04);
	}

	.team-strip-divider {
		width: 1rpx;
		align-self: stretch;
		background: #e0e0e6;
		flex-shrink: 0;
		margin: 16rpx 0;
	}

	.team-stat-num {
		font-size: 32rpx;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		letter-spacing: -0.5rpx;
		flex-shrink: 0;
	}

	.team-stat-label {
		font-size: 24rpx;
		color: var(--text-secondary);
		font-weight: 500;
		line-height: 1.3;
		max-width: 56%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.menu-section {
		padding: 8rpx 24rpx 0;
	}

<<<<<<< HEAD
	.settings-card {
		background: #fff;
		border-radius: 28rpx;
=======
	.menu-card {
		background: var(--bg-secondary);
		border-radius: 18rpx;
		border: 1rpx solid var(--border-color);
		box-shadow: var(--card-shadow-soft);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(15, 23, 42, 0.06);
		margin-bottom: 20rpx;
	}

	.set-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 26rpx 22rpx;
		min-height: 112rpx;
		box-sizing: border-box;
	}

<<<<<<< HEAD
	.set-row-hover {
		background: #f8fafc;
=======
	.menu-row-hover {
		background: var(--cell-hover);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.set-row-last {
		border-bottom: none;
	}

	.set-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.set-icon-blue {
		background: rgba(59, 130, 246, 0.12);
	}
	.set-icon-purple {
		background: rgba(139, 92, 246, 0.12);
	}
	.set-icon-gray {
		background: rgba(100, 116, 139, 0.1);
	}
	.set-icon-orange {
		background: rgba(249, 115, 22, 0.12);
	}
	.set-icon-green {
		background: rgba(34, 197, 94, 0.12);
	}
	.set-icon-sky {
		background: rgba(14, 165, 233, 0.12);
	}

	.set-emoji {
		font-size: 32rpx;
	}

	.set-ico-font {
		font-size: 32rpx;
		color: #475569;
	}

	.set-mid {
		flex: 1;
		min-width: 0;
	}

	.set-title {
		font-size: 30rpx;
<<<<<<< HEAD
		font-weight: 700;
		color: #0f172a;
=======
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.3;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.set-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
<<<<<<< HEAD
		color: #94a3b8;
=======
		color: var(--text-secondary);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		line-height: 1.35;
	}

	.set-chev {
		font-size: 32rpx;
		color: #cbd5e1;
	}

	.set-divider {
		height: 1rpx;
		background: #f1f5f9;
		margin-left: 114rpx;
	}

	.about-card {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 28rpx 22rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #e0f2fe, #eef2ff);
		box-shadow: 0 8rpx 28rpx rgba(14, 165, 233, 0.12);
		margin-bottom: 16rpx;
		gap: 20rpx;
	}

	.about-logo {
		width: 88rpx;
		height: 88rpx;
		border-radius: 22rpx;
		background: linear-gradient(145deg, #2563eb, #4f46e5);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.3);
	}

	.about-logo-t {
		font-size: 28rpx;
		font-weight: 900;
		color: #fff;
	}

	.about-texts {
		flex: 1;
		min-width: 0;
	}

	.about-title {
		font-size: 30rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.about-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.about-deco {
		font-size: 44rpx;
		color: rgba(37, 99, 235, 0.25);
		flex-shrink: 0;
	}

	.scroll-pad {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
<<<<<<< HEAD
		background: transparent;
=======
		background-color: transparent;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
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
	[data-theme="dark"] .profile-page {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .page-title,
	[data-theme="dark"] .nick,
	[data-theme="dark"] .stat-num,
	[data-theme="dark"] .set-title,
	[data-theme="dark"] .about-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .page-sub,
	[data-theme="dark"] .tagline,
	[data-theme="dark"] .set-sub,
	[data-theme="dark"] .about-desc,
	[data-theme="dark"] .stat-label {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .sq-btn,
	[data-theme="dark"] .user-glass,
	[data-theme="dark"] .stat-card,
	[data-theme="dark"] .settings-card {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .chip-tag {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .chip-tag-t {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .set-row-hover {
		background: var(--cell-hover) !important;
	}

	[data-theme="dark"] .set-divider {
		background: var(--border-color) !important;
	}

	[data-theme="dark"] .set-chev,
	[data-theme="dark"] .chev-right {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .about-card {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .agent-popup {
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
