<template>
	<view class="page">
		<view class="hint">账号与安全</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="switchAccount">
				<view class="cell-icon bg-switch">
					<text class="iconfont cell-glyph">&#xe654;</text>
				</view>
				<text class="cell-title">切换账号</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="logoutAccount">
				<view class="cell-icon bg-out">
					<text class="iconfont cell-glyph">&#xe727;</text>
				</view>
				<text class="cell-title cell-danger">退出账号</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>
		<text class="sub-hint">切换账号将前往登录页以使用其他账号；退出账号将清除本机登录状态并返回「我的」。</text>
	</view>
</template>

<script>
	import { getToken, clearSession } from "@/utils/index";

	export default {
		onShow() {
			if (!getToken()) {
				uni.showToast({ title: "请先登录", icon: "none" });
				setTimeout(() => {
					uni.redirectTo({ url: "/pages/login/login" });
				}, 400);
			}
		},
		methods: {
			switchAccount() {
				uni.showModal({
					title: "切换账号",
					content: "将退出当前账号并前往登录页，以便使用其他账号登录。",
					confirmText: "前往登录",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.reLaunch({ url: "/pages/login/login" });
					},
				});
			},
			logoutAccount() {
				uni.showModal({
					title: "退出账号",
					content: "确定退出当前账号吗？",
					confirmText: "退出",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.showToast({ title: "已退出", icon: "success" });
						setTimeout(() => {
							uni.navigateBack({ delta: 1 });
						}, 400);
					},
				});
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 24rpx 28rpx 48rpx;
		box-sizing: border-box;
	}

	.hint {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		margin-bottom: 16rpx;
		padding-left: 4rpx;
	}

	.sub-hint {
		display: block;
		margin-top: 24rpx;
		padding: 0 8rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.cell-group {
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
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

	.bg-switch {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
	}

	.bg-out {
		background: linear-gradient(145deg, #64748b, #475569);
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

	.cell-arrow {
		flex-shrink: 0;
		font-size: 36rpx;
		color: #cbd5e1;
		font-weight: 300;
		line-height: 1;
		padding-left: 12rpx;
	}
</style>

<style>
	@font-face {
		font-family: "iconfont";
		src: url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2") format("woff2"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff") format("woff"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf") format("truetype");
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 36rpx;
	}
</style>
