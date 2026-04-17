<template>
	<view class="profile-container">
		<view class="content">
			<text>个人页面</text>
			<button class="logout-btn" @click="logout">退出登录 / 切换账号</button>
		</view>
		<view class="tab-bar">
			<view class="tab-item" :class="{ active: currentPage === 'home' }" @click="navigateTo('home')">
				<text class="tab-icon iconfont">&#xe64f;</text>
				<text class="tab-text">首页</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'project' }" @click="navigateTo('project')">
				<text class="tab-icon iconfont">&#xe620;</text>
				<text class="tab-text">项目</text>
			</view>
			<view class="tab-item center-item">
				<view class="center-button" @click="navigateTo('add')">
					<text class="center-icon iconfont"></text>
				</view>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'message' }" @click="navigateTo('message')">
				<text class="tab-icon iconfont">&#xe87c;</text>
				<text class="tab-text">消息</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'profile' }" @click="navigateTo('profile')">
				<text class="tab-icon iconfont">&#xe654;</text>
				<text class="tab-text">个人</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { clearToken } from '@/utils/index'

	export default {
		data() {
			return {
				currentPage: 'profile'
			}
		},
		onLoad() {

		},
		methods: {
			navigateTo(page) {
				uni.navigateTo({
					url: `/pages/${page}/${page}`
				});
			},
			logout() {
				uni.showModal({
					title: '提示',
					content: '确认退出当前账号吗？',
					success: (res) => {
						if (!res.confirm) return;
						clearToken();
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						});
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}, 300);
					}
				});
			}
		}
	}
</script>

<style>
	@font-face {
		font-family: 'iconfont';  /* Project id 5162264 */
		src: url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 36rpx;
	}

	.profile-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.content {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}

	.logout-btn {
		margin-top: 40rpx;
		width: 360rpx;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #ff4d4f;
		color: #fff;
		font-size: 28rpx;
		border-radius: 10rpx;
	}

	.tab-bar {
		display: flex;
		align-items: center;
		height: 100rpx;
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		position: relative;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 100%;
	}

	.tab-icon {
		font-size: 36rpx;
		margin-bottom: 8rpx;
	}

	.tab-text {
		font-size: 20rpx;
		color: #666;
	}

	.tab-item.active .tab-text {
		color: #333;
		font-weight: bold;
	}

	.center-item {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		flex: 1;
	}

	.center-button {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: #007aff;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: -40rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.center-icon {
		font-size: 40rpx;
		color: #fff;
	}
</style>