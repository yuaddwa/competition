<template>
	<view class="shell">
		<component v-if="department" :is="entry" :department="department" />
		<view v-else class="empty-page"><text>未找到该部门</text></view>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";
	import { cleanDeptLabel } from "@/utils/deptUi";

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

	const ENTRY_BY_ID = {
		engineering: DeptEngineering,
		design: DeptDesign,
		paid: DeptPaid,
		sales: DeptSales,
		marketing: DeptMarketing,
		product: DeptProduct,
		pm: DeptPm,
		qa: DeptQa,
		support: DeptSupport,
		spatial: DeptSpatial,
		special: DeptSpecial,
		finance: DeptFinance,
		academic: DeptAcademic,
	};

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
		computed: {
			entry() {
				if (!this.department) return DeptDefault;
				return ENTRY_BY_ID[this.department.id] || DeptDefault;
			},
		},
		onLoad(options) {
			const id = (options && options.id) || "";
			this.department = agentDepartments.find((item) => item.id === id) || null;
			if (this.department) {
				try {
					uni.setNavigationBarTitle({
						title: cleanDeptLabel(this.department.name),
					});
				} catch {
					//
				}
			}
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
