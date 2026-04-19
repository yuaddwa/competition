/** 本地存储：OpenAI 兼容接口（密钥勿提交代码仓库） */

const K_API_KEY = "user_llm_api_key";
const K_BASE_URL = "user_llm_base_url";
const K_MODEL = "user_llm_model";

export function getLlmSettings() {
	const apiKey = String(uni.getStorageSync(K_API_KEY) || "").trim();
	let baseUrl = String(uni.getStorageSync(K_BASE_URL) || "").trim();
	if (!baseUrl) baseUrl = "https://api.openai.com/v1";
	let model = String(uni.getStorageSync(K_MODEL) || "").trim();
	if (!model) model = "gpt-4o-mini";
	return { apiKey, baseUrl, model };
}

export function setLlmSettings({ apiKey, baseUrl, model }) {
	if (apiKey !== undefined) uni.setStorageSync(K_API_KEY, String(apiKey));
	if (baseUrl !== undefined) uni.setStorageSync(K_BASE_URL, String(baseUrl).trim());
	if (model !== undefined) uni.setStorageSync(K_MODEL, String(model).trim());
}
