import request from "@/utils/request";
import { unwrapData, unwrapList } from "@/utils/apiHelpers";
import { getUserInfo } from "@/utils/index";

function resolveCurrentUserId() {
	const me = getUserInfo() || {};
	return String(me.id || me.userId || me.uid || "").trim();
}

/**
 * 素材 / 人设详情（Markdown 正文在 content）
 * GET /api/agents/{id}
 */
export async function getAgentById(id) {
	if (!id) return null;
	const path = `/api/agents/${encodeURIComponent(id)}`;
	try {
		const r = await request.get(path, {}, { needAuth: false, showError: false });
		return unwrapData(r);
	} catch {
		return null;
	}
}

/** 素材库列表，可按 category/department 过滤 */
export async function listAgentMaterials(params = {}) {
	try {
		const r = await request.get("/api/agents", params, { needAuth: true, showError: false });
		return unwrapList(r);
	} catch {
		return [];
	}
}

/** 当前用户 Agent 列表 */
export async function listUserAgents(params = {}) {
	const r = await request.get("/api/user-agents", params, { needAuth: true });
	return unwrapList(r);
}

/** 严格当前登录用户 Agent 列表；拿不到当前用户 id 时返回空，避免展示示例/他人数据 */
export async function listMyUserAgents(params = {}) {
	const myId = resolveCurrentUserId();
	if (!myId) return [];
	const list = await listUserAgents(params);
	return (Array.isArray(list) ? list : []).filter((a) => {
		const uid = String(a?.userId || a?.userID || a?.uid || a?.ownerId || a?.creatorId || "").trim();
		return uid === myId;
	});
}

/** 创建用户 Agent（空 body 等价 {}） */
export async function createUserAgent(body) {
	const r = await request.post("/api/user-agents", body || {}, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** 从素材库一键生成用户 Agent */
export async function createUserAgentFromMaterialLibrary({ materialLibraryId, displayName } = {}) {
	const id = String(materialLibraryId || "").trim();
	if (!id) throw new Error("materialLibraryId 不能为空");
	const body = { materialLibraryId: id };
	const name = String(displayName || "").trim();
	if (name) body.displayName = name;
	const r = await request.post("/api/user-agents/from-material-library", body, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** AI 生成 Agent 草稿 */
export async function draftUserAgentByAI(brief) {
	const r = await request.post("/api/user-agents/ai-draft", { brief }, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** 获取单个用户 Agent */
export async function getUserAgentById(agentId) {
	if (!agentId) return null;
	const r = await request.get(`/api/user-agents/${encodeURIComponent(agentId)}`, {}, { needAuth: true });
	return unwrapData(r);
}

/** 修改用户 Agent */
export async function updateUserAgent(agentId, body) {
	if (!agentId) throw new Error("agentId 不能为空");
	const r = await request.patch(`/api/user-agents/${encodeURIComponent(agentId)}`, body || {}, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** 删除用户 Agent */
export async function deleteUserAgent(agentId) {
	if (!agentId) return;
	await request.delete(`/api/user-agents/${encodeURIComponent(agentId)}`, {}, { needAuth: true });
}

/** 用户 Agent 可选部门列表 */
export async function listUserAgentDepartments() {
	const r = await request.get("/api/user-agents/departments", {}, { needAuth: true, showError: false });
	const d = unwrapData(r);
	if (Array.isArray(d)) return d;
	if (d && typeof d === "object") {
		if (Array.isArray(d.items)) return d.items;
		if (Array.isArray(d.list)) return d.list;
		if (Array.isArray(d.records)) return d.records;
		if (Array.isArray(d.content)) return d.content;
		if (Array.isArray(d.departments)) return d.departments;
		if (Array.isArray(d.data)) return d.data;
	}
	return [];
}

/** 新增部门 */
export async function createUserAgentDepartment(name) {
	const r = await request.post("/api/user-agents/departments", { name }, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** 修改部门名称 */
export async function updateUserAgentDepartment(departmentId, name) {
	if (!departmentId) throw new Error("departmentId 不能为空");
	const r = await request.patch(`/api/user-agents/departments/${encodeURIComponent(departmentId)}`, { name }, {
		needAuth: true,
		header: { "Content-Type": "application/json" },
	});
	return unwrapData(r);
}

/** 删除部门 */
export async function deleteUserAgentDepartment(departmentId) {
	if (!departmentId) return;
	await request.delete(`/api/user-agents/departments/${encodeURIComponent(departmentId)}`, {}, { needAuth: true });
}

/** 用户 Agent 预设列表 */
export async function listUserAgentPresets() {
	const r = await request.get("/api/user-agents/presets", {}, { needAuth: true, showError: false });
	return unwrapList(r);
}
