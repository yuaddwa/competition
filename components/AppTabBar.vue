<template>
	<view class="app-tab-bar">
		<view class="tab-container">
			<view class="tab-item" :class="{ active: current === 'home' }" @click="go('home')">
				<text class="tab-icon iconfont">&#xe64f;</text>
				<text class="tab-text">{{ t('home') }}</text>
			</view>
			<view class="tab-item" :class="{ active: current === 'project' }" @click="go('project')">
				<text class="tab-icon iconfont">&#xe620;</text>
				<text class="tab-text">{{ t('project') }}</text>
			</view>
			<!-- 与微信常见底栏一致：中间一列留给悬浮「+」，项目 / 消息 分列加号左右 -->
			<view class="tab-item tab-item-center-spacer" />
			<view class="tab-item" :class="{ active: current === 'message' }" @click="go('message')">
				<view class="tab-icon-wrap">
					<text class="tab-icon iconfont">&#xe87c;</text>
					<view v-if="messageBadgeCount > 0" class="tab-badge">
						<text class="tab-badge-t">{{ messageBadgeCount > 99 ? "99+" : messageBadgeCount }}</text>
					</view>
				</view>
				<text class="tab-text">{{ t('message') }}</text>
			</view>
			<view class="tab-item" :class="{ active: current === 'profile' }" @click="go('profile')">
				<text class="tab-icon iconfont">&#xe654;</text>
				<text class="tab-text">{{ t('profile') }}</text>
			</view>
		</view>
		<view class="center-button-container">
			<view class="center-button" :class="{ active: current === 'add' }" @click.stop="go('add')">
				<!-- 用几何线条画「+」，避免 iconfont 字框偏移导致看起来不居中 -->
				<view class="plus-icon">
					<view class="plus-bar plus-bar-h" />
					<view class="plus-bar plus-bar-v" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { switchMainTab } from "@/utils/tabNav";
	import { t } from "@/utils/lang";

	export default {
		name: "AppTabBar",
		props: {
			current: {
			type: String,
			required: true,
			validator: (v) => ["home", "project", "add", "message", "profile"].includes(v),
		},
		},
		data() {
			return {
				messageBadgeCount: 0,
			};
		},
		mounted() {
			this.refreshMessageBadge();
			try {
				uni.$on("app-tab-badge-refresh", this.refreshMessageBadge);
			} catch {
				//
			}
		},
		beforeDestroy() {
			try {
				uni.$off("app-tab-badge-refresh", this.refreshMessageBadge);
			} catch {
				//
			}
		},
		methods: {
			refreshMessageBadge() {
				try {
					const n = Number(uni.getStorageSync("tab_message_badge") || 0);
					this.messageBadgeCount = n > 99 ? 99 : n;
				} catch {
					this.messageBadgeCount = 0;
				}
			},
			t(key) {
				return t(key);
			},
			go(page) {
				if (page === "add") {
					// 同页（project）点击 +：直接发事件，避免 switchTab 到同一路由不触发生命周期
					if (this.current === "project") {
						try {
							uni.$emit("openProjectCreateFromPlus");
						} catch {
							//
						}
						return;
					}
					try {
						uni.setStorageSync("open_project_create_from_plus", "1");
					} catch {
						//
					}
					switchMainTab("project");
					return;
				}
				switchMainTab(page);
			},
		},
	};
</script>

<style scoped>
	.app-tab-bar {
		position: fixed;
		left: 18rpx;
		right: 18rpx;
		bottom: 0;
		z-index: 100;
<<<<<<< HEAD
		background-color: #fff;
		border-top: 1rpx solid #e2e8f0;
=======
		background-color: var(--tab-bar-bg);
		border: 1rpx solid var(--border-color);
		border-bottom: none;
		border-radius: 26rpx 26rpx 0 0;
		box-shadow: 0 10rpx 36rpx rgba(15, 23, 42, 0.12);
		backdrop-filter: blur(10px);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		box-sizing: border-box;
		box-shadow: 0 -8rpx 32rpx rgba(15, 23, 42, 0.05);
	}

	.tab-container {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		min-width: 0;
		padding-bottom: 8rpx;
		min-height: 100rpx;
		box-sizing: border-box;
	}

	.tab-icon-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 6rpx;
	}

	.tab-badge {
		position: absolute;
		top: -14rpx;
		right: -28rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 8rpx;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid #fff;
		box-sizing: border-box;
	}

	.tab-badge-t {
		font-size: 18rpx;
		font-weight: 800;
		color: #fff;
		line-height: 1;
	}

	.tab-icon {
		font-size: 36rpx;
<<<<<<< HEAD
		color: #64748b;
=======
		margin-bottom: 6rpx;
		color: var(--text-secondary);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.tab-text {
		font-size: 20rpx;
		color: var(--text-secondary);
	}

	.tab-item.active .tab-text {
		color: var(--primary-color);
		font-weight: bold;
	}

	.tab-item.active .tab-icon {
		color: var(--primary-color);
	}

	.tab-item-center-spacer {
		flex: 1;
		min-width: 0;
		min-height: 100rpx;
		padding-bottom: 8rpx;
		pointer-events: none;
	}

	.center-button-container {
		position: absolute;
		left: 50%;
		top: 0;
		transform: translateX(-50%);
		z-index: 10;
	}

	.center-button {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-color-2));
		display: flex;
		align-items: center;
		justify-content: center;
<<<<<<< HEAD
		box-shadow: 0 12rpx 36rpx rgba(37, 99, 235, 0.4);
		border: 5rpx solid #fff;
=======
		box-shadow: 0 10rpx 28rpx rgba(49, 94, 251, 0.38);
		border: 4rpx solid var(--tab-bar-bg);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		box-sizing: border-box;
		margin-top: -28rpx;
	}


	.center-button.active {
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.45);
	}

	.plus-icon {
		position: relative;
		width: 34rpx;
		height: 34rpx;
		flex-shrink: 0;
	}

	.plus-bar {
		position: absolute;
		left: 50%;
		top: 50%;
		background-color: #ffffff;
		border-radius: 3rpx;
		transform: translate(-50%, -50%);
	}

	.plus-bar-h {
		width: 30rpx;
		height: 5rpx;
	}

	.plus-bar-v {
		width: 5rpx;
		height: 30rpx;
	}
</style>

<style>
	@font-face {
		font-family: "iconfont";
		src: url("../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2") format("woff2"),
			url("../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff") format("woff"),
			url("../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf") format("truetype");
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-style: normal;
	}
</style>
