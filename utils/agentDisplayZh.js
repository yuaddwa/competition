const DEPT_ZH = {
	academic: "学术部",
	design: "设计部",
	engineering: "工程部",
	finance: "财务部",
	marketing: "市场部",
	product: "产品部",
	"project-management": "项目管理部",
	pm: "项目管理部",
	qa: "测试部",
	testing: "测试部",
	sales: "销售部",
	support: "支持服务部",
	"spatial-computing": "空间计算部",
	spatial: "空间计算部",
	specialized: "专项能力部",
	special: "专项能力部",
	"paid-media": "付费媒介部",
	paid: "付费媒介部",
	"game-development": "游戏开发部",
};

const ROLE_ZH = [
	[/anthropologist/i, "人类学家"],
	[/geographer/i, "地理学家"],
	[/historian/i, "历史学家"],
	[/narratologist/i, "叙事学家"],
	[/psychologist/i, "心理学家"],
	[/terminal integration specialist/i, "终端集成专家"],
	[/xr cockpit interaction specialist/i, "XR 驾舱交互专家"],
	[/xr immersive developer/i, "XR 沉浸式开发专家"],
	[/xr interface architect/i, "XR 界面架构师"],
	[/visionos spatial engineer/i, "visionOS 空间计算工程师"],
	[/macos spatial\/metal engineer/i, "macOS Spatial/Metal 工程师"],
	[/backend architect/i, "后端架构师"],
	[/frontend developer/i, "前端开发工程师"],
	[/ui designer/i, "界面设计师"],
	[/ux researcher/i, "用户研究员"],
	[/ux architect/i, "体验架构师"],
	[/brand guardian/i, "品牌守护者"],
	[/image prompt engineer/i, "图像提示工程师"],
];

const AGENT_NAME_ZH = [
	[/anthropologist/i, "人类学家"],
	[/geographer/i, "地理学家"],
	[/historian/i, "历史学家"],
	[/narratologist/i, "叙事学家"],
	[/psychologist/i, "心理学家"],
	[/terminal integration specialist/i, "终端集成专家"],
	[/xr cockpit interaction specialist/i, "XR 驾舱交互专家"],
	[/xr immersive developer/i, "XR 沉浸式开发专家"],
	[/xr interface architect/i, "XR 界面架构师"],
	[/visionos spatial engineer/i, "visionOS 空间计算工程师"],
	[/macos spatial\/metal engineer/i, "macOS Spatial/Metal 工程师"],
	[/ui designer/i, "界面设计师"],
	[/ux researcher/i, "用户研究员"],
	[/ux architect|architectux/i, "体验架构师"],
	[/brand guardian/i, "品牌守护者"],
	[/image prompt engineer/i, "图像提示工程师"],
];

export function normalizeDeptKey(v) {
	return String(v || "").trim().toLowerCase().replace(/\s+/g, "");
}

export function departmentToZh(v, departmentMap = null) {
	const raw = String(v || "").trim();
	if (!raw) return "未分配部门";
	if (/[\u4e00-\u9fff]/.test(raw)) return raw;
	const key = normalizeDeptKey(raw);
	if (departmentMap && departmentMap[key]) return departmentMap[key];
	return DEPT_ZH[key] || raw;
}

export function roleToZh(v) {
	const raw = String(v || "").trim();
	if (!raw) return "";
	if (/[\u4e00-\u9fff]/.test(raw)) return raw;
	for (const [re, zh] of ROLE_ZH) {
		if (re.test(raw)) return zh;
	}
	return raw;
}

export function agentNameToZh(v) {
	const raw = String(v || "").trim();
	if (!raw) return "";
	if (/[\u4e00-\u9fff]/.test(raw)) return raw;
	const cleaned = raw
		.replace(/\bAgent Personality\b/gi, "")
		.replace(/\bAgent\b/gi, "")
		.replace(/\bPersonality\b/gi, "")
		.replace(/\s{2,}/g, " ")
		.trim();
	for (const [re, zh] of AGENT_NAME_ZH) {
		if (re.test(cleaned) || re.test(raw)) return zh;
	}
	return cleaned || raw;
}
