/**
 * 数字员工 id → 聊天使用的模型名（OpenAI 兼容）；留空则沿用「模型与 API」全局默认。
 */
import { getLlmSettings } from "@/utils/llmSettings";

const K_MAP = "agent_llm_model_map";

function readMap() {
	const raw = uni.getStorageSync(K_MAP);
	let obj = {};
	if (typeof raw === "string") {
		try {
			obj = JSON.parse(raw || "{}");
		} catch {
			obj = {};
		}
	} else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		obj = raw;
	}
	return obj && typeof obj === "object" ? obj : {};
}

function writeMap(map) {
	try {
		uni.setStorageSync(K_MAP, JSON.stringify(map));
	} catch (e) {
		console.warn("[agentModelMap] writeMap", e);
	}
}

export function getAgentModelMap() {
	return readMap();
}

/** @returns {string} 仅员工单独配置的模型名，无则空串 */
export function getAgentModel(agentId) {
	if (!agentId) return "";
	const v = readMap()[String(agentId)];
	return v != null && String(v).trim() ? String(v).trim() : "";
}

export function setAgentModel(agentId, model) {
	const m = readMap();
	const id = String(agentId);
	const t = String(model ?? "").trim();
	if (!t) delete m[id];
	else m[id] = t;
	writeMap(m);
}

/** 将同一模型批量写入多名员工 */
export function setAgentModelBatch(agentIds, model) {
	const m = readMap();
	const val = String(model ?? "").trim();
	const ids = Array.isArray(agentIds) ? agentIds : [];
	for (const id of ids) {
		if (id == null || id === "") continue;
		const sid = String(id);
		if (!val) delete m[sid];
		else m[sid] = val;
	}
	writeMap(m);
}

/** 聊天侧：有则员工专属，否则全局默认 */
export function getAgentModelOrDefault(agentId) {
	const per = getAgentModel(agentId);
	if (per) return per;
	return getLlmSettings().model;
}
