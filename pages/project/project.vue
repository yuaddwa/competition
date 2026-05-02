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

			<view v-else-if="workflows.length === 0" class="empty-wrap">
				<view class="empty-bg">
					<view class="empty-blob empty-blob-a" />
					<view class="empty-blob empty-blob-b" />
				</view>
				<view class="empty-card">
					<view class="empty-icon-stack">
						<view class="empty-icon-glow" />
						<view class="empty-icon-square">
							<text class="empty-emoji">📂</text>
						</view>
						<text class="empty-float-ico">✨</text>
					</view>
					<view class="empty-title-row">
						<text class="empty-title">{{ t("no_projects_yet") }}</text>
						<text class="empty-spark">✨</text>
					</view>
					<text class="empty-desc">{{ t("no_projects_desc") }}</text>
					<view class="empty-pills">
						<text class="empty-pill">{{ t("project_empty_tag_collab") }}</text>
						<text class="empty-pill">{{ t("project_empty_tag_flow") }}</text>
					</view>
					<view class="empty-cta" @tap="openCreate">
						<text class="empty-cta-star">✨</text>
						<text class="empty-cta-t">＋ {{ t("create_project") }}</text>
					</view>
				</view>
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
			<view class="create-status-bar" :style="{ height: statusBarPx + 'px' }" />
			<view class="create-header">
				<view class="create-header-main">
					<view class="create-title-row2">
						<text class="create-title-large">{{ t("add_new_project_title") }}</text>
						<text class="create-title-spark">✨</text>
						<text class="create-title-spark">✨</text>
					</view>
					<text class="create-sub-large">{{ t("create_project_subtitle") }}</text>
				</view>
				<view class="create-close-btn" @tap="closeCreate"><text class="create-close-x">×</text></view>
			</view>
			<scroll-view scroll-y class="create-body">
				<view class="field-card">
					<view class="field-head">
						<view class="field-ico field-ico-purple"><text class="field-ico-t">💼</text></view>
						<view class="field-head-text">
							<text class="field-label">{{ t("project_field_name") }}</text>
							<text class="field-star">*</text>
						</view>
					</view>
					<input
						class="field-input"
						v-model="newTitle"
						:placeholder="t('project_name_ph')"
						placeholder-class="field-ph"
						:maxlength="50"
					/>
					<text class="field-count">{{ titleLen }}/50</text>
				</view>
				<view class="field-card">
					<view class="field-head">
						<view class="field-ico field-ico-blue"><text class="field-ico-t">📄</text></view>
						<text class="field-label">{{ t("project_field_desc") }}</text>
					</view>
					<input
						class="field-input"
						v-model="newDesc"
						:placeholder="t('project_desc_ph')"
						placeholder-class="field-ph"
						:maxlength="200"
					/>
					<text class="field-count">{{ descLen }}/200</text>
				</view>
				<view class="field-card">
					<view class="field-head">
						<view class="field-ico field-ico-green"><text class="field-ico-t">🎯</text></view>
						<view class="field-head-text">
							<text class="field-label">{{ t("project_field_goal") }}</text>
							<text class="field-star">*</text>
						</view>
					</view>
					<text class="field-hint">{{ t("project_goal_hint") }}</text>
					<textarea
						class="field-textarea"
						v-model="newGoal"
						:placeholder="t('project_goal_ph')"
						placeholder-class="field-ph"
						:maxlength="500"
					/>
					<text class="field-count">{{ goalLen }}/500</text>
				</view>

				<view class="agent-section-card">
					<view class="agent-sec-head">
						<view class="agent-sec-head-left">
							<text class="agent-sec-title">{{ t("project_pick_agents_title") }}</text>
							<text class="agent-sec-sub">{{ t("project_pick_agents_sub_detail") }}</text>
						</view>
						<view class="agent-sec-help" @tap.stop="onLearnAgent">
							<text class="agent-sec-help-q">?</text>
							<text class="agent-sec-help-t">{{ t("project_learn_agent") }}</text>
						</view>
					</view>
					<view v-if="loadingAgents" class="agent-empty">{{ t("loading") }}…</view>
					<view v-else-if="!agentOptions.length" class="agent-empty">{{ t("group_invite_none_available") }}</view>
					<view v-else>
						<view
							v-for="(a, ai) in agentOptions"
							:key="a.id"
							class="pick-agent-card"
							:class="{ 'pick-agent-on': selectedAgentIds.includes(a.id) }"
							@tap="toggleAgent(a.id)"
						>
							<text class="pick-model-pill-abs">{{ modelShort(a.id) }}</text>
							<view class="pick-agent-left">
								<text v-if="selectedAgentIds.includes(a.id)" class="pick-check">✓</text>
								<view v-else class="pick-circle" />
							</view>
							<view class="pick-agent-av" :style="{ background: agentCardGradient(a.id) }">
								<text class="pick-agent-av-t">{{ (a.name || '?').slice(0, 1) }}</text>
							</view>
							<view class="pick-agent-mid">
								<view class="pick-name-row">
									<text class="pick-name">{{ a.name }}</text>
									<text v-if="agentIsRecommended(ai)" class="pick-rec">{{ t("tag_recommended") }}</text>
								</view>
								<text class="pick-meta">{{ agentMetaLine(a) }}</text>
								<text class="pick-desc">{{ agentBlurb(a) }}</text>
								<view class="pick-skills">
									<text v-for="(sk, si) in agentSkillTagsSlice(a)" :key="si" class="pick-skill">{{ sk }}</text>
									<text v-if="agentSkillTagsMore(a) > 0" class="pick-skill pick-skill-more">+{{ agentSkillTagsMore(a) }}</text>
								</view>
								<view class="pick-cap-row">
									<text class="pick-cap-lab">{{ t("agent_capability") }}</text>
									<view class="pick-cap-val">
										<text class="pick-cap-pct">{{ agentCapabilityPct(a.id) }}%</text>
										<text class="pick-cap-trend">📈</text>
									</view>
								</view>
							</view>
						</view>
						<view class="ai-match-banner">
							<text class="ai-match-ico">✨</text>
							<view class="ai-match-texts">
								<view class="ai-match-line">
									<text class="ai-match-bold">{{ t("ai_match_inline") }}</text>
									<text class="ai-match-colon">: </text>
									<text class="ai-match-body">{{ t("ai_match_banner_body") }}</text>
								</view>
							</view>
							<text class="ai-match-art">🧊</text>
						</view>
					</view>
				</view>
				<view class="create-scroll-pad" />
			</scroll-view>
			<view class="create-actions">
				<view class="create-btn create-btn-cancel" @tap.stop="closeCreate">
					<text class="create-btn-t">{{ t("cancel") }}</text>
				</view>
				<view
					class="create-btn create-btn-ok"
					:class="{ 'is-disabled': !canSubmitCreate && !creating }"
					@tap.stop="submitCreate"
				>
					<text class="create-btn-star">✨</text>
					<text class="create-btn-t">{{ creating ? `${t('loading')}…` : t("create_project") }}</text>
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
	import { getToken } from "@/utils/index";
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
				statusBarPx: 20,
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
			titleLen() {
				return (this.newTitle || "").length;
			},
			descLen() {
				return (this.newDesc || "").length;
			},
			goalLen() {
				return (this.newGoal || "").length;
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
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
						.map((r) => {
							const tagRaw = r?.tags || r?.skillTags || r?.capabilities;
							const skillTags = Array.isArray(tagRaw)
								? tagRaw.map((x) => String(x || "").trim()).filter(Boolean)
								: [];
							const mc = Number(r?.teamSize ?? r?.memberCount ?? r?.teamMemberCount ?? NaN);
							return {
								id: String(r?.id || r?.agentId || "").trim(),
								name: String(r?.displayName || r?.name || "").trim(),
								role: String(r?.jobTitle || r?.rolePosition || r?.role || "").trim(),
								department: String(r?.department || "").trim(),
								avatar: String(r?.avatar || r?.avatarUrl || r?.headImg || r?.headimg || "").trim(),
								bio: String(
									r?.bio || r?.introduction || r?.summary || r?.roleDescription || r?.description || ""
								).trim(),
								memberCount: Number.isFinite(mc) && mc > 0 ? mc : 1,
								skillTags,
							};
						})
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
				if (!getToken()) {
					uni.showModal({
						title: this.t("create_project"),
						content: this.t("please_login_first"),
						confirmText: this.t("go_to_login"),
						cancelText: this.t("cancel"),
						success: (res) => {
							if (res.confirm) uni.navigateTo({ url: "/pages/login/login" });
						},
					});
					return;
				}
				uni.hideTabBar({ animation: false });
				this.showCreate = true;
				if (!this.agentOptions.length) this.loadAgentOptions();
			},
			closeCreate() {
				this.showCreate = false;
			},
			agentCapabilityPct(agentId) {
				let h = 0;
				const s = String(agentId || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return 68 + (h % 28);
			},
			agentSkillTagsAll(a) {
				if (a?.skillTags && a.skillTags.length) {
					return [...new Set(a.skillTags.map((x) => String(x || "").trim()).filter(Boolean))];
				}
				const raw = [a?.role, a?.department].filter(Boolean).join(" ");
				const parts = raw.split(/[,，、\s]+/).map((x) => String(x || "").trim()).filter(Boolean);
				const fallback = [this.t("profile_tag_collab"), this.t("workflow")];
				return [...new Set([...parts, ...fallback])];
			},
			agentSkillTagsSlice(a) {
				return this.agentSkillTagsAll(a).slice(0, 3);
			},
			agentSkillTagsMore(a) {
				const n = this.agentSkillTagsAll(a).length;
				return Math.max(0, n - 3);
			},
			agentMetaLine(a) {
				const dept = a?.department || this.t("vt_member_default");
				return `${dept} · ${this.t("conv_member_count", { n: a?.memberCount || 1 })}`;
			},
			agentBlurb(a) {
				const b = String(a?.bio || "").trim();
				if (b) return b.length > 140 ? `${b.slice(0, 138)}…` : b;
				const blurbs = [
					"擅长项目推进、风险识别与资源协调，适合复杂项目管理",
					"擅长任务执行与流程优化，适合标准化项目落地",
				];
				let h = 0;
				const s = String(a?.id || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return blurbs[h % blurbs.length];
			},
			agentIsRecommended(idx) {
				return idx === 0;
			},
			agentCardGradient(id) {
				const colors = [
					"linear-gradient(145deg,#ec4899,#f9a8d4)",
					"linear-gradient(145deg,#f59e0b,#fcd34d)",
					"linear-gradient(145deg,#3b82f6,#93c5fd)",
					"linear-gradient(145deg,#a855f7,#c084fc)",
					"linear-gradient(145deg,#14b8a6,#5eead4)",
				];
				let h = 0;
				const s = String(id || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			onLearnAgent() {
				uni.showToast({ title: this.t("project_learn_agent"), icon: "none" });
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
		background: #f8f9fb;
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
		gap: 12rpx;
		margin-bottom: 24rpx;
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
		font-size: 26rpx;
		font-weight: 800;
		color: #3730a3;
		padding: 14rpx 26rpx;
		border-radius: 999rpx;
		background: linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%);
		border: 2rpx solid rgba(92, 133, 255, 0.35);
		box-shadow: 0 6rpx 20rpx rgba(92, 133, 255, 0.12);
	}

	.hero-link {
		font-size: 26rpx;
		font-weight: 600;
		color: #64748b;
		padding: 14rpx 18rpx;
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

	.empty-wrap {
		position: relative;
		min-height: 62vh;
		padding: 8rpx 0 32rpx;
		box-sizing: border-box;
	}

	.empty-bg {
		position: absolute;
		left: 0;
		right: 0;
		top: 80rpx;
		height: 360rpx;
		pointer-events: none;
		overflow: hidden;
	}

	.empty-blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(2rpx);
		opacity: 0.55;
	}

	.empty-blob-a {
		width: 280rpx;
		height: 280rpx;
		left: 50%;
		margin-left: -200rpx;
		top: 0;
		background: radial-gradient(circle, rgba(92, 133, 255, 0.35) 0%, transparent 70%);
	}

	.empty-blob-b {
		width: 220rpx;
		height: 220rpx;
		left: 50%;
		margin-left: -40rpx;
		top: 120rpx;
		background: radial-gradient(circle, rgba(126, 96, 255, 0.28) 0%, transparent 70%);
	}

	.empty-card {
		position: relative;
		z-index: 1;
		margin: 0 auto;
		max-width: 620rpx;
		padding: 48rpx 36rpx 40rpx;
		background: #ffffff;
		border-radius: 32rpx;
		border: 1rpx solid #e8eaed;
		box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.08);
		text-align: center;
		box-sizing: border-box;
	}

	.empty-icon-stack {
		position: relative;
		width: 144rpx;
		height: 144rpx;
		margin: 0 auto 28rpx;
	}

	.empty-icon-glow {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 120rpx;
		height: 120rpx;
		margin-left: -60rpx;
		margin-top: -60rpx;
		border-radius: 36rpx;
		background: linear-gradient(145deg, rgba(92, 133, 255, 0.25), rgba(126, 96, 255, 0.18));
	}

	.empty-icon-square {
		position: relative;
		width: 144rpx;
		height: 144rpx;
		border-radius: 36rpx;
		background: linear-gradient(160deg, #eef2ff 0%, #e0e7ff 45%, #f5f3ff 100%);
		border: 2rpx solid rgba(129, 140, 248, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 12rpx 32rpx rgba(79, 70, 229, 0.15);
	}

	.empty-float-ico {
		position: absolute;
		top: -12rpx;
		right: -8rpx;
		font-size: 36rpx;
		line-height: 1;
	}

	.empty-emoji {
		font-size: 64rpx;
		line-height: 1;
	}

	.empty-title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 10rpx;
	}

	.empty-title {
		font-size: 36rpx;
		color: #333;
		font-weight: 900;
		letter-spacing: 0.5rpx;
	}

	.empty-spark {
		font-size: 30rpx;
		line-height: 1;
	}

	.empty-desc {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		color: #999;
		line-height: 1.65;
		padding: 0 4rpx;
	}

	.empty-pills {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12rpx;
		margin-top: 28rpx;
	}

	.empty-pill {
		font-size: 22rpx;
		font-weight: 700;
		color: #5c85ff;
		background: rgba(92, 133, 255, 0.1);
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		border: 1rpx solid rgba(92, 133, 255, 0.22);
	}

	.empty-cta {
		margin: 36rpx auto 0;
		width: 100%;
		max-width: 480rpx;
		height: 96rpx;
		border-radius: 48rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		background: linear-gradient(135deg, #5c85ff, #7e60ff);
		box-shadow: 0 14rpx 36rpx rgba(94, 112, 255, 0.35);
	}

	.empty-cta-star {
		font-size: 28rpx;
	}

	.empty-cta-t {
		font-size: 30rpx;
		font-weight: 800;
		color: #fff;
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
		background: #f8f9fb;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.create-status-bar {
		flex-shrink: 0;
	}

	.create-header {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		padding: 8rpx 28rpx 20rpx;
	}

	.create-header-main {
		flex: 1;
		min-width: 0;
	}

	.create-title-row2 {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
		flex-wrap: wrap;
	}

	.create-title-large {
		font-size: 44rpx;
		font-weight: 900;
		color: #0f172a;
	}

	.create-title-spark {
		font-size: 32rpx;
	}

	.create-sub-large {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.create-close-btn {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
		flex-shrink: 0;
		margin-left: 16rpx;
	}

	.create-close-x {
		font-size: 44rpx;
		color: #94a3b8;
		font-weight: 300;
		line-height: 1;
	}

	.create-body {
		flex: 1;
		height: 0;
		padding: 0 24rpx;
		box-sizing: border-box;
	}

	.field-card {
		background: #fff;
		border-radius: 28rpx;
		padding: 24rpx 22rpx 20rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #e8eaed;
		box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
		position: relative;
	}

	.field-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 16rpx;
	}

	.field-head-text {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
	}

	.field-ico {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.field-ico-purple {
		background: linear-gradient(145deg, #8b5cf6, #a78bfa);
	}
	.field-ico-blue {
		background: linear-gradient(145deg, #3b82f6, #60a5fa);
	}
	.field-ico-green {
		background: linear-gradient(145deg, #10b981, #34d399);
	}

	.field-ico-t {
		font-size: 28rpx;
	}

	.field-label {
		font-size: 30rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.field-star {
		font-size: 30rpx;
		color: #ef4444;
		font-weight: 700;
	}

	.field-hint {
		display: block;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.4;
		margin: -8rpx 0 14rpx;
	}

	.field-input {
		width: 100%;
		min-height: 88rpx;
		background: #f1f5f9;
		border-radius: 20rpx;
		padding: 20rpx 22rpx;
		font-size: 28rpx;
		color: #0f172a;
		box-sizing: border-box;
	}

	.field-textarea {
		width: 100%;
		min-height: 200rpx;
		background: #f1f5f9;
		border-radius: 20rpx;
		padding: 20rpx 22rpx;
		font-size: 28rpx;
		color: #0f172a;
		box-sizing: border-box;
	}

	.field-ph {
		color: #94a3b8;
	}

	.field-count {
		display: block;
		text-align: right;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #94a3b8;
	}

	.agent-section-card {
		background: #fff;
		border-radius: 28rpx;
		padding: 24rpx 20rpx 20rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #e8eaed;
		box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
	}

	.agent-sec-head {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 20rpx;
		gap: 16rpx;
	}

	.agent-sec-head-left {
		flex: 1;
		min-width: 0;
	}

	.agent-sec-title {
		display: block;
		font-size: 30rpx;
		font-weight: 900;
		color: #333;
	}

	.agent-sec-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #999;
		line-height: 1.4;
	}

	.agent-sec-help {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		flex-shrink: 0;
		padding-top: 4rpx;
	}

	.agent-sec-help-q {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		background: #ede9fe;
		color: #7c3aed;
		font-size: 22rpx;
		font-weight: 800;
		line-height: 32rpx;
		text-align: center;
	}

	.agent-sec-help-t {
		font-size: 24rpx;
		color: #5c85ff;
		font-weight: 700;
	}

	.agent-empty {
		font-size: 24rpx;
		color: #94a3b8;
		padding: 24rpx 0;
		text-align: center;
	}

	.pick-agent-card {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		padding: 20rpx 16rpx 18rpx;
		border-radius: 24rpx;
		border: 2rpx solid #e8eaed;
		background: #fff;
		margin-bottom: 16rpx;
		box-sizing: border-box;
		position: relative;
	}

	.pick-agent-on {
		border-color: #5c85ff;
		background: linear-gradient(180deg, #fff 0%, #f4f7ff 100%);
		box-shadow: 0 8rpx 24rpx rgba(92, 133, 255, 0.12);
	}

	.pick-agent-left {
		width: 40rpx;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 8rpx;
		flex-shrink: 0;
	}

	.pick-check {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: #fff;
		font-size: 22rpx;
		font-weight: 900;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.pick-circle {
		width: 34rpx;
		height: 34rpx;
		border-radius: 50%;
		border: 3rpx solid #cbd5e1;
		box-sizing: border-box;
	}

	.pick-agent-av {
		width: 88rpx;
		height: 88rpx;
		border-radius: 22rpx;
		margin: 0 14rpx 0 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.12);
	}

	.pick-agent-av-t {
		font-size: 36rpx;
		font-weight: 800;
		color: #fff;
	}

	.pick-agent-mid {
		flex: 1;
		min-width: 0;
	}

	.pick-name-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.pick-name {
		font-size: 30rpx;
		font-weight: 800;
		color: #333;
	}

	.pick-rec {
		font-size: 20rpx;
		font-weight: 800;
		color: #7c3aed;
		background: rgba(124, 58, 237, 0.12);
		padding: 4rpx 10rpx;
		border-radius: 8rpx;
	}

	.pick-meta {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #999;
		line-height: 1.35;
	}

	.pick-model-pill-abs {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		font-size: 20rpx;
		color: #0369a1;
		background: #e0f2fe;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		font-weight: 600;
		z-index: 2;
	}

	.pick-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #666;
		line-height: 1.45;
	}

	.pick-skills {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8rpx;
		margin-top: 12rpx;
	}

	.pick-skill {
		font-size: 20rpx;
		color: #64748b;
		background: #f1f5f9;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
	}

	.pick-skill-more {
		color: #5c85ff;
		background: rgba(92, 133, 255, 0.12);
	}

	.pick-cap-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		margin-top: 12rpx;
		gap: 8rpx;
	}

	.pick-cap-lab {
		font-size: 18rpx;
		color: #94a3b8;
	}

	.pick-cap-val {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 4rpx;
	}

	.pick-cap-pct {
		font-size: 26rpx;
		font-weight: 900;
		color: #16a34a;
	}

	.pick-cap-trend {
		font-size: 22rpx;
	}

	.ai-match-banner {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 20rpx;
		border-radius: 24rpx;
		background: linear-gradient(135deg, #eef2ff 0%, #e8edff 50%, #f3e8ff 100%);
		margin-top: 8rpx;
		border: 1rpx solid rgba(126, 96, 255, 0.15);
	}

	.ai-match-ico {
		font-size: 36rpx;
		flex-shrink: 0;
		margin-right: 12rpx;
	}

	.ai-match-texts {
		flex: 1;
		min-width: 0;
	}

	.ai-match-line {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: baseline;
		font-size: 24rpx;
		color: #4c1d95;
		line-height: 1.5;
	}

	.ai-match-bold {
		font-weight: 900;
		color: #3730a3;
	}

	.ai-match-colon,
	.ai-match-body {
		font-weight: 500;
		color: #5b21b6;
	}

	.ai-match-art {
		font-size: 52rpx;
		flex-shrink: 0;
		opacity: 0.9;
	}

	.create-scroll-pad {
		height: 40rpx;
	}

	.create-actions {
		flex-shrink: 0;
		padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
		background: rgba(244, 246, 251, 0.96);
		display: flex;
		gap: 16rpx;
		box-sizing: border-box;
		border-top: 1rpx solid #e2e8f0;
	}

	.create-btn {
		flex: 1;
		height: 96rpx;
		border-radius: 48rpx;
		font-size: 28rpx;
		font-weight: 700;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}

	.create-btn-t {
		font-size: 28rpx;
		font-weight: 700;
	}

	.create-btn-star {
		font-size: 26rpx;
	}

	.create-btn-cancel {
		background: #fff;
		border: 2rpx solid #e2e8f0;
	}

	.create-btn-cancel .create-btn-t {
		color: #475569;
	}

	.create-btn-ok {
		background: linear-gradient(135deg, #5c85ff, #7e60ff);
		box-shadow: 0 10rpx 28rpx rgba(94, 112, 255, 0.35);
	}

	.create-btn-ok .create-btn-t,
	.create-btn-ok .create-btn-star {
		color: #fff;
	}

	.create-btn-ok.is-disabled {
		opacity: 0.45;
		pointer-events: none;
	}
</style>
