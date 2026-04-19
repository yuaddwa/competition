<!-- 空间计算：性能预算 + 场景档位 + 沉浸目标（职能：空间体验） -->
<template>
	<scroll-view scroll-y class="page dark">
		<view class="hero">
			<text class="eyebrow">空间体验</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">目标帧体验（FPS 档位）</text>
			<text class="big">{{ fps }}</text>
			<slider :value="fps" min="72" max="120" step="8" show-value activeColor="#818cf8" @changing="e => (fps = +e.detail.value)" @change="e => (fps = +e.detail.value)" />
		</view>

		<view class="card">
			<text class="h">场景复杂度</text>
			<view class="lv">
				<text v-for="l in levels" :key="l.key" class="lv-i" :class="{ on: tier === l.key }" @click="tier = l.key">{{ l.label }}</text>
			</view>
		</view>

		<view class="card">
			<text class="h">体验与性能目标</text>
			<textarea v-model="goal" class="ta" placeholder="晕眩控制、手势时延、定位容差、多用户同步等" />
		</view>

		<view class="card">
			<text class="h">空间技术编组</text>
			<view class="chips">
				<text v-for="s in translatedDepartment.services" :key="s.id" class="c" :class="{ on: set.has(s.id) }" @click="tog(s.id)">{{ cleanDeptLabel(s.name) }}</text>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">清空</button>
			<button class="btn primary" type="primary" @click="submit">生成空间交付单</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptSpatial",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				fps: 90,
				levels: [
					{ key: "low", label: "轻量" },
					{ key: "mid", label: "中等" },
					{ key: "high", label: "重度" },
				],
				tier: "mid",
				goal: "",
				set: new Set(),
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
				const n = new Set(this.set);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.set = n;
			},
			reset() {
				this.fps = 90;
				this.tier = "mid";
				this.goal = "";
				this.set = new Set();
			},
			submit() {
				if (!this.goal.trim()) {
					uni.showToast({ title: this.t("dept_spa_err_goal"), icon: "none" });
					return;
				}
				if (this.set.size === 0) {
					uni.showToast({ title: this.t("dept_spa_err_team"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_spa_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page.dark {
		max-height: 100vh;
		background: #020617;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(155deg, #1e1b4b, #312e81);
		border: 1rpx solid rgba(129, 140, 248, 0.4);
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #a5b4fc;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #e0e7ff;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #c7d2fe;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #0f172a;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #334155;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #f1f5f9;
		margin-bottom: 12rpx;
	}
	.big {
		display: block;
		font-size: 56rpx;
		font-weight: 800;
		color: #a5b4fc;
		margin-bottom: 8rpx;
	}
	.lv {
		display: flex;
		gap: 12rpx;
	}
	.lv-i {
		flex: 1;
		text-align: center;
		padding: 18rpx;
		border-radius: 14rpx;
		background: #1e293b;
		color: #94a3b8;
		font-size: 26rpx;
		border: 2rpx solid transparent;
	}
	.lv-i.on {
		border-color: #818cf8;
		color: #e0e7ff;
		font-weight: 800;
		background: #312e81;
	}
	.ta {
		min-height: 160rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #1e293b;
		border-radius: 12rpx;
		color: #f8fafc;
		border: 1rpx solid #475569;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.c {
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #1e293b;
		font-size: 24rpx;
		color: #cbd5e1;
		border: 2rpx solid #475569;
	}
	.c.on {
		border-color: #818cf8;
		color: #e0e7ff;
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
		background: #334155;
		color: #e2e8f0;
	}
	.pad {
		height: 48rpx;
	}
</style>
