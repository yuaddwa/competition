<template>
	<view class="wb-page">
		<view class="wb-top-card">
			<view class="wb-proj-row">
				<view class="wb-proj-ico"><text class="wb-proj-ico-t">☀️</text></view>
				<view class="wb-proj-main">
					<view class="wb-proj-title-row">
						<text class="wb-proj-title">{{ screenTitle }}</text>
						<view class="wb-badge-run">
							<text class="wb-badge-run-t">{{ t("workbench_running") }}</text>
						</view>
					</view>
					<view class="wb-id-row" @tap="copyWorkflowId">
						<text class="wb-id-text">{{ t("workbench_id_label") }}{{ workflowId || "—" }}</text>
						<text class="wb-id-copy">📋</text>
					</view>
				</view>
			</view>
			<view class="wb-model-box" :class="{ 'wb-model-ok': llmConn.configured }">
				<view class="wb-model-ico"><text class="wb-model-ico-t">⟨/⟩</text></view>
				<view class="wb-model-mid">
					<text class="wb-model-t">{{ llmConn.configured ? t("workbench_model_cfg") : t("workbench_model_uncfg") }}</text>
					<text v-if="llmConn.apiEndpoint" class="wb-model-e">{{ llmConn.apiEndpoint }}</text>
				</view>
				<view class="wb-model-btn" @tap="goModelSettings">
					<text class="wb-model-btn-ico">⚙️</text>
					<text class="wb-model-btn-t">{{ t("workbench_btn_model") }}</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-x class="wb-tabs" show-scrollbar="false">
			<view class="wb-tabs-inner">
				<view
					v-for="tabItem in tabDefs"
					:key="tabItem.id"
					class="wb-tab"
					:class="{ on: tab === tabItem.id }"
					@tap="tab = tabItem.id"
				>
					<text class="wb-tab-ico">{{ tabItem.icon }}</text>
					<text class="wb-tab-t">{{ t(tabItem.i18n) }}</text>
				</view>
			</view>
		</scroll-view>

		<scroll-view v-if="tab === 'assign'" scroll-y class="wb-panel">
			<view class="wb-card">
				<view class="wb-card-h">
					<text class="wb-card-h-ico">🎯</text>
					<text class="wb-card-h-t">{{ t("workbench_goal_title") }}</text>
				</view>
				<view class="wb-goal-box">
					<textarea
						v-model="goalText"
						class="wb-goal-ta"
						:placeholder="t('workbench_goal_ph')"
						placeholder-class="wb-goal-ph"
					/>
					<text class="wb-goal-art" aria-hidden="true">🎯</text>
				</view>
				<view
					class="wb-goal-btn"
					:class="{ disabled: assigning }"
					@tap="appendRequirementAndAutoRun"
				>
					<text class="wb-goal-btn-ico">🪄</text>
					<text class="wb-goal-btn-t">{{ assigning ? t("workbench_assigning") : t("workbench_goal_btn") }}</text>
				</view>
				<view class="wb-goal-hint-row">
					<text class="wb-hint-i">ⓘ</text>
					<text class="wb-goal-hint">{{ t("workbench_goal_hint") }}</text>
				</view>
			</view>

			<view class="wb-card">
				<view class="wb-card-h">
					<text class="wb-card-h-ico">📊</text>
					<text class="wb-card-h-t">{{ t("workbench_alloc_title") }}</text>
				</view>
				<view v-if="!tasks.length" class="wb-empty">{{ t("workbench_alloc_empty") }}</view>
				<view
					v-for="(task, ti) in tasks"
					:key="task.id || task.taskId"
					class="wb-task"
					@tap="onTaskTap(task)"
				>
					<view class="wb-task-num" :class="ti % 2 === 0 ? 'n0' : 'n1'">
						<text class="wb-task-num-t">{{ taskIndexStr(ti) }}</text>
					</view>
					<view class="wb-task-main">
						<text class="wb-task-title">{{ task.title || task.name }}</text>
						<view class="wb-task-meta-row">
							<text class="wb-task-meta">{{ taskAssignedLine(task) }}</text>
							<text class="wb-task-dot"> · </text>
							<text class="wb-task-dept" :class="deptClass(task)">{{ taskDept(task) }}</text>
						</view>
						<view class="wb-task-status-wrap">
							<view class="wb-task-done-badge" v-if="isDone(task)">
								<text class="wb-task-done-ico">✓</text>
								<text class="wb-task-done-t">{{ t("workbench_status_done") }}</text>
							</view>
							<view class="wb-task-st-badge" v-else>
								<text class="wb-task-st-t">{{ statusLabel(task) }}</text>
							</view>
						</view>
						<view class="wb-task-detail">
							<text class="wb-task-doc-ico">📄</text>
							<text class="wb-task-detail-t">{{ taskDescLine(task) }}</text>
						</view>
					</view>
					<text class="wb-task-chev">›</text>
				</view>
				<view class="wb-insight">
					<text class="wb-insight-ico">💡</text>
					<view class="wb-insight-txt">
						<text class="wb-insight-t">{{ t("workbench_insight_t") }}</text>
						<text class="wb-insight-d">{{ t("workbench_insight_d") }}</text>
					</view>
					<text class="wb-insight-art">📋</text>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else-if="tab === 'progress'" scroll-y class="wb-panel">
			<view class="wb-card">
				<view class="wb-card-h">
					<text class="wb-card-h-ico">📈</text>
					<text class="wb-card-h-t">{{ t("progress_card_title") }}</text>
				</view>
				<view v-if="!agentProgressRows.length" class="wb-empty">{{ t("progress_card_empty") }}</view>
				<view v-for="row in agentProgressRows" :key="row.id" class="agent-row">
					<view class="agent-top">
						<text class="agent-name">{{ row.name }}</text>
						<text class="agent-pct">{{ row.percent }}%</text>
					</view>
					<text class="agent-sub">{{ progressAgentSub(row) }}</text>
					<view v-if="row.achievements.length" class="achv-list">
						<view v-for="a in row.achievements" :key="a.id" class="achv-item">
							<text class="achv-title">{{ a.title }}</text>
							<text class="achv-status">{{ a.status }}</text>
							<text class="achv-body">{{ a.body }}</text>
						</view>
					</view>
					<view v-else class="achv-empty">{{ t("achv_none") }}</view>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else-if="tab === 'collab'" scroll-y class="wb-panel">
			<view class="wb-card">
				<view class="wb-card-h">
					<text class="wb-card-h-ico">💬</text>
					<text class="wb-card-h-t">{{ t("collab_card_title") }}</text>
				</view>
				<text class="wb-card-subhint">{{ t("collab_card_hint") }}</text>
				<view v-if="!messages.length" class="wb-empty">{{ t("collab_empty") }}</view>
				<view v-for="m in messages" :key="m.id || m.messageId" class="msg">
					<text class="msg-meta">{{ timeOf(m.createdAt) }}</text>
					<text class="msg-body">{{ m.body || m.content || m.text }}</text>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else scroll-y class="wb-panel">
			<view class="wb-card">
				<view class="wb-card-h">
					<text class="wb-card-h-ico">📅</text>
					<text class="wb-card-h-t">{{ t("schedule_card_title") }}</text>
				</view>
				<view v-if="!scheduleRows.length" class="wb-empty">{{ t("schedule_empty") }}</view>
				<view v-for="s in scheduleRows" :key="s.id" class="sched-row">
					<text class="sched-title">{{ s.title }}</text>
					<text class="sched-line">{{ s.agent }} · {{ s.start }} ~ {{ s.end }}</text>
					<text class="sched-line">{{ s.status }}</text>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>
	</view>
