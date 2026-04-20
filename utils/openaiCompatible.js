import { extractAssistantText } from "@/utils/openaiResponse";

function normalizeBaseRoot(baseUrl) {
	return String(baseUrl || "")
		.trim()
		.replace(/\/+$/, "");
}

function errorMessageFromResponseData(data) {
	if (!data || typeof data !== "object") return "";
	const err = data.error;
	if (err && typeof err === "object" && err.message) return String(err.message);
	if (data.message) return String(data.message);
	return "";
}

/**
 * 保存前校验：密钥与地址是否真能调通（乱填的 Key/域名无法通过）。
 * 先 GET {baseUrl}/models；若无该接口（404/405）或网络失败则回退为最小 POST chat/completions。
 */
export function verifyLlmConnection({ apiKey, baseUrl, model, timeoutMs = 30000 }) {
	const root = normalizeBaseRoot(baseUrl);
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`,
	};
	const modelName = String(model || "gpt-4o-mini").trim() || "gpt-4o-mini";

	return new Promise((resolve, reject) => {
		uni.request({
			url: `${root}/models`,
			method: "GET",
			timeout: timeoutMs,
			header: headers,
			success: (res) => {
				const code = res.statusCode;
				if (code >= 200 && code < 300) {
					resolve();
					return;
				}
				if (code === 401 || code === 403) {
					reject({ messageKey: "model_verify_auth_failed" });
					return;
				}
				if (code === 429) {
					reject({ messageKey: "model_verify_http", detail: "429" });
					return;
				}
				if (code === 404 || code === 405) {
					postMinimalChat();
					return;
				}
				const detail = errorMessageFromResponseData(res.data) || `HTTP ${code}`;
				reject({ messageKey: "model_verify_http", detail });
			},
			fail: () => postMinimalChat(),
		});

		function postMinimalChat() {
			uni.request({
				url: `${root}/chat/completions`,
				method: "POST",
				timeout: timeoutMs,
				header: headers,
				data: {
					model: modelName,
					messages: [{ role: "user", content: "ping" }],
					max_tokens: 1,
				},
				success: (res) => {
					const code = res.statusCode;
					if (code >= 200 && code < 300) {
						resolve();
						return;
					}
					if (code === 401 || code === 403) {
						reject({ messageKey: "model_verify_auth_failed" });
						return;
					}
					if (code === 429) {
						reject({ messageKey: "model_verify_http", detail: "429" });
						return;
					}
					const detail = errorMessageFromResponseData(res.data) || `HTTP ${code}`;
					reject({ messageKey: "model_verify_chat_failed", detail });
				},
				fail: (err) => {
					reject({
						messageKey: "model_verify_network",
						detail: err && err.errMsg ? String(err.errMsg) : "",
					});
				},
			});
		}
	});
}

/**
 * OpenAI 兼容 POST {baseUrl}/chat/completions
 * 小程序需在后台配置 request 合法域名（或走你们自己的反向代理域名）。
 */
export function chatCompletion({ apiKey, baseUrl, model, system, messages, timeoutMs = 120000 }) {
	const root = normalizeBaseRoot(baseUrl);
	const url = `${root}/chat/completions`;
	const payload = {
		model: model || "gpt-4o-mini",
		messages: [{ role: "system", content: system || "You are a helpful assistant." }, ...messages],
		temperature: 0.7,
	};

	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method: "POST",
			timeout: timeoutMs,
			header: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			data: payload,
			success: (res) => {
				const { statusCode, data } = res;
				if (statusCode >= 200 && statusCode < 300) {
					resolve(data);
					return;
				}
				const msg =
					(data && (data.error?.message || data.message)) || `HTTP ${statusCode}`;
				reject(new Error(msg));
			},
			fail: (err) => reject(err),
		});
	});
}

export { extractAssistantText as extractChatReply };
