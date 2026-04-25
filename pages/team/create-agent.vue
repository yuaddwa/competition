<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">创建数字员工</view>
		<view class="tab-wrap">
			<view class="tab" :class="{ active: activeTab === 'manual' }" @tap="activeTab = 'manual'">手动创建</view>
			<view class="tab" :class="{ active: activeTab === 'system' }" @tap="activeTab = 'system'">系统生成</view>
		</view>

		<view v-if="activeTab === 'manual'">
			<view class="card">
				<text class="label"><text class="req">*</text>姓名</text>
				<input class="inp" v-model="form.displayName" placeholder="例如：销售助手" placeholder-class="ph" />
			</view>
			<view class="card">
				<text class="label">部门</text>
				<picker v-if="departments.length > 0" mode="selector" :range="departmentLabels" :value="safeDepartmentIdx" @change="onDepartment">
					<view class="picker-line">{{ departmentLabels[safeDepartmentIdx] || "暂无部门，请先新增" }}</view>
				</picker>
				<view v-else class="picker-line">暂无部门，请先新增</view>
			</view>
			<view class="card">
				<text class="label"><text class="req">*</text>职位</text>
				<input class="inp" v-model="form.jobTitle" placeholder="例如：销售经理" placeholder-class="ph" />
			</view>
			<view class="card">
				<text class="label">角色定位</text>
				<input class="inp" v-model="form.rolePosition" placeholder="例如：客户关系推进者" placeholder-class="ph" />
			</view>
			<view class="card">
				<text class="label">性格描述</text>
				<input class="inp" v-model="form.personality" placeholder="例如：积极、结果导向" placeholder-class="ph" />
			</view>
			<view class="card">
				<text class="label">主要工作</text>
				<textarea class="ta" v-model="form.mainWork" placeholder="填写主要职责" placeholder-class="ph" />
			</view>
			<button class="btn" :loading="busy" @click="submitManual">创建数字员工</button>
		</view>

		<view v-else>
			<view class="card">
				<text class="label"><text class="req">*</text>选择部门</text>
				<picker v-if="systemDeptOptions.length > 0" mode="selector" :range="systemDeptLabels" :value="safeSystemDeptIdx" @change="onSystemDepartmentChange">
					<view class="picker-line">{{ systemDeptLabels[safeSystemDeptIdx] || "请选择部门" }}</view>
				</picker>
				<view v-else class="picker-line">暂无可选部门</view>
			</view>
			<view class="card">
				<text class="label"><text class="req">*</text>选择角色</text>
				<picker v-if="materialOptions.length > 0" mode="selector" :range="materialLabels" :value="safeMaterialIdx" @change="onMaterialChange">
					<view class="picker-line">{{ materialLabels[safeMaterialIdx] || "请选择角色" }}</view>
				</picker>
				<view v-else class="picker-line">该部门暂无可用角色</view>
			</view>
			<view v-if="selectedMaterialText" class="card">
				<text class="label">角色简介</text>
				<text class="tip">{{ selectedMaterialText }}</text>
			</view>
			<view class="card">
				<text class="label">覆盖显示名（可选）</text>
				<input class="inp" v-model="systemDisplayName" placeholder="不填则使用下方角色的中文名称" placeholder-class="ph" />
			</view>
			<button class="btn" :loading="busy" @click="submitSystem">一键生成数字员工</button>
		</view>

		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
import * as agentsApi from "@/clientApi/agentsApi";
import { getApiErrorMessage } from "@/utils/apiHelpers";
import { departmentToZh, normalizeDeptKey } from "@/utils/agentDisplayZh";
import { buildMessageDepartmentBlocks } from "@/utils/messageDepartmentConfig";

const DEPT_CACHE_KEY = "user_agent_departments_cache";
const MATERIAL_DEPT_ZH = {
	academic: "学术研究",
	design: "设计创意",
	engineering: "工程技术",
	product: "产品管理",
	marketing: "市场营销",
	sales: "销售增长",
	support: "客户支持",
	finance: "财务法务",
	operations: "运营交付",
	data: "数据智能",
	security: "安全合规",
	pm: "项目管理",
	qa: "质量保障",
	paid: "投放增长",
	special: "专项能力",
	spatial: "空间计算",
	"spatial-computing": "空间计算",
	xr: "扩展现实",
	backend: "后端开发",
	frontend: "前端开发",
	devops: "运维与交付",
	legal: "法务合规",
	hr: "人力资源",
};

