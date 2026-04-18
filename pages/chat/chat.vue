<template>
	<view class="chat-page">
		<!-- Tab 入口：会话列表（原 message 页） -->
		<view v-if="viewMode === 'list'" class="list-mode">
			<view class="content">
				<view v-if="messages.length === 0" class="empty-state">
					<text class="empty-icon iconfont">&#xe87c;</text>
					<text class="empty-text">还没有消息哦</text>
				</view>
				<view v-else class="list-scroll">
					<view
						v-for="g in groupedMessages"
						:key="g.projectName"
						class="message-item"
						@click="openThread(g.projectName)"
					>
						<view class="avatar-wrapper">
							<text v-if="g.projectName === '老板'" class="avatar-icon iconfont icon-laoban"></text>
							<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
						</view>
						<view class="message-body">
							<view class="message-header">
								<view class="project-info">
									<text class="message-project">{{ g.projectName }}</text>
									<view v-if="g.unread > 0" class="unread-badge">{{ g.unread }}</view>
								</view>
								<text class="list-row-time">{{ formatListTime(g.latestMessage.time) }}</text>
							</view>
							<text class="message-content">{{ g.latestMessage.content }}</text>
						</view>
					</view>
				</view>
			</view>
			<AppTabBar current="message" />
		</view>

		<!-- 会话详情（原 chat 单页 UI） -->
		<view v-else class="chat-container thread-mode">
			<view class="chat-header">
				<text class="back-button iconfont" @click="closeThread">&#xe602;</text>
				<text v-if="projectName === '老板'" class="avatar-icon iconfont icon-laoban"></text>
				<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
				<text class="chat-title">{{ projectName }}</text>
			</view>
			<view class="chat-content" v-if="chatMessages.length > 0">
				<view
					v-for="msg in chatMessages"
					:key="msg.id"
					class="bubble-row"
					:class="{ 'my-message': msg.isMine }"
				>
					<view class="message-bubble" :class="{ 'my-message': msg.isMine }">
						<text class="bubble-text">{{ msg.content }}</text>
					</view>
					<text class="bubble-meta-time">{{ formatThreadTime(msg.time) }}</text>
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
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import { groupMessagesByProject, loadMessages, loadChatMessages, markMessagesAsRead } from "@/utils/messageUtils";

	export default {
		components: { AppTabBar },
		data() {
			return {
				viewMode: "list",
				messages: [],
				projectName: "",
				inputText: "",
				chatMessages: [],
			};
		},
		computed: {
			groupedMessages() {
				return groupMessagesByProject(this.messages);
			},
		},
		onLoad(options) {
			this.bootstrapList();
			const raw = options && options.projectName;
			if (raw) {
				this.projectName = decodeURIComponent(raw);
				this.viewMode = "thread";
				this.loadChatMessages();
				this.markAsRead();
			} else {
				this.viewMode = "list";
			}
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.bootstrapList();
			if (this.viewMode === "thread" && this.projectName) {
				this.loadChatMessages();
			}
		},
		methods: {
			bootstrapList() {
				this.messages = loadMessages();
			},
			openThread(projectName) {
				this.projectName = projectName;
				this.viewMode = "thread";
				this.loadChatMessages();
				this.markAsRead();
			},
			closeThread() {
				this.viewMode = "list";
				this.projectName = "";
				this.chatMessages = [];
				this.inputText = "";
				this.bootstrapList();
			},
			loadChatMessages() {
				this.chatMessages = loadChatMessages(this.projectName);
			},
			markAsRead() {
				markMessagesAsRead(this.projectName);
				this.bootstrapList();
			},
			sendMessage() {
				if (!this.inputText.trim()) return;

				const newMessage = {
					id: "msg-" + Date.now(),
					projectName: this.projectName,
					title: "消息",
					content: this.inputText.trim(),
					time: new Date().toISOString(),
					sender: "me",
					read: true,
				};

				const allMessages = uni.getStorageSync("projectMessages") || [];
				allMessages.unshift(newMessage);
				uni.setStorageSync("projectMessages", allMessages);

				this.inputText = "";
				this.loadChatMessages();
				this.bootstrapList();

				if (this.projectName === "老板") {
					setTimeout(() => {
						const replyMessage = {
							id: "msg-" + Date.now(),
							projectName: "老板",
							title: "回复",
							content: "好的，我知道了",
							time: new Date().toISOString(),
							read: false,
						};
						const updatedMessages = uni.getStorageSync("projectMessages") || [];
						updatedMessages.unshift(replyMessage);
						uni.setStorageSync("projectMessages", updatedMessages);
						this.loadChatMessages();
						this.bootstrapList();
					}, 1000);
				}
			},
			formatListTime(time) {
				const date = new Date(time);
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const hour = date.getHours().toString().padStart(2, "0");
				const minute = date.getMinutes().toString().padStart(2, "0");
				return `${month}/${day} ${hour}:${minute}`;
			},
			formatThreadTime(time) {
				const date = new Date(time);
				const hour = date.getHours().toString().padStart(2, "0");
				const minute = date.getMinutes().toString().padStart(2, "0");
				return `${hour}:${minute}`;
			},
		},
	};
</script>

<style scoped>
	.chat-page {
		height: 100vh;
		box-sizing: border-box;
	}

	.list-mode {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f4f6fb;
	}

	.list-mode .content {
		flex: 1;
		height: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.list-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 20rpx;
		box-sizing: border-box;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.empty-icon {
		font-family: iconfont !important;
		font-size: 80rpx;
		color: #ccc;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
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
		font-family: iconfont !important;
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

	.list-row-time {
		font-size: 22rpx;
		color: #999;
	}

	.message-content {
		font-size: 24rpx;
		color: #666;
		line-height: 1.5;
		display: block;
	}

	.thread-mode.chat-container {
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

	.chat-header .avatar-icon {
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
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
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

	.bubble-row {
		display: flex;
		flex-direction: column;
		margin-bottom: 20rpx;
		align-items: flex-start;
	}

	.bubble-row.my-message {
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

	.bubble-text {
		font-size: 24rpx;
		line-height: 1.5;
	}

	.message-bubble.my-message .bubble-text {
		color: #fff;
	}

	.bubble-meta-time {
		font-size: 20rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.chat-input {
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		display: flex;
		align-items: center;
		padding-left: 30rpx;
		padding-right: 30rpx;
		padding-top: 20rpx;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		gap: 20rpx;
		z-index: 100;
		box-sizing: border-box;
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

<style>
	@font-face {
		font-family: "iconfont";
		src: url("../../static/download/font_5162264_zt7ytonuy38/iconfont.woff2") format("woff2"),
			url("../../static/download/font_5162264_zt7ytonuy38/iconfont.woff") format("woff"),
			url("../../static/download/font_5162264_zt7ytonuy38/iconfont.ttf") format("truetype");
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 36rpx;
	}
</style>
