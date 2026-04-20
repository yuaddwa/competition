/** 本地存储：OpenAI 兼容接口（密钥勿提交代码仓库） */

const K_API_KEY = "user_llm_api_key";
const K_BASE_URL = "user_llm_base_url";
const K_MODEL = "user_llm_model";

const DEFAULT_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * 保存前校验（与 openaiCompatible 中 `${baseUrl}/chat/completions` 约定一致，路径须含 /v1）
 * @returns {{ ok: true, values: { apiKey: string, baseUrl: string, model: string } } | { ok: false, messageKey: string }}
 */
export function validateLlmSettings({ apiKey, baseUrl, model }) {
	const key = String(apiKey ?? "").trim();
	if (!key) {
		return { ok: false, messageKey: "model_validate_key_required" };
	}

	const urlRaw = String(baseUrl ?? "").trim();
	if (!urlRaw) {
		return { ok: false, messageKey: "model_validate_url_required" };
	}

	let u;
	try {
		u = new URL(urlRaw);
	} catch {
		return { ok: false, messageKey: "model_validate_url_invalid" };
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") {
		return { ok: false, messageKey: "model_validate_url_protocol" };
	}
	const path = (u.pathname || "/").replace(/\/+$/, "") || "/";
	if (!/\/v1$/i.test(path)) {
		return { ok: false, messageKey: "model_validate_url_need_v1" };
	}
	const baseNormalized = urlRaw.replace(/\/+$/, "");

	const m = String(model ?? "").trim();
	if (!m) {
		return { ok: false, messageKey: "model_validate_model_required" };
	}
	if (m.length > 128) {
		return { ok: false, messageKey: "model_validate_model_too_long" };
	}

	return {
		ok: true,
		values: {
			apiKey: key,
			baseUrl: baseNormalized,
			model: m,
		},
	};
}

export function getLlmSettings() {
	const apiKey = String(uni.getStorageSync(K_API_KEY) || "").trim();
	let baseUrl = String(uni.getStorageSync(K_BASE_URL) || "").trim();
	if (!baseUrl) baseUrl = DEFAULT_BASE;
	let model = String(uni.getStorageSync(K_MODEL) || "").trim();
	if (!model) model = DEFAULT_MODEL;
	return { apiKey, baseUrl, model };
}

export function setLlmSettings({ apiKey, baseUrl, model }) {
	if (apiKey !== undefined) uni.setStorageSync(K_API_KEY, String(apiKey));
	if (baseUrl !== undefined) uni.setStorageSync(K_BASE_URL, String(baseUrl).trim());
	if (model !== undefined) uni.setStorageSync(K_MODEL, String(model).trim());
}