const DEPT_TOKEN_ZH = {
	spatial: "空间",
	computing: "计算",
	integration: "集成",
	terminal: "终端",
	engineering: "工程",
	marketing: "市场",
	design: "设计",
	product: "产品",
	sales: "销售",
	support: "支持",
	security: "安全",
	data: "数据",
	ai: "智能",
	cloud: "云",
	mobile: "移动",
	web: "网页",
	backend: "后端",
	frontend: "前端",
	ops: "运维",
	qa: "质量",
	pm: "项目",
	finance: "财务",
	legal: "法务",
	operations: "运营",
	research: "研究",
	academic: "学术",
	specialist: "专家",
	engineer: "工程师",
	architect: "架构师",
	designer: "设计师",
	researcher: "研究员",
	manager: "经理",
	analyst: "分析师",
	developer: "开发者",
	consultant: "顾问",
	writer: "作者",
	editor: "编辑",
	guardian: "守护者",
	storyteller: "叙事师",
	injector: "注入师",
	remediation: "修复",
	prompt: "提示词",
	visual: "视觉",
	inclusive: "包容",
	whimsy: "趣味",
	brand: "品牌",
	image: "图像",
	narratologist: "叙事学家",
	psychologist: "心理学家",
	historian: "历史学家",
	geographer: "地理学家",
	anthropologist: "人类学家",
};

function slugToZhFromTokens(slug) {
	const s = String(slug || "").trim().toLowerCase();
	if (!s) return "";
	const parts = s.split(/[-_/]+/).filter(Boolean);
	const bits = parts.map((p) => DEPT_TOKEN_ZH[p] || "").filter(Boolean);
	if (bits.length) return [...new Set(bits)].join("·");
	return "";
}

function deptToZh(name) {
	const raw = String(name || "").trim();
	const s = raw.toLowerCase();
	if (!s) return "未分组";
	if (MATERIAL_DEPT_ZH[s]) return MATERIAL_DEPT_ZH[s];
	if (/[\u4e00-\u9fff]/.test(raw)) return raw;
	const fromTokens = slugToZhFromTokens(s);
	if (fromTokens) return fromTokens;
	return raw;
}

