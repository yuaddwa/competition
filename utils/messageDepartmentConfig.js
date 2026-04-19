/**
 * 消息页：部门条目（人数统计 + static 图标）及与 agentDepartments 的映射。
 */
import agentDepartments from "@/data/agentDepartments";
import { cleanDeptLabel } from "@/utils/deptUi";

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
  engineering: "/static/工程部的图标，一个扳手_.png",
  design: "/static/设计部的图标，一支笔_.png",
  "paid-media": "/static/一群小人观看电视__.png",
  sales: "/static/一个小人把货物卖给另一个小人_.png",
  marketing: "/static/一个天平_.png",
  product: "/static/一个产品_.png",
  "project-management": "/static/许多的项目_.png",
  testing: "/static/一个小人对着电脑测试_.png",
  support: "/static/一个医疗的符号_.png",
  "spatial-computing": "/static/立体的正方形.png",
  specialized: "/static/钻研问题的小人_.png",
  finance: "/static/美金的图标.png",
  "game-development": "/static/一个手柄.png",
  academic: "/static/一本书.png",
};

const FALLBACK_ICON = "/static/一本书.png";

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
  return MESSAGE_DEPARTMENT_STATS.map((row) => {
    const slug = row.name;
    const agentDeptId = MESSAGE_SLUG_TO_AGENT_ID[slug];
    const dept = agentDeptId ? agentDepartments.find((d) => d.id === agentDeptId) : null;
    const title = dept ? cleanDeptLabel(dept.name) : SLUG_TITLE_ZH[slug] || slug.replace(/-/g, " ");
    const desc = dept?.desc || "";
    return {
      slug,
      agentDeptId,
      title,
      desc,
      count: row.count,
      icon: MESSAGE_DEPT_ICON_BY_SLUG[slug] || FALLBACK_ICON,
    };
  });
}
