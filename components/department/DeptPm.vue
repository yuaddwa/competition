<!-- 项目管理部：里程碑清单 + 风险热度 + 治理角色（职能：交付治理） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">交付治理</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">里程碑 / 检查点</text>
			<view v-for="(m, i) in milestones" :key="i" class="ms-row">
				<text class="idx">{{ i + 1 }}</text>
				<input v-model="milestones[i]" class="inp-grow" placeholder="描述节点与完成标准" />
				<text class="del" @click="milestones.splice(i, 1)">删</text>
			</view>
			<button class="add" size="mini" @click="milestones.push('')">＋ 添加节点</button>
		</view>

		<view class="card">
			<text class="h">综合风险热度（自评 1–5）</text>
			<text class="risk-val">{{ risk }}</text>
			<slider :value="risk" min="1" max="5" step="1" show-value activeColor="#16a34a" @changing="e => (risk = +e.detail.value)" @change="e => (risk = +e.detail.value)" />
		</view>

		<view class="card">
			<text class="h">启用治理角色</text>
			<view class="chk">
				<label v-for="s in translatedDepartment.services" :key="s.id" class="chk-row" @tap="tog(s.id)">
					<text class="box">{{ gov.has(s.id) ? '☑' : '☐' }}</text>
					<text class="nm">{{ cleanDeptLabel(s.name) }}</text>
				</label>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">清空</button>
			<button class="btn primary" type="primary" @click="submit">导出治理纪要</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptPm",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				milestone: "",
				risk: "",
				team: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			tog(id) {
				const n = new Set(this.gov);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.gov = n;
			},
			reset() {
				this.milestones = [""];
				this.risk = 3;
				this.gov = new Set();
			},
			submit() {
				const ok = this.milestones.some((x) => (x || "").trim());
				if (!ok) {
					uni.showToast({ title: this.t("dept_pm_err_milestone"), icon: "none" });
					return;
				}
				if (this.gov.size === 0) {
					uni.showToast({ title: this.t("dept_pm_err_gov"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_pm_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #f0fdf4;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #f0fdf4, #bbf7d0);
		border: 1rpx solid #86efac;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #15803d;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #14532d;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #166534;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #dcfce7;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.ms-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 12rpx;
	}
	.idx {
		width: 36rpx;
		height: 36rpx;
		line-height: 36rpx;
		text-align: center;
		background: #dcfce7;
		border-radius: 50%;
		font-size: 22rpx;
		font-weight: 800;
		color: #15803d;
	}
	.inp-grow {
		flex: 1;
		height: 72rpx;
		padding: 0 12rpx;
		background: #f8fafc;
		border-radius: 10rpx;
		font-size: 26rpx;
	}
	.del {
		font-size: 22rpx;
		color: #94a3b8;
	}
	.add {
		margin-top: 8rpx;
	}
	.risk-val {
		display: block;
		font-size: 48rpx;
		font-weight: 800;
		color: #15803d;
		margin-bottom: 8rpx;
	}
	.chk-row {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 14rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.box {
		font-size: 32rpx;
		color: #16a34a;
	}
	.nm {
		font-size: 28rpx;
		color: #334155;
	}
	.actions {
		display: flex;
		gap: 16rpx;
	}
	.btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 42rpx;
		font-weight: 700;
		font-size: 28rpx;
	}
	.btn.ghost {
		background: #dcfce7;
		color: #166534;
	}
	.pad {
		height: 48rpx;
	}
</style>
