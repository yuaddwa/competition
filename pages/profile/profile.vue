<template>
	<view class="profile-page">
		<!-- 同 home：小程序原生 scroll-view 会盖住 fixed 自定义 Tab -->
		<view class="main-scroll">
			<!-- 顶部资料区（仿「我」页：方角头像 + 昵称 + 副账号文案 + 右侧箭头） -->
			<view class="profile-header" @click="onHeaderTap">
				<view class="avatar-wrap">
					<image v-if="avatarImg" class="avatar-img" :src="avatarImg" mode="aspectFill" />
					<text v-else class="avatar-text">{{ avatarChar }}</text>
				</view>
				<view class="header-main">
					<text class="nick">{{ displayName }}</text>
					<text class="account-line">{{ accountSubLine }}</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>

			<view class="group-spacer" />

			<!-- 单条：工作流（类似「服务」单独成组） -->
			<view class="cell-group">
				<view class="cell" @click="goPage('/pages/project/project')">
					<view class="cell-icon bg-wf">
						<text class="iconfont cell-glyph">&#xe620;</text>
					</view>
					<text class="cell-title">工作流</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<!-- 功能列表：仿多行菜单，仅主标题一行 -->
			<view class="cell-group">
				<view class="cell cell-border" @click="goPage('/pages/add/add')">
					<view class="cell-icon bg-add">
						<text class="iconfont cell-glyph">&#xe727;</text>
					</view>
					<text class="cell-title">布置任务</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell cell-border" @click="goPage('/pages/chat/chat')">
					<view class="cell-icon bg-msg">
						<text class="iconfont cell-glyph">&#xe87c;</text>
					</view>
					<text class="cell-title">消息</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="goPage('/pages/home/home')">
					<view class="cell-icon bg-home">
						<text class="iconfont cell-glyph">&#xe64f;</text>
					</view>
					<text class="cell-title">首页</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<!-- 账号 -->
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
				<view class="cell" @click="logout">
					<view class="cell-lead-gap" />
					<text class="cell-title cell-danger">退出登录</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<view class="group-spacer" />

			<!-- 关于 -->
			<view class="cell-group">
				<view class="cell cell-static">
					<text class="cell-title">关于</text>
					<text class="cell-extra">v1.0</text>
				</view>
				<view class="about-desc">
					<text class="about-line">协作工作台 · 竞赛项目</text>
					<text class="about-line sub">界面以实际接口文档为准</text>
				</view>
			</view>

			<view class="scroll-pad" />
		</view>
		<AppTabBar current="profile" />
	</view>
</template>

<script>
	import { getToken, getUserInfo, setUserInfo, clearSession } from "@/utils/index";
	import { switchMainTab } from "@/utils/tabNav";
	import AppTabBar from "@/components/AppTabBar.vue";
	import { getAuthProfile, mergeProfileIntoUser, resolveAvatarDisplayUrl } from "@/clientApi/authApi";

	export default {
		components: { AppTabBar },
		data() {
			return {
				loggedIn: false,
				user: null,
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
				if (!this.loggedIn) return "账号: 点击登录";
				const u = this.user || {};
				const phone = u.phone || u.mobile || u.username || "";
				if (phone && String(phone).length >= 7) {
					const p = String(phone);
					const masked = `${p.slice(0, 3)}****${p.slice(-4)}`;
					return `手机号: ${masked}`;
				}
				return "账号: 已登录";
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
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.refreshAuth();
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
			goProfileInfo() {
				uni.navigateTo({ url: "/pages/profile/profile-info" });
			},
			logout() {
				uni.showModal({
					title: "退出登录",
					content: "确定退出当前账号吗？",
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						this.refreshAuth();
						uni.showToast({ title: "已退出", icon: "success" });
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

	/* 顶部资料 */
	.profile-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 36rpx 28rpx 40rpx;
		background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
		border-bottom: 1rpx solid #e2e8f0;
	}

	.profile-header:active {
		background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
	}

	.avatar-wrap {
		width: 128rpx;
		height: 128rpx;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.28);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.avatar-img {
		width: 128rpx;
		height: 128rpx;
		border-radius: 16rpx;
	}

	.avatar-text {
		font-size: 48rpx;
		font-weight: 700;
		color: #fff;
	}

	.header-main {
		flex: 1;
		min-width: 0;
		margin-left: 28rpx;
		margin-right: 16rpx;
	}

	.nick {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #0f172a;
		line-height: 1.25;
	}

	.account-line {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.3;
	}

	/* 分组间隔 */
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

	/* 与全站蓝紫主色一致，仅用明度区分行 */
	.bg-wf {
		background: linear-gradient(145deg, #2563eb, #1d4ed8);
	}
	.bg-add {
		background: linear-gradient(145deg, #4f46e5, #4338ca);
	}
	.bg-msg {
		background: linear-gradient(145deg, #6366f1, #4f46e5);
	}
	.bg-home {
		background: linear-gradient(145deg, #7c3aed, #6d28d9);
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

	/* 无图标行与左侧图标列对齐（与微信「退出」样式一致） */
	.cell-lead-gap {
		width: 88rpx;
		flex-shrink: 0;
		margin-right: 0;
	}

	.cell-title {
		flex: 1;
		font-size: 32rpx;
		color: #1e293b;
		font-weight: 400;
	}

	.cell-danger {
		color: #dc2626;
		font-weight: 500;
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
