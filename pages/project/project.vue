<template>
	<view class="project-container">
		<scroll-view scroll-y class="scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view class="header-block">
				<text class="page-title">工作流</text>
				<text class="page-sub">选择或创建一个工作流进入工作台</text>
			</view>

			<view v-if="!loading && workflows.length === 0" class="empty">
				<text class="empty-title">暂无工作流</text>
				<text class="empty-desc">点击下方按钮创建第一个工作流</text>
			</view>

			<view
				v-for="w in workflows"
				:key="workflowKey(w)"
				class="wf-card"
				@click="openWorkbench(w)"
			>
				<view class="wf-card-top">
					<text class="wf-title">{{ workflowTitle(w) }}</text>
					<text class="wf-id">{{ workflowKey(w) }}</text>
				</view>
				<text v-if="workflowDesc(w)" class="wf-desc">{{ workflowDesc(w) }}</text>
			</view>

			<view class="bottom-spacer" />
		</scroll-view>

		<view class="fab-row">
			<button class="fab-btn" type="primary" @click="showCreate = true">新建工作流</button>
		</view>

		<view v-if="showCreate" class="mask" @click.self="showCreate = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">新建工作流</text>
				<input class="dialog-input" v-model="newTitle" placeholder="名称（必填）" placeholder-class="ph" />
				<input class="dialog-input" v-model="newDesc" placeholder="描述（可选）" placeholder-class="ph" />
				<view class="dialog-actions">
					<button class="btn ghost" @click="showCreate = false">取消</button>
					<button class="btn primary" type="primary" :loading="creating" @click="submitCreate">创建</button>
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
	import * as workflowApi from "@/api/workflowApi";
	import { pickId } from "@/utils/apiHelpers";

	export default {
		data() {
			return {
				currentPage: "project",
				workflows: [],
				loading: true,
				refreshing: false,
				showCreate: false,
				newTitle: "",
				newDesc: "",
				creating: false,
			};
		},
		onShow() {
			this.loadList();
		},
		methods: {
			pickId,
			workflowKey(w) {
				return pickId(w) || w?.workflowId || "";
			},
			workflowTitle(w) {
				return w?.title || w?.name || "未命名工作流";
			},
			workflowDesc(w) {
				return w?.description || w?.desc || "";
			},
			async loadList() {
				this.loading = true;
				try {
					const list = await workflowApi.listWorkflows();
					this.workflows = Array.isArray(list) ? list : [];
				} catch {
					this.workflows = [];
				} finally {
					this.loading = false;
				}
			},
			async onRefresh() {
				this.refreshing = true;
				await this.loadList();
				this.refreshing = false;
			},
			openWorkbench(w) {
				const id = this.workflowKey(w);
				if (!id) {
					uni.showToast({ title: "缺少工作流 ID", icon: "none" });
					return;
				}
				try {
					uni.setStorageSync("lastWorkflowId", id);
					uni.setStorageSync("lastWorkflowTitle", this.workflowTitle(w));
				} catch {
					//
				}
				uni.navigateTo({
					url: `/pages/workflow/workbench?id=${encodeURIComponent(id)}`,
				});
			},
			async submitCreate() {
				const title = (this.newTitle || "").trim();
				if (!title) {
					uni.showToast({ title: "请输入名称", icon: "none" });
					return;
				}
				this.creating = true;
				try {
					const payload = { title, name: title };
					const desc = (this.newDesc || "").trim();
					if (desc) {
						payload.description = desc;
					}
					const created = await workflowApi.createWorkflow(payload);
					const id = pickId(created) || created?.workflowId;
					this.showCreate = false;
					this.newTitle = "";
					this.newDesc = "";
					uni.showToast({ title: "已创建", icon: "success" });
					await this.loadList();
					if (id) {
						uni.navigateTo({
							url: `/pages/workflow/workbench?id=${encodeURIComponent(id)}`,
						});
					}
				} catch {
					// toast由 request 处理
				} finally {
					this.creating = false;
				}
			},
			navigateTo(page) {
				uni.redirectTo({
					url: `/pages/${page}/${page}`,
				});
			},
		},
	};
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

	.project-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f4f6fb;
	}

	.scroll {
		flex: 1;
		height: 0;
		padding: 24rpx 28rpx 200rpx;
		box-sizing: border-box;
	}

	.header-block {
		margin-bottom: 20rpx;
	}

	.page-title {
		font-size: 40rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.page-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #6f7a89;
	}

	.empty {
		padding: 80rpx 20rpx;
		align-items: center;
		text-align: center;
	}

	.empty-title {
		font-size: 30rpx;
		color: #333;
		font-weight: 600;
	}

	.empty-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #888;
	}

	.wf-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #e8ecf3;
		box-shadow: 0 8rpx 20rpx rgba(20, 38, 70, 0.06);
	}

	.wf-card-top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16rpx;
	}

	.wf-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d3d;
		flex: 1;
	}

	.wf-id {
		font-size: 22rpx;
		color: #98a2b3;
		max-width: 240rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wf-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #6f7a89;
		line-height: 1.5;
	}

	.bottom-spacer {
		height: 40rpx;
	}

	.fab-row {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 120rpx;
		padding: 0 28rpx;
		z-index: 20;
	}

	.fab-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 30rpx;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 200;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 40rpx 28rpx 80rpx;
		box-sizing: border-box;
	}

	.dialog {
		width: 100%;
		background: #fff;
		border-radius: 24rpx;
		padding: 28rpx;
		box-sizing: border-box;
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1f2d3d;
		margin-bottom: 20rpx;
	}

	.dialog-input {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 12rpx;
		padding: 0 20rpx;
		margin-bottom: 16rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		background: #f8fafc;
	}

	.ph {
		color: #aaa;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 16rpx;
		margin-top: 8rpx;
	}

	.btn {
		min-width: 160rpx;
		height: 72rpx;
		line-height: 72rpx;
		font-size: 28rpx;
		border-radius: 12rpx;
	}

	.btn.ghost {
		background: #f2f4f8;
		color: #333;
	}

	.btn.primary {
		padding: 0 28rpx;
	}

	.tab-bar {
		display: flex;
		align-items: center;
		height: 100rpx;
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		position: relative;
		z-index: 50;
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
