<template>
	<view class="message-page">
		<view class="content">
			<view v-if="groupedMessages.length === 0" class="empty-state">
				<text class="empty-icon iconfont">&#xe87c;</text>
				<text class="empty-text">还没有消息哦</text>
			</view>
			<view v-else class="message-list">
				<view
					v-for="(g, index) in groupedMessages"
					:key="g.projectName + '-' + index"
					class="message-item"
					@click="openChat(g.projectName)"
				>
					<view class="avatar-wrapper">
						<image
							class="avatar-image"
							:src="getDepartmentAvatar(g.projectName)"
							mode="aspectFit"
						/>
					</view>
					<view class="message-body">
						<view class="message-header">
							<view class="project-info">
								<text class="message-project">{{ g.projectName }}</text>
								<view v-if="g.unread > 0" class="unread-badge">{{ g.unread }}</view>
							</view>
							<text class="message-time">{{ formatTime(g.latestMessage.time) }}</text>
						</view>
						<text class="message-content">{{ getMessagePreview(g) }}</text>
					</view>
				</view>
			</view>
		</view>
		<AppTabBar current="message" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import agentDepartments from "@/data/agentDepartments";
	import { groupMessagesByProject, loadMessages } from "@/utils/messageUtils";

	export default {
		components: {
			AppTabBar,
		},
		data() {
			return {
				messages: []
			}
		},
		computed: {
			groupedMessages() {
				const grouped = groupMessagesByProject(this.messages);
				const byName = {};
				grouped.forEach(item => {
					byName[item.projectName] = item;
				});

				const departmentEntries = agentDepartments.map((dept, index) => {
					const projectName = dept.name.replace(/^[^\s\u4e00-\u9fa5A-Za-z]+/, "").trim();
					const existed = byName[projectName];
					if (existed) return existed;
					return {
						projectName,
						unread: 0,
						latestMessage: {
							content: "点击进入部门会话",
							time: new Date(0).toISOString()
						},
						__order: index
					};
				});

				return departmentEntries.sort((a, b) => {
					const aTime = new Date(a.latestMessage.time).getTime();
					const bTime = new Date(b.latestMessage.time).getTime();
					if (aTime === bTime) {
						return (a.__order || 0) - (b.__order || 0);
					}
					return bTime - aTime;
				});
			}
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
			this.loadMessagesData();
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.loadMessagesData();
		},
		methods: {
			loadMessagesData() {
				this.messages = loadMessages();
			},
			formatTime(time) {
				const date = new Date(time)
				if (date.getFullYear() === 1970) {
					return ''
				}
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
			getMessagePreview(group) {
				if (group.unread > 0) {
					return `有 ${group.unread} 条新消息`
				}
				return '暂无新消息'
			},
			getDepartmentAvatar(projectName) {
				const map = {
					工程部: "/static/工程部的图标，一个扳手_.png",
					设计部: "/static/设计部的图标，一支笔_.png",
					付费媒体部: "/static/一群小人观看电视__.png",
					销售部: "/static/一个小人把货物卖给另一个小人_.png",
					市场部: "/static/一个天平_.png",
					产品部: "/static/一个产品_.png",
					项目管理部: "/static/许多的项目_.png",
					测试部: "/static/一个小人对着电脑测试_.png",
					支援部: "/static/一个医疗的符号_.png",
					空间计算部: "/static/立体的正方形.png",
					专业部门: "/static/一本书.png",
					财务部: "/static/美金的图标.png",
					学术部: "/static/一群小人观看电视__ (1).png"
				};
				return map[projectName] || "/static/logo.png";
			}
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
		background: #f0f2f7;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.avatar-image {
		width: 56rpx;
		height: 56rpx;
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

	.message-project {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.unread-badge {
		background-color: #ff4d4f;
		background-color: #ff4d4f;
		color: #fff;
		font-size: 20rpx;
		padding: 2rpx 12rpx;
		border-radius: 12rpx;
		min-width: 24rpx;
		padding: 2rpx 12rpx;
		border-radius: 12rpx;
		min-width: 24rpx;
		text-align: center;
	}

	.message-time {
		font-size: 20rpx;
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