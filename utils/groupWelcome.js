/**
 * 项目群拉入新成员后：系统提示 + 现有成员依次发欢迎语（有 API 时走模型一句，否则用语料模板）
 */
import {
  appendVirtualChat,
  displayAgentName,
  displayAgentRole,
  formatAgentNavTitle,
  getProjectGroupById,
} from "./virtualTeamStore.js";
import { t, getLanguage } from "./lang.js";
import { getLlmSettings } from "./llmSettings.js";
import { getAgentModelOrDefault } from "./agentModelMap.js";
import { chatCompletion } from "./openaiCompatible.js";
import { extractAssistantText } from "./openaiResponse.js";

const WELCOME_TPL_KEYS = [
  "vt_group_welcome_tpl_0",
  "vt_group_welcome_tpl_1",
  "vt_group_welcome_tpl_2",
  "vt_group_welcome_tpl_3",
  "vt_group_welcome_tpl_4",
];

/**
 * @param {string} groupId
 * @param {Array<object>} addedMembers 已通过 addMembersToProjectGroup 写入存储的成员（含 id/name/role…）
 */
export async function appendGroupInviteWelcomeFlow(groupId, addedMembers) {
  const lang = getLanguage();
  const added = Array.isArray(addedMembers)
    ? addedMembers.filter((m) => m && String(m.id || m.agentId || "").trim())
    : [];
  if (!groupId || added.length === 0) return;

  const namesDisplay = added
    .map((m) => formatAgentNavTitle({ name: m.name, role: m.role }) || displayAgentName(m))
    .join(lang === "en" ? ", " : "、");

  appendVirtualChat("group", groupId, {
    content: t("vt_group_joined_system", lang, { names: namesDisplay }),
    isMine: false,
    senderName: t("sender_system_name", lang),
  });

  const g = getProjectGroupById(groupId);
  const roster = Array.isArray(g?.members) ? g.members : [];
  const newbieIds = new Set(added.map((a) => String(a.id || a.agentId || "").trim()).filter(Boolean));
  const existing = roster.filter((m) => !newbieIds.has(String(m.id || m.agentId || "").trim()));

  const newbieShort =
    formatAgentNavTitle({ name: added[0].name, role: added[0].role }) || displayAgentName(added[0]);

  const { apiKey, baseUrl, model } = getLlmSettings();
  const maxWelcomes = Math.min(existing.length, 8);

  for (let idx = 0; idx < maxWelcomes; idx++) {
    const m = existing[idx];
    const aid = String(m.id || m.agentId || "").trim();
    const senderName = formatAgentNavTitle({ name: m.name, role: m.role }) || displayAgentName(m);
    const roleDisp = displayAgentRole(m);
    let content = "";

    if (apiKey) {
      try {
        const agentModel = (aid && getAgentModelOrDefault(aid)) || model;
        const nameDisp = displayAgentName(m);
        const lineLang =
          lang === "en"
            ? "Write exactly ONE short welcome in English (max ~70 chars). Do not quote the system join line verbatim."
            : "只写一句口语化中文欢迎（不超过 45 个字）。不要逐字复述系统刚发的入群提示。";
        const system = [
          `你是群成员「${nameDisp}」，职责：${roleDisp || t("vt_member_default", lang)}。`,
          `刚入群的同事：${namesDisplay}。`,
          lineLang,
          "不要替对方写长台词，不要扮演多人。",
        ].join("");
        const res = await chatCompletion({
          apiKey,
          baseUrl,
          model: agentModel,
          system,
          messages: [
            {
              role: "user",
              content: lang === "en" ? "Say a quick welcome to the new joiner(s) in the group." : "在群里对新人说一句欢迎。",
            },
          ],
        });
        content = (extractAssistantText(res) || "").trim();
        if (content.length > 200) content = content.slice(0, 200);
      } catch {
        content = "";
      }
    }

    if (!content) {
      const tplKey = WELCOME_TPL_KEYS[idx % WELCOME_TPL_KEYS.length];
      content = t(tplKey, lang, {
        newbie: newbieShort,
        role: roleDisp || t("vt_member_default", lang),
      });
    }

    appendVirtualChat("group", groupId, {
      content,
      isMine: false,
      senderName,
      senderAvatar: String(m.avatar || m.avatarUrl || m.headImg || m.headimg || "").trim(),
      senderId: aid,
      senderModel: (aid && getAgentModelOrDefault(aid)) || model || "",
    });
    await new Promise((r) => setTimeout(r, 450));
  }
}
