/**
 * 本地工作流/项目：列表与创建不依赖后端；在「我的 → 员工与模型」配置 API Key 后，
 * 任务拆解、指令转任务、全自动流水线会真实请求 OpenAI 兼容的 chat/completions 并落库；
 * 任务上会记录 llmCallHistory / llmRequesting，便于界面展示「确实在调模型」。
 */

import agentDepartments from "@/data/agentDepartments";
import { chatCompletion } from "@/utils/openaiCompatible";
import { extractAssistantText } from "@/utils/openaiResponse";
import { getLlmSettings, getLlmConnectionSummary } from "@/utils/llmSettings";

const STORAGE_KEY = "cachedWorkflowList";
const TASKS_KEY = "localWorkflowTasks_v1";
const EVENTS_KEY = "localWorkflowEvents_v1";
const COMMS_KEY = "localWorkflowComms_v1";

const DEPT_ID_SET = new Set(agentDepartments.map((d) => d.id));
const DEPT_ID_LIST = agentDepartments.map((d) => d.id).join(", ");

function generateWorkflowId() {
	return `ct-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function newTaskId() {
	return `ct-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getWorkflowList() {
	try {
		const cached = uni.getStorageSync(STORAGE_KEY);
		if (Array.isArray(cached) && cached.length > 0) {
			return cached;
		}
	} catch (e) {
		console.warn("[localWorkflowStore] read list", e);
	}
	return [];
}

function saveWorkflowList(list) {
	try {
		uni.setStorageSync(STORAGE_KEY, Array.isArray(list) ? list : []);
	} catch (e) {
		console.warn("[localWorkflowStore] save list", e);
	}
}

function getTaskMap() {
	try {
		const raw = uni.getStorageSync(TASKS_KEY);
		if (raw && typeof raw === "object" && !Array.isArray(raw)) {
			return raw;
		}
	} catch (e) {
		console.warn("[localWorkflowStore] read tasks", e);
	}
	return {};
}

function saveTaskMap(m) {
	try {
		uni.setStorageSync(TASKS_KEY, m);
	} catch (e) {
		console.warn("[localWorkflowStore] save tasks", e);
	}
}

function getEventMap() {
	try {
		const raw = uni.getStorageSync(EVENTS_KEY);
		if (raw && typeof raw === "object" && !Array.isArray(raw)) {
			return raw;
		}
	} catch (e) {
		console.warn("[localWorkflowStore] read events", e);
	}
	return {};
}

function saveEventMap(m) {
	try {
		uni.setStorageSync(EVENTS_KEY, m);
	} catch (e) {
		console.warn("[localWorkflowStore] save events", e);
	}
}

function getTasksForWorkflowInner(workflowId) {
	if (!workflowId) return [];
	const m = getTaskMap();
	const arr = m[workflowId];
	return Array.isArray(arr) ? arr : [];
}

/** 用于展示：最近更新（无则用创建时间）越新越靠前 */
function taskRecencyMs(t) {
	if (!t || typeof t !== "object") return 0;
	const u = Number(t.updatedAt);
	const c = Number(t.createdAt);
	if (Number.isFinite(u) && u > 0) return u;
	if (Number.isFinite(c) && c > 0) return c;
	return 0;
}

function sortTasksNewestFirst(list) {
	if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? [...list] : [];
	return [...list].sort((a, b) => {
		const tb = taskRecencyMs(b);
		const ta = taskRecencyMs(a);
		if (tb !== ta) return tb - ta;
		const ida = String(a.id || a.taskId || "");
		const idb = String(b.id || b.taskId || "");
		return idb.localeCompare(ida);
	});
}

function saveTasksForWorkflowInner(workflowId, tasks) {
	if (!workflowId) return;
	const m = { ...getTaskMap() };
	m[workflowId] = tasks;
	saveTaskMap(m);
}

function pushEvents(workflowId, event) {
	if (!workflowId || !event) return;
	const m = { ...getEventMap() };
	const arr = Array.isArray(m[workflowId]) ? [...m[workflowId]] : [];
	const ev = {
		...event,
		createdAt: event.createdAt != null ? event.createdAt : Date.now(),
	};
	arr.unshift(ev);
	m[workflowId] = arr.slice(0, 200);
	saveEventMap(m);
}

function getLlmIfConfigured() {
	const { apiKey, baseUrl, model } = getLlmSettings();
	if (!String(apiKey || "").trim()) return null;
	return { apiKey, baseUrl, model: model || "gpt-4o-mini" };
}

/** 无 API Key 时：按句拆成 2～3 条可执行任务 */
function mockDecomposeToTaskPayloads(params) {
	const brief = String(params.brief || "").trim();
	if (!brief) return [];
	const max = Math.min(8, Math.max(1, Number(params.maxTasks) || 6));
	const toDept = normDept(params.toDepartment || "engineering");
	const fromD = normDept(params.fromDepartment || "product");
	const lines = brief
		.split(/[。\n.;\u3001]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const chunks = lines.length > 0 ? lines.slice(0, 4) : [brief];
	const n = Math.min(max, Math.max(2, Math.min(3, Math.ceil(brief.length / 60))));
	const fake = [];
	for (let i = 0; i < n; i++) {
		const part = chunks[Math.min(i, chunks.length - 1)] || brief;
		const t = {
			title: (i === 0 ? "整体推进" : `步骤 ${i + 1}`) + "：" + (part.length > 32 ? part.slice(0, 32) + "…" : part),
			description: `【本机速拆、未接大模型】请围绕：${part.slice(0, 500)}`.trim(),
			department: i % 2 === 0 ? toDept : fromD,
			status: i === 0 ? "IN_PROGRESS" : "NOT_STARTED",
			hierarchyLevel: 2,
		};
		fake.push(t);
	}
	return fake.map((t, j) => buildTaskFromDecompose(t, j));
}

function mockExecuteCommandPayload(commandCtx) {
	const { sourceDepartment, targetDepartment, hierarchyLevel, text, customTitle } = commandCtx;
	const id = newTaskId();
	return {
		id,
		taskId: id,
		title: String(customTitle || text.slice(0, 32)).slice(0, 120),
		name: String(customTitle || text.slice(0, 32)).slice(0, 120),
		description: text,
		aiExecutionReport: `【未联网大模型】未配置 API Key 或接口不可用，以下为本地规则生成的占位说明。\n- 自 ${sourceDepartment} 到 ${targetDepartment} 的 L${hierarchyLevel} 指令已记录。\n- 在「我的 → 员工与模型」填写密钥并保存后，此处会改为真实 chat/completions 返回的交付说明。`.trim(),
		department: normDept(targetDepartment),
		status: "IN_PROGRESS",
		hierarchyLevel: Math.min(5, Math.max(1, Number(hierarchyLevel) || 1)),
		progressPercent: 20,
		aiGenerated: true,
		offlineOnly: true,
		commandText: text,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

function stripCodeFence(s) {
	const t = String(s || "").trim();
	const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (m) return m[1].trim();
	return t;
}

function parseJsonObjectLoose(s) {
	const raw = stripCodeFence(s);
	try {
		return JSON.parse(raw);
	} catch {
		const i = raw.indexOf("{");
		const j = raw.lastIndexOf("}");
		if (i >= 0 && j > i) {
			return JSON.parse(raw.slice(i, j + 1));
		}
	}
	throw new Error("invalid_json");
}

function normDept(s) {
	const x = String(s || "engineering")
		.trim()
		.toLowerCase();
	if (DEPT_ID_SET.has(x)) return x;
	if (x === "dev" || x === "devops") return "engineering";
	if (x === "mkt") return "marketing";
	return "engineering";
}

function normStatus(s) {
	const u = String(s || "IN_PROGRESS")
		.trim()
		.toUpperCase();
	if (["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"].includes(u)) return u;
	return "IN_PROGRESS";
}

function buildTaskFromDecompose(t, i) {
	const id = newTaskId();
	return {
		id,
		taskId: id,
		title: String(t.title || t.name || `任务 ${i + 1}`).slice(0, 120),
		name: String(t.title || t.name || `任务 ${i + 1}`).slice(0, 120),
		description: String(t.description || t.desc || "").trim(),
		department: normDept(t.department),
		status: normStatus(t.status),
		hierarchyLevel: Math.min(5, Math.max(1, Number(t.hierarchyLevel) || 2)),
		progressPercent: normStatus(t.status) === "NOT_STARTED" ? 0 : 20,
		aiGenerated: true,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

/**
 * 由大模型拆解需求为多条任务；未配置 API 时走本机速拆
 * @param {string} [workflowIdForTrace] 写入工作流 meta 的「正在调模型拆解」状态，供工作台轮询展示
 */
async function llmDecomposeToTaskPayloads(params, workflowIdForTrace) {
	const max = Math.min(10, Math.max(1, Number(params.maxTasks) || 6));
	const from = String(params.fromDepartment || "product");
	const toLv = Math.min(5, Math.max(1, Number(params.toLevel) || 1));
	const brief = String(params.brief || "").trim();
	if (!brief) throw new Error("brief 不能为空");
	const toDept = normDept(params.toDepartment || "engineering");
	const mockParams = { ...params, maxTasks: max, toDepartment: toDept };
	const wfId = String(workflowIdForTrace || "").trim();
	const summ = getLlmConnectionSummary();
	const llm = getLlmIfConfigured();
	if (!llm) {
		if (wfId) {
			patchWorkflowMeta(wfId, {
				workflowLlmBusy: false,
				workflowLlmPhase: "",
				workflowLlmPhaseLabel: "",
				llmWorkflowLastDecomposeUsedApi: false,
				llmWorkflowLastDecomposeAt: Date.now(),
			});
		}
		return mockDecomposeToTaskPayloads(mockParams);
	}
	const { apiKey, baseUrl, model } = llm;
	if (wfId) {
		patchWorkflowMeta(wfId, {
			workflowLlmBusy: true,
			workflowLlmPhase: "task_decompose",
			workflowLlmPhaseLabel: "大模型：将需求拆解为任务",
			workflowLlmModel: summ.model,
			workflowLlmEndpoint: summ.apiEndpoint,
			workflowLlmStartedAt: Date.now(),
		});
	}
	try {
		const system = `You are a project task decomposer. Output a single JSON object only, no markdown, no other text.
Schema: { "tasks": [ { "title": string, "description": string, "department": one of [${DEPT_ID_LIST}], "status": "NOT_STARTED" or "IN_PROGRESS", "hierarchyLevel": 1-5 } ] }
"department" is the **owning** unit for the task (who executes). Use at most ${max} tasks. Write title/description in the same language as the user's request.`;
		const user = {
			role: "user",
			content: `User goal:\n${brief}\n\nFlow context: from department "${from}" toward collaboration depth L${toLv}.`,
		};

		const data = await chatCompletion({
			apiKey,
			baseUrl,
			model,
			system,
			messages: [user],
			timeoutMs: 120000,
		});
		const text = extractAssistantText(data);
		const parsed = parseJsonObjectLoose(text);
		const list = Array.isArray(parsed.tasks) ? parsed.tasks : [];
		const out = list.slice(0, max).map((t, i) => buildTaskFromDecompose(t, i));
		if (out.length) {
			if (wfId) {
				patchWorkflowMeta(wfId, {
					workflowLlmBusy: false,
					workflowLlmPhase: "",
					workflowLlmPhaseLabel: "",
					llmWorkflowLastDecomposeUsedApi: true,
					llmWorkflowLastDecomposeAt: Date.now(),
					llmWorkflowLastDecomposeError: "",
				});
			}
			return out;
		}
	} catch (e) {
		if (import.meta.env.MODE === "development") {
			console.warn("[localWorkflowStore] decompose, fallback to mock", e);
		}
		if (wfId) {
			patchWorkflowMeta(wfId, {
				workflowLlmBusy: false,
				llmWorkflowLastDecomposeUsedApi: false,
				llmWorkflowLastDecomposeAt: Date.now(),
				llmWorkflowLastDecomposeError: String((e && e.message) || e).slice(0, 240),
			});
		}
	}
	const fallback = mockDecomposeToTaskPayloads({ ...params, maxTasks: max, toDepartment: toDept });
	if (wfId) {
		patchWorkflowMeta(wfId, {
			workflowLlmBusy: false,
			workflowLlmPhase: "",
			workflowLlmPhaseLabel: "",
		});
	}
	return fallback;
}

/**
 * 大模型对「跨部门指令」生成任务与交付说明；未配置 API 时走本机说明
 * @param {{ workflowId: string, taskId: string }} [trace] 用于 UI：请求前标记 llmRequesting、返回后写入 llmCallHistory
 */
async function llmExecuteCommandPayload(commandCtx, trace) {
	const { sourceDepartment, targetDepartment, hierarchyLevel, text, customTitle } = commandCtx;
	const summ = getLlmConnectionSummary();
	const traceIds = trace && trace.workflowId && trace.taskId ? { workflowId: trace.workflowId, taskId: trace.taskId } : null;
	const llm = getLlmIfConfigured();
	const t0 = Date.now();
	if (!llm) {
		const m = mockExecuteCommandPayload(commandCtx);
		m.llmCallHistory = mergeTaskLlmHistories(m.llmCallHistory, [
			{
				phase: "command_generate",
				label: "指令转任务（chat/completions）",
				usedRealApi: false,
				durationMs: 0,
				note: "未配置 API Key，未发起网络请求",
			},
		]);
		m.offlineOnly = true;
		if (traceIds) {
			patchTaskInStorage(traceIds.workflowId, traceIds.taskId, { llmRequesting: false });
		}
		return m;
	}
	const { apiKey, baseUrl, model } = llm;
	const endpoint = summ.apiEndpoint;
	if (traceIds) {
		patchTaskInStorage(traceIds.workflowId, traceIds.taskId, {
			llmRequesting: true,
			llmRequestPhase: "command_generate",
			llmRequestPhaseLabel: "大模型：解析指令并生成任务与交付说明",
			llmRequestModel: model,
			llmRequestEndpoint: endpoint,
			llmRequestStartedAt: t0,
		});
	}
	try {
		const system = `You simulate execution of a cross-department work instruction. Return one JSON only, no markdown.
Schema: { "taskTitle": string, "taskDescription": string, "executionReport": string, "suggestedStatus": "NOT_STARTED"|"IN_PROGRESS"|"BLOCKED"|"DONE", "suggestedProgress": number 0-100 }
"executionReport" is the main deliverable in the user's language: concrete outcomes, next steps, risks. About 200–500 Chinese characters or equivalent if the user writes English.`;
		const user = {
			role: "user",
			content: `From: ${sourceDepartment} → to: ${targetDepartment}. Hierarchy: L${hierarchyLevel}.\nInstruction:\n${text}\n${
				customTitle ? `Preferred title (optional): ${customTitle}\n` : ""
			}`,
		};

		const data = await chatCompletion({
			apiKey,
			baseUrl,
			model,
			system,
			messages: [user],
			timeoutMs: 120000,
		});
		const textRes = extractAssistantText(data);
		const parsed = parseJsonObjectLoose(textRes);
		const id = newTaskId();
		const pct = (() => {
			const p = Number(parsed.suggestedProgress);
			if (Number.isFinite(p)) return Math.max(0, Math.min(100, Math.round(p)));
			return 15;
		})();
		const durationMs = Date.now() - t0;
		return {
			id,
			taskId: id,
			title: String(parsed.taskTitle || customTitle || text.slice(0, 32)).slice(0, 120),
			name: String(parsed.taskTitle || customTitle || text.slice(0, 32)).slice(0, 120),
			description: String(parsed.taskDescription || text).trim(),
			aiExecutionReport: String(parsed.executionReport || "").trim(),
			department: normDept(targetDepartment),
			status: normStatus(parsed.suggestedStatus),
			hierarchyLevel: Math.min(5, Math.max(1, Number(hierarchyLevel) || 1)),
			progressPercent: pct,
			aiGenerated: true,
			commandText: text,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			llmLastRealApiAt: Date.now(),
			llmCallHistory: [
				{
					phase: "command_generate",
					label: "指令转任务（chat/completions）",
					usedRealApi: true,
					durationMs,
					endpoint,
					model,
				},
			],
		};
	} catch (e) {
		if (import.meta.env.MODE === "development") {
			console.warn("[localWorkflowStore] command LLM, fallback to mock", e);
		}
		const msg = String((e && e.message) || e).slice(0, 400);
		const m = mockExecuteCommandPayload(commandCtx);
		m.aiExecutionReport = `【已配置 API，但本次 chat/completions 请求失败，以下为本地降级】\n${msg}\n\n---\n\n${m.aiExecutionReport}`;
		m.offlineOnly = true;
		m.llmCallHistory = mergeTaskLlmHistories(m.llmCallHistory, [
			{
				phase: "command_generate",
				label: "指令转任务（chat/completions）",
				usedRealApi: false,
				durationMs: Date.now() - t0,
				endpoint,
				model,
				note: msg.slice(0, 200),
			},
		]);
		return m;
	} finally {
		if (traceIds) {
			patchTaskInStorage(traceIds.workflowId, traceIds.taskId, { llmRequesting: false });
		}
	}
}

/* ---------- 任务全自动：分析 → 规划 → 执行 → 测试/优化 循环 → 完成 ---------- */

const AUTO_LABEL = {
	analyzing: "需求分析",
	planning: "执行规划",
	executing: "落地执行",
	refining: "迭代优化",
	testing: "回归测试",
	completing: "验收通过",
};

function sleepMs(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function patchTaskInStorage(workflowId, taskId, patch) {
	if (!workflowId || !taskId) return null;
	const tasks = getTasksForWorkflowInner(workflowId);
	const i = tasks.findIndex((t) => (t.id || t.taskId) === String(taskId));
	if (i < 0) return null;
	const next = { ...tasks[i], ...patch, updatedAt: Date.now() };
	const o = tasks.slice();
	o[i] = next;
	saveTasksForWorkflowInner(workflowId, o);
	return next;
}

function mergeTaskLlmHistories(a, b) {
	const x = Array.isArray(a) ? a : [];
	const y = Array.isArray(b) ? b : [];
	return [...x, ...y].slice(-40);
}

function appendTaskLlmHistory(workflowId, taskId, entry) {
	const tid = String(taskId);
	const tasks = getTasksForWorkflowInner(workflowId);
	const i = tasks.findIndex((t) => (t.id || t.taskId) === tid);
	if (i < 0) return;
	const prev = Array.isArray(tasks[i].llmCallHistory) ? tasks[i].llmCallHistory : [];
	const row = { ...entry, at: entry && entry.at != null ? entry.at : Date.now() };
	patchTaskInStorage(workflowId, tid, { llmCallHistory: [...prev, row].slice(-40) });
}

function patchWorkflowMeta(workflowId, patch) {
	if (!workflowId || !patch || typeof patch !== "object") return;
	const list = getWorkflowList();
	const i = list.findIndex((w) => String(w.id || w.workflowId) === String(workflowId));
	if (i < 0) return;
	const o = list.slice();
	o[i] = { ...o[i], ...patch, updatedAt: Date.now() };
	saveWorkflowList(o);
}

/** 任务列表区域是否需要轮询（自动流水线、指令转任务、生命周期中的 LLM 请求） */
export function needsTaskLivePolling(workflowId) {
	if (!workflowId) return false;
	if (hasRunningAutomation(workflowId)) return true;
	return getTasksForWorkflowInner(workflowId).some(
		(t) => t.pendingLlm === true || t.llmRequesting === true
	);
}

const LIFECYCLE_LLM_LABEL = {
	analyze: "大模型：需求分析",
	plan: "大模型：执行规划",
	execute: "大模型：落地执行",
	refine: "大模型：迭代优化",
	test: "大模型：回归测试",
};

function lifecycleStepMock(phase, ctx) {
	const base = (ctx.title || "任务") + " · " + (String(ctx.description || "").slice(0, 200) || "（无更多说明）");
	if (phase === "analyze") {
		return { text: `已梳理目标与范围：${base.slice(0, 300)}` };
	}
	if (phase === "plan") {
		return { text: `里程碑：1) 环境准备 2) 核心实现 3) 联调 4) 回执。与「${(ctx.analysis || "").slice(0, 80)}…」对齐。` };
	}
	if (phase === "execute") {
		return { text: `已按规划落地：可交付物清单、主要改动与风险点已落档；与「${(ctx.plan || "").slice(0, 80)}…」一致。` };
	}
	if (phase === "refine") {
		return { text: `根据测试反馈「${(ctx.testFeedback || "").slice(0, 120)}」已做修正与补测。` };
	}
	if (phase === "test") {
		const round = Number(ctx.testRound) || 1;
		const passed = round >= 2;
		return {
			text: `第${round}轮：核心路径 ${passed ? "通过" : "未通过，待优化"}。冒烟与回归检查已记录。`,
			passed,
		};
	}
	return { text: "" };
}

async function lifecycleStepLlm(phase, ctx, trace) {
	const traceIds = trace && trace.workflowId && trace.taskId ? { workflowId: trace.workflowId, taskId: trace.taskId } : null;
	const summ = getLlmConnectionSummary();
	const llm = getLlmIfConfigured();
	if (!llm) {
		const r = lifecycleStepMock(phase, ctx);
		if (traceIds) {
			appendTaskLlmHistory(traceIds.workflowId, traceIds.taskId, {
				phase: `lifecycle_${phase}`,
				label: LIFECYCLE_LLM_LABEL[phase] || phase,
				usedRealApi: false,
				durationMs: 0,
				note: "未配置 API Key，未发起网络请求",
			});
		}
		return r;
	}
	const { apiKey, baseUrl, model } = llm;
	const userCtx = {
		phase,
		title: String(ctx.title || "").slice(0, 2000),
		description: String(ctx.description || "").slice(0, 4000),
		analysis: String(ctx.analysis || "").slice(0, 2000),
		plan: String(ctx.plan || "").slice(0, 2000),
		execution: String(ctx.execution || "").slice(0, 2000),
		testRound: ctx.testRound,
		testFeedback: String(ctx.testFeedback || "").slice(0, 2000),
	};
	const systemByPhase = {
		analyze:
			"你是交付经理。只输出一个 JSON 对象：{\"analysis\":\"...\"}。analysis 为中文 200–500 字，概括需求、约束与验收。",
		plan: "你是项目经理。只输出 JSON：{\"plan\":\"...\",\"milestones\":[\"...\"]} 。plan 为中文 200–500 字。",
		execute:
			"你模拟已完成的执行结果。只输出 JSON：{\"execution\":\"...\"}。执行说明 200–500 字，可含交付物与风险。",
		refine:
			"根据测试不通过原因做改进。只输出 JSON：{\"improvement\":\"...\"} 。中文 200–500 字。",
		test:
			"你模拟质量工程师。只输出 JSON：{\"testReport\":\"...\",\"passed\": true/false} 。第 1 轮可 passed:false 以暴露问题；第 2 轮起无重大缺陷时 passed:true 。",
	};
	const system = systemByPhase[phase] || systemByPhase.analyze;
	const t0 = Date.now();
	if (traceIds) {
		patchTaskInStorage(traceIds.workflowId, traceIds.taskId, {
			llmRequesting: true,
			llmRequestPhase: phase,
			llmRequestPhaseLabel: LIFECYCLE_LLM_LABEL[phase] || phase,
			llmRequestModel: model,
			llmRequestEndpoint: summ.apiEndpoint,
			llmRequestStartedAt: t0,
		});
	}
	try {
		const data = await chatCompletion({
			apiKey,
			baseUrl,
			model,
			system,
			messages: [{ role: "user", content: JSON.stringify(userCtx) }],
			timeoutMs: 90000,
		});
		const raw = parseJsonObjectLoose(extractAssistantText(data));
		const durationMs = Date.now() - t0;
		let result;
		if (phase === "test") {
			result = {
				text: String(raw.testReport || raw.report || JSON.stringify(raw)).trim(),
				passed: raw.passed === true || raw.passed === "true" || String(raw.status).toLowerCase() === "pass",
			};
		} else if (phase === "plan") {
			const planText = [raw.plan, Array.isArray(raw.milestones) ? raw.milestones.join("；") : ""]
				.filter(Boolean)
				.join("\n");
			result = { text: String(planText || raw.plan || "").trim() || "(空)" };
		} else if (phase === "execute") {
			result = { text: String(raw.execution || raw.executive || raw.result || "").trim() || "(空)" };
		} else if (phase === "refine") {
			result = { text: String(raw.improvement || raw.refine || raw.text || "").trim() || "(空)" };
		} else {
			result = { text: String(raw.analysis || raw.text || raw.summary || "").trim() || "(空)" };
		}
		if (traceIds) {
			appendTaskLlmHistory(traceIds.workflowId, traceIds.taskId, {
				phase: `lifecycle_${phase}`,
				label: LIFECYCLE_LLM_LABEL[phase] || phase,
				usedRealApi: true,
				durationMs,
				endpoint: summ.apiEndpoint,
				model,
			});
		}
		return result;
	} catch (e) {
		if (import.meta.env.MODE === "development") {
			console.warn("[localWorkflowStore] lifecycle LLM", phase, e);
		}
		if (traceIds) {
			appendTaskLlmHistory(traceIds.workflowId, traceIds.taskId, {
				phase: `lifecycle_${phase}`,
				label: LIFECYCLE_LLM_LABEL[phase] || phase,
				usedRealApi: false,
				durationMs: Date.now() - t0,
				note: String((e && e.message) || e).slice(0, 200),
			});
		}
		return lifecycleStepMock(phase, ctx);
	} finally {
		if (traceIds) {
			patchTaskInStorage(traceIds.workflowId, traceIds.taskId, { llmRequesting: false });
		}
	}
}

/**
 * 全自动跑完：分析 / 规划 / 执行 /（测试 ↔ 优化）* n / 置为完成。无需用户再次下发。
 */
export async function runAutonomousTaskLifecycle(workflowId, taskId) {
	const tid = String(taskId);
	const readT = () => {
		const ts = getTasksForWorkflowInner(workflowId);
		return ts.find((x) => (x.id || x.taskId) === tid);
	};
	let t = readT();
	if (!t) return;
	if (t.automationStatus === "complete") return;

	const baseTitle = t.title || t.name || "任务";
	const baseDesc = [t.description, t.commandText, t.aiExecutionReport]
		.filter(Boolean)
		.join("\n")
		.slice(0, 4000);

	const trace = { workflowId, taskId: tid };

	const appendLog = (line) => {
		const cur = readT();
		if (!cur) return;
		const prev = Array.isArray(cur.automationLog) ? cur.automationLog : [];
		patchTaskInStorage(workflowId, tid, {
			automationLog: [...prev, `${new Date().toLocaleTimeString()} ${line}`].slice(-50),
		});
	};

	const setRunning = (key, minPct) => {
		const cur = readT();
		const prevPct = Number(cur && cur.progressPercent) || 0;
		patchTaskInStorage(workflowId, tid, {
			automationStatus: "running",
			automationPhase: key,
			automationPhaseLabel: AUTO_LABEL[key] || key,
			progressPercent: Math.max(minPct, prevPct, 5),
			status: "IN_PROGRESS",
		});
	};

	patchTaskInStorage(workflowId, tid, {
		automationStatus: "running",
		automationPhase: "analyzing",
		automationPhaseLabel: AUTO_LABEL.analyzing,
		automationLog: ["已启动全自动：分析 → 规划 → 执行 → 测试与优化 → 完成"],
	});
	await sleepMs(300);

	setRunning("analyzing", 8);
	const an = await lifecycleStepLlm("analyze", { title: baseTitle, description: baseDesc }, trace);
	appendLog(`分析：${(an.text || "").slice(0, 200)}${(an.text || "").length > 200 ? "…" : ""}`);
	await sleepMs(300);

	setRunning("planning", 22);
	const pl = await lifecycleStepLlm(
		"plan",
		{
			title: baseTitle,
			description: baseDesc,
			analysis: an.text,
		},
		trace
	);
	appendLog(`规划：${(pl.text || "").slice(0, 200)}${(pl.text || "").length > 200 ? "…" : ""}`);
	await sleepMs(300);

	setRunning("executing", 35);
	const ex = await lifecycleStepLlm(
		"execute",
		{
			title: baseTitle,
			description: baseDesc,
			analysis: an.text,
			plan: pl.text,
		},
		trace
	);
	appendLog(`执行：${(ex.text || "").slice(0, 200)}${(ex.text || "").length > 200 ? "…" : ""}`);
	await sleepMs(350);

	let ctx = {
		title: baseTitle,
		description: baseDesc,
		analysis: an.text,
		plan: pl.text,
		execution: ex.text,
	};

	let testIter = 0;
	let lastReport = "";
	let passed = false;
	const maxRounds = 3;

	while (testIter < maxRounds && !passed) {
		testIter += 1;
		setRunning("testing", 45 + testIter * 5);
		const te = await lifecycleStepLlm("test", { ...ctx, testRound: testIter }, trace);
		lastReport = te.text || "";
		passed = te.passed === true;
		appendLog(`第${testIter}轮测试：${passed ? "通过" : "未通过"}`);
		if (passed) break;
		if (testIter >= maxRounds) {
			passed = true;
			lastReport = `${lastReport}\n（已达轮次上限，标记为验收通过。）`.trim();
			break;
		}
		setRunning("refining", 52 + testIter * 4);
		const re = await lifecycleStepLlm("refine", { ...ctx, testFeedback: lastReport, refineRound: testIter }, trace);
		ctx = { ...ctx, lastRefinement: re.text, testFeedback: lastReport };
		appendLog(`第${testIter}轮优化后重测`);
		await sleepMs(350);
	}

	const full = [
		"## 全自动执行与验收报告",
		"### 需求分析",
		an.text,
		"### 规划",
		pl.text,
		"### 执行与交付",
		ex.text,
		"### 测试结论",
		lastReport,
	].join("\n");

	const before = readT();
	const prevRep = (before && before.aiExecutionReport) || "";
	patchTaskInStorage(workflowId, tid, {
		automationStatus: "complete",
		automationPhase: "completing",
		automationPhaseLabel: AUTO_LABEL.completing,
		status: "DONE",
		progressPercent: 100,
		aiExecutionReport: [prevRep, full].filter(Boolean).join("\n\n---\n\n").slice(0, 20000),
		automationFullReport: full.slice(0, 20000),
	});
	appendLog("已自动完成：分析 / 规划 / 执行 / 测试与优化 / 验收");
	pushEvents(workflowId, {
		type: "AUTOMATION_DONE",
		eventType: "AUTOMATION_DONE",
		title: baseTitle,
		brief: "任务已自动跑完全流程",
	});
}

/**
 * 异步调度（不阻塞下发接口）
 * @param {number} [delayMs] 批量任务时错峰启动
 */
export function scheduleAutonomousTaskRun(workflowId, taskId, delayMs = 100) {
	setTimeout(() => {
		runAutonomousTaskLifecycle(workflowId, taskId).catch((err) => {
			const msg = (err && err.message) || String(err);
			patchTaskInStorage(workflowId, taskId, {
				automationStatus: "error",
				automationPhaseLabel: "异常中断",
				automationError: msg.slice(0, 500),
			});
			pushEvents(workflowId, { type: "AUTOMATION_ERROR", eventType: "AUTOMATION_ERROR", brief: msg.slice(0, 120) });
		});
	}, Math.max(0, delayMs));
}

/** 工作台用于判断是否需要刷新列表以展示自动进度 */
export function hasRunningAutomation(workflowId) {
	if (!workflowId) return false;
	return getTasksForWorkflowInner(workflowId).some((t) => t.automationStatus === "running");
}

export async function listWorkflows() {
	try {
		return getWorkflowList();
	} catch (e) {
		console.warn("[listWorkflows]", e);
		return [];
	}
}

export async function createWorkflow(input) {
	const nameRaw = (input && (input.name != null ? input.name : input.title)) || "";
	const title = String(nameRaw).trim() || "未命名项目";
	const desc = String((input && input.description) || "").trim();
	const wid = generateWorkflowId();
	const newWorkflow = {
		id: wid,
		workflowId: wid,
		title,
		name: title,
		description: desc,
		desc,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	const list = getWorkflowList();
	saveWorkflowList([newWorkflow, ...list]);
	if (import.meta.env.MODE === "development") {
		console.log("[createWorkflow]", { title, id: wid });
	}
	return newWorkflow;
}

function getCommsRoot() {
	try {
		const r = uni.getStorageSync(COMMS_KEY);
		return r && typeof r === "object" && !Array.isArray(r) ? r : {};
	} catch {
		return {};
	}
}

function saveCommsRoot(obj) {
	try {
		uni.setStorageSync(COMMS_KEY, obj);
	} catch (e) {
		console.warn("[localWorkflowStore] save comms", e);
	}
}

function purgeLocalWorkflowData(workflowId) {
	if (!workflowId) return;
	const m = { ...getTaskMap() };
	delete m[workflowId];
	saveTaskMap(m);
	const e = { ...getEventMap() };
	delete e[workflowId];
	saveEventMap(e);
	const cr = { ...getCommsRoot() };
	delete cr[workflowId];
	saveCommsRoot(cr);
}

export async function deleteWorkflow(workflowId) {
	if (!workflowId) throw new Error("workflowId 不能为空");
	const list = getWorkflowList();
	const filtered = list.filter((w) => {
		const wId = w.id || w.workflowId;
		return wId !== workflowId;
	});
	saveWorkflowList(filtered);
	purgeLocalWorkflowData(workflowId);
	if (import.meta.env.MODE === "development") {
		console.log("[deleteWorkflow]", workflowId);
	}
	return { success: true };
}

export async function getWorkflow(workflowId) {
	try {
		if (!workflowId) return null;
		const list = getWorkflowList();
		return list.find((w) => (w.id || w.workflowId) === workflowId) || null;
	} catch (e) {
		console.warn("[getWorkflow]", e);
		return null;
	}
}

/** 仅用于纯前端：冷启动链接或缓存丢失时，补一条可编辑的项目记录 */
export async function ensureWorkflowRecord(workflowId) {
	if (!workflowId) return null;
	const w = await getWorkflow(workflowId);
	if (w) return w;
	let title = "本地项目";
	try {
		const t = String(uni.getStorageSync("lastWorkflowTitle") || "").trim();
		if (t) title = t;
	} catch {
		//
	}
	const stub = {
		id: workflowId,
		workflowId,
		title,
		name: title,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	const list = getWorkflowList();
	const rest = list.filter((x) => (x.id || x.workflowId) !== workflowId);
	saveWorkflowList([stub, ...rest]);
	return stub;
}

export function clearAllWorkflows() {
	try {
		saveWorkflowList([]);
		uni.setStorageSync(TASKS_KEY, {});
		uni.setStorageSync(EVENTS_KEY, {});
		uni.setStorageSync(COMMS_KEY, {});
	} catch (e) {
		console.warn("[clearAllWorkflows]", e);
	}
}

/** 任务列表（与 clientApi 形态兼容）；按最近更新时间倒序，新的在上 */
export async function listTasks(workflowId) {
	const wid = String(workflowId || "").trim();
	if (!wid) return [];
	return sortTasksNewestFirst(getTasksForWorkflowInner(wid));
}

/** 自动流水线 / AI 生成任务：禁止用户手改进度（仅 automationStatus=error 时可人工补救） */
export function isManualTaskProgressDisabled(task) {
	if (!task || typeof task !== "object") return false;
	if (task.pendingLlm === true) return true;
	const st = String(task.automationStatus || "");
	if (st === "running" || st === "complete") return true;
	if (task.aiGenerated === true && st !== "error") return true;
	return false;
}

export async function updateTaskProgress(workflowId, taskId, body = {}) {
	if (!workflowId || !taskId) throw new Error("参数不完整");
	const tasks = getTasksForWorkflowInner(workflowId);
	const i = tasks.findIndex((t) => (t.id || t.taskId) === taskId);
	if (i < 0) throw new Error("未找到任务");
	const cur = tasks[i];
	if (isManualTaskProgressDisabled(cur)) {
		const e = new Error("MANUAL_PROGRESS_LOCKED");
		e.messageKey = "task_progress_manual_locked_toast";
		throw e;
	}
	const next = { ...tasks[i] };
	const rawPct = body && (body.progressPercent ?? body.progress ?? body.percent);
	const pct = (() => {
		if (rawPct == null || rawPct === "") {
			return Number(next.progressPercent) || 0;
		}
		const n = Number(rawPct);
		if (!Number.isFinite(n)) return next.progressPercent || 0;
		return Math.max(0, Math.min(100, Math.round(n)));
	})();
	const note = String((body && (body.note || body.remark)) || "").trim();
	next.progressPercent = pct;
	if (note) {
		next.lastRemark = note;
		next.lastProgressNote = note;
	}
	if (pct >= 100) next.status = "DONE";
	else if (pct > 0) next.status = "IN_PROGRESS";
	next.updatedAt = Date.now();
	const out = tasks.slice();
	out[i] = next;
	saveTasksForWorkflowInner(workflowId, out);
	pushEvents(workflowId, { type: "TASK_PROGRESS", eventType: "TASK_PROGRESS" });
	return next;
}

/**
 * 一句话创建项目并由大模型拆解任务
 */
export async function aiOneShot(body = {}) {
	const brief = String(body.brief || "").trim();
	if (!brief) throw new Error("brief 不能为空");
	const nameBase =
		String(body.title || "").trim() ||
		(brief.length > 40 ? `${brief.slice(0, 40)}…` : brief);
	const created = await createWorkflow({
		name: nameBase,
		description: brief,
	});
	const wid = created.id || created.workflowId;
	const tasks = await llmDecomposeToTaskPayloads(
		{
			...body,
			brief,
			maxTasks: body.maxTasks,
		},
		wid
	);
	if (!tasks.length) {
		throw new Error("模型未返回有效任务，请重试或缩短描述");
	}
	saveTasksForWorkflowInner(wid, tasks);
	pushEvents(wid, {
		type: "TASK_ASSIGNED",
		eventType: "TASK_ASSIGNED",
		brief: brief.slice(0, 80),
	});
	if (import.meta.env.MODE === "development") {
		console.log("[aiOneShot]", { wid, n: tasks.length });
	}
	for (let i = 0; i < tasks.length; i += 1) {
		const tid = tasks[i].id || tasks[i].taskId;
		if (tid) scheduleAutonomousTaskRun(wid, tid, 300 + i * 900);
	}
	return { ...created, id: wid, workflowId: wid, tasks };
}

/**
 * 在已有工作流上追加 AI 任务
 */
export async function aiAuto(workflowId, body = {}) {
	if (!workflowId) throw new Error("workflowId 不能为空");
	const wf = (await getWorkflow(workflowId)) || (await ensureWorkflowRecord(workflowId));
	if (!wf) throw new Error("工作流不存在");
	const brief = String(body.brief || "").trim();
	if (!brief) throw new Error("brief 不能为空");
	const tasks = await llmDecomposeToTaskPayloads(
		{
			...body,
			brief,
			maxTasks: body.maxTasks,
		},
		workflowId
	);
	if (!tasks.length) throw new Error("模型未返回有效任务，请重试或缩短描述");
	const prev = getTasksForWorkflowInner(workflowId);
	saveTasksForWorkflowInner(workflowId, prev.concat(tasks));
	pushEvents(workflowId, {
		type: "TASK_ASSIGNED",
		eventType: "TASK_ASSIGNED",
		brief: brief.slice(0, 80),
	});
	if (import.meta.env.MODE === "development") {
		console.log("[aiAuto]", { workflowId, n: tasks.length });
	}
	for (let i = 0; i < tasks.length; i += 1) {
		const tid = tasks[i].id || tasks[i].taskId;
		if (tid) scheduleAutonomousTaskRun(workflowId, tid, 400 + i * 900);
	}
	return { workflowId, tasks, added: tasks.length };
}

/**
 * 指令下发 + 大模型执行模拟（可生成任务、交付物说明）
 * 与 clientApi postCommand 的字段尽量对齐
 * 先立即写入占位任务，再异步补全 LLM，避免长时间无列表数据、像「没反应」
 */
export async function postCommand(workflowId, body) {
	const wid = String(workflowId || "").trim();
	if (!wid) throw new Error("workflowId 不能为空");
	await ensureWorkflowRecord(wid);
	const text = String(
		(body && (body.commandText || body.content || body.body || body.text || body.goal)) || ""
	).trim();
	if (!text) throw new Error("指令内容为空");
	const from = normDept((body && (body.fromDepartment || body.sourceDepartment)) || "product");
	const to = normDept((body && (body.toDepartment || body.targetDepartment)) || "engineering");
	const level = Math.min(5, Math.max(1, Number((body && body.hierarchyLevel) || 1)));
	const customTitle = String((body && body.createTaskTitle) || "").trim();
	const tctx = { sourceDepartment: from, targetDepartment: to, hierarchyLevel: level, text, customTitle };

	const pendingId = newTaskId();
	const titlePending = customTitle || `${text.length > 26 ? `${text.slice(0, 26)}…` : text}（处理中）`;
	const summ0 = getLlmConnectionSummary();
	const placeholder = {
		id: pendingId,
		taskId: pendingId,
		title: titlePending,
		name: titlePending,
		description: text,
		department: to,
		status: "IN_PROGRESS",
		progressPercent: 5,
		hierarchyLevel: level,
		commandText: text,
		pendingLlm: true,
		llmRequesting: !!summ0.configured,
		automationStatus: "idle",
		automationPhaseLabel: summ0.configured
			? `正在请求大模型（${summ0.model}）生成任务详情…`
			: "未配置 API Key，将使用本机规则生成（不会发起网络请求）",
		aiExecutionReport: summ0.configured
			? `已收到指令。将向 ${summ0.apiEndpoint} 发起 chat/completions 以生成任务说明与交付物，请稍候…`
			: "已收到指令。当前未配置 API Key，不会发起联网请求；即将写入本机规则生成的任务说明。",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	if (body && body.parentTaskId) placeholder.parentTaskId = body.parentTaskId;
	if (body && body.dependsOnTaskIds) {
		placeholder.dependsOnTaskIds = [].concat(body.dependsOnTaskIds);
	}
	const prev0 = getTasksForWorkflowInner(wid);
	saveTasksForWorkflowInner(wid, prev0.concat([placeholder]));
	pushEvents(wid, {
		type: "COMMAND_ISSUED",
		eventType: "COMMAND_ISSUED",
		fromDepartment: from,
		toDepartment: to,
		commandText: text.slice(0, 200),
	});

	let newTask;
	try {
		newTask = await llmExecuteCommandPayload(tctx, { workflowId: wid, taskId: pendingId });
	} catch (e) {
		const msg = (e && e.message) || String(e);
		patchTaskInStorage(wid, pendingId, {
			pendingLlm: false,
			automationPhaseLabel: "生成失败",
			aiExecutionReport: `任务已记录，但大模型调用失败：${msg.slice(0, 400)}`,
			automationStatus: "error",
			automationError: msg.slice(0, 500),
		});
		throw e;
	}

	newTask.id = pendingId;
	newTask.taskId = pendingId;
	newTask.pendingLlm = false;
	if (body && body.parentTaskId) newTask.parentTaskId = body.parentTaskId;
	if (body && body.dependsOnTaskIds) {
		newTask.dependsOnTaskIds = [].concat(body.dependsOnTaskIds);
	}
	const prev = getTasksForWorkflowInner(wid);
	const idx = prev.findIndex((t) => String(t.id || t.taskId) === String(pendingId));
	if (idx >= 0) {
		const out = prev.slice();
		const ph = prev[idx];
		out[idx] = {
			...ph,
			...newTask,
			llmCallHistory: mergeTaskLlmHistories(ph.llmCallHistory, newTask.llmCallHistory),
			pendingLlm: false,
			llmRequesting: false,
			updatedAt: Date.now(),
		};
		saveTasksForWorkflowInner(wid, out);
	} else {
		saveTasksForWorkflowInner(wid, prev.concat([newTask]));
	}
	if (import.meta.env.MODE === "development") {
		console.log("[postCommand local]", { workflowId: wid, task: pendingId });
	}
	scheduleAutonomousTaskRun(wid, pendingId, 200);
	return { ok: true, task: newTask };
}

export async function listEvents(workflowId) {
	if (!workflowId) return [];
	const m = getEventMap();
	return Array.isArray(m[workflowId]) ? m[workflowId] : [];
}

/**
 * 从本地任务推导出简单协作图，便于无后端时图 Tab 有内容
 */
export async function getCollaborationGraphFromLocalTasks(workflowId) {
	const tasks = getTasksForWorkflowInner(workflowId);
	const nodes = tasks.map((t) => {
		const id = t.id || t.taskId;
		return { ...t, id, name: t.title, label: t.title };
	});
	const edges = [];
	for (const t of tasks) {
		const to = t.id || t.taskId;
		if (t.parentTaskId) {
			edges.push({ from: t.parentTaskId, to, source: t.parentTaskId, target: to, relation: "PARENT" });
		}
		const deps = t.dependsOnTaskIds;
		if (Array.isArray(deps)) {
			for (const d of deps) {
				if (d) {
					edges.push({ from: d, to, source: d, target: to, relation: "DEPEND" });
				}
			}
		}
	}
	return { nodes, edges };
}

export async function getCollaborationGraph(workflowId) {
	return getCollaborationGraphFromLocalTasks(workflowId);
}

function comNewId() {
	return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyComms() {
	return {
		threads: [],
		groups: [],
		members: {},
		tmsgs: {},
		gmsgs: {},
	};
}

function getWfComms(wid) {
	const root = getCommsRoot();
	if (!root[wid]) {
		const c = emptyComms();
		const nr = { ...root, [wid]: c };
		saveCommsRoot(nr);
		return c;
	}
	return root[wid];
}

function setWfComms(wid, c) {
	const root = { ...getCommsRoot() };
	root[wid] = c;
	saveCommsRoot(root);
}

/**
 * 初始化沟通/项目群；纯前端
 */
export async function commsBootstrap(workflowId) {
	if (!workflowId) return { ok: false };
	await ensureWorkflowRecord(workflowId);
	const c = getWfComms(workflowId);
	if (!c.threads.length) {
		const t1 = comNewId();
		const t2 = comNewId();
		c.threads = [
			{
				threadId: t1,
				id: t1,
				title: "内部 · 主沟通",
				name: "内部 · 主沟通",
				kind: "INTERNAL",
				threadKind: "INTERNAL",
			},
			{
				threadId: t2,
				id: t2,
				title: "客户 · 同步",
				name: "客户 · 同步",
				kind: "CUSTOMER",
				threadKind: "CUSTOMER",
			},
		];
		c.tmsgs[t1] = [];
		c.tmsgs[t2] = [];
	}
	if (!c.groups.length) {
		const g1 = comNewId();
		c.groups = [
			{ id: g1, groupId: g1, title: "项目主群", name: "项目主群" },
		];
		c.gmsgs[g1] = [];
		c.members[g1] = [
			{ id: "m1", type: "ROLE", label: "产品负责人", department: "product" },
			{ id: "m2", type: "ROLE", label: "工程负责人", department: "engineering" },
		];
	}
	setWfComms(workflowId, c);
	return { ok: true };
}

export async function listThreads(workflowId, params = {}) {
	if (!workflowId) return [];
	await commsBootstrap(workflowId);
	const c = getWfComms(workflowId);
	const kind = String((params && params.kind) || "").toUpperCase();
	if (!kind) return c.threads;
	return c.threads.filter(
		(t) => String((t.kind || t.threadKind || "").toUpperCase()) === kind
	);
}

export async function listProjectGroups(workflowId) {
	if (!workflowId) return [];
	await commsBootstrap(workflowId);
	return getWfComms(workflowId).groups;
}

export async function listMessages(workflowId, threadId) {
	if (!workflowId || !threadId) return [];
	await commsBootstrap(workflowId);
	const arr = getWfComms(workflowId).tmsgs[threadId];
	return Array.isArray(arr) ? arr : [];
}

export async function listProjectGroupMessages(workflowId, groupId) {
	if (!workflowId || !groupId) return [];
	await commsBootstrap(workflowId);
	const arr = getWfComms(workflowId).gmsgs[groupId];
	return Array.isArray(arr) ? arr : [];
}

export async function listProjectGroupMembers(workflowId, groupId) {
	if (!workflowId || !groupId) return [];
	await commsBootstrap(workflowId);
	return getWfComms(workflowId).members[groupId] || [];
}

function mergeThreadMsgPayload(body, payload = {}) {
	const id = comNewId();
	const text = String(
		(body && (body.text || body.content || body.body)) || ""
	).trim();
	const m = {
		...payload,
		id,
		messageId: id,
		body: text,
		content: text,
		text,
		createdAt: Date.now(),
	};
	if (body && body.fromDepartment) m.fromDepartment = body.fromDepartment;
	if (body && body.toDepartment) m.toDepartment = body.toDepartment;
	if (body && body.fromTaskId) m.fromTaskId = body.fromTaskId;
	if (body && body.toTaskId) m.toTaskId = body.toTaskId;
	return m;
}

export async function sendMessage(workflowId, threadId, body) {
	if (!workflowId || !threadId) throw new Error("参数缺失");
	const c = getWfComms(workflowId);
	const m = mergeThreadMsgPayload(body, {});
	if (!c.tmsgs[threadId]) c.tmsgs[threadId] = [];
	c.tmsgs[threadId] = c.tmsgs[threadId].concat(m);
	setWfComms(workflowId, c);
	return m;
}

export async function sendProjectGroupMessage(workflowId, groupId, body) {
	if (!workflowId || !groupId) throw new Error("参数缺失");
	const c = getWfComms(workflowId);
	const m = mergeThreadMsgPayload(body, {});
	if (!c.gmsgs[groupId]) c.gmsgs[groupId] = [];
	c.gmsgs[groupId] = c.gmsgs[groupId].concat(m);
	setWfComms(workflowId, c);
	return m;
}

export async function createThread(workflowId, body = {}) {
	await commsBootstrap(workflowId);
	const c = getWfComms(workflowId);
	const kind = String(body.kind || "INTERNAL").toUpperCase();
	const title = String(body.title || "新沟通").trim() || "新沟通";
	const id = comNewId();
	const th = {
		threadId: id,
		id,
		title,
		name: title,
		kind,
		threadKind: kind,
	};
	c.threads.push(th);
	if (!c.tmsgs[id]) c.tmsgs[id] = [];
	setWfComms(workflowId, c);
	return th;
}

export async function createProjectGroup(workflowId, body = {}) {
	await commsBootstrap(workflowId);
	const c = getWfComms(workflowId);
	const title = String(body.title || "项目群").trim() || "项目群";
	const id = comNewId();
	const g = { id, groupId: id, title, name: title };
	c.groups.push(g);
	if (!c.gmsgs[id]) c.gmsgs[id] = [];
	if (!c.members[id] || !c.members[id].length) {
		c.members[id] = [
			{ id: "m1", type: "ROLE", label: "产品", department: "product" },
			{ id: "m2", type: "ROLE", label: "工程", department: "engineering" },
		];
	}
	setWfComms(workflowId, c);
	return g;
}

export async function linkMessageToTask(workflowId, messageId, body = {}) {
	const taskId = body && (body.taskId || body.targetTaskId);
	if (!workflowId || !messageId || !taskId) throw new Error("参数缺失");
	const c = { ...getWfComms(workflowId) };
	const walk = (arr) => {
		if (!Array.isArray(arr)) return false;
		for (const msg of arr) {
			if (String(msg.id || msg.messageId) === String(messageId)) {
				msg.linkedTaskId = taskId;
				return true;
			}
		}
		return false;
	};
	for (const tid of Object.keys(c.tmsgs)) {
		if (walk(c.tmsgs[tid])) {
			setWfComms(workflowId, c);
			return { ok: true };
		}
	}
	for (const gid of Object.keys(c.gmsgs)) {
		if (walk(c.gmsgs[gid])) {
			setWfComms(workflowId, c);
			return { ok: true };
		}
	}
	throw new Error("未找到消息");
}

export async function broadcastComms(workflowId, body = {}) {
	if (!workflowId) return;
	await commsBootstrap(workflowId);
	const c = getWfComms(workflowId);
	const text = String(
		(body && (body.commandText || body.content || body.body)) || ""
	).trim();
	if (!text) return;
	const t0 = c.threads[0];
	if (t0) {
		const mid = t0.threadId || t0.id;
		if (!c.tmsgs[mid]) c.tmsgs[mid] = [];
		const id = comNewId();
		c.tmsgs[mid].push({
			id,
			messageId: id,
			body: `【广播】${text}`,
			content: `【广播】${text}`,
			createdAt: Date.now(),
			broadcast: true,
		});
	}
	setWfComms(workflowId, c);
	pushEvents(workflowId, { type: "BROADCAST", eventType: "BROADCAST" });
}