/** 解析素材 snippet 中的 description（支持引号跨行） */
function parseSnippetDesc(snippet) {
	const s = String(snippet || "");
	if (!s.trim()) return "";
	const dq = s.match(/description:\s*"((?:[^"\\]|\\.)*)"/is);
	if (dq && dq[1]) {
		return String(dq[1])
			.replace(/\\"/g, '"')
			.replace(/\\n/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
	const sq = s.match(/description:\s*'((?:[^'\\]|\\.)*)'/is);
	if (sq && sq[1]) {
		return String(sq[1])
			.replace(/\\'/g, "'")
			.replace(/\\n/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
	// 兼容单行 YAML 风格：description: ... color: ... emoji: ... vibe: ...
	const raw = s.match(/description:\s*([\s\S]*?)\s+(?:color|emoji|vibe|tools|author)\s*:/i);
	if (raw && raw[1]) {
		return String(raw[1]).trim().replace(/^["']|["']$/g, "").trim();
	}
	const hit = s.match(/description:\s*([^\n]+)/i);
	if (hit && hit[1]) return String(hit[1]).trim().replace(/^["']|["']$/g, "").trim();
	return "";
}

function parseSnippetName(snippet) {
	const s = String(snippet || "");
	const m = s.match(/^\s*---[\s\S]*?^name:\s*(.+)$/im);
	if (!m || !m[1]) return "";
	let v = String(m[1]).trim();
	if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
		v = v.slice(1, -1);
	}
	return v.trim();
}

const ROLE_PHRASE_ZH = [
	[/expert/gi, "专家"],
	[/specialist/gi, "专员"],
	[/strategist/gi, "策略师"],
	[/architect/gi, "架构师"],
	[/engineer/gi, "工程师"],
	[/developer/gi, "开发者"],
	[/designer/gi, "设计师"],
	[/researcher/gi, "研究员"],
	[/manager/gi, "经理"],
	[/analyst/gi, "分析师"],
	[/consultant/gi, "顾问"],
	[/auditor/gi, "审计专家"],
	[/optimization/gi, "优化"],
	[/operations?/gi, "运营"],
	[/workflows?/gi, "工作流"],
	[/automation/gi, "自动化"],
	[/compliance/gi, "合规"],
	[/security/gi, "安全"],
	[/performance/gi, "性能"],
	[/architecture/gi, "架构"],
	[/systems?/gi, "系统"],
	[/platforms?/gi, "平台"],
	[/integrations?/gi, "集成"],
	[/pipelines?/gi, "流程管道"],
	[/cloud/gi, "云"],
	[/frontend/gi, "前端"],
	[/backend/gi, "后端"],
	[/database/gi, "数据库"],
	[/api/gi, "API"],
	[/mobile/gi, "移动端"],
	[/marketing/gi, "营销"],
	[/sales/gi, "销售"],
	[/finance/gi, "财务"],
	[/project management/gi, "项目管理"],
	[/data-driven/gi, "数据驱动"],
	[/real-time/gi, "实时"],
	[/cross-platform/gi, "跨平台"],
	[/scalable/gi, "可扩展"],
	[/reliable/gi, "高可靠"],
	[/maintainable/gi, "可维护"],
	[/production/gi, "生产环境"],
	[/end-to-end/gi, "端到端"],
	[/frameworks?/gi, "框架"],
	[/tooling/gi, "工具链"],
	[/visual/gi, "视觉"],
	[/storytelling/gi, "叙事表达"],
	[/community/gi, "社区"],
	[/engagement/gi, "互动"],
	[/terminal\s+integration\s+specialist/gi, "终端集成专家"],
	[/integration\s+specialist/gi, "集成专家"],
	[/physical\s+and\s+human\s+geography/gi, "自然地理与人文地理"],
	[/climate\s+systems?/gi, "气候系统"],
	[/cartography/gi, "地图制图"],
	[/spatial\s+analysis/gi, "空间分析"],
	[/terrain/gi, "地形"],
	[/resources?/gi, "资源"],
	[/settlement\s+patterns?/gi, "聚落格局"],
	[/geographically\s+coherent/gi, "地理逻辑自洽"],
	[/scientific\s+sense/gi, "科学合理性"],
	[/where\s+you\s+are\s+determines\s+who\s+you\s+become/gi, "你所处的位置会深刻影响发展路径"],
	[/geography\s+is\s+destiny/gi, "地理影响发展路径"],
	[/data\s+remediation/gi, "数据修复"],
	[/machine\s+learning/gi, "机器学习"],
	[/user\s+experience|ux\b/gi, "用户体验"],
	[/ui\b/gi, "界面"],
	[/brand\b/gi, "品牌"],
	[/security\b/gi, "安全"],
	[/compliance\b/gi, "合规"],
	[/expert\s+in/gi, "专长："],
	[/specialist\s+in/gi, "专长："],
	[/masters?\s+/gi, "精通"],
	[/focus(?:es)?\s+on/gi, "聚焦"],
	[/builds?\s+/gi, "构建"],
	[/provides?\s+/gi, "提供"],
];

function softenEnglishForZhHint(text) {
	let t = String(text || "").trim();
	if (!t) return "";
	for (const [re, zh] of ROLE_PHRASE_ZH) {
		t = t.replace(re, zh);
	}
	t = t.replace(/\s+/g, " ").trim();
	if (t.length > 120) t = `${t.slice(0, 118)}…`;
	return t;
}

function translateSnippetDescToZh(text) {
	const raw = String(text || "").trim();
	if (!raw) return "";
	let out = softenEnglishForZhHint(raw);
	out = out
		.replace(/\s*—\s*/g, "，")
		.replace(/\s*-\s*/g, "，")
		.replace(/\s*;\s*/g, "；")
		.replace(/\s*,\s*/g, "，")
		.replace(/\s*\.\s*/g, "。")
		.replace(/\s+/g, " ")
		.trim();
	const alphaCount = (out.match(/[A-Za-z]/g) || []).length;
	if (alphaCount > 14) {
		// 仍有大量英文时，尽量给出可读中文摘要，避免直接暴露英文段落
		if (/geograph/i.test(raw)) {
			return "专长：自然地理与人文地理、气候系统、地图制图与空间分析，能构建地理逻辑自洽、具备科学合理性的方案。";
		}
		if (/anthropolog/i.test(raw)) {
			return "专长：文化系统、仪式与社会关系分析，能够构建具有真实感与内在逻辑的文化设定。";
		}
		if (/histor/i.test(raw)) {
			return "专长：历史分析、分期与史料考据，能提供具有历史真实感的内容支持。";
		}
		if (/narratolog|story|narrative/i.test(raw)) {
			return "专长：叙事结构、人物弧线与故事框架，能把复杂想法组织成清晰叙事。";
		}
		if (/psycholog|behavior|motivation|cognitive/i.test(raw)) {
			return "专长：行为动机与认知模式分析，能够构建可信的人物与互动策略。";
		}
		return "专长：基于该素材的人设与方法论提供分析建议与执行方案。";
	}
	return out;
}

function roleIdTail(id) {
	const parts = String(id || "").split("__");
	return (parts[1] || parts[0] || "").toLowerCase();
}

function roleTitleZh(rawTitle, id, snippet) {
	const title = String(rawTitle || "").trim();
	const slug = String(id || "").trim().toLowerCase();
	const tail = roleIdTail(id);
	const map = [
		[/anthropologist/, "人类学家"],
		[/geographer/, "地理学家"],
		[/historian/, "历史学家"],
		[/narratologist/, "叙事学家"],
		[/psychologist/, "心理学家"],
		[/ux-architect|architectux/, "体验架构师"],
		[/brand-guardian/, "品牌守护者"],
		[/image-prompt-engineer/, "图像提示工程师"],
		[/ui-designer/, "界面设计师"],
		[/ux-researcher/, "用户研究员"],
		[/visual-storyteller/, "视觉叙事师"],
		[/whimsy-injector/, "创意注入师"],
		[/inclusive-visuals-specialist/, "包容视觉专家"],
		[/ai-data-remediation-engineer/, "数据修复工程师"],
		[/terminal-integration-specialist|terminal.*integration/, "终端集成专家"],
		[/spatial/, "空间计算"],
	];
	for (const [rule, zh] of map) {
		if (rule.test(slug) || rule.test(tail) || rule.test(title.toLowerCase())) return zh;
	}
	const fromSnippetName = parseSnippetName(snippet);
	if (fromSnippetName && /[\u4e00-\u9fff]/.test(fromSnippetName)) return fromSnippetName;
	if (fromSnippetName) {
		const softened = softenEnglishForZhHint(fromSnippetName);
		if (/[\u4e00-\u9fff]/.test(softened)) return softened;
	}
	const tokenZh = slugToZhFromTokens(tail.replace(/__/g, "-"));
	if (tokenZh) return tokenZh;
	if (title && /[\u4e00-\u9fff]/.test(title)) return title;
	return title ? softenEnglishForZhHint(title) || "未命名角色" : "未命名角色";
}

function roleIntroZh(id, snippet) {
	const slug = String(id || "").trim().toLowerCase();
	const tail = roleIdTail(id);
	const parsed = parseSnippetDesc(snippet);
	if (parsed) {
		const translated = translateSnippetDescToZh(parsed);
		if (translated) return translated;
	}
	const introMap = [
		[/anthropologist/, "擅长文化系统、仪式与社会关系分析。"],
		[/geographer/, "擅长地理空间、气候与区域规划分析。"],
		[/historian/, "擅长历史脉络梳理与资料考据。"],
		[/narratologist/, "擅长故事结构、人物弧光与叙事设计。"],
		[/psychologist/, "擅长行为动机、认知模式与心理分析。"],
		[/ux-architect|architectux/, "擅长体验架构与前端实现规范。"],
		[/brand-guardian/, "擅长品牌策略、识别系统与一致性维护。"],
		[/image-prompt-engineer/, "擅长把视觉想法转化为高质量生成提示词。"],
		[/ui-designer/, "擅长界面视觉设计与组件系统建设。"],
		[/ux-researcher/, "擅长用户研究、可用性测试与洞察提炼。"],
		[/visual-storyteller/, "擅长视觉叙事与多媒体表达。"],
		[/whimsy-injector/, "擅长加入品牌个性与趣味体验。"],
		[/inclusive-visuals-specialist/, "擅长包容性视觉设计与偏差规避。"],
		[/ai-data-remediation-engineer/, "擅长数据异常修复与数据质量治理。"],
		[/terminal-integration-specialist|terminal.*integration/, "擅长终端仿真、文本渲染与 Swift 终端类组件集成。"],
		[/spatial/, "擅长空间计算、三维交互与相关工程落地。"],
	];
	for (const [rule, intro] of introMap) {
		if (rule.test(slug) || rule.test(tail)) return intro;
	}
	return "根据素材库配置生成数字员工，生成后可到「员工与模型」中微调人设与职责。";
}

export default {
	data() {
		return {
			busy: false,
			activeTab: "manual",
			form: {
				displayName: "",
				personality: "",
				jobTitle: "",
				mainWork: "",
				rolePosition: "",
			},
			departments: [],
			departmentIdx: 0,
			prefillDepartment: "",
			materialOptions: [],
			materialIdx: 0,
			systemDeptOptions: [],
			systemDeptIdx: 0,
			systemDisplayName: "",
		};
	},
	computed: {
		departmentLabels() {
			if (!this.departments.length) return ["暂无部门，请先新增"];
			return this.departments.map((d) => {
				if (typeof d === "string") return d || "";
				return d.name || d.id || "";
			});
		},
		selectedDepartment() {
			if (!this.departments.length) return "";
			const row = this.departments[this.departmentIdx];
			if (typeof row === "string") return row;
			return row?.name || row?.id || "";
		},
		safeDepartmentIdx() {
			if (!this.departments.length) return 0;
			if (typeof this.departmentIdx !== "number" || this.departmentIdx < 0) return 0;
			if (this.departmentIdx >= this.departments.length) return 0;
			return this.departmentIdx;
		},
		materialLabels() {
			if (!this.materialOptions.length) return ["暂无可用素材"];
			return this.materialOptions.map((m) => m.displayText);
		},
		systemDeptLabels() {
			if (!this.systemDeptOptions.length) return ["暂无可选部门"];
			return this.systemDeptOptions.map((d) => d.nameZh);
		},
		safeSystemDeptIdx() {
			if (!this.systemDeptOptions.length) return 0;
			if (typeof this.systemDeptIdx !== "number" || this.systemDeptIdx < 0) return 0;
			if (this.systemDeptIdx >= this.systemDeptOptions.length) return 0;
			return this.systemDeptIdx;
		},
		selectedSystemDept() {
			if (!this.systemDeptOptions.length) return null;
			return this.systemDeptOptions[this.safeSystemDeptIdx] || null;
		},
		safeMaterialIdx() {
			if (!this.materialOptions.length) return 0;
			if (typeof this.materialIdx !== "number" || this.materialIdx < 0) return 0;
			if (this.materialIdx >= this.materialOptions.length) return 0;
			return this.materialIdx;
		},
		selectedMaterial() {
			if (!this.materialOptions.length) return null;
			return this.materialOptions[this.safeMaterialIdx] || null;
		},
		selectedMaterialText() {
			const m = this.selectedMaterial;
			if (!m) return "";
			return m.extraText || "";
		},
	},
	onShow() {
		this.bootstrap();
	},
	onLoad(options) {
		const raw = options?.department;
		if (raw) {
			try {
				this.prefillDepartment = decodeURIComponent(String(raw));
			} catch {
				this.prefillDepartment = String(raw);
			}
		}
	},
	methods: {
		async bootstrap() {
			await Promise.all([this.loadDepartments(), this.loadMaterials()]);
		},
		async loadMaterials() {
			try {
				const rows = await agentsApi.listAgentMaterials();
				const all = (Array.isArray(rows) ? rows : [])
					.map((r, idx) => {
						const id = String(r?.id || r?.materialLibraryId || "").trim();
						if (!id) return null;
						const titleRaw = String(r?.title || r?.displayName || r?.name || "").trim();
						const department = String(r?.department || r?.category || "").trim().toLowerCase();
						return {
							id,
							title: roleTitleZh(titleRaw, id, r?.snippet),
							department,
							departmentZh: deptToZh(department),
							displayText: roleTitleZh(titleRaw, id, r?.snippet),
							extraText: `简介：${roleIntroZh(id, r?.snippet)}`,
						};
					})
					.filter(Boolean);
				const deptMap = new Map();
				all.forEach((m) => {
					const d = m.department || "unknown";
					if (!deptMap.has(d)) {
						deptMap.set(d, { key: d, nameZh: deptToZh(d) });
					}
				});
				this.systemDeptOptions = Array.from(deptMap.values());
				this.systemDeptIdx = this.systemDeptOptions.length ? 0 : -1;
				const firstDept = this.selectedSystemDept?.key || "";
				this.materialOptions = all.filter((m) => (m.department || "unknown") === firstDept);
				this.materialIdx = this.materialOptions.length ? 0 : -1;
			} catch (err) {
				this.materialOptions = [];
				this.materialIdx = -1;
				this.systemDeptOptions = [];
				this.systemDeptIdx = -1;
				uni.showToast({ title: getApiErrorMessage(err) || "素材加载失败", icon: "none" });
			}
		},
		async loadDepartments() {
			try {
				const list = await agentsApi.listUserAgentDepartments();
				const apiRows = (Array.isArray(list) ? list : [])
					.map((r) => {
						if (typeof r === "string") {
							const name = r.trim();
							const zh = departmentToZh(name);
							return name ? { id: name, name: zh } : null;
						}
						const name = String(r?.name || r?.id || "").trim();
						const id = String(r?.id || name);
						const zh = departmentToZh(name || id);
						return name ? { id, name: zh } : null;
					})
					.filter((r) => {
						const name = String(r?.name || "").trim();
						return !!name && name !== "不设置部门";
					})
					.filter(Boolean);
				const baseRows = buildMessageDepartmentBlocks()
					.map((b) => {
						const title = String(b.title || "").trim();
						if (!title) return null;
						return { id: title, name: title };
					})
					.filter(Boolean);
				const merged = [];
				const seen = new Set();
				[...apiRows, ...baseRows].forEach((r) => {
					const idKey = normalizeDeptKey(r?.id || "");
					const nameKey = normalizeDeptKey(r?.name || "");
					const key = idKey || nameKey;
					if (!key || seen.has(key)) return;
					seen.add(key);
					merged.push(r);
				});
				try {
					uni.setStorageSync(DEPT_CACHE_KEY, merged);
				} catch {
					//
				}
				this.departments = merged;
				const preferred = String(this.prefillDepartment || "").trim().toLowerCase();
				if (preferred && merged.length) {
					const hitIdx = merged.findIndex((r) => {
						const n = String(r?.name || r?.id || "").trim().toLowerCase();
						return n === preferred || n.includes(preferred) || preferred.includes(n);
					});
					this.departmentIdx = hitIdx >= 0 ? hitIdx : 0;
				} else {
					this.departmentIdx = merged.length ? 0 : -1;
				}
			} catch (err) {
				let cached = [];
				try {
					const raw = uni.getStorageSync(DEPT_CACHE_KEY);
					cached = (Array.isArray(raw) ? raw : []).filter((r) => {
						const name = String(r?.name || r?.id || "").trim();
						return !!name && name !== "不设置部门";
					});
				} catch {
					//
				}
				this.departments = cached;
				this.departmentIdx = cached.length ? 0 : -1;
				if (!cached.length) {
					uni.showToast({ title: getApiErrorMessage(err) || "部门列表加载失败", icon: "none" });
				}
			}
		},
		onDepartment(e) {
			if (!this.departments.length) return;
			this.departmentIdx = Number(e.detail.value) || 0;
		},
		onMaterialChange(e) {
			if (!this.materialOptions.length) return;
			this.materialIdx = Number(e.detail.value) || 0;
		},
		onSystemDepartmentChange(e) {
			if (!this.systemDeptOptions.length) return;
			this.systemDeptIdx = Number(e.detail.value) || 0;
			const key = this.selectedSystemDept?.key || "";
			if (!key) {
				this.materialOptions = [];
				this.materialIdx = -1;
				return;
			}
			this.busy = true;
			agentsApi
				.listAgentMaterials({ department: key })
				.then((rows) => {
					const list = (Array.isArray(rows) ? rows : [])
						.map((r, idx) => {
							const id = String(r?.id || r?.materialLibraryId || "").trim();
							if (!id) return null;
							const titleRaw = String(r?.title || r?.displayName || r?.name || "").trim();
							return {
								id,
								title: roleTitleZh(titleRaw, id, r?.snippet),
								displayText: roleTitleZh(titleRaw, id, r?.snippet),
								extraText: `简介：${roleIntroZh(id, r?.snippet)}`,
							};
						})
						.filter(Boolean);
					this.materialOptions = list;
					this.materialIdx = list.length ? 0 : -1;
				})
				.catch((err) => {
					this.materialOptions = [];
					this.materialIdx = -1;
					uni.showToast({ title: getApiErrorMessage(err) || "角色加载失败", icon: "none" });
				})
				.finally(() => {
					this.busy = false;
				});
		},
		async submitManual() {
			const n = String(this.form.displayName || "").trim();
			const j = String(this.form.jobTitle || "").trim();
			if (!n) return uni.showToast({ title: "请填写姓名", icon: "none" });
			if (!j) return uni.showToast({ title: "请填写职位", icon: "none" });
			this.busy = true;
			try {
				const payload = {
					displayName: n,
					jobTitle: j,
				};
				if (this.form.personality) payload.personality = this.form.personality;
				if (this.form.mainWork) payload.mainWork = this.form.mainWork;
				if (this.form.rolePosition) payload.rolePosition = this.form.rolePosition;
				if (this.selectedDepartment) payload.department = this.selectedDepartment;
				await agentsApi.createUserAgent(payload);
				uni.showToast({ title: "创建成功", icon: "success" });
				this.form = {
					displayName: "",
					personality: "",
					jobTitle: "",
					mainWork: "",
					rolePosition: "",
				};
			} catch (err) {
				uni.showToast({ title: getApiErrorMessage(err) || "创建失败", icon: "none" });
			} finally {
				this.busy = false;
			}
		},
		async submitSystem() {
			const selected = this.selectedMaterial;
			if (!selected?.id) {
				uni.showToast({ title: "请先选择素材", icon: "none" });
				return;
			}
			this.busy = true;
			try {
				await agentsApi.createUserAgentFromMaterialLibrary({
					materialLibraryId: selected.id,
					displayName: this.systemDisplayName,
				});
				uni.showToast({ title: "系统生成成功", icon: "success" });
				this.systemDisplayName = "";
			} catch (err) {
				uni.showToast({ title: getApiErrorMessage(err) || "系统生成失败", icon: "none" });
			} finally {
				this.busy = false;
			}
		},
	},
};
</script>

<style>
.page { min-height: 100vh; background: #ededed; padding: 24rpx; box-sizing: border-box; }
.section-t { font-size: 30rpx; font-weight: 700; color: #475569; margin: 8rpx 0 12rpx; }
.tab-wrap { display: flex; align-items: center; gap: 16rpx; margin-bottom: 14rpx; }
.tab { flex: 1; text-align: center; font-size: 28rpx; color: #64748b; background: #fff; border-radius: 14rpx; padding: 16rpx 0; border: 1rpx solid #e2e8f0; }
.tab.active { color: #1d4ed8; border-color: #93c5fd; background: #eff6ff; font-weight: 600; }
.card { background: #fff; border-radius: 14rpx; padding: 20rpx; margin-bottom: 12rpx; }
.label { display: block; font-size: 26rpx; color: #64748b; margin-bottom: 10rpx; }
.req { color: #ef4444; margin-right: 4rpx; }
.inp { height: 72rpx; font-size: 28rpx; color: #111; }
.ta { width: 100%; min-height: 120rpx; font-size: 26rpx; color: #111; }
.ph { color: #bbb; }
.picker-line { font-size: 28rpx; color: #111; padding: 10rpx 0; }
.tip { font-size: 24rpx; color: #475569; line-height: 1.5; }
.btn { margin-top: 10rpx; }
.foot-pad { height: 40rpx; padding-bottom: env(safe-area-inset-bottom); }
</style>
