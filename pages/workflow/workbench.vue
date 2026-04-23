<template>
	<view class="wb">
		<view class="hero">
			<text class="hero-title">{{ screenTitle }}</text>
			<text class="hero-sub">{{ t('workbench_id_label') }}{{ workflowId || "-" }}</text>
		</view>

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

			<view v-if="taskView === 'dept'">
				<view v-for="dept in deptKeys" :key="dept" class="blk">
					<text class="blk-title">{{ dept }}</text>
					<view v-for="task in groupedByDept[dept]" :key="taskKey(task)" class="card" @click="openProgress(task)">
						<view class="card-h">
							<text class="card-t">{{ taskTitle(task) }}</text>
							<text class="badge" :class="statusClass(task)">{{ statusLabel(task) }}</text>
						</view>
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
						<text class="link" @click="openLinkTask(m)">{{ t('link_task') }}</text>
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
				<text v-for="(e, idx) in graphEdges" :key="idx" class="edge-line">{{ edgeLabel(e) }}</text>
			</view>
			<view class="tail-gap" />
		</scroll-view>

		<!-- 动态 -->
		<scroll-view v-show="mainTab === 'feed'" scroll-y class="panel">
			<button class="refresh" size="mini" @click="loadEvents">{{ t('refresh_feed') }}</button>
			<view v-if="events.length === 0" class="empty-inline">{{ t('no_events') }}</view>
			<view v-for="(ev, idx) in events" :key="idx" class="ev">
				<text class="ev-t">{{ eventText(ev) }}</text>
				<text class="ev-time">{{ eventTime(ev) }}</text>
			</view>
			<view class="tail-gap" />
		</scroll-view>

		<!-- 下发指令 -->
		<view v-if="showCommand" class="mask" @click.self="showCommand = false">
			<view class="dialog lg" @click.stop>
				<text class="dialog-title">{{ t('issue_command') }}</text>
				<picker mode="selector" :range="deptLabels" @change="onCmdSource">
					<view class="picker-line">{{ t('source_department') }}：{{ deptLabels[cmdSourceIdx] }}</view>
				</picker>
				<picker mode="selector" :range="deptLabels" @change="onCmdTarget">
					<view class="picker-line">{{ t('target_department') }}：{{ deptLabels[cmdTargetIdx] }}</view>
				</picker>
				<picker mode="selector" :range="levelLabels" @change="onCmdLevel">
					<view class="picker-line">{{ t('hierarchy_level') }}：{{ levelLabels[cmdLevelIdx] }}</view>
				</picker>
				<textarea class="ta" v-model="cmdBody" :placeholder="t('command_body_required')" />
				<input class="inp" v-model="cmdTaskTitle" :placeholder="t('generate_task_title_optional')" />
				<picker mode="selector" :range="taskPickLabels" @change="onCmdParent">
					<view class="picker-line">{{ t('parent_task') }}：{{ taskPickLabels[cmdParentIdx] }}</view>
				</picker>
				<picker mode="selector" :range="taskPickLabels" @change="onCmdDepend">
					<view class="picker-line">{{ t('dependent_task') }}：{{ taskPickLabels[cmdDependIdx] }}</view>
				</picker>
				<view class="dialog-actions">
					<button class="btn ghost" @click="showCommand = false">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="cmdLoading" @click="submitCommand">{{ t('submit') }}</button>
				</view>
			</view>
		</view>

		<!-- 更新进度 -->
		<view v-if="progressTask" class="mask" @click.self="progressTask = null">
			<view class="dialog" @click.stop>
				<text class="dialog-title">{{ t('update_progress') }}</text>
				<text class="dlg-sub">{{ taskTitle(progressTask) }}</text>
				<slider :value="progressValue" min="0" max="100" show-value @changing="onSlider" @change="onSlider" />
				<input class="inp" v-model="progressNote" :placeholder="t('remark_optional')" />
				<view class="dialog-actions">
					<button class="btn ghost" @click="progressTask = null">{{ t('cancel') }}</button>
					<button class="btn primary" type="primary" :loading="progressLoading" @click="submitProgress">{{ t('save') }}</button>
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
	import * as workflowApi from "@/clientApi/workflowApi";
	import { pickId } from "@/utils/apiHelpers";
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
				linkMsg: null,
				linkTaskIndex: 0,
				linkLoading: false,
				pollTimer: null,
				realtimeUnsub: null,
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
		},
		onLoad(options) {
			this.workflowId = options.id ? decodeURIComponent(options.id) : "";
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
			if (!this.workflowId) {
				uni.showToast({ title: this.t("missing_workflow_id"), icon: "none" });
				return;
			}
			await this.bootstrapPage();
			this.startPoll();
			this.startRealtime();
		},
		onHide() {
			this.stopPoll();
			this.stopRealtime();
		},
		onUnload() {
			this.stopPoll();
			this.stopRealtime();
		},
		watch: {
			async threadKind() {
				await this.loadThreads();
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
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			shortId(id) {
				if (!id) return "-";
				const s = String(id);
				return s.length > 8 ? `${s.slice(0, 6)}…` : s;
			},
			async bootstrapPage() {
				await workflowApi.commsBootstrap(this.workflowId);
				const meta = await workflowApi.getWorkflow(this.workflowId);
				this.meta = meta;
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
				await Promise.all([this.loadTasks(), this.loadThreads(), this.loadGraph(), this.loadEvents()]);
				if (!this.selectedThreadId && this.filteredThreads.length > 0) {
					this.selectThread(this.filteredThreads[0]);
				}
			},
			startPoll() {
				this.stopPoll();
				this.pollTimer = setInterval(() => {
					this.loadTasks();
					this.loadEvents();
				}, 25000);
			},
			stopPoll() {
				if (this.pollTimer) {
					clearInterval(this.pollTimer);
					this.pollTimer = null;
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
					const list = await workflowApi.listTasks(this.workflowId);
					this.tasks = Array.isArray(list) ? list : [];
				} catch {
					this.tasks = [];
				}
			},
			async loadThreads() {
				try {
					const list = await workflowApi.listThreads(this.workflowId, { kind: this.threadKind });
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
					const list = await workflowApi.listMessages(this.workflowId, this.selectedThreadId, { limit: 200 });
					this.messages = Array.isArray(list) ? list : [];
				} catch {
					this.messages = [];
				}
			},
			async loadGraph() {
				try {
					this.graph = await workflowApi.getCollaborationGraph(this.workflowId);
				} catch {
					this.graph = null;
				}
			},
			async loadEvents() {
				try {
					const list = await workflowApi.listEvents(this.workflowId, { limit: 50 });
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
					await workflowApi.commsBootstrap(this.workflowId);
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
					await workflowApi.postCommand(this.workflowId, payload);
					uni.showToast({ title: this.t('issued'), icon: "success" });
					this.showCommand = false;
					await this.loadTasks();
				} catch {
					//
				} finally {
					this.cmdLoading = false;
				}
			},
			openProgress(task) {
				this.progressTask = task;
				this.progressValue = this.taskPercent(task);
				this.progressNote = "";
			},
			onSlider(e) {
				this.progressValue = Number(e.detail.value);
			},
			async submitProgress() {
				if (!this.progressTask) return;
				const taskId = this.taskKey(this.progressTask);
				if (!taskId) return;
				this.progressLoading = true;
				try {
					const note = (this.progressNote || "").trim();
					await workflowApi.updateTaskProgress(this.workflowId, taskId, {
						progressPercent: this.progressValue,
						note,
						remark: note,
					});
					uni.showToast({ title: this.t('updated'), icon: "success" });
					this.progressTask = null;
					await this.loadTasks();
				} catch {
					//
				} finally {
					this.progressLoading = false;
				}
			},
			threadKey(th) {
				return pickId(th) || th.threadId || "";
			},
			threadTitle(th) {
				return th.title || th.name || th.topic || this.t("thread_default");
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
					await workflowApi.sendMessage(this.workflowId, this.selectedThreadId, payload);
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
					await workflowApi.broadcastComms(this.workflowId, payload);
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
					const payload = {
						kind: this.threadKind,
						title: title || `${this.t("thread_default")} ${new Date().toLocaleTimeString()}`,
					};
					const created = await workflowApi.createThread(this.workflowId, payload);
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
					await workflowApi.linkMessageToTask(this.workflowId, messageId, { taskId });
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
			eventText(ev) {
				return ev.type || ev.eventType || ev.action || JSON.stringify(ev).slice(0, 120);
			},
			eventTime(ev) {
				return ev.createdAt || ev.time || ev.timestamp || "";
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

	.ev {
		background: #fff;
		padding: 14rpx;
		border-radius: 12rpx;
		margin-bottom: 10rpx;
		border: 1rpx solid #e8ecf3;
	}

	.ev-t {
		font-size: 24rpx;
		color: #1e293b;
		display: block;
	}

	.ev-time {
		font-size: 20rpx;
		color: #94a3b8;
		margin-top: 6rpx;
		display: block;
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
		background: rgba(15, 23, 42, 0.45);
		z-index: 10050;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 40rpx 24rpx;
		padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.dialog {
		width: 100%;
		background: #fff;
		border-radius: 22rpx;
		padding: 24rpx;
		box-sizing: border-box;
		max-height: 85vh;
		overflow: auto;
	}

	.dialog.lg {
		max-height: 90vh;
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 12rpx;
	}

	.dlg-sub {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		margin-bottom: 16rpx;
	}

	.inp {
		width: 100%;
		height: 76rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 0 16rpx;
		margin-bottom: 12rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #f8fafc;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 14rpx;
		margin-top: 16rpx;
	}

	.btn {
		min-width: 160rpx;
		height: 72rpx;
		line-height: 72rpx;
		font-size: 28rpx;
		border-radius: 12rpx;
	}

	.btn.ghost {
		background: #f1f5f9;
		color: #334155;
	}

	.btn.primary {
		padding: 0 28rpx;
	}
</style>
