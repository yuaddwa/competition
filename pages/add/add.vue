<template>
	<view class="add-page">
		<!-- 同 home：小程序原生 scroll-view 会盖住 fixed 自定义 Tab -->
		<view class="scroll">
			<view class="hero">
				<view class="hero-icon">⚡</view>
				<view class="hero-copy">
				<text class="head-title">{{ t('add') }}</text>
				<text class="head-sub">{{ t('add_subtitle') }}</text>
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
			<text class="boss-title">老板指令台</text>
			<text class="boss-sub">选择模板并确认流向，用一句话下达可执行任务</text>
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
			<text class="label">指令流向</text>
			<text class="mini-label">来源部门</text>
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
			<text class="mini-label">目标部门</text>
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
			<text class="label">任务目标（老板口吻）</text>
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

		<view class="card">
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
			<text class="preview-title">下发预览</text>
			<text class="preview-line">发起人：{{ operatorName || '老板' }}</text>
			<text class="preview-line">流向：{{ sourceDeptLabel }} → {{ targetDeptLabel }}</text>
			<text class="preview-line">优先级：{{ priorityLabel }}（L{{ hierarchyLevel }}）</text>
			<text class="preview-text">{{ goalTrimmed || '请在上方输入任务目标，建议包含结果、时间、验收标准。' }}</text>
		</view>

		<view class="actions">
			<button class="btn ghost" :disabled="submitting" @click="reset">{{ t('clear') }}</button>
			<button class="btn main" type="primary" :loading="submitting" @click="submit">{{ t('submit_task') }}</button>
		</view>

		<view class="hint-card">
			<text class="hint-title">{{ t('tips') }}</text>
			<text class="hint-t">{{ t('no_workflow_tip') }}</text>
			<button class="hint-btn" @click="goProject">{{ t('open_project') }}</button>
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
	import { switchMainTab } from "@/utils/tabNav";
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
				templateIdx: -1,
				operatorName: "",
				quickTemplates: [
					{
						key: "mvp",
						name: "MVP 冲刺",
						text: "请在两周内交付可演示 MVP，覆盖核心流程并可给客户试用；同步输出风险清单与回滚方案。",
						level: 2,
						source: "product",
						target: "engineering",
						title: "两周 MVP 冲刺",
					},
					{
						key: "bugfix",
						name: "线上修复",
						text: "优先修复线上高优先级问题，今天内给出根因和修复计划，明早前完成验证并回传结论。",
						level: 3,
						source: "pm",
						target: "engineering",
						title: "线上问题紧急修复",
					},
					{
						key: "campaign",
						name: "营销联动",
						text: "围绕本周增长目标，产出可执行活动方案，明确渠道、预算、转化指标与复盘口径。",
						level: 2,
						source: "product",
						target: "marketing",
						title: "增长活动方案",
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
				const lang = getLanguage();
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
		},
		onShow() {
			uni.hideTabBar({ animation: false });
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
			setTimeout(() => {
				this.prefetchWorkflows();
			}, 0);
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
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
			goProject() {
				switchMainTab("project");
			},
			reset() {
				this.goal = "";
				this.priorityIdx = 1;
				this.templateIdx = -1;
			},
			indexOfDeptId(deptId) {
				const idx = this.deptOptions.findIndex((d) => d.id === deptId);
				return idx >= 0 ? idx : 0;
			},
			applyTemplate(idx) {
				const tpl = this.quickTemplates[idx];
				if (!tpl) return;
				this.templateIdx = idx;
				this.goal = tpl.text || "";
				if (typeof tpl.level === "number") {
					this.priorityIdx = Math.max(0, Math.min(2, Number(tpl.level) - 1));
				}
				if (tpl.source) this.sourceDeptIdx = this.indexOfDeptId(tpl.source);
				if (tpl.target) this.targetDeptIdx = this.indexOfDeptId(tpl.target);
			},
			async submit() {
				const text = (this.goal || "").trim();
				if (!text) {
					uni.showToast({ title: this.t("please_write_task_content"), icon: "none" });
					return;
				}
				if (!this.workflowId) {
					this.openCreateProject();
					return;
				}
				if (this.sourceDeptId === this.targetDeptId) {
					uni.showToast({ title: "来源部门和目标部门不能相同", icon: "none" });
					return;
				}
				this.submitting = true;
				try {
					const selectedTpl = this.templateIdx >= 0 ? this.quickTemplates[this.templateIdx] : null;
					await workflowApi.postCommand(this.workflowId, {
						sourceDepartment: this.sourceDeptId,
						targetDepartment: this.targetDeptId,
						hierarchyLevel: this.hierarchyLevel,
						content: text,
						body: text,
						commandText: text,
						createTaskTitle: selectedTpl?.title || text.slice(0, 28),
					});
					uni.showToast({ title: this.t("issued"), icon: "success" });
					this.goal = "";
				} catch (err) {
					const detail = getApiErrorMessage(err);
					uni.showToast({
						title: detail || "下发失败，请稍后重试",
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

	.wf-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx 24rpx;
		margin-bottom: 20rpx;
		border: none;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.wf-right {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.wf-new {
		font-size: 22rpx;
		font-weight: 700;
		color: #2563eb;
		padding: 8rpx 14rpx;
		border-radius: 999rpx;
		background: #eff6ff;
		border: 1rpx solid #bfdbfe;
	}

	.wf-info {
		flex: 1;
		min-width: 0;
	}

	.wf-label {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		margin-bottom: 6rpx;
	}

	.wf-name {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1e293b;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wf-arrow {
		font-size: 40rpx;
		color: #cbd5e1;
		font-weight: 300;
		padding-left: 16rpx;
	}

	.boss-strip {
		background: linear-gradient(135deg, #1e3a8a, #4338ca);
		border-radius: 18rpx;
		padding: 20rpx 22rpx;
		margin-bottom: 14rpx;
	}

	.boss-title {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #fff;
	}

	.boss-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.85);
	}

	.tpl-scroll {
		white-space: nowrap;
		margin-bottom: 18rpx;
	}

	.tpl-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 14rpx 22rpx;
		margin-right: 12rpx;
		border-radius: 999rpx;
		background: #fff;
		border: 1rpx solid #dbeafe;
	}

	.tpl-chip.on {
		background: #dbeafe;
		border-color: #2563eb;
	}

	.tpl-name {
		font-size: 24rpx;
		font-weight: 700;
		color: #1e3a8a;
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
		display: flex;
		gap: 16rpx;
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

	.hint-card {
		padding: 24rpx;
		background: #fff;
		border-radius: 18rpx;
		border: none;
		box-shadow: 0 8rpx 26rpx rgba(15, 23, 42, 0.06);
		margin-bottom: 24rpx;
	}

	.hint-title {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #334155;
		margin-bottom: 10rpx;
	}

	.hint-t {
		display: block;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 20rpx;
	}

	.hint-btn {
		width: 100%;
		height: 76rpx;
		line-height: 76rpx;
		border-radius: 38rpx;
		font-size: 28rpx;
		font-weight: 700;
		background: #f8fafc !important;
		color: #2563eb !important;
		border: 2rpx solid #bfdbfe !important;
	}

	.hint-btn::after {
		border: none;
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
		max-width: 680rpx;
		background: #fff !important;
		border-radius: 20rpx;
		padding: 24rpx;
		box-sizing: border-box;
		box-shadow: 0 20rpx 60rpx rgba(15, 23, 42, 0.18);
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 16rpx;
	}

	.dialog-input {
		width: 100%;
		height: 84rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 14rpx;
		padding: 0 18rpx;
		margin-bottom: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		background: #f8fafc;
	}

	.dialog-actions {
		display: flex;
		justify-content: space-between;
		gap: 12rpx;
		margin-top: 14rpx;
	}

	.modal-btn {
		flex: 1;
		height: 76rpx;
		border-radius: 38rpx;
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
		background: #f1f5f9 !important;
	}

	.modal-btn-ghost .modal-btn-t {
		color: #475569;
	}

	.modal-btn-primary {
		background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
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