</template>

<script>
	import * as wfs from "@/utils/localWorkflowStore";
	import { getLlmConnectionSummary } from "@/utils/llmSettings";
	import { getApiErrorMessage } from "@/utils/apiHelpers";
	import { t, getLanguage } from "@/utils/lang";

	function ymdOffset(days) {
		const d = new Date();
		d.setDate(d.getDate() + days);
		const p = (n) => (n < 10 ? "0" : "") + n;
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
	}

	export default {
		data() {
			return {
				workflowId: "",
				meta: null,
				tab: "assign",
				llmConn: { configured: false, model: "", apiEndpoint: "" },
				agents: [],
				tasks: [],
				goalText: "",
				assigning: false,
				groupId: "",
				messages: [],
				refreshTimer: null,
				autoBootstrapped: false,
				currentLanguage: getLanguage(),
				tabDefs: [
					{ id: "assign", icon: "📋", i18n: "workbench_tab_assign" },
					{ id: "progress", icon: "📈", i18n: "workbench_tab_progress" },
					{ id: "collab", icon: "💬", i18n: "workbench_tab_collab" },
					{ id: "schedule", icon: "📅", i18n: "workbench_tab_schedule" },
				],
			};
		},
		computed: {
			screenTitle() {
				if (this.meta && (this.meta.title || this.meta.name)) return this.meta.title || this.meta.name;
				return this.t("workbench_title");
			},
			agentProgressRows() {
				const out = [];
				for (const a of this.agents) {
					const mine = this.tasks.filter((t) => String(t.assignedAgentId || "") === String(a.id));
					const total = mine.length;
					const done = mine.filter((t) => String(t.status || "").toUpperCase() === "DONE").length;
					const percent = total ? Math.round(mine.reduce((s, t) => s + Number(t.progressPercent || 0), 0) / total) : 0;
					const last = mine[0];
					const sorted = [...mine].sort((x, y) => Number(y.updatedAt || 0) - Number(x.updatedAt || 0));
					out.push({
						id: a.id,
						name: a.name,
						total,
						done,
						percent,
						lastSummary: last ? String(last.aiExecutionReport || last.description || "").slice(0, 28) : "—",
						achievements: sorted
							.filter((t) => String(t.status || "").toUpperCase() === "DONE")
							.slice(0, 4)
							.map((t) => ({
								id: t.id || t.taskId,
								title: t.title || t.name || "—",
								status: this.statusLabel(t),
								body: this.extractAchievement(t),
							})),
					});
				}
				return out;
			},
			scheduleRows() {
				return this.tasks.map((t, i) => {
					const st = t.scheduleStart || ymdOffset(i);
					const ed = t.scheduleEnd || ymdOffset(i + 1);
					return {
						id: t.id || t.taskId,
						title: t.title || t.name || "—",
						agent: t.assignedAgentName || this.t("workbench_unassigned"),
						start: st,
						end: ed,
						status: this.statusLabel(t),
					};
				});
			},
		},
		onLoad(options) {
			const raw = options && options.id ? decodeURIComponent(options.id) : "";
			this.workflowId = String(raw || "").trim();
		},
		async onShow() {
			this.currentLanguage = getLanguage();
			await this.bootstrap();
			this.startRefresh();
		},
		onHide() {
			this.stopRefresh();
		},
		onUnload() {
			this.stopRefresh();
		},
		methods: {
			t(key, params) {
				return t(key, this.currentLanguage, params || {});
			},
			progressAgentSub(row) {
				return this.t("workbench_agent_progress_sub", {
					done: row.done,
					total: row.total,
					last: row.lastSummary || "—",
				});
			},
			async bootstrap() {
				if (!this.workflowId) return;
				this.llmConn = getLlmConnectionSummary() || this.llmConn;
				this.meta = await wfs.getWorkflow(this.workflowId);
				this.agents = await wfs.listWorkflowAgents(this.workflowId);
				const g = await wfs.ensureProjectGroupForWorkflow(this.workflowId);
				this.groupId = g && (g.groupId || g.id) ? String(g.groupId || g.id) : "";
				await this.reloadData();
				if (!this.goalText) {
					const base =
						this.meta && (this.meta.goal || this.meta.description)
							? this.meta.goal || this.meta.description
							: this.screenTitle;
					this.goalText = `目标：${base}。请结合各 Agent 岗位进行真实分工，明确交付物与协作节点。`;
				}
				await this.autoKickoffIfNeeded();
			},
			async reloadData() {
				this.tasks = await wfs.listTasks(this.workflowId);
				if (this.groupId) this.messages = await wfs.listProjectGroupMessages(this.workflowId, this.groupId);
			},
			startRefresh() {
				this.stopRefresh();
				this.refreshTimer = setInterval(() => this.reloadData(), 1800);
			},
			stopRefresh() {
				if (this.refreshTimer) clearInterval(this.refreshTimer);
				this.refreshTimer = null;
			},
			copyWorkflowId() {
				const id = String(this.workflowId || "").trim();
				if (!id) return;
				uni.setClipboardData({
					data: id,
					success: () => uni.showToast({ title: this.t("workbench_id_copied"), icon: "none" }),
				});
			},
			goModelSettings() {
				uni.navigateTo({ url: "/pages/profile/model-settings" });
			},
			taskIndexStr(i) {
				const n = i + 1;
				return (n < 10 ? "0" : "") + n;
			},
			taskDept(task) {
				return String(task.department || task.fromDepartment || task.toDepartment || "product").trim() || "product";
			},
			deptClass(task) {
				const d = this.taskDept(task).toLowerCase();
				if (d.includes("engineer") || d.includes("工程") || d === "engineering") return "dept-eng";
				if (d.includes("product") || d.includes("产品")) return "dept-prod";
				return "dept-other";
			},
			taskAssignedLine(task) {
				const name = String(task.assignedAgentName || "").trim();
				return name || this.t("workbench_unassigned");
			},
			taskDescLine(task) {
				const raw = String(
					task?.description || task?.aiExecutionReport || task?.automationFullReport || ""
				).trim();
				if (raw) return raw.length > 120 ? raw.slice(0, 118) + "…" : raw;
				return this.t("task_no_detail");
			},
			isDone(task) {
				return String(task.status || "").toUpperCase() === "DONE";
			},
			onTaskTap() {
				/* 预留：任务详情 */
			},
			extractAchievement(task) {
				const text = String(
					task?.automationFullReport || task?.aiExecutionReport || task?.description || this.t("achv_none")
				);
				const hit = text.match(/###\s*执行与交付[\s\S]*?(?=###|$)/);
				const core = (hit ? hit[0] : text).replace(/[#*`>-]/g, " ").replace(/\s+/g, " ").trim();
				return core.slice(0, 180);
			},
			async autoKickoffIfNeeded() {
				if (this.autoBootstrapped) return;
				if (this.tasks.length > 0) return;
				const goal = String(this.goalText || this.meta?.goal || this.meta?.description || "").trim();
				if (!goal || !this.agents.length) return;
				this.autoBootstrapped = true;
				await this.assignByModel(goal, { silentToast: true });
			},
			statusLabel(task) {
				const s = String(task.status || "").toUpperCase();
				if (s === "DONE") return this.t("workbench_status_done");
				if (s === "IN_PROGRESS") return this.t("workbench_status_progress");
				if (s === "BLOCKED") return this.t("workbench_status_blocked");
				return this.t("workbench_status_todo");
			},
			timeOf(ts) {
				if (!ts) return "";
				const d = new Date(ts);
				if (Number.isNaN(d.getTime())) return String(ts);
				const p = (n) => (n < 10 ? "0" : "") + n;
				return `${p(d.getHours())}:${p(d.getMinutes())}`;
			},
			async assignByModel(goalInput, opts = {}) {
				const goal = String(goalInput != null ? goalInput : this.goalText || "").trim();
				if (!goal) {
					uni.showToast({ title: this.t("workbench_enter_goal_first"), icon: "none" });
					return;
				}
				if (!this.agents.length) {
					uni.showToast({ title: this.t("workbench_no_agents"), icon: "none" });
					return;
				}
				this.assigning = true;
				try {
					await wfs.updateWorkflow(this.workflowId, { goal });
					for (let i = 0; i < this.agents.length; i++) {
						const a = this.agents[i];
						const body = `项目目标：${goal}\n负责人：${a.name}（${a.role || "成员"}）\n请输出该 Agent 在本项目中的可执行任务与交付结果。`;
						const res = await wfs.postCommand(this.workflowId, {
							fromDepartment: a.department || "product",
							toDepartment: a.department || "engineering",
							hierarchyLevel: 2,
							commandText: body,
							createTaskTitle: `${a.name} · ${this.screenTitle}执行任务`,
						});
						const taskId = res && res.task && (res.task.id || res.task.taskId);
						if (taskId) {
							await wfs.annotateTask(this.workflowId, taskId, {
								assignedAgentId: a.id,
								assignedAgentName: a.name,
								scheduleStart: ymdOffset(i),
								scheduleEnd: ymdOffset(i + 1),
							});
							if (this.groupId) {
								await wfs.sendProjectGroupMessage(this.workflowId, this.groupId, {
									body: `${a.name} 已接单：${this.screenTitle}，任务已分配并进入执行。`,
								});
							}
						}
					}
					await this.reloadData();
					if (!opts.silentToast) uni.showToast({ title: this.t("workbench_assign_ok"), icon: "success" });
				} catch (e) {
					uni.showToast({ title: getApiErrorMessage(e) || this.t("err_request_failed"), icon: "none" });
				} finally {
					this.assigning = false;
				}
			},
			async appendRequirementAndAutoRun() {
				const goal = String(this.goalText || "").trim();
				if (!goal) {
					uni.showToast({ title: this.t("workbench_enter_goal_first"), icon: "none" });
					return;
				}
				await this.assignByModel(goal);
			},
		},
	};
</script>

<style scoped>
	.wb-page {
		min-height: 100vh;
		background: #f7f8fa;
		box-sizing: border-box;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.wb-top-card {
		margin: 20rpx 24rpx 0;
		padding: 28rpx 24rpx 22rpx;
		background: #fff;
		border-radius: 28rpx;
		border: 1rpx solid #eef0f3;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.wb-proj-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 18rpx;
	}

	.wb-proj-ico {
		width: 88rpx;
		height: 88rpx;
		border-radius: 22rpx;
		background: linear-gradient(145deg, #3b82f6, #60a5fa);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.25);
	}

	.wb-proj-ico-t {
		font-size: 44rpx;
	}

	.wb-proj-main {
		flex: 1;
		min-width: 0;
	}

	.wb-proj-title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.wb-proj-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.wb-badge-run {
		background: #ecfdf5;
		border-radius: 999rpx;
		padding: 4rpx 14rpx;
	}

	.wb-badge-run-t {
		font-size: 22rpx;
		font-weight: 700;
		color: #059669;
	}

	.wb-id-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 12rpx;
		gap: 10rpx;
	}

	.wb-id-text {
		flex: 1;
		font-size: 22rpx;
		color: #94a3b8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wb-id-copy {
		font-size: 28rpx;
		flex-shrink: 0;
	}

	.wb-model-box {
		margin-top: 22rpx;
		padding: 18rpx 16rpx;
		border-radius: 20rpx;
		background: #fffbeb;
		border: 1rpx solid #fde68a;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 14rpx;
	}

	.wb-model-ico {
		width: 56rpx;
		height: 56rpx;
		border-radius: 14rpx;
		background: #ffedd5;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.wb-model-ico-t {
		font-size: 26rpx;
		font-weight: 800;
		color: #d97706;
	}

	.wb-model-mid {
		flex: 1;
		min-width: 0;
	}

	.wb-model-t {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #92400e;
		line-height: 1.35;
	}

	.wb-model-e {
		display: block;
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #a8a29e;
		word-break: break-all;
	}

	.wb-model-btn {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		padding: 12rpx 16rpx;
		border-radius: 999rpx;
		border: 2rpx solid #f59e0b;
		background: #fff;
	}

	.wb-model-btn-ico {
		font-size: 24rpx;
	}

	.wb-model-box.wb-model-ok {
		background: #eff6ff;
		border-color: #bfdbfe;
	}

	.wb-model-box.wb-model-ok .wb-model-t {
		color: #1e40af;
	}

	.wb-model-box.wb-model-ok .wb-model-ico {
		background: #dbeafe;
	}

	.wb-model-box.wb-model-ok .wb-model-ico-t {
		color: #2563eb;
	}

	.wb-tabs {
		width: 100%;
		white-space: nowrap;
		margin-top: 20rpx;
		padding: 0 12rpx;
		box-sizing: border-box;
	}

	.wb-tabs-inner {
		display: inline-flex;
		flex-direction: row;
		padding: 0 12rpx 0 12rpx;
		gap: 8rpx;
	}

	.wb-tab {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding: 12rpx 20rpx 16rpx;
		min-width: 140rpx;
		box-sizing: border-box;
		border-bottom: 4rpx solid transparent;
	}

	.wb-tab.on {
		border-bottom-color: #3b82f6;
	}

	.wb-tab-ico {
		font-size: 30rpx;
		margin-bottom: 6rpx;
	}

	.wb-tab-t {
		font-size: 24rpx;
		color: #64748b;
		font-weight: 600;
	}

	.wb-tab.on .wb-tab-t {
		color: #3b82f6;
		font-weight: 800;
	}

	.wb-panel {
		height: calc(100vh - 420rpx);
		padding: 16rpx 24rpx 0;
		box-sizing: border-box;
	}

	.wb-card {
		background: #fff;
		border-radius: 24rpx;
		border: 1rpx solid #eef0f3;
		padding: 22rpx 22rpx 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 22rpx rgba(15, 23, 42, 0.05);
	}

	.wb-card-h {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 16rpx;
	}

	.wb-card-h-ico {
		font-size: 32rpx;
	}

	.wb-card-h-t {
		font-size: 30rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.wb-card-subhint {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		line-height: 1.45;
		margin: -8rpx 0 14rpx;
	}

	.wb-goal-box {
		position: relative;
		background: linear-gradient(180deg, #eff6ff 0%, #f0f9ff 100%);
		border-radius: 20rpx;
		border: 1rpx solid #bfdbfe;
		padding: 16rpx;
		min-height: 200rpx;
	}

	.wb-goal-ta {
		width: 100%;
		min-height: 180rpx;
		font-size: 26rpx;
		color: #1e293b;
		line-height: 1.5;
		box-sizing: border-box;
		background: transparent;
	}

	.wb-goal-ph {
		color: #94a3b8;
	}

	.wb-goal-art {
		position: absolute;
		right: 12rpx;
		bottom: 8rpx;
		font-size: 48rpx;
		opacity: 0.35;
		pointer-events: none;
	}

	.wb-goal-btn {
		margin-top: 18rpx;
		height: 88rpx;
		border-radius: 44rpx;
		background: linear-gradient(135deg, #3b82f6, #6366f1);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		box-shadow: 0 10rpx 26rpx rgba(59, 130, 246, 0.28);
	}

	.wb-goal-btn.disabled {
		opacity: 0.55;
		pointer-events: none;
	}

	.wb-goal-btn-ico {
		font-size: 30rpx;
	}

	.wb-goal-btn-t {
		font-size: 28rpx;
		font-weight: 800;
		color: #fff;
	}

	.wb-goal-hint-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 8rpx;
		margin-top: 14rpx;
	}

	.wb-hint-i {
		font-size: 24rpx;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.wb-goal-hint {
		flex: 1;
		font-size: 22rpx;
		color: #94a3b8;
		line-height: 1.45;
	}

	.wb-empty {
		padding: 28rpx 0;
		font-size: 24rpx;
		color: #94a3b8;
		text-align: center;
	}

	.wb-task {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
		gap: 14rpx;
	}

	.wb-task:last-of-type {
		border-bottom: none;
	}

	.wb-task-num {
		width: 56rpx;
		height: 56rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		align-self: flex-start;
	}

	.wb-task-num.n0 {
		background: linear-gradient(145deg, #3b82f6, #60a5fa);
	}
	.wb-task-num.n1 {
		background: linear-gradient(145deg, #a855f7, #c084fc);
	}

	.wb-task-num-t {
		font-size: 22rpx;
		font-weight: 900;
		color: #fff;
	}

	.wb-task-main {
		flex: 1;
		min-width: 0;
	}

	.wb-task-title {
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		line-height: 1.35;
	}

	.wb-task-meta-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 8rpx;
	}

	.wb-task-meta {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.wb-task-dot {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.wb-task-dept {
		font-size: 22rpx;
		font-weight: 700;
	}

	.wb-task-dept.dept-prod {
		color: #2563eb;
	}
	.wb-task-dept.dept-eng {
		color: #7c3aed;
	}
	.wb-task-dept.dept-other {
		color: #0891b2;
	}

	.wb-task-status-wrap {
		margin-top: 10rpx;
	}

	.wb-task-done-badge {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		background: #ecfdf5;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
	}

	.wb-task-done-ico {
		font-size: 22rpx;
		color: #059669;
		font-weight: 900;
	}

	.wb-task-done-t {
		font-size: 22rpx;
		font-weight: 700;
		color: #059669;
	}

	.wb-task-st-badge {
		display: inline-flex;
		background: #f1f5f9;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
	}

	.wb-task-st-t {
		font-size: 22rpx;
		color: #475569;
		font-weight: 600;
	}

	.wb-task-detail {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 8rpx;
		margin-top: 10rpx;
	}

	.wb-task-doc-ico {
		font-size: 24rpx;
		flex-shrink: 0;
	}

	.wb-task-detail-t {
		flex: 1;
		font-size: 22rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.wb-task-chev {
		flex-shrink: 0;
		font-size: 36rpx;
		color: #cbd5e1;
		align-self: center;
		font-weight: 300;
	}

	.wb-insight {
		margin-top: 16rpx;
		padding: 20rpx 18rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #eff6ff, #e0e7ff);
		border: 1rpx solid #c7d2fe;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 14rpx;
	}

	.wb-insight-ico {
		font-size: 36rpx;
		flex-shrink: 0;
	}

	.wb-insight-txt {
		flex: 1;
		min-width: 0;
	}

	.wb-insight-t {
		display: block;
		font-size: 26rpx;
		font-weight: 800;
		color: #1e3a8a;
	}

	.wb-insight-d {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #4338ca;
		line-height: 1.4;
	}

	.wb-insight-art {
		font-size: 40rpx;
		flex-shrink: 0;
		opacity: 0.85;
	}

	.agent-row {
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.agent-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.agent-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6rpx;
	}

	.agent-name {
		font-size: 26rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.agent-pct {
		font-size: 22rpx;
		color: #2563eb;
		font-weight: 700;
	}

	.agent-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #64748b;
	}

	.achv-list {
		margin-top: 10rpx;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.achv-item {
		background: #f8fafc;
		border: 1rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 12rpx;
	}

	.achv-title {
		display: block;
		font-size: 24rpx;
		color: #0f172a;
		font-weight: 700;
	}

	.achv-status {
		display: block;
		margin-top: 4rpx;
		font-size: 20rpx;
		color: #2563eb;
	}

	.achv-body {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #334155;
		line-height: 1.45;
	}

	.achv-empty {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #94a3b8;
	}

	.msg {
		padding: 10rpx 0;
		border-bottom: 1rpx solid #eef2f7;
	}

	.msg:last-child {
		border-bottom: none;
	}

	.msg-meta {
		display: block;
		font-size: 20rpx;
		color: #94a3b8;
		margin-bottom: 6rpx;
	}

	.msg-body {
		display: block;
		font-size: 24rpx;
		color: #1e293b;
		line-height: 1.5;
	}

	.sched-row {
		padding: 12rpx 0;
		border-bottom: 1rpx solid #eef2f7;
	}

	.sched-row:last-child {
		border-bottom: none;
	}

	.sched-title {
		display: block;
		font-size: 26rpx;
		color: #0f172a;
		font-weight: 700;
	}

	.sched-line {
		display: block;
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #64748b;
	}

	.pad {
		height: 80rpx;
	}
</style>
