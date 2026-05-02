/**
 * 消息页：部门条目（人数统计 + static 图标）及与 agentDepartments 的映射。
 */
import agentDepartments from "@/data/agentDepartments";
import { cleanDeptLabel } from "@/utils/deptUi";
import { t, getLanguage } from "@/utils/lang";

function msgDeptI18nKey(slug, suffix) {
  return `msg_dept_${String(slug).replace(/-/g, "_")}_${suffix}`;
}

/** 与后端/统计约定的 slug 顺序与人数（可改为接口返回） */
export const MESSAGE_DEPARTMENT_STATS = [
  { name: "engineering", count: 29 },
  { name: "design", count: 8 },
  { name: "paid-media", count: 7 },
  { name: "sales", count: 8 },
  { name: "marketing", count: 30 },
  { name: "product", count: 5 },
  { name: "project-management", count: 6 },
  { name: "testing", count: 8 },
  { name: "support", count: 6 },
  { name: "spatial-computing", count: 6 },
  { name: "specialized", count: 41 },
  { name: "finance", count: 5 },
  { name: "game-development", count: 20 },
  { name: "academic", count: 5 },
];

/** 统计 slug → data/agentDepartments.js 中的部门 id */
export const MESSAGE_SLUG_TO_AGENT_ID = {
  engineering: "engineering",
  design: "design",
  "paid-media": "paid",
  sales: "sales",
  marketing: "marketing",
  product: "product",
  "project-management": "pm",
  testing: "qa",
  support: "support",
  "spatial-computing": "spatial",
  specialized: "special",
  finance: "finance",
  "game-development": "game-development",
  academic: "academic",
};

/** static 目录下图标（与文件名一致） */
export const MESSAGE_DEPT_ICON_BY_SLUG = {
  engineering: "/static/engineering-wrench.png",
  design: "/static/design-pen.png",
  "paid-media": "/static/paid-media-tv-watchers.png",
  sales: "/static/sales-handoff.png",
  marketing: "/static/balance-scale.png",
  product: "/static/product-icon.png",
  "project-management": "/static/projects-many.png",
  testing: "/static/testing-computer.png",
  support: "/static/support-medical.png",
  "spatial-computing": "/static/cube-3d.png",
  specialized: "/static/research-figure.png",
  finance: "/static/icon-dollar.png",
  "game-development": "/static/gamepad.png",
  academic: "/static/book.png",
};

export const FALLBACK_ICON = "/static/book.png";

const CUSTOM_DEPTS_KEY = "msg_custom_departments";
const HIDDEN_DEPTS_KEY = "msg_hidden_departments";

export function getCustomDepartments() {
  try {
    return uni.getStorageSync(CUSTOM_DEPTS_KEY) || [];
  } catch {
    return [];
  }
}

export function setCustomDepartments(list) {
  try {
    uni.setStorageSync(CUSTOM_DEPTS_KEY, list);
  } catch {}
}

export function getHiddenDepartments() {
  try {
    return uni.getStorageSync(HIDDEN_DEPTS_KEY) || [];
  } catch {
    return [];
  }
}

export function setHiddenDepartments(list) {
  try {
    uni.setStorageSync(HIDDEN_DEPTS_KEY, list);
  } catch {}
}

/** 英文 slug → 中文部门名（备用） */
const SLUG_TITLE_ZH = {
  engineering: "工程部",
  design: "设计部",
  "paid-media": "付费媒介部",
  sales: "销售部",
  marketing: "市场部",
  product: "产品部",
  "project-management": "项目管理部",
  testing: "测试部",
  support: "支持服务部",
  "spatial-computing": "空间计算部",
  specialized: "专项能力部",
  finance: "财务部",
  "game-development": "游戏开发部",
  academic: "学术部",
};

/**
 * @returns {{ slug: string, agentDeptId: string, title: string, desc: string, count: number, icon: string }[]}
 */
export function buildMessageDepartmentBlocks() {
  const lang = getLanguage();
  const hidden = getHiddenDepartments();
  const custom = getCustomDepartments();

  const presetBlocks = MESSAGE_DEPARTMENT_STATS.filter((row) => !hidden.includes(row.name)).map((row) => {
    const slug = row.name;
    const agentDeptId = MESSAGE_SLUG_TO_AGENT_ID[slug];
    const dept = agentDeptId ? agentDepartments.find((d) => d.id === agentDeptId) : null;
    const titleKey = msgDeptI18nKey(slug, "title");
    const descKey = msgDeptI18nKey(slug, "desc");
    let title = t(titleKey, lang);
    if (title === titleKey) {
      title = dept ? cleanDeptLabel(dept.name) : SLUG_TITLE_ZH[slug] || slug.replace(/-/g, " ");
    }
    let desc = t(descKey, lang);
    if (desc === descKey) {
      desc = dept?.desc || "";
    }
    return {
      slug,
      agentDeptId,
      title,
      desc,
      count: row.count,
      icon: MESSAGE_DEPT_ICON_BY_SLUG[slug] || FALLBACK_ICON,
      isCustom: false,
    };
  });

  const customBlocks = custom.map((row) => ({
    slug: row.slug || `custom_${Date.now()}`,
    agentDeptId: "",
    title: row.title || row.name || "自定义部门",
    desc: row.desc || "",
    count: row.count || 0,
    icon: row.icon || FALLBACK_ICON,
    isCustom: true,
  }));

  return [...presetBlocks, ...customBlocks];
}

/**
 * @returns {{ slug: string, title: string }[]}
 */
export function getAvailablePresetDepartments() {
  const lang = getLanguage();
  const hidden = getHiddenDepartments();
  return MESSAGE_DEPARTMENT_STATS.filter((row) => hidden.includes(row.name)).map((row) => {
    const slug = row.name;
    const agentDeptId = MESSAGE_SLUG_TO_AGENT_ID[slug];
    const dept = agentDeptId ? agentDepartments.find((d) => d.id === agentDeptId) : null;
    const titleKey = msgDeptI18nKey(slug, "title");
    let title = t(titleKey, lang);
    if (title === titleKey) {
      title = dept ? cleanDeptLabel(dept.name) : SLUG_TITLE_ZH[slug] || slug.replace(/-/g, " ");
    }
    return { slug, title };
  });
}
