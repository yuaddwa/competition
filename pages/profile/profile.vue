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
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="team-overview">
				<view class="team-stat-card" @click="showAgentList">
					<view class="team-stat-icon bg-agents">
						<text class="team-stat-icon-text">🤖</text>
					</view>
					<view class="team-stat-info">
						<text class="team-stat-num">{{ agentCount }}</text>
						<text class="team-stat-label">数字员工</text>
					</view>
					<text class="team-stat-arrow">›</text>
				</view>
				<view class="team-stat-card" @click="goCreateGroup">
					<view class="team-stat-icon bg-groups">
						<text class="team-stat-icon-text">👥</text>
					</view>
					<view class="team-stat-info">
						<text class="team-stat-num">{{ groupCount }}</text>
						<text class="team-stat-label">项目群</text>
					</view>
					<text class="team-stat-arrow">›</text>
				</view>
				<view class="team-stat-card" @click="goProject">
					<view class="team-stat-icon bg-workflows">
						<text class="team-stat-icon-text">📋</text>
					</view>
					<view class="team-stat-info">
						<text class="team-stat-num">{{ workflowCount }}</text>
						<text class="team-stat-label">工作流</text>
					</view>
					<text class="team-stat-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view class="quick-actions">
				<view class="quick-action-item" @click="goCreateAgent">
					<text class="quick-action-icon">⚡</text>
					<text class="quick-action-text">招聘新员工</text>
				</view>
				<view class="quick-action-item" @click="goCreateGroup">
					<text class="quick-action-icon">🚀</text>
					<text class="quick-action-text">创建项目群</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view class="cell-group">
				<view class="cell" @click="showDailyReport">
					<view class="cell-icon bg-report">
						<text class="cell-glyph-text">📊</text>
					</view>
					<text class="cell-title">工作日报</text>
					<text class="cell-sub">查看团队今日工作</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view class="cell-group">
				<view class="cell cell-border" @click="goPage('/pages/add/add')">
					<view class="cell-icon bg-add">
						<text class="iconfont cell-glyph">&#xe727;</text>
					</view>
					<text class="cell-title">下发任务</text>
					<text class="cell-sub">指派工作给AI团队</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view class="cell-group">
				<view class="cell" @click="goPage('/pages/project/project')">
					<view class="cell-icon bg-wf">
						<text class="iconfont cell-glyph">&#xe620;</text>
					</view>
					<text class="cell-title">工作流</text>
					<text class="cell-sub">管理协作流水线</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view v-if="!loggedIn" class="cell-group">
				<view class="cell cell-border" @click="goLogin">
					<view class="cell-icon bg-account">
						<text class="iconfont cell-glyph">&#xe654;</text>
					</view>
					<text class="cell-title">登录</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="goRegister">
					<view class="cell-icon bg-reg">
						<text class="iconfont cell-glyph">&#xe727;</text>
					</view>
					<text class="cell-title">注册</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view v-else class="cell-group">
				<view class="cell cell-border" @click="goPage('/pages/profile/model-settings')">
					<view class="cell-icon bg-pwd">
						<text class="iconfont cell-glyph">&#xe727;</text>
					</view>
					<text class="cell-title">模型与 API</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell cell-border" @click="goChangePassword">
					<view class="cell-icon bg-pwd">
						<text class="iconfont cell-glyph">&#xe78f;</text>
					</view>
					<text class="cell-title">修改密码</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="goSettings">
					<view class="cell-icon bg-settings">
						<text class="iconfont cell-glyph">&#xe654;</text>
					</view>
					<text class="cell-title">设置</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<view class="cell-group">
				<view class="cell cell-static">
					<text class="cell-title">关于</text>
					<text class="cell-extra">v1.0</text>
				</view>
				<view class="about-desc">
					<text class="about-line">一人公司 · AI驱动</text>
					<text class="about-line sub">你当老板，AI当员工</text>
				</view>
			</view>

			<view class="scroll-pad" />
		</view>
		<AppTabBar current="profile" />

		<view v-if="showAgentPopup" class="mask" @click="closeAgentPopup">
			<view class="agent-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">我的团队</text>
					<view class="popup-header-right">
						<text class="popup-count">{{ agentList.length }} 位员工</text>
						<text class="popup-close" @click="closeAgentPopup">×</text>
					</view>
				</view>
				<scroll-view scroll-y class="agent-list">
					<view v-if="agentList.length === 0" class="agent-empty">
						<text class="agent-empty-icon">🤖</text>
						<text class="agent-empty-text">还没有数字员工</text>
						<text class="agent-empty-sub">点击「招聘新员工」创建你的第一位AI员工</text>
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
							<text class="agent-last-msg">{{ agent.lastMsg || '已就绪，随时听候安排' }}</text>
						</view>
						<view class="agent-right">
							<text v-if="agent.unread > 0" class="agent-badge">{{ agent.unread > 9 ? '9+' : agent.unread }}</text>
							<text class="agent-arrow">›</text>
						</view>
					</view>
				</scroll-view>
				<view class="popup-footer">
					<button class="popup-btn" @click="goCreateAgent">＋ 招聘新员工</button>
				</view>
			</view>
		</view>

		<view v-if="showDailyReportPopup" class="mask" @click="closeDailyReportPopup">
			<view class="report-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">工作日报</text>
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
								<text class="summary-label">数字员工</text>
							</view>
							<view class="summary-item">
								<text class="summary-num">{{ dailyReport.groupCount }}</text>
								<text class="summary-label">项目群</text>
							</view>
							<view class="summary-item">
								<text class="summary-num">{{ dailyReport.workflowCount }}</text>
								<text class="summary-label">工作流</text>
							</view>
						</view>
						<view class="report-divider" />
						<view class="report-section">
							<text class="section-title">团队状态</text>
							<view v-if="dailyReport.agentList.length === 0" class="report-empty">
								<text class="report-empty-text">暂无数字员工</text>
							</view>
							<view v-for="agent in dailyReport.agentList" :key="agent.name" class="report-agent">
								<view class="report-agent-avatar" :style="{ background: avatarColor(agent.name) }">
									<text class="report-agent-text">{{ avatarLetter(agent.name) }}</text>
								</view>
								<view class="report-agent-info">
									<text class="report-agent-name">{{ agent.name }}</text>
									<text class="report-agent-role">{{ agent.role }}</text>
								</view>
								<view class="report-agent-status" :class="{ busy: agent.status === '忙碌中' }">
									<text>{{ agent.status }}</text>
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
	import AppTabBar from "@/components/AppTabBar.vue";
	import { getAuthProfile, mergeProfileIntoUser, resolveAvatarDisplayUrl } from "@/clientApi/authApi";
	import { loadDigitalAgents, loadProjectGroups } from "@/utils/virtualTeamStore";

	export default {
		components: { AppTabBar },
		data() {
			return {
				loggedIn: false,
				user: null,
				statusBarPx: 20,
				workflowCount: 0,
				showAgentPopup: false,
				showDailyReportPopup: false,
				dailyReport: null,
			};
		},
		computed: {
			displayName() {
				if (!this.loggedIn) return "未登录";
				const u = this.user || {};
				const nick = u.nickname != null ? String(u.nickname).trim() : "";
				if (nick) return nick;
				const phone = u.phone || u.mobile || u.username || "";
				if (phone && String(phone).length >= 7) {
					const p = String(phone);
					return `${p.slice(0, 3)}****${p.slice(-4)}`;
				}
				return u.name || "我的账号";
			},
			accountSubLine() {
				if (!this.loggedIn) return "点击登录，开始管理你的AI团队";
				return "一人公司 · 团队负责人";
			},
			avatarChar() {
				const n = this.displayName;
				if (!this.loggedIn) return "用";
				return n && n.length ? n.slice(0, 1) : "用";
			},
			avatarImg() {
				if (!this.loggedIn || !this.user) return "";
				return resolveAvatarDisplayUrl(this.user.avatarUrl);
			},
			agentList() {
				return loadDigitalAgents();
			},
			agentCount() {
				return loadDigitalAgents().length;
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
			this.refreshAuth();
			this.loadStats();
		},
		methods: {
			refreshAuth() {
				const token = getToken();
				this.loggedIn = !!token;
				this.user = getUserInfo();
				if (!token) return;
				getAuthProfile()
					.then((profile) => {
						if (!profile || typeof profile !== "object") return;
						const merged = mergeProfileIntoUser(getUserInfo() || {}, profile);
						setUserInfo(merged);
						this.user = merged;
					})
					.catch(() => {});
			},
			loadStats() {
				try {
					const workflows = uni.getStorageSync("workflows") || [];
					this.workflowCount = Array.isArray(workflows) ? workflows.length : 0;
				} catch {
					this.workflowCount = 0;
				}
			},
			showAgentList() {
				this.showAgentPopup = true;
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
				const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
				const agents = loadDigitalAgents();
				const groups = loadProjectGroups();
				try {
					const workflows = uni.getStorageSync("workflows") || [];
					this.dailyReport = {
						date: dateStr,
						agentCount: agents.length,
						groupCount: groups.length,
						workflowCount: Array.isArray(workflows) ? workflows.length : 0,
						agentList: agents.map(a => ({
							name: a.name,
							role: a.role,
							status: a.unread > 0 ? '忙碌中' : '已就绪'
						}))
					};
				} catch {
					this.dailyReport = {
						date: dateStr,
						agentCount: agents.length,
						groupCount: groups.length,
						workflowCount: 0,
						agentList: agents.map(a => ({
							name: a.name,
							role: a.role,
							status: '已就绪'
						}))
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
				const n = (agent && agent.name) || "员";
				return n.trim().slice(0, 1);
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
			goProject() {
				switchMainTab("project");
			},
		},
	};
</script>

<style scoped>
	.profile-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f1f5f9;
		box-sizing: border-box;
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
		background: linear-gradient(135deg, #1e3a5f 0%, #1a365d 50%, #2d3748 100%);
		padding: 32rpx 28rpx 40rpx;
	}

	.profile-header {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.profile-header:active {
		opacity: 0.9;
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
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.28);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 3rpx solid rgba(255, 255, 255, 0.2);
	}

	.avatar-img {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
	}

	.avatar-text {
		font-size: 40rpx;
		font-weight: 700;
		color: #fff;
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
		font-size: 36rpx;
		font-weight: 600;
		color: #fff;
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
		font-weight: 700;
		color: #fbbf24;
		background: rgba(251, 191, 36, 0.15);
		padding: 4rpx 10rpx;
		border-radius: 6rpx;
		letter-spacing: 1rpx;
	}

	.account-line {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.3;
	}

	.team-overview {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
		padding: 24rpx 28rpx;
		background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
	}

	.team-stat-card {
		flex: 1;
		background: #fff;
		border-radius: 20rpx;
		padding: 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid #e2e8f0;
	}

	.team-stat-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.team-stat-icon-text {
		font-size: 36rpx;
	}

	.bg-agents {
		background: linear-gradient(135deg, #dbeafe, #bfdbfe);
	}

	.bg-groups {
		background: linear-gradient(135deg, #dcfce7, #bbf7d0);
	}

	.bg-workflows {
		background: linear-gradient(135deg, #fef3c7, #fde68a);
	}

	.team-stat-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4rpx;
	}

	.team-stat-num {
		font-size: 36rpx;
		font-weight: 800;
		color: #0f172a;
		line-height: 1;
	}

	.team-stat-label {
		font-size: 22rpx;
		color: #64748b;
		font-weight: 500;
	}

	.team-stat-arrow {
		font-size: 28rpx;
		color: #94a3b8;
		font-weight: 600;
		margin-top: 4rpx;
	}

	.quick-actions {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
		padding: 0 28rpx;
	}

	.quick-action-item {
		flex: 1;
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx 16rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid #e2e8f0;
	}

	.quick-action-icon {
		font-size: 32rpx;
	}

	.quick-action-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #1e293b;
	}

	.group-spacer {
		height: 16rpx;
		background-color: #f1f5f9;
	}

	.cell-group {
		background-color: #fff;
		padding-left: 28rpx;
	}

	.cell {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-height: 108rpx;
		padding: 22rpx 28rpx 22rpx 0;
		box-sizing: border-box;
	}

	.cell-border {
		border-bottom: 1rpx solid #e2e8f0;
	}

	.cell:active {
		background-color: #f8fafc;
	}

	.cell-static:active {
		background-color: #fff;
	}

	.cell-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
	}

	.cell-glyph {
		font-size: 36rpx;
		color: #fff;
		line-height: 1;
	}

	.cell-glyph-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #fff;
	}

	.bg-wf {
		background: linear-gradient(145deg, #2563eb, #1d4ed8);
	}
	.bg-add {
		background: linear-gradient(145deg, #4f46e5, #4338ca);
	}
	.bg-account {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
	}
	.bg-reg {
		background: linear-gradient(145deg, #8b5cf6, #7c3aed);
	}
	.bg-pwd {
		background: linear-gradient(145deg, #64748b, #475569);
	}
	.bg-settings {
		background: linear-gradient(145deg, #0ea5e9, #0284c7);
	}
	.bg-report {
		background: linear-gradient(145deg, #2563eb, #1d4ed8);
	}

	.cell-title {
		flex: 1;
		font-size: 32rpx;
		color: #1e293b;
		font-weight: 400;
	}

	.cell-sub {
		font-size: 24rpx;
		color: #94a3b8;
		margin-right: 16rpx;
	}

	.cell-extra {
		font-size: 28rpx;
		color: #64748b;
		margin-right: 8rpx;
	}

	.cell-arrow {
		flex-shrink: 0;
		font-size: 36rpx;
		color: #cbd5e1;
		font-weight: 300;
		line-height: 1;
		padding-left: 12rpx;
	}

	.cell-static {
		border-bottom: 1rpx solid #e2e8f0;
	}

	.about-desc {
		padding: 24rpx 28rpx 28rpx 0;
	}

	.about-line {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.5;
	}

	.about-line.sub {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #94a3b8;
	}

	.scroll-pad {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #f1f5f9;
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
