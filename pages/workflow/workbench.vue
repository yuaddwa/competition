<template>
	<view class="page">
		<view class="hero">
			<text class="title">{{ screenTitle }}</text>
			<text class="sub">ID: {{ workflowId || "-" }}</text>
		</view>

		<view class="conn" :class="{ on: llmConn.configured }">
			<text class="conn-t">{{ llmConn.configured ? `已配置模型：${llmConn.model}` : "未配置模型（将使用本地规则）" }}</text>
			<text class="conn-e">{{ llmConn.apiEndpoint || "" }}</text>
		</view>

		<view class="seg">
			<view class="seg-item" :class="{ on: tab === 'assign' }" @click="tab = 'assign'"><text>任务分配</text></view>
			<view class="seg-item" :class="{ on: tab === 'progress' }" @click="tab = 'progress'"><text>实时进度</text></view>
			<view class="seg-item" :class="{ on: tab === 'collab' }" @click="tab = 'collab'"><text>协作交流</text></view>
			<view class="seg-item" :class="{ on: tab === 'schedule' }" @click="tab = 'schedule'"><text>项目排期</text></view>
		</view>

		<scroll-view v-if="tab === 'assign'" scroll-y class="panel">
			<view class="card">
				<text class="card-t">项目目标</text>
				<textarea v-model="goalText" class="ta" placeholder="输入目标，例如：两周内完成小程序 MVP，上线登录、首页、消息、项目协作与日报。" />
				<button class="btn primary" type="primary" :loading="assigning" @click="appendRequirementAndAutoRun">追加需求并自动续跑</button>
				<text class="card-hint">无需人工分配任务，系统会让 Agent 自动拆解、自动执行、自动同步协作记录。</text>
			</view>
			<view class="card">
				<text class="card-t">分配结果</text>
				<view v-if="!tasks.length" class="empty">暂无任务，先输入目标并分配。</view>
				<view v-for="task in tasks" :key="task.id || task.taskId" class="task-row">
					<view class="task-h">
						<text class="task-title">{{ task.title || task.name }}</text>
						<text class="badge">{{ statusLabel(task) }}</text>
					</view>
					<text class="task-meta">{{ (task.assignedAgentName || "未分配") + " · " + (task.department || "-") }}</text>
					<text class="task-desc">{{ task.description || task.aiExecutionReport || "无描述" }}</text>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else-if="tab === 'progress'" scroll-y class="panel">
			<view class="card">
				<text class="card-t">Agent 成果看板（自动刷新）</text>
				<view v-if="!agentProgressRows.length" class="empty">暂无可展示数据</view>
				<view v-for="row in agentProgressRows" :key="row.id" class="agent-row">
					<view class="agent-top">
						<text class="agent-name">{{ row.name }}</text>
						<text class="agent-pct">{{ row.percent }}%</text>
					</view>
					<text class="agent-sub">任务 {{ row.done }}/{{ row.total }} · 最近：{{ row.lastSummary }}</text>
					<view v-if="row.achievements.length" class="achv-list">
						<view v-for="a in row.achievements" :key="a.id" class="achv-item">
							<text class="achv-title">{{ a.title }}</text>
							<text class="achv-status">{{ a.status }}</text>
							<text class="achv-body">{{ a.body }}</text>
						</view>
					</view>
					<view v-else class="achv-empty">暂未产出可展示成果</view>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else-if="tab === 'collab'" scroll-y class="panel">
			<view class="card">
				<text class="card-t">项目群协作记录</text>
				<text class="card-hint">协作消息由 Agent 自动产生，无需人工发送。</text>
				<view v-if="!messages.length" class="empty">暂无消息</view>
				<view v-for="m in messages" :key="m.id || m.messageId" class="msg">
					<text class="msg-meta">{{ timeOf(m.createdAt) }}</text>
					<text class="msg-body">{{ m.body || m.content || m.text }}</text>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<scroll-view v-else scroll-y class="panel">
			<view class="card">
				<text class="card-t">项目排期</text>
				<view v-if="!scheduleRows.length" class="empty">暂无排期，先做任务分配。</view>
				<view v-for="s in scheduleRows" :key="s.id" class="sched-row">
					<text class="sched-title">{{ s.title }}</text>
					<text class="sched-line">{{ s.agent }} · {{ s.start }} ~ {{ s.end }}</text>
					<text class="sched-line">当前状态：{{ s.status }}</text>
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
			};
		},
		computed: {
			screenTitle() {
				if (this.meta && (this.meta.title || this.meta.name)) return this.meta.title || this.meta.name;
				return "项目执行";
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
						lastSummary: last ? String(last.aiExecutionReport || last.description || "").slice(0, 28) : "暂无",
						achievements: sorted
							.filter((t) => String(t.status || "").toUpperCase() === "DONE")
							.slice(0, 4)
							.map((t) => ({
								id: t.id || t.taskId,
								title: t.title || t.name || "未命名任务",
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
						title: t.title || t.name || "未命名任务",
						agent: t.assignedAgentName || "未分配",
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
			async bootstrap() {
				if (!this.workflowId) return;
				this.llmConn = getLlmConnectionSummary() || this.llmConn;
				this.meta = await wfs.getWorkflow(this.workflowId);
				this.agents = await wfs.listWorkflowAgents(this.workflowId);
				const g = await wfs.ensureProjectGroupForWorkflow(this.workflowId);
				this.groupId = g && (g.groupId || g.id) ? String(g.groupId || g.id) : "";
				await this.reloadData();
				if (!this.goalText) {
					const base = this.meta && (this.meta.goal || this.meta.description) ? (this.meta.goal || this.meta.description) : this.screenTitle;
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
			extractAchievement(task) {
				const text = String(
					task?.automationFullReport ||
					task?.aiExecutionReport ||
					task?.description ||
					"暂无成果说明"
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
				if (s === "DONE") return "已完成";
				if (s === "IN_PROGRESS") return "进行中";
				if (s === "BLOCKED") return "阻塞";
				return "未开始";
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
					uni.showToast({ title: "请先输入项目目标", icon: "none" });
					return;
				}
				if (!this.agents.length) {
					uni.showToast({ title: "该项目未配置 Agent", icon: "none" });
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
					if (!opts.silentToast) uni.showToast({ title: "模型分配完成", icon: "success" });
				} catch (e) {
					uni.showToast({ title: getApiErrorMessage(e) || "分配失败", icon: "none" });
				} finally {
					this.assigning = false;
				}
			},
			async appendRequirementAndAutoRun() {
				const goal = String(this.goalText || "").trim();
				if (!goal) {
					uni.showToast({ title: "请先输入项目目标", icon: "none" });
					return;
				}
				await this.assignByModel(goal);
			},
		},
	};
</script>

<style scoped>
	.page { min-height: 100vh; background: #f4f6fb; }
	.hero { padding: 26rpx 24rpx 10rpx; }
	.title { display:block; font-size: 40rpx; font-weight: 800; color: #0f172a; }
	.sub { display:block; margin-top: 8rpx; font-size: 22rpx; color: #94a3b8; word-break: break-all; }
	.conn { margin: 0 20rpx 12rpx; padding: 14rpx; border-radius: 14rpx; background: #fffbeb; border: 1rpx solid #fcd34d; }
	.conn.on { background: #eff6ff; border-color: #93c5fd; }
	.conn-t { display:block; font-size: 24rpx; font-weight: 700; color: #334155; }
	.conn-e { display:block; margin-top: 6rpx; font-size: 20rpx; color: #64748b; word-break: break-all; }
	.seg { display:flex; margin: 0 20rpx; background:#e9edf5; border-radius: 16rpx; padding: 6rpx; }
	.seg-item { flex:1; text-align:center; padding: 14rpx 0; border-radius: 12rpx; font-size: 24rpx; color:#475569; }
	.seg-item.on { background:#fff; color:#0f172a; font-weight:700; box-shadow: 0 4rpx 12rpx rgba(20,38,70,.08); }
	.panel { height: calc(100vh - 270rpx); padding: 16rpx 20rpx 0; box-sizing: border-box; }
	.card { background:#fff; border-radius: 16rpx; border:1rpx solid #e8ecf3; padding: 18rpx; margin-bottom: 14rpx; box-shadow: 0 4rpx 14rpx rgba(15,23,42,.05); }
	.card-t { display:block; font-size: 28rpx; font-weight: 700; color:#0f172a; margin-bottom: 10rpx; }
	.card-hint { display:block; margin-top: 10rpx; font-size: 22rpx; color:#64748b; line-height: 1.45; }
	.ta { width:100%; min-height: 140rpx; border:1rpx solid #dbe3ef; border-radius: 12rpx; padding: 12rpx; box-sizing:border-box; font-size: 26rpx; background:#fff; }
	.btn { margin-top: 12rpx; height: 76rpx; line-height: 76rpx; border-radius: 12rpx; font-size: 28rpx; }
	.btn.primary { background: linear-gradient(135deg, #5b8cff, #6478ff) !important; color:#fff; }
	.empty { padding: 24rpx 0; font-size: 24rpx; color:#94a3b8; text-align:center; }
	.task-row { padding: 12rpx 0; border-bottom: 1rpx solid #eef2f7; }
	.task-row:last-child { border-bottom: none; }
	.task-h { display:flex; align-items:flex-start; gap: 10rpx; }
	.task-title { flex:1; font-size: 26rpx; color:#0f172a; font-weight: 700; }
	.badge { font-size: 20rpx; color:#2563eb; background:#e8f0ff; border-radius: 999rpx; padding: 4rpx 10rpx; }
	.task-meta { display:block; margin-top: 6rpx; font-size: 22rpx; color:#64748b; }
	.task-desc { display:block; margin-top: 6rpx; font-size: 23rpx; color:#334155; line-height: 1.5; }
	.agent-row { margin-bottom: 14rpx; }
	.agent-top { display:flex; justify-content:space-between; align-items:center; margin-bottom: 6rpx; }
	.agent-name { font-size: 26rpx; font-weight:700; color:#0f172a; }
	.agent-pct { font-size: 22rpx; color:#2563eb; font-weight:700; }
	.agent-sub { display:block; margin-top: 6rpx; font-size: 22rpx; color:#64748b; }
	.achv-list { margin-top: 10rpx; display: flex; flex-direction: column; gap: 10rpx; }
	.achv-item { background: #f8fafc; border: 1rpx solid #e2e8f0; border-radius: 10rpx; padding: 10rpx; }
	.achv-title { display:block; font-size: 24rpx; color:#0f172a; font-weight:700; }
	.achv-status { display:block; margin-top: 4rpx; font-size: 20rpx; color:#2563eb; }
	.achv-body { display:block; margin-top: 6rpx; font-size: 22rpx; color:#334155; line-height: 1.45; }
	.achv-empty { margin-top: 10rpx; font-size: 22rpx; color:#94a3b8; }
	.msg { padding: 10rpx 0; border-bottom: 1rpx solid #eef2f7; }
	.msg:last-child { border-bottom: none; }
	.msg-meta { display:block; font-size: 20rpx; color:#94a3b8; margin-bottom: 6rpx; }
	.msg-body { display:block; font-size: 24rpx; color:#1e293b; line-height: 1.5; }
	.sched-row { padding: 10rpx 0; border-bottom:1rpx solid #eef2f7; }
	.sched-row:last-child { border-bottom:none; }
	.sched-title { display:block; font-size: 26rpx; color:#0f172a; font-weight:700; }
	.sched-line { display:block; margin-top: 4rpx; font-size: 22rpx; color:#64748b; }
	.pad { height: 80rpx; }
</style>
