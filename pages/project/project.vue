<template>
	<view class="page-root">
	<view class="project-container">
		<!-- 预留底栏高度，缩短原生 scroll-view，否则小程序里会盖住 fixed 自定义 Tab -->
		<view class="scroll-clip">
		<scroll-view scroll-y class="scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view class="top-actions">
				<text class="hero-new" @tap.stop="openCreate">＋ {{ t('create_project') }}</text>
				<text class="hero-link" @tap.stop="goAdd">{{ t('go_assign_task') }}</text>
			</view>
			<scroll-view v-if="workflowNavList.length" scroll-x class="project-strip" show-scrollbar="false">
				<view
					v-for="w in workflowNavList"
					:key="workflowKey(w)"
					class="project-chip"
					@click="openWorkbench(w)"
				>
					<text class="project-chip-t">{{ workflowTitle(w) }}</text>
				</view>
			</scroll-view>

			<view v-if="loading" class="loading-row">
				<view class="loading-dot"></view>
				<text class="loading-t">{{ t('loading') }}</text>
			</view>

			<view v-else-if="workflows.length === 0" class="empty">
				<text class="empty-emoji">📂</text>
				<text class="empty-title">{{ t('no_projects_yet') }}</text>
				<text class="empty-desc">{{ t('no_projects_desc') }}</text>
				<view class="empty-cta" @tap="openCreate">＋ {{ t('create_project') }}</view>
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
					<text class="wf-del" @click.stop="confirmDeleteWorkflow(w)">删除</text>
					<text class="wf-go">›</text>
				</view>
			</view>

			<view class="bottom-spacer" />
		</scroll-view>
		</view>
	</view>

		<!-- 弹窗打开时隐藏底栏，避免与自定义 Tab 层叠导致按钮被挡（各端表现不一致） -->
		<AppTabBar v-if="!showCreate" current="project" />

		<view v-if="showCreate" class="mask" @click.self="showCreate = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('add_new_project_title') }}</text>
				<input
					class="dialog-input"
					v-model="newTitle"
					:placeholder="t('add_new_project_name_ph')"
					placeholder-class="ph"
					confirm-type="next"
				/>
				<input
					class="dialog-input"
					v-model="newDesc"
					:placeholder="t('add_new_project_desc_ph')"
					placeholder-class="ph"
					confirm-type="done"
					@confirm="submitCreate"
				/>
				<view class="dialog-actions">
					<view class="dialog-btn dialog-btn-ghost" @tap.stop="showCreate = false">
						<text class="dialog-btn-t">{{ t('cancel') }}</text>
					</view>
					<view
						class="dialog-btn dialog-btn-primary"
						:class="{
							'is-loading': creating,
							'is-disabled': !canSubmitCreate && !creating,
						}"
						@tap.stop="submitCreate"
					>
						<text v-if="creating" class="dialog-btn-t">{{ t('loading') }}…</text>
						<text v-else class="dialog-btn-t">{{ t('create') }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import * as workflowApi from "@/clientApi/workflowApi";
	import { pickId, getApiErrorMessage } from "@/utils/apiHelpers";
	import { switchMainTab } from "@/utils/tabNav";
	import { t, getLanguage } from "@/utils/lang";
	import AppTabBar from "@/components/AppTabBar.vue";
	const STORAGE_WF = "lastWorkflowId";
	const STORAGE_WF_TITLE = "lastWorkflowTitle";
	const STORAGE_WF_LIST = "cachedWorkflowList";

	export default {
		components: { AppTabBar },
		data() {
			return {
				workflows: [],
				workflowNavList: [],
				loading: true,
				refreshing: false,
				showCreate: false,
				newTitle: "",
				newDesc: "",
				creating: false,
				currentLanguage: getLanguage(),
			};
		},
		computed: {
			/** 仅项目名必填 */
			canSubmitCreate() {
				return (this.newTitle || "").trim().length > 0;
			},
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.currentLanguage = getLanguage();
			try {
				uni.setNavigationBarTitle({ title: this.t("project") });
			} catch (e) {
				//
			}
			try {
				const cached = uni.getStorageSync(STORAGE_WF_LIST);
				if (Array.isArray(cached) && cached.length) {
					this.workflowNavList = cached;
				}
			} catch {
				//
			}
			this.loadList();
		},
		methods: {
			t(key, params = {}) {
				return t(key, this.currentLanguage, params);
			},
			pickId,
			workflowKey(w) {
				return pickId(w) || w?.workflowId || "";
			},
			workflowTitle(w) {
				const _ = this.currentLanguage;
				return w?.title || w?.name || this.t("unnamed_workflow");
			},
			workflowDesc(w) {
				return w?.description || w?.desc || "";
			},
			async loadList() {
				this.loading = true;
				try {
					const list = await workflowApi.listWorkflows();
					const arr = Array.isArray(list) ? list : [];
					this.workflows = arr;
					this.workflowNavList = arr;
					try {
						uni.setStorageSync(STORAGE_WF_LIST, arr);
					} catch {
						//
					}
				} catch {
					this.workflows = Array.isArray(this.workflowNavList) ? this.workflowNavList : [];
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
					uni.setStorageSync(STORAGE_WF, id);
					uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle(w));
				} catch {
					//
				}
				uni.navigateTo({
					url: `/pages/workflow/workbench?id=${encodeURIComponent(id)}`,
				});
			},
			confirmDeleteWorkflow(w) {
				const id = this.workflowKey(w);
				if (!id) return;
				uni.showModal({
					title: "删除项目",
					content: `确认删除「${this.workflowTitle(w)}」？删除后不可恢复。`,
					confirmColor: "#dc2626",
					success: async (res) => {
						if (!res.confirm) return;
						try {
							await workflowApi.deleteWorkflow(id);
							this.workflows = (this.workflows || []).filter((x) => this.workflowKey(x) !== id);
							this.workflowNavList = (this.workflowNavList || []).filter((x) => this.workflowKey(x) !== id);
							try {
								uni.setStorageSync(STORAGE_WF_LIST, this.workflowNavList);
								if (uni.getStorageSync(STORAGE_WF) === id) {
									uni.removeStorageSync(STORAGE_WF);
									uni.removeStorageSync(STORAGE_WF_TITLE);
								}
							} catch {
								//
							}
							uni.showToast({ title: "已删除", icon: "success" });
						} catch (err) {
							const detail = getApiErrorMessage(err);
							uni.showToast({ title: detail || "删除失败", icon: "none" });
						}
					},
				});
			},
			goAdd() {
				switchMainTab("add");
			},
			openCreate() {
				uni.hideTabBar({ animation: false });
				this.showCreate = true;
			},
			mergeCreatedIfMissing(created, title, id) {
				if (!id || this.workflows.some((w) => this.workflowKey(w) === id)) return;
				const item = {
					...(created && typeof created === "object" ? created : {}),
					id,
					title: (created && (created.title || created.name)) || title,
					name: (created && (created.name || created.title)) || title,
				};
				this.workflows = [item, ...this.workflows];
			},
			async submitCreate() {
				if (this.creating) return;
				const title = (this.newTitle || "").trim();
				const desc = (this.newDesc || "").trim();
				if (!title) {
					uni.showToast({ title: this.t("please_enter_project_name"), icon: "none" });
					return;
				}
				this.creating = true;
				try {
					const created = await workflowApi.createWorkflow(
						desc ? { name: title, description: desc } : { name: title }
					);
					const id = pickId(created) || (created && created.workflowId) || "";
					this.showCreate = false;
					this.newTitle = "";
					this.newDesc = "";
					uni.showToast({ title: this.t("created"), icon: "success" });
					await this.loadList();
					if (id) {
						this.mergeCreatedIfMissing(created, title, id);
					}
					if (id) {
						uni.navigateTo({
							url: `/pages/workflow/workbench?id=${encodeURIComponent(id)}`,
						});
					}
				} catch (err) {
					const detail = getApiErrorMessage(err);
					uni.showToast({ title: detail || this.t("err_request_failed"), icon: "none", duration: 3200 });
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
		padding: 24rpx 28rpx 120rpx;
		box-sizing: border-box;
	}

	.top-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 20rpx;
	}

	.project-strip {
		white-space: nowrap;
		margin-bottom: 16rpx;
	}

	.project-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 62rpx;
		padding: 0 20rpx;
		margin-right: 12rpx;
		border-radius: 999rpx;
		background: #ffffff;
		border: 1rpx solid #dbe3ef;
	}

	.project-chip-t {
		max-width: 260rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 24rpx;
		font-weight: 600;
		color: #334155;
	}

	.hero-new {
		font-size: 30rpx;
		font-weight: 700;
		color: #2563eb;
		padding: 16rpx 30rpx;
		border-radius: 999rpx;
		background: rgba(37, 99, 235, 0.1);
		border: 2rpx solid #bfdbfe;
	}

	.hero-link {
		font-size: 28rpx;
		font-weight: 600;
		color: #64748b;
		padding: 16rpx 20rpx;
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
		padding: 72rpx 24rpx 48rpx;
		align-items: center;
		text-align: center;
		background: transparent;
		border-radius: 0;
		border: none;
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

	.empty-cta {
		margin: 32rpx auto 0;
		width: 100%;
		max-width: 520rpx;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 30rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		color: #fff;
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.28);
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
		border: none;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
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

	.wf-del {
		align-self: center;
		font-size: 22rpx;
		color: #dc2626;
		padding: 8rpx 10rpx;
		border-radius: 10rpx;
		background: #fef2f2;
		margin-right: 6rpx;
	}

	.bottom-spacer {
		height: 40rpx;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.38);
		z-index: 100000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 28rpx;
		padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		isolation: isolate;
	}

	.dialog {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 680rpx;
		max-height: calc(85vh - env(safe-area-inset-bottom));
		overflow-y: auto;
		background: #fff !important;
		background-color: #fff !important;
		opacity: 1;
		border-radius: 24rpx;
		padding: 32rpx;
		box-sizing: border-box;
		box-shadow: 0 24rpx 80rpx rgba(15, 23, 42, 0.18);
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
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
		justify-content: space-between;
		gap: 16rpx;
		margin-top: 12rpx;
	}

	.dialog-btn {
		flex: 1;
		height: 76rpx;
		border-radius: 38rpx;
		font-size: 28rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.15);
	}

	.dialog-btn-t {
		font-size: 28rpx;
		font-weight: 700;
	}

	.dialog-btn-ghost {
		background: #f1f5f9;
		box-shadow: none;
	}

	.dialog-btn-ghost .dialog-btn-t {
		color: #475569;
	}

	.dialog-btn-primary {
		background: linear-gradient(135deg, #2563eb, #4f46e5);
	}

	.dialog-btn-primary .dialog-btn-t {
		color: #fff;
	}

	.dialog-btn-primary.is-loading {
		opacity: 0.8;
	}

	.dialog-btn-primary.is-disabled {
		opacity: 0.45;
		pointer-events: none;
	}
</style>
