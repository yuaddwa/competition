<template>
	<view class="page-root">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="navbar">
				<view class="navbar-side"></view>
				<text class="navbar-title">消息</text>
				<view class="navbar-side navbar-side-right" @click="showAddMenu">
					<text class="navbar-plus">＋</text>
				</view>
			</view>
		</view>

		<view class="msg-tab-strip">
			<view
				class="msg-tab-item"
				:class="{ 'msg-tab-active': messageTab === 0 }"
				@tap="messageTab = 0"
			>
				<text class="msg-tab-text">会话</text>
				<view v-if="messageTab === 0" class="msg-tab-underline"></view>
			</view>
			<view
				class="msg-tab-item"
				:class="{ 'msg-tab-active': messageTab === 1 }"
				@tap="messageTab = 1"
			>
				<text class="msg-tab-text">协作与部门</text>
				<view v-if="messageTab === 1" class="msg-tab-underline"></view>
			</view>
		</view>

		<scroll-view scroll-y class="feed-scroll" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="messageTab === 0" class="tip-line">
				<text class="tip-t">经理总览、项目群与工作流会话</text>
			</view>
			<view v-if="messageTab === 1" class="tip-line">
				<text class="tip-t">按部门浏览岗位角色，进入人格对话</text>
			</view>

			<view v-if="loading" class="wx-loading"><text>加载中...</text></view>
			<template v-else>
				<template v-if="messageTab === 0">
					<view v-if="feedRows.length === 0" class="wx-empty wx-empty-inline wx-empty-first">
						<text class="wx-empty-t">暂无会话</text>
						<text class="wx-empty-sub">点击右上角「＋」创建项目群或数字员工</text>
					</view>
					<view v-else>
						<view
							v-for="row in feedRows"
							:key="row.id"
							class="wx-cell"
							hover-class="wx-cell-hover"
							@click="onRowTap(row)"
						>
							<view class="wx-avatar" :style="{ background: avatarBg(row) }">
								<text class="wx-avatar-t">{{ avatarLetter(row) }}</text>
							</view>
							<view class="wx-cell-main">
								<view class="wx-cell-top">
									<view class="wx-title-wrap">
										<text class="wx-title">{{ row.title }}</text>
										<text v-if="row.badge" class="wx-tag">{{ row.badge }}</text>
									</view>
									<text class="wx-time">{{ formatRowTime(row.time) }}</text>
								</view>
								<view class="wx-cell-bottom">
									<text class="wx-sub">{{ row.subtitle }}</text>
									<view v-if="row.unread > 0" class="wx-badge">{{ row.unread > 99 ? "99+" : row.unread }}</view>
								</view>
							</view>
						</view>
					</view>
				</template>

				<template v-if="messageTab === 1">
					<view
						v-for="block in departmentBlocks"
						:key="block.slug"
						class="dept-wrap"
					>
						<view
							class="wx-cell wx-cell-dept"
							hover-class="wx-cell-hover"
							@tap="goDepartmentRoles(block)"
						>
							<image class="wx-dept-icon" :src="block.icon" mode="aspectFit" />
							<view class="wx-cell-main">
								<view class="wx-cell-top wx-cell-top-dept">
									<view class="wx-title-wrap">
										<text class="wx-title">{{ block.title }}</text>
									</view>
									<text class="wx-dept-count">{{ block.count }} 岗</text>
								</view>
								<text v-if="block.desc" class="wx-sub wx-sub-dept">{{ block.desc }}</text>
							</view>
							<text class="wx-chevron">›</text>
						</view>
					</view>
				</template>
			</template>
			<view class="wx-pad"></view>
		</scroll-view>

		<AppTabBar current="message"></AppTabBar>
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import {
		getDailyBriefing,
		buildMessageFeedRows,
		loadProjectGroups,
		loadDigitalAgents,
		MANAGER_ID,
	} from "@/utils/virtualTeamStore";
	import { loadUnifiedConversationList } from "@/utils/conversationInbox";
	import { buildMessageDepartmentBlocks } from "@/utils/messageDepartmentConfig";

	export default {
		components: { AppTabBar },
		data() {
			return {
				statusBarPx: 20,
				departmentBlocks: [],
				feedRows: [],
				briefing: {
					managerSummary: "",
					scheduleNote: "",
					managerTime: "",
					employeeLines: [],
				},
				refreshing: false,
				loading: true,
				/** 0 会话 · 1 协作与部门 */
				messageTab: 0,
			};
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
			this.loadList();
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.loadList();
		},
		methods: {
			rebuildDepartmentBlocks() {
				this.departmentBlocks = buildMessageDepartmentBlocks();
			},
			goDepartmentRoles(block) {
				if (!block || !block.slug) return;
				const title = block.title || block.slug;
				uni.navigateTo({
					url: `/pages/message/department-roles?slug=${encodeURIComponent(block.slug)}&title=${encodeURIComponent(title)}`,
				});
			},
			async loadList() {
				this.loading = true;
				try {
					this.briefing = getDailyBriefing();
					this.rebuildDepartmentBlocks();
					const feed = buildMessageFeedRows().filter((r) => r.rowKind !== "daily_agent");
					let mapped = [];
					try {
						const unified = await loadUnifiedConversationList();
						const extra = unified.filter((u) => u.convType === "workflow" || u.convType === "local");
						mapped = extra.map((u) => ({
							id: u.id,
							rowKind: "unified",
							convType: u.convType,
							title: u.title,
							subtitle: u.subtitle || "",
							time: u.time,
							unread: u.unread || 0,
							badge: "",
							navigate: u.navigate,
						}));
					} catch (e2) {
						console.warn("[message] unified inbox", e2);
					}
					this.feedRows = [...feed, ...mapped];
				} catch (e) {
					console.warn("[message] load", e);
					this.rebuildDepartmentBlocks();
					this.feedRows = buildMessageFeedRows().filter((r) => r.rowKind !== "daily_agent");
				} finally {
					this.loading = false;
					this.refreshing = false;
				}
			},
			async onRefresh() {
				this.refreshing = true;
				await this.loadList();
			},
			showAddMenu() {
				uni.showActionSheet({
					itemList: ["创建项目群", "创建数字员工"],
					success: (res) => {
						if (res.tapIndex === 0) {
							uni.navigateTo({ url: "/pages/team/create-group" });
						} else if (res.tapIndex === 1) {
							uni.navigateTo({ url: "/pages/team/create-agent" });
						}
					},
				});
			},
			avatarBg(row) {
				const colors = ["#07c160", "#10aeff", "#576b95", "#fa9d3b", "#1485ee", "#9a6bff"];
				const s = row.id || row.title || "";
				let h = 0;
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(row) {
				if (row.rowKind === "manager") return "经";
				if (row.rowKind === "group") return "群";
				if (row.rowKind === "unified" && row.convType === "workflow") return "项";
				const t = (row.title || "?").trim();
				return t.slice(0, 1);
			},
			formatWxTime(iso) {
				const d = new Date(iso);
				if (Number.isNaN(d.getTime())) return "";
				const now = new Date();
				const pad = (n) => (n < 10 ? "0" + n : "" + n);
				const sameDay = d.toDateString() === now.toDateString();
				if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
				const yest = new Date(now);
				yest.setDate(yest.getDate() - 1);
				if (d.toDateString() === yest.toDateString()) return "昨天";
				return `${d.getMonth() + 1}月${d.getDate()}日`;
			},
			formatRowTime(t) {
				if (t == null || t === "") return "";
				const d = new Date(t);
				if (!Number.isNaN(d.getTime())) return this.formatWxTime(t);
				return String(t);
			},
			onRowTap(row) {
				if (row.rowKind === "unified" && row.navigate) {
					const n = row.navigate;
					if (n.mode === "remote") {
						const q = [
							`workflowId=${encodeURIComponent(n.workflowId)}`,
							`threadId=${encodeURIComponent(n.threadId)}`,
							`workflowTitle=${encodeURIComponent(n.workflowTitle || "")}`,
							`threadTitle=${encodeURIComponent(n.threadTitle || "")}`,
						].join("&");
						uni.navigateTo({ url: `/pages/chat/chat?${q}` });
						return;
					}
					if (n.mode === "local" && n.projectName) {
						uni.navigateTo({
							url: `/pages/chat/chat?projectName=${encodeURIComponent(n.projectName)}`,
						});
					}
					return;
				}
				if (row.rowKind === "manager") {
					uni.navigateTo({
						url: `/pages/chat/chat?mode=virtual&kind=manager&id=${encodeURIComponent(MANAGER_ID)}&title=${encodeURIComponent("经理总览")}`,
					});
					return;
				}
				if (row.rowKind === "daily_agent" && row.agentId) {
					const agents = loadDigitalAgents();
					const a = agents.find((x) => x.id === row.agentId);
					const title = a ? `${a.name}（${a.role}）` : "数字员工";
					uni.navigateTo({
						url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(row.agentId)}&title=${encodeURIComponent(title)}`,
					});
					return;
				}
				if (row.rowKind === "group" && row.groupId) {
					const groups = loadProjectGroups();
					const g = groups.find((x) => x.id === row.groupId);
					const name = g ? g.name : "项目群";
					uni.navigateTo({
						url: `/pages/chat/chat?mode=virtual&kind=group&id=${encodeURIComponent(row.groupId)}&title=${encodeURIComponent(name)}`,
					});
				}
			},
		},
	};
</script>

<style>
	.page-root {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #ededed;
		box-sizing: border-box;
	}

	.navbar-wrap {
		background: #ededed;
		flex-shrink: 0;
	}

	.navbar {
		height: 88rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx 0 24rpx;
		border-bottom: 1rpx solid #d9d9d9;
	}

	.navbar-side {
		width: 88rpx;
		min-height: 1px;
	}

	.navbar-side-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 16rpx;
	}

	.navbar-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: 600;
		color: #000;
	}

	.navbar-plus {
		font-size: 44rpx;
		font-weight: 300;
		color: #191919;
		line-height: 1;
	}

	.feed-scroll {
		flex: 1;
		height: 0;
	}

	.msg-tab-strip {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		background: #ededed;
		border-bottom: 1rpx solid #d9d9d9;
		padding: 0 48rpx;
	}

	.msg-tab-item {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 20rpx 0 16rpx;
		min-height: 72rpx;
		box-sizing: border-box;
	}

	.msg-tab-text {
		font-size: 30rpx;
		color: #888;
		line-height: 1.2;
	}

	.msg-tab-active .msg-tab-text {
		color: #191919;
		font-weight: 600;
	}

	.msg-tab-underline {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 56rpx;
		height: 4rpx;
		background: #07c160;
		border-radius: 2rpx;
	}

	.tip-line {
		padding: 16rpx 24rpx 12rpx;
		background: #ededed;
	}

	.tip-t {
		font-size: 22rpx;
		color: #888;
		line-height: 1.45;
	}

	.wx-loading {
		padding: 60rpx;
		text-align: center;
		color: #888;
		font-size: 28rpx;
	}

	.wx-empty {
		padding: 80rpx 40rpx;
		text-align: center;
	}

	.wx-empty-t {
		display: block;
		font-size: 28rpx;
		color: #888;
	}

	.wx-empty-sub {
		display: block;
		margin-top: 16rpx;
		font-size: 24rpx;
		color: #b2b2b2;
		line-height: 1.5;
	}

	.wx-cell {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 20rpx 24rpx;
		background: #fff;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.wx-cell-hover {
		background: #f0f0f0 !important;
	}

	.wx-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
	}

	.wx-avatar-t {
		font-size: 34rpx;
		font-weight: 600;
		color: #fff;
	}

	.wx-cell-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 4rpx 0;
	}

	.wx-cell-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.wx-title-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		padding-right: 16rpx;
	}

	.wx-title {
		font-size: 32rpx;
		color: #191919;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wx-tag {
		font-size: 20rpx;
		color: #fff;
		background: #fa5151;
		padding: 2rpx 10rpx;
		border-radius: 6rpx;
		flex-shrink: 0;
	}

	.wx-time {
		font-size: 22rpx;
		color: #b2b2b2;
		flex-shrink: 0;
	}

	.wx-cell-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.wx-sub {
		font-size: 26rpx;
		color: #999;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wx-badge {
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: #fa5151;
		color: #fff;
		font-size: 20rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.wx-pad {
		height: 24rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.dept-wrap {
		background: #fff;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.wx-cell-dept {
		align-items: center;
		border-bottom: none;
	}

	.wx-dept-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
		margin-right: 24rpx;
		background: #f5f5f5;
	}

	.wx-cell-top-dept {
		margin-bottom: 4rpx;
	}

	.wx-sub-dept {
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.wx-dept-count {
		font-size: 24rpx;
		color: #576b95;
		flex-shrink: 0;
		margin-left: 12rpx;
	}

	.wx-chevron {
		font-size: 36rpx;
		color: #c7c7cc;
		flex-shrink: 0;
		padding-left: 8rpx;
		line-height: 1;
	}

	.wx-empty-inline {
		padding: 40rpx 40rpx 24rpx;
		background: #fff;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.wx-empty-first {
		border-top: 1rpx solid #e5e5e5;
	}
</style>
