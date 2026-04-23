<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">创建 Agent</view>
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
		<button class="btn" :loading="busy" @click="submit">创建 Agent</button>

		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
import * as agentsApi from "@/clientApi/agentsApi";
import { getApiErrorMessage } from "@/utils/apiHelpers";

const DEPT_CACHE_KEY = "user_agent_departments_cache";

export default {
	data() {
		return {
			busy: false,
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
			await this.loadDepartments();
		},
		async loadDepartments() {
			try {
				const list = await agentsApi.listUserAgentDepartments();
				const rows = (Array.isArray(list) ? list : [])
					.map((r) => {
						if (typeof r === "string") {
							const name = r.trim();
							return name ? { id: name, name } : null;
						}
						const name = String(r?.name || r?.id || "").trim();
						return name ? { id: String(r?.id || name), name } : null;
					})
					.filter((r) => {
						const name = String(r?.name || "").trim();
						return !!name && name !== "不设置部门";
					})
					.filter(Boolean);
				try {
					uni.setStorageSync(DEPT_CACHE_KEY, rows);
				} catch {
					//
				}
				this.departments = rows;
				const preferred = String(this.prefillDepartment || "").trim().toLowerCase();
				if (preferred && rows.length) {
					const hitIdx = rows.findIndex((r) => {
						const n = String(r?.name || r?.id || "").trim().toLowerCase();
						return n === preferred || n.includes(preferred) || preferred.includes(n);
					});
					this.departmentIdx = hitIdx >= 0 ? hitIdx : 0;
				} else {
					this.departmentIdx = rows.length ? 0 : -1;
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
		async submit() {
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
	},
};
</script>

<style>
.page { min-height: 100vh; background: #ededed; padding: 24rpx; box-sizing: border-box; }
.section-t { font-size: 30rpx; font-weight: 700; color: #475569; margin: 8rpx 0 12rpx; }
.card { background: #fff; border-radius: 14rpx; padding: 20rpx; margin-bottom: 12rpx; }
.label { display: block; font-size: 26rpx; color: #64748b; margin-bottom: 10rpx; }
.req { color: #ef4444; margin-right: 4rpx; }
.inp { height: 72rpx; font-size: 28rpx; color: #111; }
.ta { width: 100%; min-height: 120rpx; font-size: 26rpx; color: #111; }
.ph { color: #bbb; }
.picker-line { font-size: 28rpx; color: #111; padding: 10rpx 0; }
.btn { margin-top: 10rpx; }
.foot-pad { height: 40rpx; padding-bottom: env(safe-area-inset-bottom); }
</style>
