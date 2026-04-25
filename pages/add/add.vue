<template>
	<view class="add-page">
		<!-- 同 home：小程序原生 scroll-view 会盖住 fixed 自定义 Tab -->
		<view class="scroll">
			<view class="hero">
				<view class="hero-icon">⚡</view>
				<view class="hero-copy">
				<text class="head-title">{{ t('add') }}</text>
				<text class="head-sub">一句话自动创建并分配工作流任务（ai-one-shot / ai-auto）</text>
			</view>
			</view>

			<view class="steps">
			<view class="step" :class="{ done: !!workflowId }">
				<text class="step-n">1</text>
				<text class="step-t">{{ t('select_workflow') }}</text>
			</view>
			<text class="step-line"></text>
			<view class="step" :class="{ done: goalTrimmed.length > 0 }">
				<text class="step-n">2</text>
				<text class="step-t">{{ t('write_task') }}</text>
			</view>
			<text class="step-line"></text>
			<view class="step">
				<text class="step-n">3</text>
				<text class="step-t">{{ t('submit_task') }}</text>
			</view>
		</view>

			<view class="wf-bar">
			<view class="wf-info" @tap="pickWorkflow">
				<text class="wf-label">{{ t('add_select_project') }}</text>
				<text class="wf-name">{{ workflowTitle || t('click_to_select') }}</text>
			</view>
			<view class="wf-right">
				<text class="wf-new" @tap.stop="openCreateProject">{{ t('add_picker_new_project') }}</text>
				<text class="wf-arrow" @tap="pickWorkflow">›</text>
			</view>
		</view>

		<view class="boss-strip">
			<text class="boss-title">{{ t('boss_dashboard') }}</text>
			<text class="boss-sub">{{ t('boss_dashboard_sub') }}</text>
		</view>

		<scroll-view scroll-x class="tpl-scroll" show-scrollbar="false">
			<view
				v-for="(tpl, i) in quickTemplates"
				:key="tpl.key"
				class="tpl-chip"
				:class="{ on: templateIdx === i }"
				@click="applyTemplate(i)"
			>
				<text class="tpl-name">{{ tpl.name }}</text>
			</view>
		</scroll-view>

		<view class="card">
			<text class="label">{{ t('instruction_flow') }}</text>
			<text class="mini-label">{{ t('source_dept') }}</text>
			<view class="dept-row">
				<view
					v-for="(d, i) in deptOptions"
					:key="`src-${d.id}`"
					class="dept-chip"
					:class="{ on: sourceDeptIdx === i }"
					@click="sourceDeptIdx = i"
				>
					<text class="dept-chip-t">{{ d.label }}</text>
				</view>
			</view>
			<text class="mini-label">{{ t('target_dept') }}</text>
			<view class="dept-row">
				<view
					v-for="(d, i) in deptOptions"
					:key="`tgt-${d.id}`"
					class="dept-chip"
					:class="{ on: targetDeptIdx === i }"
					@click="targetDeptIdx = i"
				>
					<text class="dept-chip-t">{{ d.label }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="label">{{ t('task_goal') }}</text>
			<textarea
				class="goal"
				v-model="goal"
				:maxlength="2000"
				:placeholder="t('task_placeholder')"
				placeholder-class="ph"
				:auto-height="false"
			/>
			<text class="counter">{{ goal.length }} / 2000</text>
		</view>

		<view v-if="showAdvanced" class="card">
			<text class="label">{{ t('priority') }}</text>
			<view class="pri-row">
				<view
					v-for="(p, i) in priorities"
					:key="p.key"
					class="pri"
					:class="{ on: priorityIdx === i }"
					@click="priorityIdx = i"
				>
					<text class="pri-t">{{ t(`priority_${p.key}`) }}</text>
				</view>
			</view>
		</view>

		<view class="preview-card">
			<text class="preview-title">{{ t('dispatch_preview') }}</text>
			<text class="preview-line">{{ t('operator_label') }}：{{ operatorName || t('boss_fallback') }}</text>
			<text class="preview-line">{{ t('flow_preview') }}：{{ sourceDeptLabel }} → {{ targetDeptLabel }}</text>
			<text class="preview-line">{{ t('priority_preview') }}：{{ priorityLabel }}（L{{ hierarchyLevel }}）</text>
			<text class="preview-text">{{ goalTrimmed || t('input_task_hint') }}</text>
		</view>

		<view class="adv-toggle" @tap="showAdvanced = !showAdvanced">
			<text class="adv-toggle-t">{{ showAdvanced ? "收起高级设置" : "展开高级设置（流向/优先级）" }}</text>
		</view>

		<view class="actions">
			<button class="btn main confirm-btn" type="primary" :loading="submitting" @click="submit">确认</button>
		</view>

			<view class="pad-bottom" />
		</view>

		<view v-if="showCreateProject" class="mask" @click.self="showCreateProject = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('add_new_project_title') }}</text>
				<input
					class="dialog-input"
					v-model="newProjectTitle"
					:placeholder="t('add_new_project_name_ph')"
					placeholder-class="ph"
					:adjust-position="true"
					:hold-keyboard="false"
					confirm-type="next"
				/>
				<input
					class="dialog-input"
					v-model="newProjectDesc"
					:placeholder="t('add_new_project_desc_ph')"
					placeholder-class="ph"
					:adjust-position="true"
					:hold-keyboard="false"
					confirm-type="done"
					@confirm="submitCreateProject"
				/>
				<view class="dialog-actions">
					<view class="modal-btn modal-btn-ghost" @tap.stop="showCreateProject = false">
						<text class="modal-btn-t">{{ t('cancel') }}</text>
					</view>
					<view
						class="modal-btn modal-btn-primary"
						:class="{
							'is-loading': creatingProject,
							'is-disabled': !canSubmitNewProject && !creatingProject,
						}"
						@tap.stop="submitCreateProject"
					>
						<text v-if="creatingProject" class="modal-btn-t">{{ t('loading') }}…</text>
						<text v-else class="modal-btn-t">{{ t('create') }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 自绘项目选择器：比原生 showActionSheet 遮罩更轻，避免全屏发灰 -->
		<view
			v-if="showWorkflowPicker"
			class="wf-picker-mask"
			@tap.self="showWorkflowPicker = false"
		>
			<view class="wf-picker-panel" @tap.stop>
				<view class="wf-picker-handle" />
				<text class="wf-picker-title">{{ t('add_select_project') }}</text>
				<!-- 小程序里 scroll-y 多直接子节点时，常只有第一个能点到；包一层保整表可点 -->
				<scroll-view scroll-y class="wf-picker-scroll" :show-scrollbar="true">
					<view class="wf-picker-list-inner">
						<view
							class="wf-picker-row wf-picker-row--new"
							@tap="onWorkflowPickerItem(0)"
						>
							<text class="wf-picker-new">{{ t('add_picker_new_project') }}</text>
						</view>
						<view
							v-for="(w, i) in workflowList"
							:key="wfPickerItemKey(w, i)"
							class="wf-picker-row"
							@tap="onWorkflowPickerItem(i + 1)"
						>
							<text class="wf-picker-name">{{ wfLabel(w) }}</text>
						</view>
						<view v-if="loadingWorkflows" class="wf-picker-empty">
							<text class="wf-picker-empty-t">正在加载项目…</text>
						</view>
						<view v-else-if="!workflowList.length" class="wf-picker-empty">
							<text class="wf-picker-empty-t">暂无项目，可先点上方“新建项目”</text>
						</view>
					</view>
				</scroll-view>
				<view class="wf-picker-footer" @tap="showWorkflowPicker = false">
					<text class="wf-picker-cancel-t">{{ t('cancel') }}</text>
				</view>
			</view>
		</view>

		<!-- 弹窗打开时隐藏底栏，避免小程序里底栏/穿透抢点击，导致「创建」无反应 -->
		<AppTabBar v-if="!showCreateProject && !showWorkflowPicker" current="add" />
	</view>
</template>

<script>
	import * as workflowApi from "@/clientApi/workflowApi";
	import { pickId, getApiErrorMessage } from "@/utils/apiHelpers";
	import { getUserInfo } from "@/utils/index";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";
	import agentDepartments from "@/data/agentDepartments";
	import AppTabBar from "@/components/AppTabBar.vue";

	const STORAGE_WF = "lastWorkflowId";
	const STORAGE_WF_TITLE = "lastWorkflowTitle";
const STORAGE_WF_LIST = "cachedWorkflowList";

	export default {
		components: { AppTabBar },
		data() {
			return {
				workflowId: "",
				workflowTitle: "",
				workflowList: [],
				goal: "",
				priorityIdx: 1,
				submitting: false,
				showCreateProject: false,
				showWorkflowPicker: false,
				loadingWorkflows: false,
				newProjectTitle: "",
				newProjectDesc: "",
				creatingProject: false,
				sourceDeptIdx: 0,
				targetDeptIdx: 1,
				operatorName: "",
				currentLanguage: getLanguage(),
				quickTemplates: [
					{
						key: "mvp",
						name: "MVP 冲刺",
						name_en: "MVP Sprint",
						text: "请在两周内交付可演示 MVP，覆盖核心流程并可给客户试用；同步输出风险清单与回滚方案。",
						text_en: "Deliver a demo-ready MVP within 2 weeks, covering core flows and ready for customer trial; output risk list and rollback plan.",
						level: 2,
						source: "product",
						target: "engineering",
						title: "两周 MVP 冲刺",
						title_en: "2-Week MVP Sprint",
					},
					{
						key: "bugfix",
						name: "线上修复",
						name_en: "Hotfix",
						text: "优先修复线上高优先级问题，今天内给出根因和修复计划，明早前完成验证并回传结论。",
						text_en: "Fix critical production issues first. Provide root cause and fix plan today, complete verification and report back by tomorrow morning.",
						level: 3,
						source: "pm",
						target: "engineering",
						title: "线上问题紧急修复",
						title_en: "Urgent Production Fix",
					},
					{
						key: "campaign",
						name: "营销联动",
						name_en: "Marketing Campaign",
						text: "围绕本周增长目标，产出可执行活动方案，明确渠道、预算、转化指标与复盘口径。",
						text_en: "Based on this week's growth targets, produce an actionable campaign plan with channels, budget, conversion metrics, and review criteria.",
						level: 2,
						source: "product",
						target: "marketing",
						title: "增长活动方案",
						title_en: "Growth Campaign Plan",
					},
				],
			};
		},
		computed: {
			hierarchyLevel() {
				return this.priorityIdx + 1;
			},
			goalTrimmed() {
				return (this.goal || "").trim();
			},
			priorities() {
				return [{ key: "low" }, { key: "mid" }, { key: "high" }];
			},
			deptOptions() {
				const lang = this.currentLanguage;
				return agentDepartments.map((d) => {
					const td = translateDepartment(d, lang);
					return { id: d.id, label: td.name || d.name || d.id };
				});
			},
			sourceDeptId() {
				return this.deptOptions[this.sourceDeptIdx]?.id || "product";
			},
			targetDeptId() {
				return this.deptOptions[this.targetDeptIdx]?.id || "engineering";
			},
			sourceDeptLabel() {
				return this.deptOptions[this.sourceDeptIdx]?.label || "产品部";
			},
			targetDeptLabel() {
				return this.deptOptions[this.targetDeptIdx]?.label || "工程部";
			},
			priorityLabel() {
				return this.t(`priority_${this.priorities[this.priorityIdx]?.key || "mid"}`);
			},
			/** 仅项目名称必填；说明可选 */
			canSubmitNewProject() {
				return (this.newProjectTitle || "").trim().length > 0;
			},
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
			this.currentLanguage = getLanguage();
			this.updateQuickTemplates();
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.currentLanguage = getLanguage();
			try {
				uni.setNavigationBarTitle({ title: this.t("add") });
			} catch (e) {
				//
			}
			this.workflowId = uni.getStorageSync(STORAGE_WF) || "";
			this.workflowTitle = uni.getStorageSync(STORAGE_WF_TITLE) || "";
			const cachedList = uni.getStorageSync(STORAGE_WF_LIST);
			this.workflowList = Array.isArray(cachedList) ? cachedList : [];
			if (!this.workflowId && this.workflowList.length > 0) {
				const first = this.workflowList[0];
				const firstId = pickId(first);
				if (firstId) {
					this.workflowId = firstId;
					this.workflowTitle = first.title || first.name || this.t("workflow");
				}
			}
			const user = getUserInfo() || {};
			this.operatorName = user.nickname || user.username || user.name || user.phone || "";
			if (this.deptOptions.length > 1 && this.targetDeptIdx === this.sourceDeptIdx) {
				this.targetDeptIdx = 1;
			}
			this.updateQuickTemplates();
			setTimeout(() => {
				this.prefetchWorkflows();
			}, 0);
		},
		methods: {
			t(key, params = {}) {
				return t(key, this.currentLanguage, params);
			},
			updateQuickTemplates() {
				const lang = this.currentLanguage;
				const isEn = lang === 'en';
				this.quickTemplates = this.quickTemplates.map(tpl => ({
					...tpl,
					name: isEn ? (tpl.name_en || tpl.name) : tpl.name,
					text: isEn ? (tpl.text_en || tpl.text) : tpl.text,
					title: isEn ? (tpl.title_en || tpl.title) : tpl.title,
				}));
			},
			async prefetchWorkflows(options = {}) {
				const keepExisting = options.keepExisting !== false;
				const prevList = Array.isArray(this.workflowList) ? this.workflowList : [];
				try {
					const list = await workflowApi.listWorkflows();
					this.workflowList = Array.isArray(list) ? list : [];
					try {
						uni.setStorageSync(STORAGE_WF_LIST, this.workflowList);
					} catch {
						//
					}
					if (!this.workflowId && this.workflowList.length === 1) {
						const w = this.workflowList[0];
						const id = pickId(w);
						if (id) {
							this.workflowId = id;
							this.workflowTitle = w.title || w.name || this.t("workflow");
							uni.setStorageSync(STORAGE_WF, id);
							uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
						}
					}
				} catch {
					this.workflowList = keepExisting ? prevList : [];
				}
			},
			wfLabel(w) {
				const id = pickId(w);
				const name = w.title || w.name || this.t("workflow");
				return id ? `${name}` : name;
			},
			async pickWorkflow() {
				this.showWorkflowPicker = true;
				this.loadingWorkflows = true;
				try {
					await this.prefetchWorkflows({ keepExisting: true });
				} finally {
					this.loadingWorkflows = false;
				}
			},
			wfPickerItemKey(w, i) {
				return pickId(w) || `w-${i}`;
			},
			onWorkflowPickerItem(index) {
				if (index === 0) {
					this.showWorkflowPicker = false;
					this.$nextTick(() => {
						this.openCreateProject();
					});
					return;
				}
				const w = this.workflowList[index - 1];
				if (!w) return;
				const id = pickId(w);
				if (!id) {
					uni.showToast({ title: "项目数据缺少ID，请刷新后重试", icon: "none" });
					return;
				}
				this.showWorkflowPicker = false;
				this.workflowId = id;
				this.workflowTitle = w.title || w.name || this.t("workflow");
				try {
					uni.setStorageSync(STORAGE_WF, id);
					uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
				} catch {
					//
				}
			},
			openCreateProject() {
				this.newProjectTitle = "";
				this.newProjectDesc = "";
				this.showCreateProject = true;
			},
			mergeCreatedIntoList(created, title, id) {
				if (!id) return;
				const has = this.workflowList.some((w) => pickId(w) === id);
				if (has) return;
				const item = {
					...(created && typeof created === "object" ? created : {}),
					id,
					title: (created && (created.title || created.name)) || title,
					name: (created && (created.name || created.title)) || title,
				};
				this.workflowList = [item, ...this.workflowList];
				try {
					uni.setStorageSync(STORAGE_WF_LIST, this.workflowList);
				} catch {
					//
				}
			},
			async submitCreateProject() {
				if (this.creatingProject) return;
				const title = (this.newProjectTitle || "").trim();
				const desc = (this.newProjectDesc || "").trim();
				if (!title) {
					uni.showToast({ title: this.t("please_enter_project_name"), icon: "none" });
					return;
				}
				this.creatingProject = true;
				try {
					const created = await workflowApi.createWorkflow(
						desc ? { name: title, description: desc } : { name: title }
					);
					let id = pickId(created) || (created && created.workflowId) || "";
					try {
						await this.prefetchWorkflows();
					} catch (e) {
						console.warn("[add] prefetchWorkflows after create", e);
					}
					if (!id && this.workflowList.length) {
						const found = this.workflowList.find(
							(w) => (w.title || w.name) === title
						);
						if (found) id = pickId(found);
					}
					if (id) {
						this.mergeCreatedIntoList(created, title, id);
						this.workflowId = id;
						this.workflowTitle = (created && (created.title || created.name)) || title;
						try {
							uni.setStorageSync(STORAGE_WF, id);
							uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
						} catch {
							//
						}
						this.showCreateProject = false;
						uni.showToast({ title: this.t("add_new_project_success"), icon: "success" });
					} else {
						this.showCreateProject = false;
						uni.showToast({ title: this.t("add_new_project_id_missing"), icon: "none" });
					}
				} catch (err) {
					const detail = getApiErrorMessage(err);
					uni.showToast({
						title: detail || this.t("add_new_project_create_failed"),
						icon: "none",
						duration: 3200,
					});
				} finally {
					this.creatingProject = false;
				}
			},
			async submit() {
				const text = (this.goal || "").trim();
				if (!text) {
					uni.showToast({ title: this.t("please_write_task_content"), icon: "none" });
					return;
				}
				this.submitting = true;
				try {
					const source = this.sourceDeptId || "product";
					const target = this.targetDeptId && this.targetDeptId !== source ? this.targetDeptId : "engineering";
					const payload = {
						brief: text,
						title: this.workflowTitle || text.slice(0, 28),
						fromDepartment: source,
						fromLevel: 0,
						toLevel: this.showAdvanced ? this.hierarchyLevel : 1,
						maxTasks: 6,
					};
					let result = null;
					let wid = this.workflowId;
					if (!wid) {
						result = await workflowApi.aiOneShot(payload);
						wid =
							pickId(result) ||
							result?.workflowId ||
							result?.id ||
							result?.workflow?.id ||
							"";
						if (!wid) throw new Error("创建成功但未返回 workflowId");
						this.workflowId = wid;
						this.workflowTitle = payload.title || this.t("workflow");
						try {
							uni.setStorageSync(STORAGE_WF, wid);
							uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
						} catch {
							//
						}
					} else {
						result = await workflowApi.aiAuto(wid, payload);
					}
					uni.showToast({ title: "已自动创建并分配", icon: "success" });
					this.goal = "";
					uni.navigateTo({
						url: `/pages/workflow/workbench?id=${encodeURIComponent(wid)}`,
					});
				} catch (err) {
					const detail = getApiErrorMessage(err);
					uni.showToast({
						title: detail || "自动分配失败，请稍后重试",
						icon: "none",
						duration: 3200,
					});
				} finally {
					this.submitting = false;
				}
			},
		},
	};
</script>

<style scoped>
	.add-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f1f5f9;
	}

	.scroll {
		flex: 1;
		height: 0;
		padding: 28rpx 28rpx 0;
		box-sizing: border-box;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.hero {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 20rpx;
		padding: 28rpx;
		margin-bottom: 22rpx;
		background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
		border-radius: 24rpx;
		border: 1rpx solid #e0e7ff;
		box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.08);
	}

	.hero-icon {
		width: 72rpx;
		height: 72rpx;
		line-height: 72rpx;
		text-align: center;
		font-size: 40rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-radius: 20rpx;
		flex-shrink: 0;
		box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.25);
	}

	.hero-copy {
		flex: 1;
		min-width: 0;
	}

	.head-title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.head-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.em {
		color: #1d4ed8;
		font-weight: 700;
	}

	.steps {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 22rpx;
		padding: 18rpx 16rpx;
		background: #fff;
		border-radius: 18rpx;
		border: none;
		box-shadow: 0 8rpx 26rpx rgba(15, 23, 42, 0.06);
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		flex: 1;
		min-width: 0;
	}

	.step-n {
		width: 44rpx;
		height: 44rpx;
		line-height: 44rpx;
		text-align: center;
		border-radius: 50%;
		font-size: 22rpx;
		font-weight: 800;
		color: #94a3b8;
		background: #f1f5f9;
	}

	.step.done .step-n {
		color: #fff;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
	}

	.step-t {
		font-size: 22rpx;
		color: #64748b;
		font-weight: 600;
	}

	.step.done .step-t {
		color: #1e293b;
	}

	.step-line {
		width: 40rpx;
		height: 2rpx;
		background: #e2e8f0;
		flex-shrink: 0;
	}

	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx 24rpx;
		margin-bottom: 18rpx;
		border: none;
		box-shadow: 0 8rpx 26rpx rgba(15, 23, 42, 0.06);
	}

	.label {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #334155;
		margin-bottom: 14rpx;
	}

	.mini-label {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin-bottom: 10rpx;
	}

	.dept-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
		margin-bottom: 14rpx;
	}

	.dept-chip {
		padding: 10rpx 16rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		border: 1rpx solid transparent;
	}

	.dept-chip.on {
		background: #dbeafe;
		border-color: #2563eb;
	}

	.dept-chip-t {
		font-size: 22rpx;
		font-weight: 600;
		color: #334155;
	}

	.dept-chip.on .dept-chip-t {
		color: #1d4ed8;
	}

	.goal {
		width: 100%;
		min-height: 280rpx;
		font-size: 30rpx;
		line-height: 1.55;
		color: #0f172a;
		box-sizing: border-box;
		padding: 16rpx;
		background: #f8fafc;
		border-radius: 14rpx;
		border: 1rpx solid #e2e8f0;
	}

	.ph {
		color: #94a3b8;
	}

	.counter {
		display: block;
		text-align: right;
		font-size: 22rpx;
		color: #94a3b8;
		margin-top: 10rpx;
	}

	.pri-row {
		display: flex;
		gap: 14rpx;
	}

	.pri {
		flex: 1;
		text-align: center;
		padding: 20rpx 12rpx;
		border-radius: 14rpx;
		background: #f1f5f9;
		border: 2rpx solid transparent;
		transition: background 0.15s ease;
	}

	.pri.on {
		background: #dbeafe;
		border-color: #2563eb;
	}

	.pri-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #475569;
	}

	.pri.on .pri-t {
		color: #1d4ed8;
	}

	.actions {
		display: block;
		margin-top: 8rpx;
		margin-bottom: 20rpx;
	}

	.preview-card {
		margin-bottom: 18rpx;
		padding: 20rpx 22rpx;
		border-radius: 18rpx;
		background: #eef2ff;
		border: 1rpx solid #c7d2fe;
	}

	.preview-title {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #312e81;
		margin-bottom: 8rpx;
	}

	.preview-line {
		display: block;
		font-size: 22rpx;
		color: #475569;
		margin-bottom: 4rpx;
	}

	.preview-text {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 1.5;
		color: #0f172a;
	}

	.adv-toggle {
		margin: 4rpx 0 14rpx;
		padding: 18rpx 16rpx;
		border-radius: 14rpx;
		background: #eef2ff;
		border: 1rpx solid #c7d2fe;
	}

	.adv-toggle-t {
		font-size: 24rpx;
		font-weight: 600;
		color: #3730a3;
	}

	.btn {
		flex: 1;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		font-size: 30rpx;
		font-weight: 700;
	}

	.btn.ghost {
		background: #fff;
		color: #475569;
		border: 1rpx solid #e2e8f0;
	}

	.btn.main {
		flex: 1.4;
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.35);
	}

	.confirm-btn {
		width: 100%;
		background: linear-gradient(135deg, #5b8cff, #6478ff) !important;
		color: #ffffff !important;
		border: none !important;
	}

	.confirm-btn::after {
		border: none !important;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.38);
		z-index: 12000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24rpx;
		box-sizing: border-box;
		isolation: isolate;
	}

	.dialog {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 700rpx;
		background: #fff !important;
		border-radius: 26rpx;
		padding: 30rpx 26rpx 24rpx;
		box-sizing: border-box;
		box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.22);
	}

	.dialog-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 18rpx;
	}

	.dialog-input {
		width: 100%;
		height: 86rpx;
		border: 2rpx solid #dbe3ee;
		border-radius: 16rpx;
		padding: 0 20rpx;
		margin-bottom: 14rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		background: #f8fafc;
		color: #0f172a;
	}

	.dialog-actions {
		display: flex;
		justify-content: space-between;
		gap: 14rpx;
		margin-top: 10rpx;
	}

	.modal-btn {
		flex: 1;
		height: 82rpx;
		border-radius: 18rpx;
		font-size: 28rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.modal-btn-t {
		font-size: 28rpx;
		font-weight: 700;
	}

	.modal-btn-ghost {
		background: #f3f6fb !important;
		border: 1rpx solid #e2e8f0;
	}

	.modal-btn-ghost .modal-btn-t {
		color: #475569;
	}

	.modal-btn-primary {
		background: linear-gradient(135deg, #7aa2ff, #8f95ff) !important;
		box-shadow: 0 10rpx 22rpx rgba(122, 162, 255, 0.35);
	}

	.modal-btn-primary .modal-btn-t {
		color: #fff;
	}

	.modal-btn-primary.is-loading {
		opacity: 0.8;
	}

	.modal-btn-primary.is-disabled {
		opacity: 0.45;
		pointer-events: none;
	}

	.pad-bottom {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}

	/* 项目选择：轻遮罩 + 底栏面板（替代 showActionSheet 的深色全屏层） */
	.wf-picker-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.16);
		z-index: 12000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		box-sizing: border-box;
	}

	.wf-picker-panel {
		width: 100%;
		max-height: 72vh;
		background: #e2e8f0;
		border-radius: 28rpx 28rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
		overflow: hidden;
	}

	.wf-picker-handle {
		width: 64rpx;
		height: 8rpx;
		background: #cbd5e1;
		border-radius: 999rpx;
		margin: 16rpx auto 8rpx;
	}

	.wf-picker-title {
		display: block;
		text-align: center;
		font-size: 26rpx;
		color: #64748b;
		padding: 0 24rpx 12rpx;
	}

	.wf-picker-scroll {
		/* 小程序 scroll-y 需确定高度，否则不滚动 */
		height: 480rpx;
		max-height: 52vh;
		background: #fff;
		border-radius: 20rpx 20rpx 0 0;
		margin: 0 0 0;
	}

	.wf-picker-list-inner {
		width: 100%;
		box-sizing: border-box;
	}

	.wf-picker-row {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.wf-picker-row--new {
		border-bottom: 1rpx solid #e2e8f0;
		background: #f8fafc;
	}

	.wf-picker-new {
		font-size: 30rpx;
		font-weight: 700;
		color: #2563eb;
	}

	.wf-picker-name {
		font-size: 30rpx;
		color: #0f172a;
	}

	.wf-picker-empty {
		padding: 28rpx 32rpx 36rpx;
		display: flex;
		justify-content: center;
	}

	.wf-picker-empty-t {
		font-size: 26rpx;
		color: #94a3b8;
	}

	.wf-picker-footer {
		padding: 20rpx 32rpx 28rpx;
		background: #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.wf-picker-cancel-t {
		font-size: 30rpx;
		color: #64748b;
		font-weight: 600;
	}
</style>
