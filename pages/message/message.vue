<template>
	<view class="message-container">
		<view class="content">
			<view v-if="messages.length === 0" class="empty-state">
				<text class="empty-icon iconfont">&#xe87c;</text>
				<text class="empty-text">还没有消息哦</text>
			</view>
			<view v-else class="message-list">
				<view v-for="(msg, index) in groupedMessages" :key="msg.projectName" class="message-item" @click="openChat(msg.projectName)">
					<view class="avatar-wrapper">
						<text v-if="msg.projectName === '老板'" class="avatar-icon iconfont icon-laoban"></text>
						<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
					</view>
					<view class="message-body">
						<view class="message-header">
							<view class="project-info">
								<text class="message-project">{{ msg.projectName }}</text>
								<view v-if="msg.unread > 0" class="unread-badge">{{ msg.unread }}</view>
							</view>
							<text class="message-time">{{ formatTime(msg.latestMessage.time) }}</text>
						</view>
						<text class="message-content">{{ msg.latestMessage.content }}</text>
					</view>
				</view>
			</view>
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
	import AppTabBar from "@/components/AppTabBar.vue";

	export default {
		data() {
			return {
				currentPage: 'message',
				messages: []
			}
		},
		computed: {
			groupedMessages() {
				const grouped = {}
				this.messages.forEach(msg => {
					if (!grouped[msg.projectName]) {
						grouped[msg.projectName] = {
							projectName: msg.projectName,
							messages: [],
							unread: 0
						}
					}
					grouped[msg.projectName].messages.push(msg)
					if (!msg.read) {
						grouped[msg.projectName].unread++
					}
				})
				const result = Object.values(grouped).map(group => {
					group.messages.sort((a, b) => new Date(b.time) - new Date(a.time))
					group.latestMessage = group.messages[0]
					return group
				})
				return result.sort((a, b) => new Date(b.latestMessage.time) - new Date(a.latestMessage.time))
			}
		},
		onLoad() {
			this.loadMessages()
		},
		onShow() {
			this.loadMessages()
		},
		methods: {
			navigateTo(page) {
				uni.redirectTo({
					url: `/pages/${page}/${page}`
				});
			},
			loadMessages() {
				let stored = uni.getStorageSync('projectMessages') || []
				const firstLaunch = !uni.getStorageSync('hasLaunched')
				if (firstLaunch) {
					const bossMessage = {
						id: 'boss-' + Date.now(),
						projectName: '老板',
						title: '问候',
						content: '有什么问题',
						time: new Date().toISOString(),
						url: '',
						read: false
					}
					stored.unshift(bossMessage)
					uni.setStorageSync('projectMessages', stored)
					uni.setStorageSync('hasLaunched', true)
				}
				this.messages = stored.sort((a, b) => new Date(b.time) - new Date(a.time))
			},
			formatTime(time) {
				const date = new Date(time)
				const month = date.getMonth() + 1
				const day = date.getDate()
				const hour = date.getHours().toString().padStart(2, '0')
				const minute = date.getMinutes().toString().padStart(2, '0')
				return `${month}/${day} ${hour}:${minute}`
			},
			openChat(projectName) {
				uni.redirectTo({
					url: `/pages/chat/chat?projectName=${encodeURIComponent(projectName)}`
				})
			}
		}
	}
</script>

<style>
	@font-face {
		font-family: 'iconfont';
		src: url('../../static/download/font_5162264_zt7ytonuy38/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_zt7ytonuy38/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_zt7ytonuy38/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 36rpx;
	}

	.message-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #f4f6fb;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.empty-icon {
		font-family: 'iconfont' !important;
		font-size: 80rpx;
		color: #ccc;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}

	.message-list {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
	}

	.message-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
	}

	.avatar-wrapper {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.avatar-icon {
		font-family: 'iconfont' !important;
		font-size: 40rpx;
		color: #fff;
	}

	.message-body {
		flex: 1;
		min-width: 0;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.project-info {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.unread-badge {
		background-color: #ff3b30;
		color: #fff;
		font-size: 20rpx;
		padding: 2rpx 10rpx;
		border-radius: 10rpx;
		min-width: 30rpx;
		text-align: center;
	}

	.message-project {
		font-size: 24rpx;
		color: #007aff;
		font-weight: 600;
	}

	.message-time {
		font-size: 22rpx;
		color: #999;
	}

	.message-content {
		font-size: 24rpx;
		color: #666;
		line-height: 1.5;
		display: block;
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
		z-index: 101;
	}

	.center-icon {
		font-size: 40rpx;
		color: #fff;
	}
</style>
