<template>
	<view class="shell">
		<!-- uni-app vite 不支持 <component :is>，改用分支部件 -->
		<DeptEngineering v-if="department && department.id === 'engineering'" :department="department" />
		<DeptDesign v-else-if="department && department.id === 'design'" :department="department" />
		<DeptPaid v-else-if="department && department.id === 'paid'" :department="department" />
		<DeptSales v-else-if="department && department.id === 'sales'" :department="department" />
		<DeptMarketing v-else-if="department && department.id === 'marketing'" :department="department" />
		<DeptProduct v-else-if="department && department.id === 'product'" :department="department" />
		<DeptPm v-else-if="department && department.id === 'pm'" :department="department" />
		<DeptQa v-else-if="department && department.id === 'qa'" :department="department" />
		<DeptSupport v-else-if="department && department.id === 'support'" :department="department" />
		<DeptSpatial v-else-if="department && department.id === 'spatial'" :department="department" />
		<DeptSpecial v-else-if="department && department.id === 'special'" :department="department" />
		<DeptFinance v-else-if="department && department.id === 'finance'" :department="department" />
		<DeptAcademic v-else-if="department && department.id === 'academic'" :department="department" />
		<DeptDefault v-else-if="department" :department="department" />
		<view v-else class="empty-page"><text>{{ t('department_not_found') }}</text></view>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	import DeptEngineering from "@/components/department/DeptEngineering.vue";
	import DeptDesign from "@/components/department/DeptDesign.vue";
	import DeptPaid from "@/components/department/DeptPaid.vue";
	import DeptSales from "@/components/department/DeptSales.vue";
	import DeptMarketing from "@/components/department/DeptMarketing.vue";
	import DeptProduct from "@/components/department/DeptProduct.vue";
	import DeptPm from "@/components/department/DeptPm.vue";
	import DeptQa from "@/components/department/DeptQa.vue";
	import DeptSupport from "@/components/department/DeptSupport.vue";
	import DeptSpatial from "@/components/department/DeptSpatial.vue";
	import DeptSpecial from "@/components/department/DeptSpecial.vue";
	import DeptFinance from "@/components/department/DeptFinance.vue";
	import DeptAcademic from "@/components/department/DeptAcademic.vue";
	import DeptDefault from "@/components/department/DeptDefault.vue";

	export default {
		name: "DepartmentEntry",
		components: {
			DeptEngineering,
			DeptDesign,
			DeptPaid,
			DeptSales,
			DeptMarketing,
			DeptProduct,
			DeptPm,
			DeptQa,
			DeptSupport,
			DeptSpatial,
			DeptSpecial,
			DeptFinance,
			DeptAcademic,
			DeptDefault,
		},
		data() {
			return {
				department: null,
			};
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			syncDeptNavTitle() {
				if (!this.department) return;
				try {
					const loc = translateDepartment(this.department, getLanguage());
					uni.setNavigationBarTitle({ title: cleanDeptLabel(loc.name) });
				} catch {
					//
				}
			},
		},
		onLoad(options) {
			const id = (options && options.id) || "";
			this.department = agentDepartments.find((item) => item.id === id) || null;
			this.syncDeptNavTitle();
		},
		onShow() {
			this.syncDeptNavTitle();
		},
	};
</script>

<style scoped>
	.shell {
		min-height: 100vh;
	}

	.empty-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #94a3b8;
	}
</style>
