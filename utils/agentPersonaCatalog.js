/** 小程序端对 import json 支持不稳定，改为人设 .js 默认导出 */
import catalog from "@/data/agentPersonas.data.js";
import {
	personaTitleZh,
	snippetZhPreview as snippetZhPreviewFn,
} from "@/utils/personaDisplayZh";
import { getLanguage } from "@/utils/lang";

/** @typedef {{ id: string, title: string, category: string, path: string, snippet: string }} PersonaRow */

/** 与 personaDisplayZh.snippetZhPreview 同步；部分 mp 打包场景下命名导出异常时用本地逻辑兜底 */
function snippetZhPreviewFallback(snippet) {
	const raw = String(snippet || "").replace(/^---[^\n]*\n?/m, "").trim();
	const chunks = raw.match(
		/[\u4e00-\u9fff]{4,}(?:[\u4e00-\u9fff\u3001\u3002\u3010\u3011，。；：、])*[\u4e00-\u9fff]?/g,
	);
	if (chunks && chunks.length) {
		const t = chunks.slice(0, 2).join("");
		return t.length > 96 ? `${t.slice(0, 93)}…` : t;
	}
	const yaml =
		raw.match(/\bdescription\s*:\s*(.+?)\s+(?:color|emoji|vibe)\s*:/is)?.[1] ||
		raw.match(/\bdescription\s*:\s*(.+)$/is)?.[1];
	if (yaml) {
		let t = String(yaml).trim().replace(/\s+/g, " ");
		return t.length > 110 ? `${t.slice(0, 107)}…` : t;
	}
	return "点击进入对话 · 查看完整人设说明";
}

/** 从 snippet 中提取英文 description */
function snippetEnPreview(snippet) {
	const raw = String(snippet || "").replace(/^---[^\n]*\n?/m, "").trim();
	const yaml = raw.match(/\bdescription\s*:\s*(.+?)\s+(?:color|emoji|vibe)\s*:/is)?.[1] ||
		raw.match(/\bdescription\s*:\s*(.+)$/is)?.[1];
	if (yaml) {
		let t = String(yaml).trim().replace(/\s+/g, " ");
		return t.length > 110 ? `${t.slice(0, 107)}…` : t;
	}
	return "Tap to chat · View full persona details";
}

const HIDDEN_PERSONA_KEY = "hidden_persona_ids";

export function getHiddenPersonaIds() {
	try {
		return uni.getStorageSync(HIDDEN_PERSONA_KEY) || [];
	} catch {
		return [];
	}
}

export function setHiddenPersonaIds(list) {
	try {
		uni.setStorageSync(HIDDEN_PERSONA_KEY, list);
	} catch {}
}

/** @returns {PersonaRow[]} */
export function listPersonasByCategorySlug(slug) {
	if (!slug) return [];
	const hidden = getHiddenPersonaIds();
	return catalog.filter((p) => p.category === slug && !hidden.includes(p.id));
}

/** @returns {{ id: string, title: string }[]} */
export function getAvailablePersonasByCategorySlug(slug) {
	if (!slug) return [];
	const hidden = getHiddenPersonaIds();
	return catalog
		.filter((p) => p.category === slug && hidden.includes(p.id))
		.map((p) => ({ id: p.id, title: personaChatTitle(p, getLanguage()) }));
}

/** @returns {PersonaRow | null} */
export function getPersonaById(id) {
	if (!id) return null;
	return catalog.find((p) => p.id === id) || null;
}

/** 界面与聊天标题（中文优先，lang 为 'en' 时返回英文） */
export function personaChatTitle(persona, lang = "zh") {
	if (lang === "en") {
		return (persona?.title || "").replace(/\s*Agent Personality\s*$/i, "").replace(/\s*Agent\s*$/i, "").trim() || "Persona";
	}
	return personaTitleZh(persona);
}

/** 部门角色列表副标题（请只从本模块取，避免页面侧重复引用 personaDisplayZh 导致 mp 运行时非函数） */
export function personaSnippetLine(persona, lang = "zh") {
	if (lang === "en") {
		const snippet = persona?.snippet || "";
		return snippetEnPreview(snippet);
	}
	const snippet = persona?.snippet || "";
	if (typeof snippetZhPreviewFn === "function") {
		try {
			return snippetZhPreviewFn(snippet);
		} catch {
			//
		}
	}
	return snippetZhPreviewFallback(snippet);
}
