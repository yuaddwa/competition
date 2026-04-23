/**
 * 本机已保存的模型配置（名称 + 接口 + 密钥），供员工分配时按模型名选择。
 * 数据存于 saved_models_v2；旧版 staff_model_presets_v1 会在首次读取时迁移。
 */

const KEY_V2 = "saved_models_v2";
const LEGACY_KEY = "staff_model_presets_v1";

function genId() {
	return `sm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseStored(raw) {
	if (raw == null || raw === "") return [];
	let arr = [];
	if (typeof raw === "string") {
		try {
			arr = JSON.parse(raw || "[]");
		} catch {
			arr = [];
		}
	} else if (Array.isArray(raw)) {
		arr = raw;
	}
	return Array.isArray(arr) ? arr : [];
}

function normalizeEntry(x) {
	if (!x || typeof x !== "object") return null;
	const model = String(x.model ?? "").trim();
	if (!model) return null;
	return {
		id: String(x.id || genId()),
		model,
		baseUrl: String(x.baseUrl ?? "").trim(),
		apiKey: String(x.apiKey ?? "").trim(),
		createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
	};
}

let migrated = false;

function migrateLegacyIfNeeded() {
	if (migrated) return;
	try {
		const v2raw = uni.getStorageSync(KEY_V2);
		const existing = parseStored(v2raw).map(normalizeEntry).filter(Boolean);
		if (existing.length > 0) {
			persist(existing);
			migrated = true;
			return;
		}
		const legacyRaw = uni.getStorageSync(LEGACY_KEY);
		const legacy = parseStored(legacyRaw);
		const out = [];
		for (const item of legacy) {
			const model = typeof item === "string" ? item.trim() : String(item?.model ?? "").trim();
			if (!model) continue;
			out.push({
				id: genId(),
				model,
				baseUrl: "",
				apiKey: "",
				createdAt: Date.now(),
			});
		}
		if (out.length) {
			persist(out);
			try {
				uni.removeStorageSync(LEGACY_KEY);
			} catch {
				//
			}
		}
	} catch (e) {
		console.warn("[staffModelPresets] migrate", e);
	}
	migrated = true;
}

function persist(list) {
	try {
		uni.setStorageSync(KEY_V2, JSON.stringify(list));
	} catch (e) {
		console.warn("[staffModelPresets] persist", e);
	}
}

/** @returns {Array<{ id: string, model: string, baseUrl: string, apiKey: string, createdAt: number }>} */
export function getSavedModels() {
	migrateLegacyIfNeeded();
	try {
		const raw = uni.getStorageSync(KEY_V2);
		const arr = parseStored(raw)
			.map(normalizeEntry)
			.filter(Boolean);
		arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
		return arr;
	} catch {
		return [];
	}
}

/** 供选择器：去重后的模型名（与已保存条目一致） */
export function getModelPresets() {
	const seen = new Set();
	const names = [];
	for (const e of getSavedModels()) {
		const m = e.model;
		if (!m || seen.has(m)) continue;
		seen.add(m);
		names.push(m);
	}
	names.sort((a, b) => a.localeCompare(b));
	return names;
}

/**
 * 是否已存在相同 API（接口根地址 + Key 一致）。迁移产生的空地址/密钥不参与比较。
 * @param {{ apiKey: string, baseUrl: string, model: string }} values
 */
export function isSameApiAlreadySaved(values) {
	const k = String(values.apiKey ?? "").trim();
	const u = String(values.baseUrl ?? "").trim();
	if (!k || !u) return false;
	return getSavedModels().some((e) => {
		const ek = String(e.apiKey ?? "").trim();
		const eu = String(e.baseUrl ?? "").trim();
		if (!ek || !eu) return false;
		return ek === k && eu === u;
	});
}

/** 是否已有同名模型（名称相同即视为冲突，与接口/Key 无关） */
export function isModelNameTaken(modelName) {
	const m = String(modelName ?? "").trim();
	if (!m) return false;
	return getSavedModels().some((e) => e.model === m);
}

/**
 * @param {{ apiKey: string, baseUrl: string, model: string }} values
 */
export function addSavedModelEntry(values) {
	const list = getSavedModels();
	const entry = normalizeEntry({
		id: genId(),
		model: values.model,
		baseUrl: values.baseUrl,
		apiKey: values.apiKey,
		createdAt: Date.now(),
	});
	if (!entry) return { ok: false };
	list.push(entry);
	persist(list);
	return { ok: true, entry };
}

export function removeSavedModel(id) {
	const sid = String(id ?? "").trim();
	if (!sid) return;
	const list = getSavedModels().filter((e) => String(e.id) !== sid);
	persist(list);
}

/** @deprecated 仅兼容旧调用，内部转为写入 saved_models_v2 */
export function addModelPreset(name) {
	const s = String(name ?? "").trim();
	if (!s) return { ok: false, messageKey: "staff_api_empty_name" };
	if (isModelNameTaken(s)) return { ok: true };
	addSavedModelEntry({ apiKey: "", baseUrl: "", model: s });
	return { ok: true };
}

export function removeModelPreset(name) {
	const s = String(name ?? "").trim();
	if (!s) return;
	const list = getSavedModels().filter((e) => e.model !== s);
	persist(list);
}
