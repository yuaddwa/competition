import { getPersonaById } from "@/utils/agentPersonaCatalog";
import { personaTitleZh } from "@/utils/personaDisplayZh";
import { appendVirtualChat, loadVirtualChatMessages } from "@/utils/virtualTeamStore";

export function ensurePersonaChatSeed(personaId) {
  const p = getPersonaById(personaId);
  if (!p) return;
  const list = loadVirtualChatMessages("persona", personaId);
  if (list.length > 0) return;

  const name = personaTitleZh(p);
  const raw = String(p.snippet || "").replace(/^---+\s*/m, "").trim();
  const body = raw.length > 520 ? `${raw.slice(0, 517)}…` : raw;
  const lines = [`你好，我是「${name}」，很高兴与你协作。`];
  if (body) lines.push("", "【人设摘要】", body);

  appendVirtualChat("persona", personaId, {
    content: lines.join("\n"),
    isMine: false,
    senderName: name.length > 16 ? `${name.slice(0, 15)}…` : name,
  });
}
