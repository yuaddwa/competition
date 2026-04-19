<!-- 未知部门：通用「目标 + 优先级 + 多选角色」最小闭环 -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>
		<view class="card">
			<text class="h">{{ t('dept_def_goal') }}</text>
			<textarea v-model="goal" class="ta" :placeholder="t('dept_def_goal_ph')" />
		</view>
		<view class="card">
			<text class="h">{{ t('dept_def_priority') }}</text>
			<view class="chips">
				<text v-for="u in urg" :key="u.v" class="c" :class="{ on: uu === u.v }" @click="uu = u.v">{{ u.l }}</text>
			</view>
		</view>
		<view class="card">
			<text class="h">{{ t('dept_def_roles') }}</text>
			<view class="tags">
				<text v-for="s in translatedDepartment.services" :key="s.id" class="t" :class="{ on: bag.has(s.id) }" @click="tog(s.id)">{{ cleanDeptLabel(s.name) }}</text>
			</view>
		</view>
		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('clear') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_def_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptDefault",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				goal: "",
				urgKeys: [
					{ k: "priority_low", v: "l" },
					{ k: "priority_mid", v: "m" },
					{ k: "priority_high", v: "h" },
				],
				uu: "m",
				bag: new Set(),
			};
		},
		computed: {
			urg() {
				return this.urgKeys.map((x) => ({ l: this.t(x.k), v: x.v }));
			},
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
				const n = new Set(this.bag);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.bag = n;
			},
			reset() {
				this.goal = "";
				this.uu = "m";
				this.bag = new Set();
			},
			submit() {
				if (!this.goal.trim()) {
					uni.showToast({ title: this.t("dept_def_err_goal"), icon: "none" });
					return;
				}
				if (this.bag.size === 0) {
					uni.showToast({ title: this.t("dept_def_err_role"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_def_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #f1f5f9;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 24rpx;
		background: #fff;
		border-radius: 18rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #e2e8f0;
	}
	.title {
		display: block;
		font-size: 36rpx;
		font-weight: 800;
		color: #0f172a;
	}
	.desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		padding: 22rpx;
		border-radius: 18rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #e2e8f0;
	}
	.h {
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 12rpx;
		display: block;
	}
	.ta {
		min-height: 120rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #f8fafc;
		border-radius: 12rpx;
	}
	.chips {
		display: flex;
		gap: 12rpx;
	}
	.c {
		padding: 12rpx 28rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		font-size: 26rpx;
		color: #475569;
	}
	.c.on {
		background: #2563eb;
		color: #fff;
		font-weight: 700;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.t {
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		font-size: 24rpx;
		border: 2rpx solid transparent;
		color: #475569;
	}
	.t.on {
		border-color: #2563eb;
		background: #eff6ff;
		color: #1d4ed8;
		font-weight: 700;
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
		background: #e2e8f0;
		color: #334155;
	}
	.pad {
		height: 48rpx;
	}
</style>
