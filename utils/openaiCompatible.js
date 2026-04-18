import { extractAssistantText } from "@/utils/openaiResponse";

/**
 * OpenAI 兼容 POST {baseUrl}/chat/completions
 * 小程序需在后台配置 request 合法域名（或走你们自己的反向代理域名）。
 */
export function chatCompletion({ apiKey, baseUrl, model, system, messages, timeoutMs = 120000 }) {
	const root = String(baseUrl || "")
		.trim()
		.replace(/\/+$/, "");
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
