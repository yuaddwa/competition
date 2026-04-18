<template>
	<view class="chat-page">
		<view class="chat-header">
			<text class="back-button iconfont" @click="goBack">&#xe602;</text>
			<text v-if="headerIsBoss" class="avatar-icon iconfont icon-laoban"></text>
			<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
			<text class="chat-title">{{ headerTitle }}</text>
		</view>
		<view v-if="loading" class="chat-empty">
			<text>加载中…</text>
		</view>
		<view class="chat-content" v-else-if="chatMessages.length > 0">
			<view
				v-for="msg in chatMessages"
				:key="msg.id"
				class="bubble-row"
				:class="{ 'my-message': msg.isMine }"
			>
				<view class="message-bubble" :class="{ 'my-message': msg.isMine }">
					<text class="bubble-text">{{ msg.content }}</text>
				</view>
				<text class="bubble-meta-time">{{ formatTime(msg.time) }}</text>
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
	import { loadChatMessages, markMessagesAsRead } from "@/utils/messageUtils";
	import { markCommsThreadRead } from "@/utils/commsInbox";
	import * as workflowApi from "@/api/workflowApi";
	import { pickId } from "@/utils/apiHelpers";
	import { getUserInfo } from "@/utils/index";

	function messageBody(m) {
		if (!m || typeof m !== "object") return "";
		return m.body || m.content || m.text || "";
	}

	function messageTime(m) {
		if (!m || typeof m !== "object") return "";
		return m.createdAt || m.time || m.timestamp || "";
	}

	function remoteMessageIsMine(m, user) {
		if (!m || !user) return false;
		const phone = user.phone || user.mobile || user.username || "";
		if (phone && (m.senderPhone === phone || m.fromPhone === phone || m.phone === phone)) return true;
		const uid = user.id ?? user.userId;
		if (uid != null && (m.fromUserId === uid || m.senderId === uid || m.userId === uid)) return true;
		return false;
	}

	export default {
		data() {
			return {
				projectName: "",
				mode: "local",
				workflowId: "",
				threadId: "",
				workflowTitle: "",
				threadTitle: "",
				inputText: "",
				chatMessages: [],
				loading: false,
				sending: false,
			};
		},
		computed: {
			headerTitle() {
				if (this.mode === "remote") {
					const a = (this.workflowTitle || "").trim();
					const b = (this.threadTitle || "").trim();
					if (a && b) return `${a} · ${b}`;
					return a || b || "工作流沟通";
				}
				return this.projectName || "聊天";
			},
			headerIsBoss() {
				return this.mode === "local" && this.projectName === "老板";
			},
		},
		onLoad(options) {
			const wf = options && options.workflowId ? decodeURIComponent(options.workflowId) : "";
			const th = options && options.threadId ? decodeURIComponent(options.threadId) : "";
			if (wf && th) {
				this.mode = "remote";
				this.workflowId = wf;
				this.threadId = th;
				this.workflowTitle = options.workflowTitle ? decodeURIComponent(options.workflowTitle) : "";
				this.threadTitle = options.threadTitle ? decodeURIComponent(options.threadTitle) : "";
				this.loadRemoteMessages();
				return;
			}
			const raw = options && options.projectName;
			if (raw) {
				this.mode = "local";
				this.projectName = decodeURIComponent(raw);
				this.loadChatMessages();
				this.markAsRead();
			}
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},
			loadChatMessages() {
				this.chatMessages = loadChatMessages(this.projectName);
			},
			markAsRead() {
				markMessagesAsRead(this.projectName);
			},
			async loadRemoteMessages() {
				this.loading = true;
				try {
					const list = await workflowApi.listMessages(this.workflowId, this.threadId);
					const arr = Array.isArray(list) ? list : [];
					const sorted = [...arr].sort((a, b) => {
						const ta = new Date(messageTime(a) || 0).getTime();
						const tb = new Date(messageTime(b) || 0).getTime();
						return ta - tb;
					});
					const user = getUserInfo();
					this.chatMessages = sorted.map((m) => ({
						id: pickId(m) || m.messageId || `m-${messageTime(m)}`,
						content: messageBody(m) || "（空）",
						time: messageTime(m) || new Date().toISOString(),
						isMine: remoteMessageIsMine(m, user),
					}));
					const last = sorted.length ? sorted[sorted.length - 1] : null;
					const lastIso = last ? messageTime(last) : new Date().toISOString();
					markCommsThreadRead(this.workflowId, this.threadId, lastIso);
				} catch (e) {
					console.warn("[chat] remote load", e);
					this.chatMessages = [];
				} finally {
					this.loading = false;
				}
			},
			sendMessage() {
				if (!this.inputText.trim()) return;
				if (this.mode === "remote") {
					this.sendRemote();
					return;
				}
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
					}, 1000);
				}
			},
			async sendRemote() {
				if (this.sending) return;
				const body = this.inputText.trim();
				this.sending = true;
				try {
					await workflowApi.sendMessage(this.workflowId, this.threadId, {
						content: body,
						body,
					});
					this.inputText = "";
					await this.loadRemoteMessages();
				} catch (e) {
					console.warn("[chat] send", e);
				} finally {
					this.sending = false;
				}
			},
			formatTime(time) {
				const date = new Date(time);
				if (Number.isNaN(date.getTime())) return "";
				const hour = date.getHours().toString().padStart(2, "0");
				const minute = date.getMinutes().toString().padStart(2, "0");
				return `${hour}:${minute}`;
			},
		},
	};
</script>

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

	.chat-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f4f6fb;
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
