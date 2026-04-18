import request from "@/utils/request";
import { unwrapData } from "@/utils/apiHelpers";

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
