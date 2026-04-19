<template>
	<view class="page-root">
	<view class="project-container">
		<!-- 预留底栏高度，缩短原生 scroll-view，否则小程序里会盖住 fixed 自定义 Tab -->
		<view class="scroll-clip">
		<scroll-view scroll-y class="scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view class="hero-header">
				<view class="hero-left">
					<text class="page-title">{{ t('workflow') }}</text>
					<text class="page-sub">{{ t('project_subtitle') }}</text>
				</view>
				<view class="stat-chip">
					<text class="stat-num">{{ workflows.length }}</text>
					<text class="stat-lab">{{ t('count_unit') }}</text>
				</view>
			</view>

			<view v-if="loading" class="loading-row">
				<view class="loading-dot"></view>
				<text class="loading-t">{{ t('loading') }}</text>
			</view>

			<view v-else-if="workflows.length === 0" class="empty">
				<text class="empty-emoji">📂</text>
				<text class="empty-title">{{ t('no_workflow') }}</text>
				<text class="empty-desc">{{ t('no_workflow_desc') }}</text>
				<button class="empty-primary" type="primary" @click="openCreate">{{ t('create_workflow') }}</button>
				<button class="empty-secondary" @click="goAdd">{{ t('go_assign_task') }}</button>
			</view>

			<view
				v-for="w in workflows"
				:key="workflowKey(w)"
				class="wf-card"
				@click="openWorkbench(w)"
			>
				<view class="wf-row">
					<view class="wf-icon">◇</view>
					<view class="wf-main">
						<text class="wf-title">{{ workflowTitle(w) }}</text>
						<text v-if="workflowDesc(w)" class="wf-desc">{{ workflowDesc(w) }}</text>
						<text class="wf-id">{{ workflowKey(w) }}</text>
					</view>
					<text class="wf-go">›</text>
				</view>
			</view>

			<view class="bottom-spacer" />
		</scroll-view>
		</view>

		<view class="fab-row">
			<button class="fab-btn" type="primary" @click="openCreate">＋ {{ t('create_workflow') }}</button>
		</view>
	</view>

		<!-- 弹窗打开时隐藏底栏，避免与自定义 Tab 层叠导致按钮被挡（各端表现不一致） -->
		<AppTabBar v-if="!showCreate" current="project" />

		<view v-if="showCreate" class="mask" @click.self="showCreate = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('create_workflow') }}</text>
				<input class="dialog-input" v-model="newTitle" :placeholder="t('name_required')" placeholder-class="ph" />
				<input class="dialog-input" v-model="newDesc" :placeholder="t('description_optional')" placeholder-class="ph" />
				<view class="dialog-actions">
					<button class="btn ghost" @click="showCreate = false">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="creating" @click="submitCreate">{{ t('create') }}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import * as workflowApi from "@/clientApi/workflowApi";
	import { pickId } from "@/utils/apiHelpers";
	import { switchMainTab } from "@/utils/tabNav";
	import { t, getLanguage } from "@/utils/lang";
	import AppTabBar from "@/components/AppTabBar.vue";

	export default {
		components: { AppTabBar },
		data() {
			return {
				workflows: [],
				loading: true,
				refreshing: false,
				showCreate: false,
				newTitle: "",
				newDesc: "",
				creating: false,
			};
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			try {
				uni.setNavigationBarTitle({ title: this.t("workflow") });
			} catch (e) {
				//
			}
			this.loadList();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			pickId,
			workflowKey(w) {
				return pickId(w) || w?.workflowId || "";
			},
			workflowTitle(w) {
				return w?.title || w?.name || this.t("unnamed_workflow");
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
					uni.showToast({ title: this.t("missing_workflow_id"), icon: "none" });
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
			goAdd() {
				switchMainTab("add");
			},
			openCreate() {
				uni.hideTabBar({ animation: false });
				this.showCreate = true;
			},
			async submitCreate() {
				const title = (this.newTitle || "").trim();
				if (!title) {
					uni.showToast({ title: this.t("please_enter_workflow_name"), icon: "none" });
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
					uni.showToast({ title: this.t("created"), icon: "success" });
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
		},
	};
</script>

<style scoped>
	.page-root {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
		overflow: hidden;
	}

	.project-container {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: #f1f5f9;
	}

	.scroll-clip {
		flex: 1;
		height: 0;
		min-height: 0;
		/* 缩短原生 scroll-view，避免压住上层；底栏改文档流后略缩短即可 */
		padding-bottom: 24rpx;
		box-sizing: border-box;
	}

	.scroll {
		height: 100%;
		padding: 24rpx 28rpx 200rpx;
		box-sizing: border-box;
	}

	.hero-header {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
		background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
		border-radius: 24rpx;
		border: 1rpx solid #e0e7ff;
		box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.08);
	}

	.hero-left {
		flex: 1;
		min-width: 0;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.page-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.5;
	}

	.stat-chip {
		flex-shrink: 0;
		min-width: 100rpx;
		padding: 16rpx 20rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.35);
	}

	.stat-num {
		font-size: 40rpx;
		font-weight: 800;
		color: #fff;
		line-height: 1;
	}

	.stat-lab {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.85);
		margin-top: 4rpx;
		font-weight: 600;
	}

	.loading-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		padding: 48rpx 20rpx;
	}

	.loading-dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #2563eb;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.9);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.loading-t {
		font-size: 26rpx;
		color: #64748b;
	}

	.empty {
		padding: 56rpx 24rpx 40rpx;
		align-items: center;
		text-align: center;
		background: #fff;
		border-radius: 24rpx;
		border: 1rpx dashed #cbd5e1;
		margin-bottom: 24rpx;
	}

	.empty-emoji {
		display: block;
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.empty-title {
		display: block;
		font-size: 32rpx;
		color: #0f172a;
		font-weight: 800;
	}

	.empty-desc {
		display: block;
		margin-top: 14rpx;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.55;
		padding: 0 8rpx;
	}

	.empty-primary {
		margin-top: 36rpx;
		width: 100%;
		max-width: 520rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 30rpx;
		font-weight: 700;
		background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
		border: none;
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.28);
	}

	.empty-primary::after {
		border: none;
	}

	.empty-secondary {
		margin-top: 20rpx;
		width: 100%;
		max-width: 520rpx;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
		font-weight: 700;
		background: #f8fafc !important;
		color: #2563eb !important;
		border: 2rpx solid #bfdbfe !important;
	}

	.empty-secondary::after {
		border: none;
	}

	.wf-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 0;
		margin-bottom: 16rpx;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
		overflow: hidden;
	}

	.wf-row {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 22rpx 22rpx 22rpx 18rpx;
		gap: 14rpx;
	}

	.wf-icon {
		width: 64rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #2563eb;
		font-weight: 700;
		background: #eff6ff;
		border-radius: 16rpx;
	}

	.wf-main {
		flex: 1;
		min-width: 0;
	}

	.wf-title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.wf-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.wf-id {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #94a3b8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wf-go {
		flex-shrink: 0;
		align-self: center;
		font-size: 40rpx;
		color: #cbd5e1;
		font-weight: 300;
		padding-left: 8rpx;
	}

	.bottom-spacer {
		height: 40rpx;
	}

	.fab-row {
		position: fixed;
		left: 0;
		right: 0;
		/* 底栏在文档流内约 100rpx + 安全区，留出悬浮按钮空间 */
		bottom: calc(108rpx + env(safe-area-inset-bottom));
		padding: 0 28rpx;
		z-index: 90;
	}

	.fab-btn {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		font-size: 30rpx;
		font-weight: 700;
		background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
		border: none;
		box-shadow: 0 12rpx 36rpx rgba(37, 99, 235, 0.35);
	}

	.fab-btn::after {
		border: none;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 100000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 32rpx 28rpx;
		padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.dialog {
		width: 100%;
		max-height: calc(85vh - env(safe-area-inset-bottom));
		overflow-y: auto;
		background: #fff;
		border-radius: 24rpx;
		padding: 32rpx;
		box-sizing: border-box;
		box-shadow: 0 24rpx 80rpx rgba(15, 23, 42, 0.18);
	}

	.dialog-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 24rpx;
	}

	.dialog-input {
		width: 100%;
		height: 84rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 16rpx;
		padding: 0 22rpx;
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
		height: 76rpx;
		line-height: 76rpx;
		font-size: 28rpx;
		font-weight: 700;
		border-radius: 38rpx;
	}

	.btn.ghost {
		background: #f1f5f9 !important;
		color: #475569 !important;
		border: none !important;
	}

	.btn.primary {
		padding: 0 32rpx;
		box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.25);
	}
</style>
