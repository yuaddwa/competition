/**
 * 首页组织层级配置（可按公司业务调整）。
 * HOME_FEATURED_IDS：与产品部 / 高管日常直接对齐的部门，单独展示在第一屏。
 * OTHER_GROUPS：其余部门按条线分组，避免一屏铺满。
 */

/** @type {string[]} */
export const HOME_FEATURED_IDS = ["product", "engineering", "sales", "finance"];

/**
 * @type {{ title: string; departmentIds: string[] }[]}
 */
export const HOME_OTHER_GROUPS = [
  {
    title: "产研与交付",
    departmentIds: ["design", "pm", "qa"],
  },
  {
    title: "增长与品牌化",
    departmentIds: ["marketing", "paid"],
  },
  {
    title: "客户服务与专项能力",
    departmentIds: ["support", "spatial", "special", "academic"],
  },
];
