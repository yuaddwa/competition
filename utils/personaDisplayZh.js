import { HYPHEN_PART_ZH } from "@/utils/personaZhTokens";

/** 人设 snippet 内 YAML 的英文 description（无则空串） */
function previewFromYamlDescription(raw) {
  const flat = String(raw || "").trim();
  const keyed = flat.match(/\bdescription\s*:\s*(.+?)\s+(?:color|emoji|vibe)\s*:/is);
  if (keyed && keyed[1]) {
    let t = keyed[1].trim().replace(/\s+/g, " ");
    return t.length > 110 ? `${t.slice(0, 107)}…` : t;
  }
  const tail = flat.match(/\bdescription\s*:\s*(.+)$/is);
  if (tail && tail[1]) {
    let t = tail[1].trim().replace(/\s+/g, " ");
    return t.length > 110 ? `${t.slice(0, 107)}…` : t;
  }
  return "";
}

/** 从人设片段中取可读摘要：优先正文汉字，其次 YAML description，最后兜底文案 */
export function snippetZhPreview(snippet) {
  const raw = String(snippet || "").replace(/^---[^\n]*\n?/m, "").trim();
  const chunks = raw.match(/[\u4e00-\u9fff]{4,}(?:[\u4e00-\u9fff\u3001\u3002\u3010\u3011，。；：、])*[\u4e00-\u9fff]?/g);
  if (chunks && chunks.length) {
    const t = chunks.slice(0, 2).join("");
    return t.length > 96 ? `${t.slice(0, 93)}…` : t;
  }
  const yamlLine = previewFromYamlDescription(raw);
  if (yamlLine) return yamlLine;
  return "点击进入对话 · 查看完整人设说明";
}

/**
 * 用人格 id 尾段英文词映射拼接中文职称；尽量避免重复「工程」等叠字。
 */
export function personaTitleZh(persona) {
  if (!persona?.id) return "对话";
  const parts = persona.id.split("__").filter(Boolean);
  const tail = parts[parts.length - 1] || "";
  const words = tail.split("-").filter(Boolean);
  const zhPieces = [];
  let lastZh = "";
  for (const w of words) {
    const z = HYPHEN_PART_ZH[w];
    if (!z) continue;
    if (z === lastZh) continue;
    zhPieces.push(z);
    lastZh = z;
  }
  let out = zhPieces.join("");
  if (/[\u4e00-\u9fff]{2,}/.test(out)) return out;

  let t = (persona.title || "").trim();
  t = t.replace(/\s*Agent Personality\s*$/i, "").trim();
  t = t.replace(/\s*Agent\s*$/i, "").trim();
  if (/[\u4e00-\u9fff]/.test(t)) return t;
  return out || "职能角色";
}
