<template>
	<view class="page-root">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="navbar">
				<view class="navbar-side"></view>
				<text class="navbar-title">{{ t('message') }}</text>
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
				<text class="msg-tab-text">{{ t('conversation') }}</text>
				<view v-if="messageTab === 0" class="msg-tab-underline"></view>
			</view>
			<view
				class="msg-tab-item"
				:class="{ 'msg-tab-active': messageTab === 1 }"
				@tap="messageTab = 1"
			>
				<text class="msg-tab-text">{{ t('collaboration') }}</text>
				<view v-if="messageTab === 1" class="msg-tab-underline"></view>
			</view>
		</view>

		<scroll-view scroll-y class="feed-scroll" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="messageTab === 0" class="tip-line">
				<text class="tip-t">{{ t('conversation_tip') }}</text>
			</view>
			<view v-if="messageTab === 1" class="tip-line">
				<text class="tip-t">{{ t('department_tip') }}</text>
			</view>

			<view v-if="loading" class="wx-loading"><text>{{ t('loading') }}</text></view>
			<template v-else>
				<template v-if="messageTab === 0">
					<view v-if="feedRows.length === 0" class="msg-empty-card">
						<text class="msg-empty-emoji">💬</text>
						<text class="msg-empty-t">{{ t('no_conversation') }}</text>
						<text class="msg-empty-sub">{{ t('create_group_agent') }}</text>
					</view>
					<view v-else class="msg-list">
						<view
							v-for="row in feedRows"
							:key="row.id"
							class="msg-row-card"
							hover-class="msg-row-card-hover"
							@click="onRowTap(row)"
						>
							<view class="msg-avatar" :style="{ background: avatarBg(row) }">
								<text class="msg-avatar-t">{{ avatarLetter(row) }}</text>
							</view>
							<view class="msg-body">
								<view class="msg-row-top">
									<view class="msg-title-wrap">
										<text class="msg-title">{{ row.title }}</text>
										<text v-if="row.badge" class="msg-pill">{{ row.badge }}</text>
									</view>
									<text class="msg-time">{{ formatRowTime(row.time) }}</text>
								</view>
								<view class="msg-row-bottom">
									<text class="msg-preview">{{ row.subtitle }}</text>
									<view v-if="row.unread > 0" class="msg-unread">{{ row.unread > 99 ? "99+" : row.unread }}</view>
								</view>
							</view>
						</view>
					</view>
				</template>

				<template v-if="messageTab === 1">
					<view class="msg-list">
						<view
							v-for="block in departmentBlocks"
							:key="block.slug"
							class="msg-row-card msg-row-dept"
							hover-class="msg-row-card-hover"
							@tap="goDepartmentRoles(block)"
						>
							<image class="msg-dept-icon" :src="block.icon" mode="aspectFit" />
							<view class="msg-body">
								<view class="msg-row-top">
									<view class="msg-title-wrap">
										<text class="msg-title">{{ block.title }}</text>
									</view>
									<text class="msg-dept-count">{{ block.count }}{{ t('role_count_suffix') }}</text>
								</view>
								<text v-if="block.desc" class="msg-preview msg-preview-multi">{{ block.desc }}</text>
							</view>
							<text class="msg-chevron">›</text>
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
	import { t, getLanguage } from "@/utils/lang";
	import {
		getDailyBriefing,
		buildMessageFeedRows,
		loadProjectGroups,
		loadDigitalAgents,
		displayGroupName,
		formatAgentNavTitle,
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
			try {
				uni.setNavigationBarTitle({ title: this.t("message") });
			} catch (e) {
				//
			}
			this.loadList();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
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
					itemList: [this.t('create_project_group'), this.t('create_digital_employee')],
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
				const colors = [
					"linear-gradient(145deg, #2563eb, #1d4ed8)",
					"linear-gradient(145deg, #7c3aed, #6d28d9)",
					"linear-gradient(145deg, #059669, #047857)",
					"linear-gradient(145deg, #d97706, #b45309)",
					"linear-gradient(145deg, #db2777, #be185d)",
					"linear-gradient(145deg, #0891b2, #0e7490)",
				];
				const s = row.id || row.title || "";
				let h = 0;
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(row) {
				if (row.rowKind === "manager") return this.t("abbr_manager");
				if (row.rowKind === "group") return this.t("abbr_group");
				if (row.rowKind === "unified" && row.convType === "workflow") return this.t("abbr_project");
				const tit = (row.title || "?").trim();
				return tit.slice(0, 1);
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
				if (d.toDateString() === yest.toDateString()) return this.t("time_yesterday");
				return this.t("date_month_day", { month: d.getMonth() + 1, day: d.getDate() });
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
						url: `/pages/chat/chat?mode=virtual&kind=manager&id=${encodeURIComponent(MANAGER_ID)}&title=${encodeURIComponent(this.t("manager_overview_title"))}`,
					});
					return;
				}
				if (row.rowKind === "daily_agent" && row.agentId) {
					const agents = loadDigitalAgents();
					const a = agents.find((x) => x.id === row.agentId);
					const title = a ? formatAgentNavTitle(a) : this.t("digital_employee_fallback");
					uni.navigateTo({
						url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(row.agentId)}&title=${encodeURIComponent(title)}`,
					});
					return;
				}
				if (row.rowKind === "group" && row.groupId) {
					const groups = loadProjectGroups();
					const g = groups.find((x) => x.id === row.groupId);
					const name = g ? displayGroupName(g) : this.t("project_group_fallback");
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
		background: #f1f5f9;
		box-sizing: border-box;
	}

	.navbar-wrap {
		background: #ffffff;
		flex-shrink: 0;
	}

	.navbar {
		height: 88rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx 0 24rpx;
		border-bottom: 1rpx solid #e2e8f0;
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
		font-weight: 700;
		color: #0f172a;
	}

	.navbar-plus {
		font-size: 40rpx;
		font-weight: 400;
		color: #2563eb;
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
		background: #ffffff;
		border-bottom: 1rpx solid #e2e8f0;
		padding: 0 40rpx;
	}

	.msg-tab-item {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 22rpx 0 18rpx;
		min-height: 76rpx;
		box-sizing: border-box;
	}

	.msg-tab-text {
		font-size: 30rpx;
		color: #64748b;
		line-height: 1.2;
	}

	.msg-tab-active .msg-tab-text {
		color: #0f172a;
		font-weight: 700;
	}

	.msg-tab-underline {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 48rpx;
		height: 6rpx;
		background: linear-gradient(90deg, #2563eb, #7c3aed);
		border-radius: 3rpx;
	}

	.tip-line {
		padding: 20rpx 28rpx 16rpx;
		background: transparent;
	}

	.tip-t {
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.wx-loading {
		padding: 80rpx;
		text-align: center;
		color: #64748b;
		font-size: 28rpx;
	}

	.msg-empty-card {
		margin: 8rpx 24rpx 24rpx;
		padding: 56rpx 32rpx;
		text-align: center;
		background: #fff;
		border-radius: 24rpx;
		border: none;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	}

	.msg-empty-emoji {
		display: block;
		font-size: 64rpx;
		margin-bottom: 16rpx;
	}

	.msg-empty-t {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.msg-empty-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.msg-list {
		padding: 8rpx 24rpx 24rpx;
	}

	.msg-row-card {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 24rpx 22rpx;
		margin-bottom: 16rpx;
		background: #fff;
		border-radius: 20rpx;
		border: none;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.msg-row-card-hover {
		background: #f8fafc !important;
	}

	.msg-row-dept {
		align-items: center;
	}

	.msg-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 22rpx;
		box-shadow: 0 6rpx 18rpx rgba(37, 99, 235, 0.2);
	}

	.msg-avatar-t {
		font-size: 34rpx;
		font-weight: 700;
		color: #fff;
	}

	.msg-dept-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		margin-right: 22rpx;
		background: #f1f5f9;
		border: none;
	}

	.msg-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 4rpx 0;
	}

	.msg-row-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 10rpx;
	}

	.msg-title-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 10rpx;
		padding-right: 12rpx;
	}

	.msg-title {
		font-size: 32rpx;
		color: #0f172a;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.msg-pill {
		font-size: 20rpx;
		font-weight: 600;
		color: #b45309;
		background: #fffbeb;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		border: 1rpx solid #fde68a;
		flex-shrink: 0;
	}

	.msg-time {
		font-size: 22rpx;
		color: #94a3b8;
		flex-shrink: 0;
		padding-top: 4rpx;
	}

	.msg-row-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.msg-preview {
		font-size: 26rpx;
		color: #64748b;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.msg-preview-multi {
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-height: 1.45;
	}

	.msg-unread {
		min-width: 36rpx;
		height: 36rpx;
		padding: 0 10rpx;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: #fff;
		font-size: 22rpx;
		font-weight: 700;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.msg-dept-count {
		font-size: 24rpx;
		font-weight: 600;
		color: #2563eb;
		flex-shrink: 0;
	}

	.msg-chevron {
		font-size: 34rpx;
		color: #cbd5e1;
		flex-shrink: 0;
		padding-left: 8rpx;
		align-self: center;
	}

	.wx-pad {
		height: 24rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
