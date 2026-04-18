<template>
	<view class="app-tab-bar">
		<view class="tab-item" :class="{ active: current === 'home' }" @click="go('home')">
			<text class="tab-icon iconfont">&#xe64f;</text>
			<text class="tab-text">首页</text>
		</view>
		<view class="tab-item" :class="{ active: current === 'project' }" @click="go('project')">
			<text class="tab-icon iconfont">&#xe620;</text>
			<text class="tab-text">项目</text>
		</view>
		<view class="tab-item center-item">
			<view class="center-button" :class="{ active: current === 'add' }" @click.stop="go('add')">
				<!-- 用几何线条画「+」，避免 iconfont 字框偏移导致看起来不居中 -->
				<view class="plus-icon">
					<view class="plus-bar plus-bar-h" />
					<view class="plus-bar plus-bar-v" />
				</view>
			</view>
		</view>
		<view class="tab-item" :class="{ active: current === 'message' }" @click="go('message')">
			<text class="tab-icon iconfont">&#xe87c;</text>
			<text class="tab-text">消息</text>
		</view>
		<view class="tab-item" :class="{ active: current === 'profile' }" @click="go('profile')">
			<text class="tab-icon iconfont">&#xe654;</text>
			<text class="tab-text">个人</text>
		</view>
	</view>
</template>

<script>
	import { switchMainTab } from "@/utils/tabNav";

	export default {
		name: "AppTabBar",
		props: {
			current: {
				type: String,
				required: true,
				validator: (v) => ["home", "project", "add", "message", "profile"].includes(v),
			},
		},
		methods: {
			go(page) {
				switchMainTab(page);
			},
		},
	};
</script>

<style scoped>
	.app-tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #fff;
		border-top: 1rpx solid #e2e8f0;
		box-sizing: border-box;
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

	.tab-icon {
		font-size: 36rpx;
		margin-bottom: 6rpx;
		color: #64748b;
	}

	.tab-text {
		font-size: 20rpx;
		color: #64748b;
	}

	.tab-item.active .tab-text {
		color: #2563eb;
		font-weight: bold;
	}

	.tab-item.active .tab-icon {
		color: #2563eb;
	}

	.center-item {
		position: relative;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: center;
		padding-bottom: 8rpx;
		min-height: 100rpx;
		box-sizing: border-box;
	}

	.center-button {
		position: relative;
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: -24rpx;
		box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.35);
		border: 4rpx solid #fff;
		box-sizing: border-box;
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
