/**
 * 工作日报：按自然日持久化、模型生成正文、互动（已读/赞/评论）持久化。
 */
import { getLlmSettings } from "@/utils/llmSettings.js";
import { chatCompletion } from "@/utils/openaiCompatible.js";
import { extractAssistantText } from "@/utils/openaiResponse.js";

const K_ENTRIES = "worklog_daily_entries_v1";
const K_REACTIONS = "worklog_daily_reactions_v1";

export function localYmd(d = new Date()) {
	const y = d.getFullYear();
	const m = d.getMonth() + 1;
	const day = d.getDate();
	const p = (n) => (n < 10 ? "0" : "") + n;
	return `${y}-${p(m)}-${p(day)}`;
}

export function addDaysYmd(ymd, delta) {
	const parts = String(ymd || "").split("-").map((x) => parseInt(x, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return localYmd();
	const dt = new Date(parts[0], parts[1] - 1, parts[2] + delta);
	return localYmd(dt);
}

function loadJson(key, fallback) {
	try {
		const raw = uni.getStorageSync(key);
		const o = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
		return o && typeof o === "object" ? o : fallback;
	} catch {
		return fallback;
	}
}

function saveJson(key, obj) {
	try {
		uni.setStorageSync(key, JSON.stringify(obj));
	} catch (e) {
		console.warn("[worklogDaily] save failed", e);
	}
}

export function loadEntriesStore() {
	return loadJson(K_ENTRIES, {});
}

export function saveEntriesStore(store) {
	saveJson(K_ENTRIES, store);
}

export function loadReactionsStore() {
	return loadJson(K_REACTIONS, {});
}

export function saveReactionsStore(store) {
	saveJson(K_REACTIONS, store);
}

export function entryIdFor(ymd, agentId) {
	return `${ymd}_${String(agentId || "").trim()}`;
}

function stripJsonFence(s) {
	let t = String(s || "").trim();
	if (t.startsWith("```")) {
		t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
	}
	return t;
}

function fallbackBody(row, lang) {
	const mw = String(row.mainWork || "").trim();
	if (mw) return mw.slice(0, 500);
	return lang === "en"
		? `I continued work as ${row.role || "the team"} and followed up on open tasks.`
		: `我作为${row.role || "团队成员"}继续推进手头工作，并与相关方同步了进度。`;
}

/**
 * 从模型输出解析 id -> body；解析失败则返回空 Map，由调用方用 fallback 填充。
 */
function parseBodyMapFromModelText(text, rows) {
	const map = new Map();
	const stripped = stripJsonFence(text);
	let arr;
	try {
		arr = JSON.parse(stripped);
	} catch {
		return map;
	}
	if (!Array.isArray(arr)) return map;
	for (const item of arr) {
		const id = String(item?.id ?? "").trim();
		const body = String(item?.body ?? item?.content ?? item?.text ?? "").trim();
		if (id && body) map.set(id, body.slice(0, 800));
	}
	return map;
}

function timeClockForRow(agentId, idx) {
	const seed = Number(String(agentId).replace(/\D/g, "")) || idx * 7919;
	const h = 16 + ((seed + idx * 31) >>> 0) % 4;
	const mi = 8 + ((seed + idx * 17) >>> 0) % 52;
	const pad = (n) => (n < 10 ? "0" : "") + n;
	return `${pad(h)}:${pad(mi)}`;
}

/**
 * @param {Array<{id,name,role,mainWork,avatar}>} rows
 * @param {string} ymd YYYY-MM-DD
 * @param {string} lang zh|en
 * @returns {Promise<Array<{entryId,agentId,name,role,avatar,body,timeClock,ymd}>>}
 */
export async function generateAndSaveDayLogs(rows, ymd, lang) {
	const isEn = lang === "en";
	const listPayload = rows.map((r) => ({
		id: String(r.id),
		name: String(r.name || ""),
		role: String(r.role || ""),
		mainWork: String(r.mainWork || "").slice(0, 800),
	}));

	const { apiKey, baseUrl, model } = getLlmSettings();
	let bodyMap = new Map();

	if (apiKey && rows.length) {
		const system = isEn
			? "Return ONLY a JSON array (no markdown). Each item: {\"id\":\"<same as input>\",\"body\":\"English, first person, 50–160 chars: concrete daily work done today, grounded in role and duties.\"} Cover every employee in the input once."
			: "只返回 JSON 数组（不要 Markdown、不要解释）。每项：{\"id\":\"与输入一致\",\"body\":\"第一人称，50～160 个汉字：今日实际完成的工作，结合岗位与职责，具体可核查\"}。必须覆盖输入中的每一位员工各一条。";
		const user = `${isEn ? "Date" : "日期"}: ${ymd}\nJSON: ${JSON.stringify(listPayload)}`;
		try {
			const res = await chatCompletion({
				apiKey,
				baseUrl,
				model,
				system,
				messages: [{ role: "user", content: user }],
				timeoutMs: 120000,
			});
			const text = extractAssistantText(res);
			bodyMap = parseBodyMapFromModelText(text, rows);
		} catch (e) {
			console.warn("[worklogDaily] chatCompletion", e);
		}
	}

	const bodies = rows.map((r) => {
		const b = bodyMap.get(String(r.id));
		if (b) return b;
		return fallbackBody(r, lang);
	});

	const entries = rows.map((r, i) => ({
		entryId: entryIdFor(ymd, r.id),
		agentId: String(r.id),
		name: r.name,
		role: r.role,
		avatar: r.avatar || "",
		body: bodies[i],
		timeClock: timeClockForRow(r.id, i),
		ymd,
	}));

	const store = loadEntriesStore();
	store[ymd] = entries;
	saveEntriesStore(store);
	return entries;
}

export function getDayEntries(ymd) {
	const store = loadEntriesStore();
	return Array.isArray(store[ymd]) ? store[ymd] : [];
}

export function mergeEntryWithReactions(entry, reactions) {
	const r = reactions[entry.entryId] || {};
	const comments = Array.isArray(r.comments) ? r.comments : [];
	return {
		...entry,
		read: r.read === true,
		likes: typeof r.likes === "number" ? r.likes : 0,
		liked: !!r.liked,
		comments,
		commentCount: comments.length,
	};
}

export function patchReaction(entryId, patch) {
	const all = loadReactionsStore();
	const cur = all[entryId] || { read: false, likes: 0, liked: false, comments: [] };
	const next = {
		read: patch.read !== undefined ? patch.read : cur.read,
		likes: patch.likes !== undefined ? patch.likes : cur.likes,
		liked: patch.liked !== undefined ? patch.liked : cur.liked,
		comments: patch.comments !== undefined ? patch.comments : cur.comments,
	};
	all[entryId] = next;
	saveReactionsStore(all);
	return next;
}

export function toggleLike(entryId) {
	const all = loadReactionsStore();
	const cur = all[entryId] || { read: false, likes: 0, liked: false, comments: [] };
	let likes = typeof cur.likes === "number" ? cur.likes : 0;
	let liked = !!cur.liked;
	if (liked) {
		likes = Math.max(0, likes - 1);
		liked = false;
	} else {
		likes += 1;
		liked = true;
	}
	return patchReaction(entryId, { likes, liked });
}

export function addComment(entryId, text) {
	const all = loadReactionsStore();
	const cur = all[entryId] || { read: false, likes: 0, liked: false, comments: [] };
	const comments = Array.isArray(cur.comments) ? [...cur.comments] : [];
	const t = String(text || "").trim();
	if (!t) return cur;
	comments.push({ id: `c_${Date.now()}`, text: t, at: new Date().toISOString() });
	return patchReaction(entryId, { comments });
}

export function markRead(entryId) {
	return patchReaction(entryId, { read: true });
}

/** 删除某日正文及该日相关互动 */
export function clearDayEntriesAndReactions(ymd) {
	const store = loadEntriesStore();
	delete store[ymd];
	saveEntriesStore(store);
	const all = loadReactionsStore();
	const prefix = `${ymd}_`;
	let changed = false;
	for (const k of Object.keys(all)) {
		if (k.startsWith(prefix)) {
			delete all[k];
			changed = true;
		}
	}
	if (changed) saveReactionsStore(all);
}
