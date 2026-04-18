<template>
	<view class="chat-container">
		<view class="chat-header">
			<text class="back-button iconfont" @click="goBack">&#xe602;</text>
			<text v-if="projectName === '老板'" class="avatar-icon iconfont icon-laoban"></text>
			<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
			<text class="chat-title">{{ projectName }}</text>
		</view>
		<view class="chat-content" v-if="chatMessages.length > 0">
			<view v-for="msg in chatMessages" :key="msg.id" class="message-wrapper" :class="{ 'my-message': msg.isMine }">
				<view class="message-bubble" :class="{ 'my-message': msg.isMine }">
					<text class="message-text">{{ msg.content }}</text>
				</view>
				<text class="message-time">{{ formatTime(msg.time) }}</text>
			</view>
		</view>
		<view v-else class="chat-empty">
			<text>暂无消息</text>
		</view>
		<view class="chat-input">
			<input type="text" v-model="inputText" placeholder="输入消息..." class="input-field" />
			<view class="send-button" @click="sendMessage">发送</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				projectName: '',
				inputText: '',
				chatMessages: []
			}
		},
		onLoad(options) {
			this.projectName = decodeURIComponent(options.projectName || '老板')
			this.loadChatMessages()
			this.markAsRead()
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			loadChatMessages() {
				const allMessages = uni.getStorageSync('projectMessages') || []
				this.chatMessages = allMessages.filter(msg => msg.projectName === this.projectName)
					.sort((a, b) => new Date(a.time) - new Date(b.time))
					.map(msg => ({
						...msg,
						isMine: msg.sender === 'me'
					}))
			},
			markAsRead() {
				const allMessages = uni.getStorageSync('projectMessages') || []
				const updatedMessages = allMessages.map(msg => {
					if (msg.projectName === this.projectName) {
						return { ...msg, read: true }
					}
					return msg
				})
				uni.setStorageSync('projectMessages', updatedMessages)
			},
			sendMessage() {
				if (!this.inputText.trim()) return

				const newMessage = {
					id: 'msg-' + Date.now(),
					projectName: this.projectName,
					title: '消息',
					content: this.inputText.trim(),
					time: new Date().toISOString(),
					sender: 'me',
					read: true
				}

				const allMessages = uni.getStorageSync('projectMessages') || []
				allMessages.unshift(newMessage)
				uni.setStorageSync('projectMessages', allMessages)

				this.inputText = ''
				this.loadChatMessages()

				if (this.projectName === '老板') {
					setTimeout(() => {
						const replyMessage = {
							id: 'msg-' + Date.now(),
							projectName: '老板',
							title: '回复',
							content: '好的，我知道了',
							time: new Date().toISOString(),
							read: false
						}
						const updatedMessages = uni.getStorageSync('projectMessages') || []
						updatedMessages.unshift(replyMessage)
						uni.setStorageSync('projectMessages', updatedMessages)
						this.loadChatMessages()
					}, 1000)
				}
			},
			formatTime(time) {
				const date = new Date(time)
				const hour = date.getHours().toString().padStart(2, '0')
				const minute = date.getMinutes().toString().padStart(2, '0')
				return `${hour}:${minute}`
			}
		}
	}
</script>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f4f6fb;
		overflow: hidden;
	}

	.chat-header {
		height: 80rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #e8e8e8;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
		flex-shrink: 0;
	}

	.back-button {
		font-size: 32rpx;
		margin-right: 30rpx;
	}

	.avatar-icon {
		font-family: 'iconfont' !important;
		font-size: 40rpx;
		margin-right: 16rpx;
	}

	.chat-title {
		font-size: 28rpx;
		font-weight: 600;
		flex: 1;
	}

	.chat-content {
		flex: 1;
		padding: 20rpx;
		padding-bottom: 120rpx;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		min-height: 0;
	}

	.chat-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 28rpx;
		min-height: 0;
	}

	.message-wrapper {
		display: flex;
		flex-direction: column;
		margin-bottom: 20rpx;
		align-items: flex-start;
	}

	.message-wrapper.my-message {
		align-items: flex-end;
	}

	.message-bubble {
		max-width: 70%;
		padding: 16rpx 20rpx;
		border-radius: 16rpx;
		background-color: #fff;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.message-bubble.my-message {
		background-color: #007aff;
		color: #fff;
	}

	.message-text {
		font-size: 24rpx;
		line-height: 1.5;
	}

	.message-bubble.my-message .message-text {
		color: #fff;
	}

	.message-time {
		font-size: 20rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.chat-input {
		height: 100rpx;
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		gap: 20rpx;
		z-index: 100;
	}

	.input-field {
		flex: 1;
		height: 60rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 30rpx;
		padding: 0 20rpx;
		font-size: 24rpx;
	}

	.send-button {
		padding: 12rpx 30rpx;
		background-color: #007aff;
		color: #fff;
		border-radius: 30rpx;
		font-size: 24rpx;
		font-weight: 600;
	}
</style>