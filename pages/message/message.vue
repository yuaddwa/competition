<template>
	<view class="message-page">
		<view class="content">
			<view v-if="loading" class="loading-row">
				<text class="loading-t">加载工作流会话…</text>
			</view>
			<view v-else-if="useRemote && remoteRows.length === 0" class="empty-state">
				<text class="empty-icon iconfont">&#xe87c;</text>
				<text class="empty-text">暂无工作流沟通会话</text>
				<text class="empty-hint">请先在「项目」创建工作流，并在工作台「沟通」中初始化线程</text>
			</view>
			<view v-else-if="useRemote" class="message-list">
				<view
					v-for="(row, index) in remoteRows"
					:key="row.id + '-' + index"
					class="message-item"
					@click="openRemoteChat(row)"
				>
					<view class="avatar-wrapper">
						<text class="avatar-icon iconfont icon-xiangmu"></text>
					</view>
					<view class="message-body">
						<view class="message-header">
							<view class="project-info">
								<text class="message-project">{{ row.projectName }}</text>
								<view v-if="!row.read" class="unread-badge">新</view>
							</view>
							<text class="message-time">{{ formatTime(row.time) }}</text>
						</view>
						<text class="message-content">{{ row.content }}</text>
					</view>
				</view>
			</view>
			<view v-else-if="useRemote === false && messages.length === 0" class="empty-state">
				<text class="empty-icon iconfont">&#xe87c;</text>
				<text class="empty-text">还没有消息哦</text>
				<text class="empty-hint">登录后可同步工作流沟通会话</text>
			</view>
			<view v-else class="message-list">
				<view
					v-for="(g, index) in groupedMessages"
					:key="g.projectName + '-' + index"
					class="message-item"
					@click="openChat(g.projectName)"
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
							<text class="message-time">{{ formatTime(g.latestMessage.time) }}</text>
						</view>
						<text class="message-content">{{ g.latestMessage.content }}</text>
					</view>
				</view>
			</view>
		</view>
		<AppTabBar current="message" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import { groupMessagesByProject, loadMessages } from "@/utils/messageUtils";
	import { listCommsInboxFromApi } from "@/utils/commsInbox";
	import { getToken } from "@/utils/index";

	export default {
		components: {
			AppTabBar
		},
		data() {
			return {
				messages: [],
				useRemote: false,
				remoteRows: [],
				loading: false,
			}
		},
		computed: {
			groupedMessages() {
				return groupMessagesByProject(this.messages);
			}
		},
		onLoad() {
			this.loadMessagesData()
		},
		onShow() {
			this.loadMessagesData()
		},
		methods: {
			async loadMessagesData() {
				if (getToken()) {
					this.loading = true;
					this.useRemote = true;
					try {
						this.remoteRows = await listCommsInboxFromApi();
					} catch (e) {
						console.warn("[message] inbox", e);
						this.remoteRows = [];
					} finally {
						this.loading = false;
					}
					return;
				}
				this.useRemote = false;
				this.remoteRows = [];
				this.messages = loadMessages();
			},
			formatTime(time) {
				const date = new Date(time)
				if (Number.isNaN(date.getTime())) return "-";
				const month = date.getMonth() + 1
				const day = date.getDate()
				const hour = date.getHours().toString().padStart(2, '0')
				const minute = date.getMinutes().toString().padStart(2, '0')
				return `${month}/${day} ${hour}:${minute}`
			},
			openChat(projectName) {
				uni.navigateTo({
					url: `/pages/chat/chat?projectName=${encodeURIComponent(projectName)}`
				})
			},
			openRemoteChat(row) {
				if (!row || !row.workflowId || !row.threadId) return;
				const q = [
					`workflowId=${encodeURIComponent(row.workflowId)}`,
					`threadId=${encodeURIComponent(row.threadId)}`,
					`workflowTitle=${encodeURIComponent(row.workflowTitle || "")}`,
					`threadTitle=${encodeURIComponent(row.threadTitle || "")}`,
				].join("&");
				uni.navigateTo({
					url: `/pages/chat/chat?${q}`,
				});
			},
		}
	}
</script>

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

	.message-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f4f6fb;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
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

	.empty-hint {
		font-size: 24rpx;
		color: #94a3b8;
		margin-top: 16rpx;
		padding: 0 48rpx;
		text-align: center;
		line-height: 1.5;
	}

	.loading-row {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48rpx;
	}

	.loading-t {
		font-size: 28rpx;
		color: #64748b;
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

	.message-project {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.unread-badge {
		background-color: #ff4d4f;
		color: #fff;
		font-size: 20rpx;
		padding: 2rpx 12rpx;
		border-radius: 12rpx;
		min-width: 24rpx;
		text-align: center;
	}

	.message-time {
		font-size: 20rpx;
		color: #999;
	}

	.message-content {
		font-size: 24rpx;
		color: #666;
		line-height: 1.5;
		display: block;
	}
</style>