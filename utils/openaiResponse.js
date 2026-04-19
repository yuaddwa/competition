/** 从多种厂商响应中取出助手文本 */
export function extractAssistantText(resData) {
	if (!resData) return "";
	const contentFromChoices = resData?.choices?.[0]?.message?.content;
	if (typeof contentFromChoices === "string" && contentFromChoices.trim()) {
		return contentFromChoices.trim();
	}
	if (Array.isArray(contentFromChoices)) {
		const text = contentFromChoices
			.map((part) => (typeof part?.text === "string" ? part.text : ""))
			.join("")
			.trim();
		if (text) return text;
	}
	const directText =
		resData?.reply ||
		resData?.text ||
		resData?.content ||
		resData?.data?.reply ||
		resData?.data?.content ||
		resData?.data?.text;
	if (typeof directText === "string" && directText.trim()) {
		return directText.trim();
	}
	const geminiText = resData?.candidates?.[0]?.content?.parts
		?.map((part) => (typeof part?.text === "string" ? part.text : ""))
		.join("")
		.trim();
	if (geminiText) {
		return geminiText;
	}
	const outputText = resData?.output_text || resData?.output?.[0]?.content?.[0]?.text;
	if (typeof outputText === "string" && outputText.trim()) {
		return outputText.trim();
	}
	return "";
}
