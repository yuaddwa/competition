<template>
	<view class="wb">
		<view class="hero">
			<text class="hero-title">{{ screenTitle }}</text>
			<text class="hero-sub">{{ t('workbench_id_label') }}{{ workflowId || "-" }}</text>
		</view>
		<view v-if="workflowLlmBusyLine" class="llm-strip wf-busy">
			<text class="llm-strip-t">{{ workflowLlmBusyLine }}</text>
		</view>
		<view class="llm-strip" :class="llmConn.configured ? 'llm-on' : 'llm-off'">
			<text class="llm-strip-t">{{ llmStripTitle }}</text>
			<text class="llm-strip-e" user-select="text">{{ llmConn.apiEndpoint || "" }}</text>
		</view>
		<scroll-view scroll-x class="project-strip" show-scrollbar="false">
			<view
				v-for="w in workflowNavList"
				:key="workflowKey(w)"
				class="project-chip"
				:class="{ active: workflowKey(w) === workflowId }"
				@click="openWorkflowFromNav(w)"
			>
				<text class="project-chip-t">{{ workflowTitle(w) }}</text>
			</view>
		</scroll-view>

		<view class="seg">
			<view v-for="tab in mainTabs" :key="tab.key" class="seg-item" :class="{ on: mainTab === tab.key }" @click="mainTab = tab.key">
				<text class="seg-text">{{ tab.label }}</text>
			</view>
		</view>

		<!-- 任务 -->
		<scroll-view v-show="mainTab === 'tasks'" scroll-y class="panel">
			<view class="toolbar">
				<view class="subseg">
					<text class="subseg-item" :class="{ on: taskView === 'dept' }" @click="taskView = 'dept'">{{ t('by_department') }}</text>
					<text class="subseg-item" :class="{ on: taskView === 'board' }" @click="taskView = 'board'">{{ t('kanban') }}</text>
					<text class="subseg-item" :class="{ on: taskView === 'list' }" @click="taskView = 'list'">{{ t('list') }}</text>
				</view>
				<button class="mini primary" type="primary" size="mini" @click="openCommand">{{ t('issue_command') }}</button>
			</view>

			<view v-if="tasks.length === 0" class="task-empty">
				<text class="task-empty-t">暂无任务</text>
				<text class="task-empty-hint">点右上角「下发指令」并填写内容后提交；提交后会先出现「处理中」任务，再补全详情与自动执行流程。</text>
			</view>

			<view v-else-if="taskView === 'dept'">
				<view v-for="dept in deptKeys" :key="dept" class="blk">
					<text class="blk-title">{{ dept }}</text>
					<view v-for="task in groupedByDept[dept]" :key="taskKey(task)" class="card" @click="openProgress(task)">
						<view class="card-h">
							<text class="card-t">{{ taskTitle(task) }}</text>
							<text class="badge" :class="statusClass(task)">{{ statusLabel(task) }}</text>
						</view>
						<text v-if="taskAutomationLine(task)" class="auto-line">{{ taskAutomationLine(task) }}</text>
						<text v-if="taskLlmLine(task)" class="llm-line">{{ taskLlmLine(task) }}</text>
						<text v-if="taskAiPreview(task)" class="ai-preview" user-select="text">{{ taskAiPreview(task) }}</text>
						<view class="progress-row">
							<progress :percent="taskPercent(task)" stroke-width="6" active border-radius="6" />
							<text class="pct">{{ taskPercent(task) }}%</text>
						</view>
						<text v-if="taskHint(task)" class="hint">{{ taskHint(task) }}</text>
					</view>
				</view>
			</view>

			<view v-else-if="taskView === 'board'" class="board">
				<view v-for="col in boardColumns" :key="col.key" class="board-col">
					<text class="board-h">{{ col.label }}</text>
					<view v-for="task in tasksInStatus(col.key)" :key="taskKey(task)" class="card sm" @click="openProgress(task)">
						<text class="card-t">{{ taskTitle(task) }}</text>
						<text class="mini-muted">{{ taskDept(task) }}</text>
						<text v-if="taskAutomationLine(task)" class="auto-line sm">{{ taskAutomationLine(task) }}</text>
						<text v-if="taskLlmLine(task)" class="llm-line sm">{{ taskLlmLine(task) }}</text>
						<text v-if="taskAiPreview(task)" class="ai-preview sm">{{ taskAiPreview(task) }}</text>
						<view class="progress-row">
							<progress :percent="taskPercent(task)" stroke-width="4" />
							<text class="pct sm">{{ taskPercent(task) }}%</text>
						</view>
					</view>
				</view>
			</view>

			<view v-else>
				<view v-for="task in tasks" :key="taskKey(task)" class="card" @click="openProgress(task)">
					<view class="card-h">
						<text class="card-t">{{ taskTitle(task) }}</text>
						<text class="badge" :class="statusClass(task)">{{ statusLabel(task) }}</text>
					</view>
					<text class="mini-muted">{{ taskDept(task) }} · L{{ taskLevel(task) }}</text>
					<text v-if="taskAutomationLine(task)" class="auto-line">{{ taskAutomationLine(task) }}</text>
					<text v-if="taskLlmLine(task)" class="llm-line">{{ taskLlmLine(task) }}</text>
					<text v-if="taskAiPreview(task)" class="ai-preview" user-select="text">{{ taskAiPreview(task) }}</text>
					<view class="progress-row">
						<progress :percent="taskPercent(task)" stroke-width="6" active />
						<text class="pct">{{ taskPercent(task) }}%</text>
					</view>
				</view>
			</view>

			<view class="tail-gap" />
		</scroll-view>

		<!-- 沟通 -->
		<scroll-view v-show="mainTab === 'comms'" scroll-y class="panel comm-panel">
			<view class="toolbar">
				<view class="subseg">
					<text class="subseg-item" :class="{ on: threadKind === 'INTERNAL' }" @click="threadKind = 'INTERNAL'">{{ t('internal') }}</text>
					<text class="subseg-item" :class="{ on: threadKind === 'CUSTOMER' }" @click="threadKind = 'CUSTOMER'">{{ t('customer') }}</text>
					<text class="subseg-item" :class="{ on: threadKind === 'PROJECT_GROUP' }" @click="threadKind = 'PROJECT_GROUP'">项目群</text>
				</view>
				<button class="mini" size="mini" @click="openCreateThread">{{ t('create') }}{{ t('thread_default') }}</button>
				<button class="mini" size="mini" @click="ensureBootstrap">{{ t('initialize_thread') }}</button>
				<button class="mini primary" type="primary" size="mini" @click="showBroadcast = true">{{ t('broadcast') }}</button>
			</view>

			<scroll-view scroll-x class="thread-strip" show-scrollbar="false">
				<view
					v-for="th in filteredThreads"
					:key="threadKey(th)"
					class="thread-chip"
					:class="{ active: selectedThreadId === threadKey(th) }"
					@click="selectThread(th)"
				>
					<text class="thread-chip-t">{{ threadTitle(th) }}</text>
				</view>
			</scroll-view>
			<view v-if="threadKind === 'PROJECT_GROUP' && selectedThreadId" class="pg-members">
				<text class="pg-members-title">群成员</text>
				<view v-if="!projectGroupMembers.length" class="pg-members-empty">暂无成员信息</view>
				<scroll-view v-else scroll-x class="pg-members-strip" show-scrollbar="false">
					<view
						v-for="m in projectGroupMembers"
						:key="`${m.type || 'X'}-${m.id || m.label}`"
						class="pg-member-chip"
					>
						<text class="pg-member-chip-t">{{ projectGroupMemberLabel(m) }}</text>
					</view>
				</scroll-view>
			</view>

			<view v-if="!selectedThreadId" class="empty-inline">{{ t('select_thread_or_initialize') }}</view>

			<view v-else>
				<view v-for="(m, mi) in messages" :key="mi" class="msg">
					<view class="msg-meta">
						<text class="msg-time">{{ messageTime(m) }}</text>
						<text v-if="msgRoute(m)" class="msg-route">{{ msgRoute(m) }}</text>
					</view>
					<text class="msg-body">{{ messageBody(m) }}</text>
					<view v-if="msgTasks(m)" class="msg-links">
						<text class="linkish" @click="highlightTask(msgFromTask(m))">{{ t('from_task') }} {{ shortId(msgFromTask(m)) }}</text>
						<text v-if="msgToTask(m)" class="linkish" @click="highlightTask(msgToTask(m))">{{ t('to_task') }} {{ shortId(msgToTask(m)) }}</text>
					</view>
					<view class="msg-actions">
						<text v-if="threadKind !== 'PROJECT_GROUP'" class="link" @click="openLinkTask(m)">{{ t('link_task') }}</text>
					</view>
				</view>
			</view>

			<view v-if="mainTab === 'comms' && selectedThreadId" class="composer">
				<picker mode="selector" :range="deptLabels" @change="onPickFromDept">
					<view class="picker-line">{{ t('wb_from_dept') }}{{ deptLabels[msgFromDeptIndex] || t('wb_optional_paren') }}</view>
				</picker>
				<picker mode="selector" :range="deptLabels" @change="onPickToDept">
					<view class="picker-line">{{ t('wb_to_dept') }}{{ deptLabels[msgToDeptIndex] || t('wb_optional_paren') }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onPickFromTask">
					<view class="picker-line">{{ t('wb_link_from_task') }}{{ taskPickLabels[msgFromTaskIndex] }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onPickToTask">
					<view class="picker-line">{{ t('wb_link_to_task') }}{{ taskPickLabels[msgToTaskIndex] }}</view>
				</picker>
				<textarea class="ta" v-model="draftMsg" :placeholder="t('wb_msg_placeholder')" />
				<button class="send" type="primary" :loading="sendingMsg" @click="submitMessage">{{ t('send') }}</button>
			</view>

			<view class="tail-gap" />
		</scroll-view>

		<!-- 图谱 -->
		<scroll-view v-show="mainTab === 'graph'" scroll-y class="panel">
			<button class="refresh" size="mini" @click="loadGraph">{{ t('refresh_graph') }}</button>
			<view v-if="graphNodes.length === 0" class="empty-inline">{{ t('no_node_data') }}</view>
			<view class="node-grid">
				<view v-for="(n, ni) in graphNodes" :key="ni" class="g-node" @click="tapGraphNode(n)">
					<text class="g-node-t">{{ graphNodeTitle(n) }}</text>
					<text class="g-node-sub">{{ graphNodeDept(n) }} · {{ graphNodeStatus(n) }}</text>
					<progress :percent="graphNodePct(n)" stroke-width="4" />
				</view>
			</view>
			<view class="blk">
				<text class="blk-title">{{ t('relationship_edges') }}</text>
				<view v-if="!graphEdges.length" class="empty-inline">暂无关系边数据</view>
				<view v-for="(e, idx) in graphEdges" :key="idx" class="edge-card">
					<view class="edge-top">
						<text class="edge-tag">{{ edgeTypeLabel(e) }}</text>
						<text class="edge-time">{{ eventTime(e) || "刚刚" }}</text>
					</view>
					<text class="edge-main">{{ edgeRouteLabel(e) }}</text>
				</view>
			</view>
			<view class="tail-gap" />
		</scroll-view>

		<!-- 动态 -->
		<scroll-view v-show="mainTab === 'feed'" scroll-y class="panel">
			<button class="refresh" size="mini" @click="loadEvents">{{ t('refresh_feed') }}</button>
			<view v-if="events.length === 0" class="empty-inline">{{ t('no_events') }}</view>
			<view v-for="(ev, idx) in events" :key="idx" class="ev">
				<view class="ev-top">
					<text class="ev-badge">{{ eventTypeLabel(ev) }}</text>
					<text class="ev-time">{{ eventTime(ev) }}</text>
				</view>
				<text class="ev-t">{{ eventText(ev) }}</text>
				<text v-if="eventDetailText(ev)" class="ev-sub">{{ eventDetailText(ev) }}</text>
			</view>
			<view class="tail-gap" />
		</scroll-view>

		<!-- 下发指令 -->
		<view v-if="showCommand" class="mask mask-center" @click.self="showCommand = false">
			<view class="dialog lg cmd-dialog" @click.stop>
				<text class="dialog-title">{{ t('issue_command') }}</text>
				<picker mode="selector" :range="deptLabels" @change="onCmdSource">
					<view class="cmd-picker-line">{{ t('source_department') }}：{{ deptLabels[cmdSourceIdx] }}</view>
				</picker>
				<picker mode="selector" :range="deptLabels" @change="onCmdTarget">
					<view class="cmd-picker-line">{{ t('target_department') }}：{{ deptLabels[cmdTargetIdx] }}</view>
				</picker>
				<picker mode="selector" :range="levelLabels" @change="onCmdLevel">
					<view class="cmd-picker-line">{{ t('hierarchy_level') }}：{{ levelLabels[cmdLevelIdx] }}</view>
				</picker>
				<scroll-view v-if="cmdQuickFills.length" scroll-x class="cmd-tpl-bar" show-scrollbar="false">
					<view
						v-for="(c, cidx) in cmdQuickFills"
						:key="cidx"
						class="cmd-tpl"
						@click="applyCmdQuick(c)"
					>
						<text class="cmd-tpl-t">{{ c.t }}</text>
					</view>
				</scroll-view>
				<textarea class="cmd-ta" v-model="cmdBody" :placeholder="t('command_body_required')" />
				<input class="cmd-inp" v-model="cmdTaskTitle" :placeholder="t('generate_task_title_optional')" />
				<picker mode="selector" :range="taskPickLabels" @change="onCmdParent">
					<view class="cmd-picker-line">{{ t('parent_task') }}：{{ taskPickLabels[cmdParentIdx] }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onCmdDepend">
					<view class="cmd-picker-line">{{ t('dependent_task') }}：{{ taskPickLabels[cmdDependIdx] }}</view>
				</picker>
				<view class="dialog-actions cmd-actions">
					<button class="btn ghost cmd-btn" @click="showCommand = false">{{ t('cancel') }}</button>
					<button class="btn primary cmd-btn" type="primary" :loading="cmdLoading" @click="submitCommand">{{ t('submit') }}</button>
				</view>
			</view>
		</view>

		<!-- 更新进度 / 自动任务只读详情 -->
		<view v-if="progressTask" class="mask" @click.self="closeProgressDialog">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ progressReadOnly ? t('task_progress_readonly_title') : t('update_progress') }}</text>
				<text class="dlg-sub">{{ taskTitle(progressTask) }}</text>
				<text v-if="progressReadOnly" class="ro-hint">{{ t('task_progress_readonly_hint') }}</text>
				<text v-if="progressReadOnly" class="ro-meta">{{ statusLabel(progressTask) }} · {{ taskPercent(progressTask) }}%</text>
				<scroll-view v-if="taskLlmHistoryLines(progressTask).length" scroll-y class="llm-trace">
					<text class="llm-trace-title">{{ t('wb_llm_trace_title') }}</text>
					<text
						v-for="(line, li) in taskLlmHistoryLines(progressTask)"
						:key="'h' + li"
						class="llm-trace-line"
						user-select="text"
					>{{ line }}</text>
				</scroll-view>
				<text v-if="progressTask.llmRequesting && progressTask.llmRequestPhaseLabel" class="llm-live">
					{{ t('wb_llm_requesting') }}{{ progressTask.llmRequestPhaseLabel }}
				</text>
				<scroll-view
					v-if="progressTask.automationLog && progressTask.automationLog.length"
					scroll-y
					class="auto-log"
				>
					<text class="auto-log-t" user-select="text">
						{{ (progressTask.automationLog || []).join('\n') }}
					</text>
				</scroll-view>
				<scroll-view v-if="taskFullAiReport(progressTask)" scroll-y class="ai-report">
					<text class="ai-report-t" user-select="text">{{ taskFullAiReport(progressTask) }}</text>
				</scroll-view>
				<template v-if="!progressReadOnly">
					<slider :value="progressValue" min="0" max="100" show-value @changing="onSlider" @change="onSlider" />
					<input class="inp" v-model="progressNote" :placeholder="t('remark_optional')" />
					<view class="dialog-actions">
						<button class="btn ghost" @click="closeProgressDialog">{{ t('cancel') }}</button>
						<button class="btn primary" type="primary" :loading="progressLoading" @click="submitProgress">{{ t('save') }}</button>
					</view>
				</template>
				<view v-else class="dialog-actions">
					<button class="btn primary" type="primary" @click="closeProgressDialog">{{ t('confirm') }}</button>
				</view>
			</view>
		</view>

		<!-- 播报 -->
		<view v-if="showBroadcast" class="mask" @click.self="showBroadcast = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('command_broadcast') }}</text>
				<input class="inp" v-model="bcTitle" :placeholder="t('title_optional')" />
				<picker mode="selector" :range="threadPickerLabels" @change="onBcThreadPick">
					<view class="picker-line">{{ t('thread_default') }}：{{ threadPickerLabels[bcThreadIndex] }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onBcFromTaskPick">
					<view class="picker-line">{{ t('wb_link_from_task') }}{{ taskPickLabels[bcFromTaskIndex] }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onBcToTaskPick">
					<view class="picker-line">{{ t('wb_link_to_task') }}{{ taskPickLabels[bcToTaskIndex] }}</view>
				</picker>
				<textarea class="ta" v-model="bcBody" :placeholder="t('broadcast_content')" />
				<view class="dialog-actions">
					<button class="btn ghost" @click="showBroadcast = false">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="bcLoading" @click="submitBroadcast">{{ t('send') }}</button>
				</view>
			</view>
		</view>

		<!-- 新建沟通线程 -->
		<view v-if="showCreateThread" class="mask" @click.self="showCreateThread = false">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('create') }}{{ t('thread_default') }}</text>
				<input class="inp" v-model="newThreadTitle" :placeholder="t('title_optional')" />
				<view class="dialog-actions">
					<button class="btn ghost" @click="showCreateThread = false">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="creatingThread" @click="submitCreateThread">{{ t('confirm') }}</button>
				</view>
			</view>
		</view>

		<!-- 关联任务 -->
		<view v-if="linkMsg" class="mask" @click.self="linkMsg = null">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('message_link_task') }}</text>
				<picker mode="selector" :range="taskPickLabels" @change="onLinkPick">
					<view class="picker-line">{{ taskPickLabels[linkTaskIndex] }}</view>
				</picker>
				<view class="dialog-actions">
					<button class="btn ghost" @click="linkMsg = null">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="linkLoading" @click="submitLink">{{ t('confirm') }}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";
	import * as wfs from "@/utils/localWorkflowStore";
	import { getLlmConnectionSummary } from "@/utils/llmSettings";
	import { getApiErrorMessage, pickId } from "@/utils/apiHelpers";
	import { subscribeWorkflowChannel } from "@/utils/realtime";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	const STATUS_LABEL = {
		NOT_STARTED: "not_started",
		IN_PROGRESS: "in_progress",
		BLOCKED: "blocked",
		DONE: "done",
	};

	function cleanLabel(label = "") {
		return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
	}

	export default {
		data() {
			return {
				workflowId: "",
				workflowNavList: [],
				meta: null,
				mainTab: "tasks",
				taskView: "dept",
				tasks: [],
				threads: [],
				threadKind: "INTERNAL",
				selectedThreadId: "",
				messages: [],
				draftMsg: "",
				sendingMsg: false,
				graph: null,
				events: [],
				msgFromDeptIndex: 0,
				msgToDeptIndex: 0,
				msgFromTaskIndex: 0,
				msgToTaskIndex: 0,
				showCommand: false,
				cmdSourceIdx: 0,
				cmdTargetIdx: 1,
				cmdLevelIdx: 0,
				levelLabels: ["1", "2", "3", "4", "5"],
				cmdBody: "",
				cmdTaskTitle: "",
				cmdParentIdx: 0,
				cmdDependIdx: 0,
				cmdLoading: false,
				progressTask: null,
				progressReadOnly: false,
				progressValue: 0,
				progressNote: "",
				progressLoading: false,
				showBroadcast: false,
				bcTitle: "",
				bcBody: "",
				bcThreadIndex: 0,
				bcFromTaskIndex: 0,
				bcToTaskIndex: 0,
				bcLoading: false,
				showCreateThread: false,
				newThreadTitle: "",
				creatingThread: false,
				projectGroupMembers: [],
				linkMsg: null,
				linkTaskIndex: 0,
				linkLoading: false,
				realtimeUnsub: null,
				/** 有任务在跑自动流水线时低频率刷新进度 */
				automationTimer: null,
				llmConn: { configured: false, model: "", apiEndpoint: "" },
				cmdQuickFills: [
					{ t: "日会+阻塞", b: "今日 17:00 前完成跨部门日会，同步本迭代阻塞点，并输出一页会议纪要与 @ 人清单。" },
					{ t: "需求小评审", b: "组织 45 分钟需求评审，确认范围与验收标准，会后群内发出结论、风险与排期表。" },
					{ t: "联调提测", b: "完成与下游的联调与冒烟用例，明早前提交可测构建，并说明已知问题与回滚点。" },
				],
			};
		},
		computed: {
			screenTitle() {
				if (this.meta && (this.meta.title || this.meta.name)) {
					return this.meta.title || this.meta.name;
				}
				return this.t("workbench");
			},
			deptOptions() {
				const lang = getLanguage();
				return agentDepartments.map((d) => {
					const td = translateDepartment(d, lang);
					return { id: d.id, label: cleanLabel(td.name) };
				});
			},
			deptLabels() {
				return this.deptOptions.map((d) => d.label);
			},
			taskPickLabels() {
				const xs = [this.t("task_pick_none")];
				for (const t of this.tasks) {
					xs.push(`${this.taskTitle(t)} (${this.shortId(this.taskKey(t))})`);
				}
				return xs;
			},
			filteredThreads() {
				const k = this.threadKind;
				return this.threads.filter((th) => {
					const kk = (th.kind || th.threadKind || "").toString().toUpperCase();
					return !k || kk === k;
				});
			},
			threadPickerLabels() {
				const xs = [this.t("task_pick_none")];
				for (const th of this.filteredThreads) {
					xs.push(`${this.threadTitle(th)} (${this.shortId(this.threadKey(th))})`);
				}
				return xs;
			},
			groupedByDept() {
				const map = {};
				for (const t of this.tasks) {
					const d = this.taskDept(t) || this.t('unassigned');
					if (!map[d]) map[d] = [];
					map[d].push(t);
				}
				return map;
			},
			deptKeys() {
				return Object.keys(this.groupedByDept);
			},
			boardColumns() {
				return [
					{ key: "NOT_STARTED", label: this.t('not_started') },
					{ key: "IN_PROGRESS", label: this.t('in_progress') },
					{ key: "BLOCKED", label: this.t('blocked') },
					{ key: "DONE", label: this.t('done') },
				];
			},
			graphNodes() {
				const g = this.graph;
				if (!g) return [];
				return Array.isArray(g.nodes) ? g.nodes : [];
			},
			graphEdges() {
				const g = this.graph;
				if (!g) return [];
				if (Array.isArray(g.edges)) return g.edges;
				return [];
			},
			mainTabs() {
				return [
					{ key: "tasks", label: this.t('tasks') },
					{ key: "comms", label: this.t('communication') },
					{ key: "graph", label: this.t('graph') },
					{ key: "feed", label: this.t('feed') },
				];
			},
			workflowLlmBusyLine() {
				const m = this.meta;
				if (!m || !m.workflowLlmBusy) return "";
				const label = m.workflowLlmPhaseLabel || m.workflowLlmPhase || "";
				const endpoint = (m.workflowLlmEndpoint || this.llmConn.apiEndpoint || "").trim();
				return this.t("wb_llm_workflow_busy", { label, endpoint });
			},
			llmStripTitle() {
				const c = this.llmConn || {};
				if (c.configured) return this.t("wb_llm_strip_ok", { model: c.model || "" });
				return this.t("wb_llm_strip_off");
			},
		},
		onLoad(options) {
			this.applyWorkflowIdFromOptions(options);
			if (agentDepartments.length > 1) {
				this.cmdTargetIdx = 1;
			}
		},
		async onShow() {
			try {
				uni.setNavigationBarTitle({ title: this.t("workbench") });
			} catch (e) {
				//
			}
			this.syncWorkflowIdFromRoute();
			if (!this.workflowId) {
				uni.showToast({ title: this.t("missing_workflow_id"), icon: "none" });
				return;
			}
			await this.bootstrapPage();
			this.startRealtime();
		},
		onHide() {
			this.clearAutomationTimer();
			this.stopRealtime();
		},
		onUnload() {
			this.clearAutomationTimer();
			this.stopRealtime();
		},
		watch: {
			async threadKind() {
				await this.loadThreads();
				this.projectGroupMembers = [];
				const ids = new Set(this.filteredThreads.map((th) => this.threadKey(th)));
				if (this.selectedThreadId && ids.has(this.selectedThreadId)) {
					return;
				}
				this.selectedThreadId = "";
				this.messages = [];
				if (this.filteredThreads.length > 0) {
					this.selectThread(this.filteredThreads[0]);
				}
			},
			async selectedThreadId() {
				if ((this.threadKind || "").toUpperCase() === "PROJECT_GROUP") {
					await this.loadProjectGroupMembers();
				} else {
					this.projectGroupMembers = [];
				}
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			/** 与 onLoad 一致，避免部分端 onLoad 未带上 query */
			applyWorkflowIdFromOptions(options) {
				if (!options) {
					return;
				}
				const raw = options.id != null && options.id !== "" ? String(options.id) : "";
				if (raw) {
					try {
						this.workflowId = decodeURIComponent(raw).trim();
					} catch {
						this.workflowId = raw.trim();
					}
				}
			},
			syncWorkflowIdFromRoute() {
				try {
					const pages = getCurrentPages();
					if (!pages || !pages.length) {
						return;
					}
					const cur = pages[pages.length - 1];
					const opt = (cur && cur.options) || {};
					if (opt.id != null && String(opt.id) !== "") {
						this.applyWorkflowIdFromOptions({ id: opt.id });
					}
				} catch {
					//
				}
			},
			workflowKey(w) {
				return pickId(w) || w?.workflowId || "";
			},
			workflowTitle(w) {
				return w?.title || w?.name || this.t("unnamed_workflow");
			},
			shortId(id) {
				if (!id) return "-";
				const s = String(id);
				return s.length > 8 ? `${s.slice(0, 6)}…` : s;
			},
			async loadWorkflowNavList() {
				try {
					const list = await wfs.listWorkflows();
					const arr = Array.isArray(list) ? list : [];
					const hasCurrent = arr.some((w) => this.workflowKey(w) === this.workflowId);
					if (!hasCurrent && this.workflowId) {
						arr.unshift({
							id: this.workflowId,
							workflowId: this.workflowId,
							title: this.screenTitle && this.screenTitle !== this.t("workbench") ? this.screenTitle : this.workflowId,
						});
					}
					this.workflowNavList = arr.filter((w, i, xs) => {
						const id = this.workflowKey(w);
						return id && xs.findIndex((x) => this.workflowKey(x) === id) === i;
					});
				} catch {
					if (this.workflowId) {
						this.workflowNavList = [
							{
								id: this.workflowId,
								workflowId: this.workflowId,
								title: this.screenTitle && this.screenTitle !== this.t("workbench") ? this.screenTitle : this.workflowId,
							},
						];
					} else {
						this.workflowNavList = [];
					}
				}
			},
			openWorkflowFromNav(w) {
				const id = this.workflowKey(w);
				if (!id || id === this.workflowId) return;
				try {
					uni.setStorageSync("lastWorkflowId", id);
					uni.setStorageSync("lastWorkflowTitle", this.workflowTitle(w));
				} catch {
					//
				}
				uni.redirectTo({
					url: `/pages/workflow/workbench?id=${encodeURIComponent(id)}`,
				});
			},
			async bootstrapPage() {
				try {
					await wfs.commsBootstrap(this.workflowId);
					await wfs.ensureWorkflowRecord(this.workflowId);
					this.meta = await wfs.getWorkflow(this.workflowId);
				} catch {
					this.meta = null;
				}
				const meta = this.meta;
				try {
					uni.setStorageSync("lastWorkflowId", this.workflowId);
					const wt = (meta && (meta.title || meta.name)) || "";
					if (wt) {
						uni.setStorageSync("lastWorkflowTitle", wt);
					}
				} catch {
					//
				}
				if (this.screenTitle && this.screenTitle !== this.t("workbench")) {
					uni.setNavigationBarTitle({ title: this.screenTitle });
				}
				await Promise.all([
					this.loadWorkflowNavList(),
					this.loadTasks(),
					this.loadThreads(),
					this.loadGraph(),
					this.loadEvents(),
				]);
				if (!this.selectedThreadId && this.filteredThreads.length > 0) {
					this.selectThread(this.filteredThreads[0]);
				}
			},
			startRealtime() {
				this.stopRealtime();
				if (!this.workflowId) return;
				this.realtimeUnsub = subscribeWorkflowChannel(this.workflowId, () => {
					this.loadTasks();
					this.loadEvents();
					if (this.selectedThreadId) {
						this.loadMessages();
					}
				});
			},
			stopRealtime() {
				if (typeof this.realtimeUnsub === "function") {
					this.realtimeUnsub();
					this.realtimeUnsub = null;
				}
			},
			async loadTasks() {
				try {
					const list = await wfs.listTasks(this.workflowId);
					this.tasks = Array.isArray(list) ? list : [];
				} catch {
					this.tasks = [];
				}
				try {
					this.llmConn = getLlmConnectionSummary() || this.llmConn;
				} catch {
					this.llmConn = { configured: false, model: "", apiEndpoint: "" };
				}
				try {
					const m = await wfs.getWorkflow(this.workflowId);
					if (m) this.meta = m;
				} catch {
					//
				}
				this.syncAutomationRefresh();
			},
			/** 有自动化运行中的任务时轮询，结束后停止 */
			syncAutomationRefresh() {
				this.$nextTick(() => {
					if (!this.workflowId) return;
					const on =
						(typeof wfs.needsTaskLivePolling === "function" && wfs.needsTaskLivePolling(this.workflowId)) ||
						(typeof wfs.hasRunningAutomation === "function" && wfs.hasRunningAutomation(this.workflowId));
					if (on) {
						if (this.automationTimer) return;
						this.automationTimer = setInterval(() => {
							this.loadTasks();
							this.loadEvents();
							this.loadGraph();
							const still =
								(typeof wfs.needsTaskLivePolling === "function" && wfs.needsTaskLivePolling(this.workflowId)) ||
								(typeof wfs.hasRunningAutomation === "function" && wfs.hasRunningAutomation(this.workflowId));
							if (!still) {
								this.clearAutomationTimer();
							}
						}, 1200);
					} else {
						this.clearAutomationTimer();
					}
				});
			},
			clearAutomationTimer() {
				if (this.automationTimer) {
					clearInterval(this.automationTimer);
					this.automationTimer = null;
				}
			},
			async loadThreads() {
				try {
					const list = this.threadKind === "PROJECT_GROUP"
						? await wfs.listProjectGroups(this.workflowId)
						: await wfs.listThreads(this.workflowId, { kind: this.threadKind });
					this.threads = Array.isArray(list) ? list : [];
				} catch {
					this.threads = [];
				}
			},
			async loadMessages() {
				if (!this.selectedThreadId) {
					this.messages = [];
					return;
				}
				try {
					const list = this.threadKind === "PROJECT_GROUP"
						? await wfs.listProjectGroupMessages(this.workflowId, this.selectedThreadId)
						: await wfs.listMessages(this.workflowId, this.selectedThreadId);
					this.messages = Array.isArray(list) ? list : [];
				} catch {
					this.messages = [];
				}
			},
			async loadProjectGroupMembers() {
				if ((this.threadKind || "").toUpperCase() !== "PROJECT_GROUP" || !this.selectedThreadId) {
					this.projectGroupMembers = [];
					return;
				}
				try {
					const list = await wfs.listProjectGroupMembers(this.workflowId, this.selectedThreadId);
					this.projectGroupMembers = Array.isArray(list) ? list : [];
				} catch {
					this.projectGroupMembers = [];
				}
			},
			async loadGraph() {
				try {
					this.graph = await wfs.getCollaborationGraph(this.workflowId);
				} catch {
					this.graph = { nodes: [], edges: [] };
				}
			},
			async loadEvents() {
				try {
					const list = await wfs.listEvents(this.workflowId);
					this.events = Array.isArray(list) ? list : [];
				} catch {
					this.events = [];
				}
			},
			async ensureBootstrap() {
				if (!this.workflowId) {
					uni.showToast({ title: this.t('missing_workflow_id'), icon: "none" });
					return;
				}
				try {
					await wfs.commsBootstrap(this.workflowId);
					await this.loadThreads();
					uni.showToast({ title: this.t('bootstrap_requested'), icon: "success" });
				} catch {
					//
				}
			},
			taskKey(t) {
				return pickId(t) || t.taskId || "";
			},
			taskTitle(t) {
				return t.title || t.name || t.taskTitle || this.t('unnamed_task');
			},
			taskDept(t) {
				return t.department || t.departmentId || t.dept || t.ownerDepartment || "";
			},
			taskLevel(t) {
				return t.hierarchyLevel ?? t.level ?? "-";
			},
			rawStatus(t) {
				return (t.status || t.taskStatus || "").toString().toUpperCase();
			},
			statusLabel(t) {
				const s = this.rawStatus(t);
				return this.t(STATUS_LABEL[s]) || s || this.t('unknown');
			},
			statusClass(t) {
				const s = this.rawStatus(t);
				if (s === "DONE") return "ok";
				if (s === "BLOCKED") return "bad";
				if (s === "IN_PROGRESS") return "run";
				return "";
			},
			taskPercent(t) {
				const n = t.progressPercent ?? t.progress ?? t.percent;
				const v = Number(n);
				if (Number.isFinite(v)) return Math.max(0, Math.min(100, Math.round(v)));
				return 0;
			},
			taskHint(task) {
				const p = task.parentTaskId || task.parentId;
				const d = task.dependsOnTaskId || (Array.isArray(task.dependsOnTaskIds) && task.dependsOnTaskIds[0]);
				const bits = [];
				if (p) bits.push(`${this.t("wb_parent_prefix")} ${this.shortId(p)}`);
				if (d) bits.push(`${this.t("wb_dep_prefix")} ${this.shortId(d)}`);
				return bits.join(" · ");
			},
			taskAiPreview(t) {
				if (!t) return "";
				const r =
					t.aiExecutionReport || t.executionReport || t.aiDeliverable || (t.aiGenerated && (t.description || t.desc)) || "";
				const s = String(r || "").trim();
				if (!s) return "";
				return s.length > 240 ? `${s.slice(0, 240)}…` : s;
			},
			taskFullAiReport(t) {
				if (!t) return "";
				return String(
					t.automationFullReport ||
						t.aiExecutionReport ||
						t.executionReport ||
						t.aiDeliverable ||
						t.description ||
						t.desc ||
						""
				).trim();
			},
			taskAutomationLine(t) {
				if (!t) return "";
				const st = t.automationStatus;
				if (st === "running" && t.automationPhaseLabel) {
					return `自动执行中：${t.automationPhaseLabel}`;
				}
				if (st === "complete") return "自动流程已完成（分析/规划/执行/测试/验收）";
				if (st === "error") return `自动流程异常：${(t.automationError || "未知").slice(0, 80)}`;
				return "";
			},
			taskLlmLine(t) {
				if (!t) return "";
				if (t.llmRequesting) {
					const model = t.llmRequestModel ? ` · ${t.llmRequestModel}` : "";
					return `大模型请求中：${t.llmRequestPhaseLabel || "chat/completions"}${model}`;
				}
				const hist = t.llmCallHistory;
				if (Array.isArray(hist) && hist.length) {
					const last = hist[hist.length - 1];
					const tag = last.usedRealApi ? "已请求 API" : "本机/降级";
					const ms = last.durationMs != null ? ` ${last.durationMs}ms` : "";
					return `${tag} · ${last.label || last.phase || "LLM"}${ms}`;
				}
				if (t.offlineOnly && t.pendingLlm !== true) return "未走联网大模型（本机规则或接口失败降级）";
				return "";
			},
			taskLlmHistoryLines(task) {
				if (!task) return [];
				const h = task.llmCallHistory;
				if (!Array.isArray(h) || !h.length) return [];
				return h.map((r) => {
					const tag = r.usedRealApi ? "API" : "本地";
					const ms = r.durationMs != null ? ` ${r.durationMs}ms` : "";
					const note = r.note ? ` — ${String(r.note).slice(0, 160)}` : "";
					return `[${tag}] ${r.label || r.phase || ""}${ms}${note}`;
				});
			},
			applyCmdQuick(c) {
				if (c && c.b) this.cmdBody = c.b;
			},
			tasksInStatus(key) {
				return this.tasks.filter((t) => this.rawStatus(t) === key);
			},
			openCommand() {
				this.cmdBody = "";
				this.cmdTaskTitle = "";
				this.showCommand = true;
			},
			openCreateThread() {
				this.newThreadTitle = "";
				this.showCreateThread = true;
			},
			onCmdSource(e) {
				this.cmdSourceIdx = Number(e.detail.value);
			},
			onCmdTarget(e) {
				this.cmdTargetIdx = Number(e.detail.value);
			},
			onCmdLevel(e) {
				this.cmdLevelIdx = Number(e.detail.value);
			},
			onCmdParent(e) {
				this.cmdParentIdx = Number(e.detail.value);
			},
			onCmdDepend(e) {
				this.cmdDependIdx = Number(e.detail.value);
			},
			selectedTaskByPickerIndex(idx) {
				if (!idx || idx <= 0) return "";
				const t = this.tasks[idx - 1];
				return this.taskKey(t);
			},
			async submitCommand() {
				const text = (this.cmdBody || "").trim();
				if (!text) {
					uni.showToast({ title: this.t('please_enter_command_body'), icon: "none" });
					return;
				}
				const src = this.deptOptions[this.cmdSourceIdx]?.id;
				const tgt = this.deptOptions[this.cmdTargetIdx]?.id;
				if (!src || !tgt) {
					uni.showToast({ title: this.t('please_select_department'), icon: "none" });
					return;
				}
				const level = Number(this.levelLabels[this.cmdLevelIdx] || "1");
				const parentId = this.selectedTaskByPickerIndex(this.cmdParentIdx);
				const dependId = this.selectedTaskByPickerIndex(this.cmdDependIdx);
				const title = (this.cmdTaskTitle || "").trim();
				const payload = {
					sourceDepartment: src,
					targetDepartment: tgt,
					hierarchyLevel: level,
					content: text,
					body: text,
					commandText: text,
				};
				if (title) payload.createTaskTitle = title;
				if (parentId) payload.parentTaskId = parentId;
				if (dependId) payload.dependsOnTaskIds = [dependId];
				this.cmdLoading = true;
				try {
					const wid = String(this.workflowId || "").trim();
					const p = wfs.postCommand(wid, payload);
					// postCommand 内会先同步落一条占位任务，再 await 大模型；此处立刻刷新，避免长时间空白
					this.$nextTick(() => {
						this.loadTasks();
						this.loadGraph();
						this.loadEvents();
					});
					await p;
					uni.showToast({ title: this.t('issued'), icon: "success" });
					this.showCommand = false;
					await Promise.all([this.loadTasks(), this.loadGraph(), this.loadEvents()]);
				} catch (e) {
					const mk = e && e.messageKey;
					const t = mk ? this.t(mk) : getApiErrorMessage(e);
					uni.showToast({ title: t || (e && e.message) || "下发失败", icon: "none", duration: 3200 });
					this.loadTasks();
					this.loadEvents();
				} finally {
					this.cmdLoading = false;
				}
			},
			closeProgressDialog() {
				this.progressTask = null;
				this.progressReadOnly = false;
			},
			openProgress(task) {
				const id = this.taskKey(task);
				const latest = (this.tasks || []).find((x) => this.taskKey(x) === id) || task;
				if (typeof wfs.isManualTaskProgressDisabled === "function" && wfs.isManualTaskProgressDisabled(latest)) {
					this.progressReadOnly = true;
					this.progressTask = latest;
					return;
				}
				this.progressReadOnly = false;
				this.progressTask = latest;
				this.progressValue = this.taskPercent(latest);
				this.progressNote = "";
			},
			onSlider(e) {
				this.progressValue = Number(e.detail.value);
			},
			async submitProgress() {
				if (!this.progressTask || this.progressReadOnly) return;
				const taskId = this.taskKey(this.progressTask);
				if (!taskId) return;
				this.progressLoading = true;
				try {
					const note = (this.progressNote || "").trim();
					await wfs.updateTaskProgress(String(this.workflowId || "").trim(), taskId, {
						progressPercent: this.progressValue,
						note,
						remark: note,
					});
					uni.showToast({ title: this.t('updated'), icon: "success" });
					this.closeProgressDialog();
					await this.loadTasks();
				} catch (e) {
					const t = (e && e.messageKey) ? this.t(e.messageKey) : getApiErrorMessage(e);
					uni.showToast({ title: t || "更新失败", icon: "none", duration: 2800 });
				} finally {
					this.progressLoading = false;
				}
			},
			threadKey(th) {
				return pickId(th) || th.threadId || th.groupId || "";
			},
			threadTitle(th) {
				return th.title || th.name || th.topic || this.t("thread_default");
			},
			projectGroupMemberLabel(m) {
				const type = String(m?.type || "").toUpperCase();
				const dep = m?.department ? ` · ${m.department}` : "";
				if (type === "ROLE") return `${m?.label || m?.id || "负责人"}${dep}`;
				return `${m?.label || m?.id || "成员"}${dep}`;
			},
			selectThread(th) {
				const id = this.threadKey(th);
				this.selectedThreadId = id;
				this.loadMessages();
			},
			messageBody(m) {
				return m.body || m.content || m.text || "";
			},
			messageTime(m) {
				return m.createdAt || m.time || m.timestamp || "";
			},
			msgRoute(m) {
				const a = m.fromDepartment || m.fromDept;
				const b = m.toDepartment || m.toDept;
				if (a && b) return `${a} → ${b}`;
				if (a || b) return `${a || ""}${b ? " → " + b : ""}`;
				return "";
			},
			msgFromTask(m) {
				return m.fromTaskId || m.sourceTaskId || "";
			},
			msgToTask(m) {
				return m.toTaskId || m.targetTaskId || "";
			},
			msgTasks(m) {
				return this.msgFromTask(m) || this.msgToTask(m);
			},
			onPickFromDept(e) {
				this.msgFromDeptIndex = Number(e.detail.value);
			},
			onPickToDept(e) {
				this.msgToDeptIndex = Number(e.detail.value);
			},
			onPickFromTask(e) {
				this.msgFromTaskIndex = Number(e.detail.value);
			},
			onPickToTask(e) {
				this.msgToTaskIndex = Number(e.detail.value);
			},
			async submitMessage() {
				const body = (this.draftMsg || "").trim();
				if (!this.selectedThreadId) {
					uni.showToast({ title: this.t('please_select_thread'), icon: "none" });
					return;
				}
				if (!body) {
					uni.showToast({ title: this.t('please_enter_content'), icon: "none" });
					return;
				}
				const payload = { text: body, content: body, body };
				const fd = this.deptOptions[this.msgFromDeptIndex]?.id;
				const td = this.deptOptions[this.msgToDeptIndex]?.id;
				const authorDept = fd || this.deptOptions[0]?.id || "";
				if (authorDept) {
					payload.author = {
						type: "INTERNAL_DEPARTMENT",
						id: authorDept,
						label: this.deptOptions.find((d) => d.id === authorDept)?.label || authorDept,
					};
				}
				if (fd) {
					payload.fromDepartment = fd;
					payload.fromDept = fd;
				}
				if (td) {
					payload.toDepartment = td;
					payload.toDept = td;
					payload.audience = [
						{
							type: "INTERNAL_DEPARTMENT",
							id: td,
							label: this.deptOptions.find((d) => d.id === td)?.label || td,
						},
					];
				}
				const ft = this.selectedTaskByPickerIndex(this.msgFromTaskIndex);
				const tt = this.selectedTaskByPickerIndex(this.msgToTaskIndex);
				if (ft) {
					payload.fromTaskId = ft;
				}
				if (tt) {
					payload.toTaskId = tt;
				}
				this.sendingMsg = true;
				try {
					if (this.threadKind === "PROJECT_GROUP") {
						await wfs.sendProjectGroupMessage(this.workflowId, this.selectedThreadId, payload);
					} else {
						await wfs.sendMessage(this.workflowId, this.selectedThreadId, payload);
					}
					this.draftMsg = "";
					uni.showToast({ title: this.t('sent'), icon: "success" });
					await this.loadMessages();
				} catch {
					//
				} finally {
					this.sendingMsg = false;
				}
			},
			async submitBroadcast() {
				const content = (this.bcBody || "").trim();
				if (!content) {
					uni.showToast({ title: this.t('please_enter_broadcast_content'), icon: "none" });
					return;
				}
				const title = (this.bcTitle || "").trim();
				const threadId = this.bcThreadIndex > 0 ? this.threadKey(this.filteredThreads[this.bcThreadIndex - 1]) : "";
				const fromTaskId = this.selectedTaskByPickerIndex(this.bcFromTaskIndex);
				const toTaskId = this.selectedTaskByPickerIndex(this.bcToTaskIndex);
				const targets = this.deptOptions.map((d) => ({
					type: "INTERNAL_DEPARTMENT",
					id: d.id,
					label: d.label,
				}));
				this.bcLoading = true;
				try {
					const payload = {
						targets,
						commandText: content,
						content,
						body: content,
					};
					if (title) payload.title = title;
					if (threadId) payload.threadId = threadId;
					if (fromTaskId) payload.fromTaskId = fromTaskId;
					if (toTaskId) payload.toTaskId = toTaskId;
					await wfs.broadcastComms(this.workflowId, payload);
					await this.loadEvents();
					await this.loadMessages();
					uni.showToast({ title: this.t('broadcasted'), icon: "success" });
					this.showBroadcast = false;
					this.bcTitle = "";
					this.bcBody = "";
					this.bcThreadIndex = 0;
					this.bcFromTaskIndex = 0;
					this.bcToTaskIndex = 0;
				} catch {
					//
				} finally {
					this.bcLoading = false;
				}
			},
			onBcThreadPick(e) {
				this.bcThreadIndex = Number(e.detail.value);
			},
			onBcFromTaskPick(e) {
				this.bcFromTaskIndex = Number(e.detail.value);
			},
			onBcToTaskPick(e) {
				this.bcToTaskIndex = Number(e.detail.value);
			},
			async submitCreateThread() {
				const title = (this.newThreadTitle || "").trim();
				this.creatingThread = true;
				try {
					const defaultTitle = `${this.t("thread_default")} ${new Date().toLocaleTimeString()}`;
					const created = this.threadKind === "PROJECT_GROUP"
						? await wfs.createProjectGroup(this.workflowId, { title: title || defaultTitle })
						: await wfs.createThread(this.workflowId, {
							kind: this.threadKind,
							title: title || defaultTitle,
						});
					await this.loadThreads();
					this.showCreateThread = false;
					this.newThreadTitle = "";
					const id = this.threadKey(created);
					if (id) {
						this.selectedThreadId = id;
						await this.loadMessages();
					}
					uni.showToast({ title: this.t("created"), icon: "success" });
				} catch {
					//
				} finally {
					this.creatingThread = false;
				}
			},
			openLinkTask(m) {
				this.linkMsg = m;
				this.linkTaskIndex = 0;
			},
			onLinkPick(e) {
				this.linkTaskIndex = Number(e.detail.value);
			},
			async submitLink() {
				const m = this.linkMsg;
				const taskId = this.selectedTaskByPickerIndex(this.linkTaskIndex);
				const messageId = pickId(m);
				if (!m || !messageId || !taskId) {
					uni.showToast({ title: this.t('please_select_task'), icon: "none" });
					return;
				}
				this.linkLoading = true;
				try {
					await wfs.linkMessageToTask(this.workflowId, messageId, { taskId });
					uni.showToast({ title: this.t('linked'), icon: "success" });
					this.linkMsg = null;
				} catch {
					//
				} finally {
					this.linkLoading = false;
				}
			},
			highlightTask(id) {
				if (!id) return;
				uni.showToast({ title: this.t("wb_task_prefix", { id: this.shortId(id) }), icon: "none" });
				this.mainTab = "tasks";
				this.taskView = "list";
			},
			tapGraphNode(n) {
				const id = pickId(n) || n.taskId;
				this.highlightTask(id);
			},
			graphNodeTitle(n) {
				return n.title || n.name || n.label || this.t("wb_node_fallback");
			},
			graphNodeDept(n) {
				return n.department || n.departmentId || "";
			},
			graphNodeStatus(n) {
				return this.statusLabel(n);
			},
			graphNodePct(n) {
				return this.taskPercent(n);
			},
			edgeLabel(e) {
				const from = e.from || e.source || e.fromId;
				const to = e.to || e.target || e.toId;
				const rel = e.relation || e.type || e.kind || "link";
				return `${rel}: ${this.shortId(from)} → ${this.shortId(to)}`;
			},
			edgeTypeLabel(e) {
				const rel = String(e?.relation || e?.type || e?.kind || "LINK").toUpperCase();
				if (rel.includes("COMMAND")) return "指令下发";
				if (rel.includes("ASSIGN")) return "任务分配";
				if (rel.includes("COLLAB")) return "协作关系";
				if (rel.includes("DEPEND")) return "依赖关系";
				return "关系连线";
			},
			edgeRouteLabel(e) {
				const from =
					e?.fromDepartment ||
					e?.fromDept ||
					e?.sourceDepartment ||
					e?.sourceDept ||
					this.shortId(e?.from || e?.source || e?.fromId || e?.sourceId) ||
					"-";
				const to =
					e?.toDepartment ||
					e?.toDept ||
					e?.targetDepartment ||
					e?.targetDept ||
					this.shortId(e?.to || e?.target || e?.toId || e?.targetId) ||
					"-";
				return `${from} → ${to}`;
			},
			eventTypeLabel(ev) {
				const type = String(ev?.type || ev?.eventType || ev?.action || "EVENT").toUpperCase();
				if (type.includes("WORKFLOW_CREATED")) return "工作流创建";
				if (type.includes("AUTOMATION_DONE")) return "自动流程完成";
				if (type.includes("AUTOMATION_ERROR")) return "自动流程异常";
				if (type.includes("COMMAND_ISSUED")) return "指令已下发";
				if (type.includes("TASK_ASSIGNED")) return "任务已分配";
				if (type.includes("COLLAB_EDGE")) return "协作关系更新";
				if (type.includes("TASK")) return "任务变更";
				return "系统动态";
			},
			eventText(ev) {
				const raw = String(ev?.type || ev?.eventType || ev?.action || "").toUpperCase();
				const from = ev?.fromDepartment || ev?.fromDept || "";
				const to = ev?.toDepartment || ev?.toDept || "";
				if (raw.includes("WORKFLOW_CREATED")) return "已创建新的工作流";
				if (raw.includes("AUTOMATION_DONE")) return ev?.brief || "任务已自动分析、执行、测试并完成验收";
				if (raw.includes("AUTOMATION_ERROR")) return ev?.brief || "自动流水线异常，请查看任务";
				if (raw.includes("COMMAND_ISSUED")) return from && to ? `已从 ${from} 向 ${to} 下发指令` : "已下发新的协作指令";
				if (raw.includes("TASK_ASSIGNED")) return "已生成并分配任务";
				if (raw.includes("COLLAB_EDGE")) return from && to ? `${from} 与 ${to} 建立协作连接` : "协作关系已更新";
				return raw || "系统发生了一条新动态";
			},
			eventDetailText(ev) {
				const text =
					ev?.commandText ||
					ev?.brief ||
					ev?.title ||
					ev?.message ||
					ev?.detail ||
					ev?.description ||
					"";
				return String(text).trim().slice(0, 80);
			},
			eventTime(ev) {
				const v = ev?.createdAt || ev?.time || ev?.timestamp || "";
				if (!v) return "";
				const d = new Date(v);
				if (!Number.isNaN(d.getTime())) {
					const mm = String(d.getMonth() + 1).padStart(2, "0");
					const dd = String(d.getDate()).padStart(2, "0");
					const hh = String(d.getHours()).padStart(2, "0");
					const mi = String(d.getMinutes()).padStart(2, "0");
					return `${mm}-${dd} ${hh}:${mi}`;
				}
				return String(v);
			},
		},
	};
</script>

<style scoped>
	.wb {
		min-height: 100vh;
		background: #f4f6fb;
		padding-bottom: 40rpx;
	}

	.hero {
		padding: 28rpx 28rpx 12rpx;
	}

	.hero-title {
		font-size: 40rpx;
		font-weight: 800;
		color: #1f2d3d;
	}

	.hero-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #98a2b3;
		word-break: break-all;
	}

	.llm-strip {
		margin: 0 20rpx 12rpx;
		padding: 14rpx 18rpx;
		border-radius: 14rpx;
		border: 1rpx solid #c7d2fe;
		background: #eef2ff;
	}
	.llm-strip.llm-on {
		border-color: #93c5fd;
		background: #eff6ff;
	}
	.llm-strip.llm-off {
		border-color: #fcd34d;
		background: #fffbeb;
	}
	.llm-strip.wf-busy {
		border-color: #a78bfa;
		background: #f5f3ff;
		margin-bottom: 8rpx;
	}
	.llm-strip-t {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #1e293b;
		line-height: 1.45;
	}
	.llm-strip-e {
		display: block;
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #64748b;
		word-break: break-all;
		line-height: 1.35;
	}
	.llm-line {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		font-weight: 600;
		color: #4338ca;
		line-height: 1.4;
	}
	.llm-line.sm {
		font-size: 20rpx;
		margin-top: 4rpx;
	}
	.llm-trace {
		max-height: 220rpx;
		margin-bottom: 12rpx;
		padding: 10rpx 12rpx;
		background: #f8fafc;
		border-radius: 10rpx;
		border: 1rpx solid #e2e8f0;
	}
	.llm-trace-title {
		display: block;
		font-size: 22rpx;
		font-weight: 800;
		color: #334155;
		margin-bottom: 8rpx;
	}
	.llm-trace-line {
		display: block;
		font-size: 20rpx;
		color: #475569;
		line-height: 1.45;
		margin-bottom: 6rpx;
	}
	.llm-live {
		display: block;
		margin-bottom: 10rpx;
		font-size: 22rpx;
		font-weight: 700;
		color: #7c3aed;
	}

	.project-strip {
		white-space: nowrap;
		padding: 0 20rpx 12rpx;
		box-sizing: border-box;
	}

	.project-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 62rpx;
		padding: 0 22rpx;
		margin-right: 12rpx;
		border-radius: 999rpx;
		background: #ffffff;
		border: 1rpx solid #dbe3ef;
	}

	.project-chip.active {
		background: #e8f0ff;
		border-color: #7aa2ff;
	}

	.project-chip-t {
		max-width: 280rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 24rpx;
		font-weight: 600;
		color: #334155;
	}

	.seg {
		display: flex;
		margin: 0 20rpx;
		background: #e9edf5;
		border-radius: 16rpx;
		padding: 6rpx;
	}

	.seg-item {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 12rpx;
	}

	.seg-item.on {
		background: #fff;
		box-shadow: 0 4rpx 12rpx rgba(20, 38, 70, 0.08);
	}

	.seg-text {
		font-size: 26rpx;
		color: #334155;
	}

	.panel {
		height: calc(100vh - 220rpx);
		padding: 16rpx 20rpx 0;
		box-sizing: border-box;
	}

	.comm-panel {
		padding-bottom: 320rpx;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
		gap: 12rpx;
		flex-wrap: wrap;
	}

	.task-empty {
		padding: 40rpx 24rpx 32rpx;
		background: #f8fafc;
		border-radius: 16rpx;
		margin-bottom: 16rpx;
		border: 1rpx dashed #cbd5e1;
	}
	.task-empty-t {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 12rpx;
	}
	.task-empty-hint {
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.subseg {
		display: flex;
		gap: 12rpx;
		flex-wrap: wrap;
		align-items: center;
	}

	.subseg-item {
		font-size: 24rpx;
		color: #64748b;
		padding: 8rpx 14rpx;
		border-radius: 999rpx;
		background: #eef2ff;
	}

	.subseg-item.on {
		color: #1e3a8a;
		font-weight: 700;
		background: #dbeafe;
	}

	.mini.primary {
		background: #2563eb;
		color: #fff;
	}

	.blk {
		margin-bottom: 18rpx;
	}

	.blk-title {
		font-size: 26rpx;
		font-weight: 700;
		color: #334155;
		margin: 8rpx 4rpx 12rpx;
	}

	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 20rpx;
		margin-bottom: 14rpx;
		border: 1rpx solid #e8ecf3;
		box-shadow: 0 8rpx 18rpx rgba(20, 38, 70, 0.05);
	}

	.card.sm {
		padding: 14rpx;
	}

	.card-h {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12rpx;
	}

	.card-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
		flex: 1;
	}

	.badge {
		font-size: 20rpx;
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		color: #475569;
	}

	.badge.ok {
		background: #dcfce7;
		color: #166534;
	}

	.badge.run {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge.bad {
		background: #fee2e2;
		color: #991b1b;
	}

	.progress-row {
		display: flex;
		align-items: center;
		gap: 12rpx;
		margin-top: 12rpx;
	}

	progress {
		flex: 1;
	}

	.pct {
		font-size: 22rpx;
		color: #64748b;
		width: 80rpx;
		text-align: right;
	}

	.pct.sm {
		width: 64rpx;
		font-size: 20rpx;
	}

	.mini-muted {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #94a3b8;
	}

	.hint {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #64748b;
	}

	.board {
		display: flex;
		gap: 12rpx;
		align-items: flex-start;
	}

	.board-col {
		flex: 1;
		min-width: 0;
	}

	.board-h {
		display: block;
		font-size: 22rpx;
		font-weight: 700;
		color: #475569;
		margin-bottom: 10rpx;
	}

	.thread-strip {
		white-space: nowrap;
		margin-bottom: 16rpx;
	}

	.pg-members {
		margin-bottom: 14rpx;
	}

	.pg-members-title {
		display: block;
		font-size: 22rpx;
		font-weight: 700;
		color: #475569;
		margin-bottom: 8rpx;
	}

	.pg-members-empty {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.pg-members-strip {
		white-space: nowrap;
	}

	.pg-member-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10rpx 16rpx;
		margin-right: 10rpx;
		background: #eff6ff;
		border: 1rpx solid #bfdbfe;
		border-radius: 999rpx;
	}

	.pg-member-chip-t {
		font-size: 22rpx;
		color: #1e40af;
	}

	.thread-chip {
		display: inline-flex;
		padding: 12rpx 18rpx;
		border-radius: 999rpx;
		background: #fff;
		border: none;
		box-shadow: 0 2rpx 10rpx rgba(15, 23, 42, 0.06);
		margin-right: 12rpx;
	}

	.thread-chip.active {
		background: #eff6ff;
		box-shadow: 0 0 0 2rpx rgba(37, 99, 235, 0.35), 0 2rpx 10rpx rgba(15, 23, 42, 0.06);
	}

	.thread-chip-t {
		font-size: 24rpx;
		color: #0f172a;
		max-width: 260rpx;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.msg {
		background: #fff;
		border-radius: 16rpx;
		padding: 16rpx;
		margin-bottom: 12rpx;
		border: none;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
	}

	.msg-meta {
		display: flex;
		justify-content: space-between;
		gap: 12rpx;
		margin-bottom: 8rpx;
	}

	.msg-time {
		font-size: 20rpx;
		color: #94a3b8;
	}

	.msg-route {
		font-size: 20rpx;
		color: #2563eb;
		max-width: 420rpx;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.msg-body {
		font-size: 26rpx;
		color: #1e293b;
		line-height: 1.55;
	}

	.msg-links {
		margin-top: 8rpx;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.linkish {
		font-size: 22rpx;
		color: #0ea5e9;
	}

	.msg-actions {
		margin-top: 10rpx;
	}

	.link {
		font-size: 22rpx;
		color: #2563eb;
	}

	.composer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 16rpx 20rpx 28rpx;
		background: linear-gradient(180deg, rgba(244, 246, 251, 0), #f4f6fb 18%);
		background-color: #f8fafc;
		border-top: 1rpx solid #e8ecf3;
		z-index: 30;
		box-sizing: border-box;
	}

	.picker-line {
		font-size: 22rpx;
		color: #475569;
		padding: 8rpx 0;
		border-bottom: 1rpx solid #e8ecf3;
	}

	.ta {
		width: 100%;
		min-height: 140rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 12rpx;
		margin-top: 10rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #fff;
	}

	.send {
		margin-top: 12rpx;
		width: 100%;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
	}

	.node-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-bottom: 16rpx;
	}

	.g-node {
		width: calc(50% - 6rpx);
		box-sizing: border-box;
		background: #fff;
		border-radius: 16rpx;
		padding: 14rpx;
		border: 1rpx solid #e8ecf3;
	}

	.g-node-t {
		font-size: 26rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.g-node-sub {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin: 6rpx 0 10rpx;
	}

	.edge-line {
		display: block;
		font-size: 22rpx;
		color: #475569;
		padding: 8rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.edge-card {
		background: #ffffff;
		border: 1rpx solid #e5edf8;
		border-radius: 14rpx;
		padding: 14rpx;
		margin-bottom: 10rpx;
		box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.05);
	}

	.edge-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6rpx;
	}

	.edge-tag {
		font-size: 20rpx;
		color: #1d4ed8;
		background: #e8f0ff;
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
	}

	.edge-time {
		font-size: 20rpx;
		color: #94a3b8;
	}

	.edge-main {
		font-size: 24rpx;
		color: #334155;
		font-weight: 600;
	}

	.ev {
		background: #fff;
		padding: 14rpx 16rpx;
		border-radius: 12rpx;
		margin-bottom: 10rpx;
		border: 1rpx solid #e8ecf3;
		box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.05);
	}

	.ev-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.ev-badge {
		font-size: 20rpx;
		color: #0369a1;
		background: #e0f2fe;
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
	}

	.ev-t {
		font-size: 24rpx;
		color: #1e293b;
		display: block;
	}

	.ev-time {
		font-size: 20rpx;
		color: #94a3b8;
		display: block;
	}

	.ev-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #64748b;
	}

	.refresh {
		margin-bottom: 12rpx;
	}

	.empty-inline {
		padding: 40rpx 10rpx;
		text-align: center;
		color: #94a3b8;
		font-size: 24rpx;
	}

	.tail-gap {
		height: 80rpx;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.5);
		z-index: 10050;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 40rpx 24rpx;
		padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.mask-center {
		align-items: center;
		padding: 24rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	}

	.dialog {
		width: 100%;
		background: #ffffff !important;
		background-color: #ffffff !important;
		opacity: 1 !important;
		border-radius: 24rpx 24rpx 20rpx 20rpx;
		padding: 28rpx 24rpx 22rpx;
		box-sizing: border-box;
		max-height: 85vh;
		overflow: auto;
		box-shadow: 0 28rpx 70rpx rgba(15, 23, 42, 0.24);
		position: relative;
		z-index: 1;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.dialog.lg {
		max-height: 90vh;
	}

	.cmd-dialog {
		border: 1rpx solid #dbe7ff;
		max-height: 84vh;
		background: #ffffff !important;
		background-color: #ffffff !important;
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 16rpx;
	}

	.dlg-sub {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		margin-bottom: 16rpx;
	}

	.ro-hint {
		display: block;
		font-size: 24rpx;
		color: #475569;
		line-height: 1.5;
		margin-bottom: 10rpx;
		padding: 12rpx 14rpx;
		background: #f1f5f9;
		border-radius: 12rpx;
	}
	.ro-meta {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin-bottom: 14rpx;
	}

	.inp {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #dbe3ef;
		border-radius: 14rpx;
		padding: 0 18rpx;
		margin-bottom: 14rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #f8fafc;
	}

	.dialog-actions {
		display: flex;
		justify-content: space-between;
		gap: 14rpx;
		margin-top: 18rpx;
	}

	.btn {
		flex: 1;
		min-width: 0;
		height: 80rpx;
		line-height: 80rpx;
		font-size: 28rpx;
		border-radius: 14rpx;
		font-weight: 700;
	}

	.btn.ghost {
		background: #f1f5f9 !important;
		color: #334155;
		border: 1rpx solid #dbe3ef;
	}

	.btn.primary {
		padding: 0 28rpx;
		background: linear-gradient(135deg, #5b8cff, #6478ff) !important;
		border: none !important;
		box-shadow: 0 10rpx 24rpx rgba(91, 140, 255, 0.36);
	}

	.btn::after {
		border: none !important;
	}

	.cmd-picker-line {
		font-size: 24rpx;
		color: #334155;
		padding: 16rpx 12rpx;
		border: 1rpx solid #dbe3ef;
		border-radius: 12rpx;
		background: #ffffff !important;
		margin-bottom: 10rpx;
	}

	.cmd-tpl-bar {
		white-space: nowrap;
		margin: 0 0 8rpx;
	}
	.cmd-tpl {
		display: inline-block;
		margin-right: 10rpx;
		padding: 10rpx 20rpx;
		border-radius: 999rpx;
		background: #eef2ff;
		border: 1rpx solid #c7d2fe;
	}
	.cmd-tpl-t {
		font-size: 22rpx;
		color: #3730a3;
		font-weight: 600;
	}

	.ai-preview {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #475569;
		line-height: 1.45;
	}
	.ai-preview.sm {
		margin-top: 4rpx;
		font-size: 20rpx;
	}
	.auto-line {
		display: block;
		margin: 6rpx 0 0;
		font-size: 22rpx;
		font-weight: 700;
		color: #0d9488;
	}
	.auto-line.sm {
		font-size: 20rpx;
		margin-top: 2rpx;
	}
	.auto-log {
		max-height: 180rpx;
		margin-bottom: 12rpx;
		padding: 10rpx 12rpx;
		background: #ecfdf5;
		border-radius: 10rpx;
	}
	.auto-log-t {
		font-size: 20rpx;
		color: #0f172a;
		line-height: 1.4;
		white-space: pre-wrap;
	}
	.ai-report {
		max-height: 200rpx;
		margin-bottom: 14rpx;
		padding: 12rpx 14rpx;
		background: #f1f5f9;
		border-radius: 12rpx;
	}
	.ai-report-t {
		font-size: 24rpx;
		color: #1e293b;
		line-height: 1.5;
	}

	.cmd-ta {
		width: 100%;
		min-height: 180rpx;
		border: 1rpx solid #dbe3ef;
		border-radius: 14rpx;
		padding: 14rpx;
		margin-top: 8rpx;
		margin-bottom: 12rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #ffffff !important;
		background-color: #ffffff !important;
		opacity: 1 !important;
	}

	.cmd-inp {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #dbe3ef;
		border-radius: 14rpx;
		padding: 0 18rpx;
		margin-bottom: 14rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #ffffff !important;
		background-color: #ffffff !important;
		opacity: 1 !important;
	}

	.cmd-actions {
		margin-top: 10rpx;
	}

	.cmd-btn {
		height: 78rpx;
		line-height: 78rpx;
	}
</style>
