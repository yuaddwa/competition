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

		<AppTabBar v-if="!showCreate" current="project" />
		<view v-else class="create-page">
			<text class="create-title">{{ t('add_new_project_title') }}</text>
			<input
				class="create-input"
				v-model="newTitle"
				:placeholder="t('add_new_project_name_ph')"
				placeholder-class="ph"
				confirm-type="next"
			/>
			<input
				class="create-input"
				v-model="newDesc"
				:placeholder="t('add_new_project_desc_ph')"
				placeholder-class="ph"
				confirm-type="next"
			/>
			<textarea
				class="create-input create-ta"
				v-model="newGoal"
				:placeholder="t('add_new_project_goal_ph')"
				placeholder-class="ph"
			/>
			<view class="create-agent-wrap">
				<text class="create-agent-title">{{ t('project_choose_agents') }}</text>
				<view v-if="loadingAgents" class="agent-empty">{{ t('loading') }}…</view>
				<view v-else-if="!agentOptions.length" class="agent-empty">{{ t('group_invite_none_available') }}</view>
				<scroll-view v-else scroll-y class="create-agent-list">
					<view
						v-for="a in agentOptions"
						:key="a.id"
						class="create-agent-row"
						@click="toggleAgent(a.id)"
					>
						<view class="create-radio" :class="{ on: selectedAgentIds.includes(a.id) }" />
						<view class="create-agent-main">
							<text class="create-agent-name">{{ a.name }}</text>
							<text class="create-agent-meta">{{ a.department || t('vt_member_default') }} · {{ a.role || t('vt_member_default') }}</text>
						</view>
						<text class="create-agent-model">{{ modelShort(a.id) }}</text>
					</view>
				</scroll-view>
			</view>
			<view class="create-actions">
				<view class="create-btn create-btn-cancel" @tap.stop="showCreate = false">
					<text class="create-btn-t">{{ t('cancel') }}</text>
				</view>
				<view
					class="create-btn create-btn-ok"
					:class="{ 'is-disabled': !canSubmitCreate && !creating }"
					@tap.stop="submitCreate"
				>
					<text class="create-btn-t">{{ creating ? `${t('loading')}…` : t('create') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import * as workflowApi from "@/utils/localWorkflowStore";
	import { pickId, getApiErrorMessage } from "@/utils/apiHelpers";
	import { switchMainTab } from "@/utils/tabNav";
	import { t, getLanguage } from "@/utils/lang";
	import AppTabBar from "@/components/AppTabBar.vue";
	import { listMyUserAgents, listUserAgents } from "@/clientApi/agentsApi";
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";
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
				newGoal: "",
				creating: false,
				loadingAgents: false,
				agentOptions: [],
				selectedAgentIds: [],
				currentLanguage: getLanguage(),
			};
		},
		computed: {
			/** 仅项目名必填 */
			canSubmitCreate() {
				return (
					(this.newTitle || "").trim().length > 0 &&
					(this.newGoal || "").trim().length > 0 &&
					this.selectedAgentIds.length > 0
				);
			},
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
			try {
				uni.$on("openProjectCreateFromPlus", this.handleOpenCreateFromPlus);
			} catch {
				//
			}
		},
		onUnload() {
			try {
				uni.$off("openProjectCreateFromPlus", this.handleOpenCreateFromPlus);
			} catch {
				//
			}
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
			this.loadAgentOptions();
			try {
				if (uni.getStorageSync("open_project_create_from_plus") === "1") {
					uni.removeStorageSync("open_project_create_from_plus");
					this.openCreate();
				}
			} catch {
				//
			}
		},
		methods: {
			handleOpenCreateFromPlus() {
				this.openCreate();
			},
			t(key, params = {}) {
				return t(key, this.currentLanguage, params);
			},
			async loadAgentOptions() {
				this.loadingAgents = true;
				try {
					let rows = await listMyUserAgents();
					if (!Array.isArray(rows) || rows.length === 0) rows = await listUserAgents();
					this.agentOptions = (Array.isArray(rows) ? rows : [])
						.map((r) => ({
							id: String(r?.id || r?.agentId || "").trim(),
							name: String(r?.displayName || r?.name || "").trim(),
							role: String(r?.jobTitle || r?.rolePosition || "").trim(),
							department: String(r?.department || "").trim(),
							avatar: String(r?.avatar || r?.avatarUrl || r?.headImg || r?.headimg || "").trim(),
						}))
						.filter((r) => r.id && r.name);
					this.selectedAgentIds = this.selectedAgentIds.filter((id) => this.agentOptions.some((a) => a.id === id));
				} catch {
					this.agentOptions = [];
				} finally {
					this.loadingAgents = false;
				}
			},
			toggleAgent(id) {
				const i = this.selectedAgentIds.indexOf(id);
				if (i >= 0) this.selectedAgentIds.splice(i, 1);
				else this.selectedAgentIds.push(id);
			},
			modelShort(agentId) {
				const s = String(getAgentModelOrDefault(agentId) || "").trim();
				if (!s) return "默认模型";
				return s.length > 20 ? `${s.slice(0, 18)}…` : s;
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
				if (!this.agentOptions.length) this.loadAgentOptions();
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
				const goal = (this.newGoal || "").trim();
				if (!title) {
					uni.showToast({ title: this.t("please_enter_project_name"), icon: "none" });
					return;
				}
				if (!goal) {
					uni.showToast({ title: this.t("please_enter_project_goal"), icon: "none" });
					return;
				}
				if (!this.selectedAgentIds.length) {
					uni.showToast({ title: this.t("project_choose_agent_first"), icon: "none" });
					return;
				}
				this.creating = true;
				try {
					const agents = this.agentOptions
						.filter((a) => this.selectedAgentIds.includes(a.id))
						.map((a) => ({ ...a, model: getAgentModelOrDefault(a.id) }));
					const created = await workflowApi.createWorkflow(
						{ name: title, description: desc, goal, agents }
					);
					const id = pickId(created) || (created && created.workflowId) || "";
					if (id) {
						const brief = desc ? `${goal}\n补充说明：${desc}` : goal;
						try {
							await workflowApi.aiAuto(id, {
								brief,
								title,
								maxTasks: Math.max(4, Math.min(10, agents.length * 2)),
							});
						} catch (e) {
							uni.showToast({ title: getApiErrorMessage(e) || "自动分配失败，可在项目内补充需求后再次分配", icon: "none", duration: 2600 });
						}
					}
					this.showCreate = false;
					this.newTitle = "";
					this.newDesc = "";
					this.newGoal = "";
					this.selectedAgentIds = [];
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

	.create-page {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 100000;
		background: #f2f4f8;
		padding: 24rpx;
		padding-top: calc(24rpx + env(safe-area-inset-top));
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		overflow-y: auto;
	}

	.create-title {
		font-size: 40rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 20rpx;
	}

	.create-input {
		width: 100%;
		height: 96rpx;
		border: 1rpx solid #dde3ec;
		border-radius: 20rpx;
		padding: 0 24rpx;
		margin-bottom: 16rpx;
		font-size: 30rpx;
		box-sizing: border-box;
		background: #f9fbff;
	}

	.create-ta {
		height: 180rpx;
		padding-top: 20rpx;
		padding-bottom: 20rpx;
	}

	.ph {
		color: #a4aec0;
	}

	.create-agent-wrap {
		margin-top: 6rpx;
	}

	.create-agent-title {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #334155;
		margin-bottom: 8rpx;
	}

	.agent-empty {
		font-size: 22rpx;
		color: #94a3b8;
		padding: 12rpx 0;
	}

	.create-agent-list {
		max-height: 430rpx;
		border: 1rpx solid #dde3ec;
		border-radius: 18rpx;
		background: #fff;
	}

	.create-agent-row {
		display: flex;
		align-items: center;
		padding: 16rpx 14rpx;
		border-bottom: 1rpx solid #edf1f6;
	}

	.create-agent-row:last-child {
		border-bottom: none;
	}

	.create-radio {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		border: 2rpx solid #95a3ba;
		margin-right: 10rpx;
		box-sizing: border-box;
	}

	.create-radio.on {
		border-color: #4f66f6;
		background: radial-gradient(circle, #4f66f6 48%, transparent 50%);
	}

	.create-agent-main {
		flex: 1;
		min-width: 0;
	}

	.create-agent-name {
		display: block;
		font-size: 34rpx;
		color: #0f172a;
		font-weight: 700;
	}

	.create-agent-meta {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		margin-top: 4rpx;
	}

	.create-agent-model {
		font-size: 24rpx;
		color: #475569;
		background: #e2e8f0;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		margin-left: 8rpx;
	}

	.create-actions {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
		background: #f2f4f8;
		display: flex;
		gap: 16rpx;
		box-sizing: border-box;
	}

	.create-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 28rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.create-btn-t {
		font-size: 28rpx;
		font-weight: 700;
	}

	.create-btn-cancel {
		background: #e8ecf2;
	}

	.create-btn-cancel .create-btn-t {
		color: #475569;
	}

	.create-btn-ok {
		background: linear-gradient(135deg, #5d8dfa, #9a95f5);
	}

	.create-btn-ok .create-btn-t {
		color: #fff;
	}

	.create-btn-ok.is-disabled {
		opacity: 0.45;
		pointer-events: none;
	}
</style>
