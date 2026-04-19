<!-- 产品部：假设验证 + 时间盒 + PM 组合（职能：路线图与证据） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_prd_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_prd_box_h') }}</text>
			<picker mode="selector" :range="boxes" :value="boxIdx" @change="onBox">
				<view class="pick">{{ boxes[boxIdx] }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_prd_hypo_h') }}</text>
			<textarea v-model="hypothesis" class="ta" :placeholder="t('dept_prd_hypo_ph')" />
		</view>

		<view class="card row">
			<text class="h flush">{{ t('dept_prd_focus_h') }}</text>
			<view class="modes">
				<text class="mode" :class="{ on: mode === 'discovery' }" @click="mode = 'discovery'">{{ t('dept_prd_mode_discovery') }}</text>
				<text class="mode" :class="{ on: mode === 'delivery' }" @click="mode = 'delivery'">{{ t('dept_prd_mode_delivery') }}</text>
			</view>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_prd_team_h') }}</text>
			<view class="tiles">
				<view v-for="s in translatedDepartment.services" :key="s.id" class="tile" :class="{ on: set.has(s.id) }" @click="tog(s.id)">
					<text>{{ cleanDeptLabel(s.name) }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_prd_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_prd_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptProduct",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				boxIdx: 0,
				hypothesis: "",
				mode: "discovery",
				set: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			boxes() {
				return [0, 1, 2, 3].map((i) => this.t(`dept_prd_box_${i}`));
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			onBox(e) {
				this.boxIdx = Number(e.detail.value);
			},
			tog(id) {
				const n = new Set(this.set);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.set = n;
			},
			reset() {
				this.boxIdx = 1;
				this.hypothesis = "";
				this.mode = "discovery";
				this.set = new Set();
			},
			submit() {
				if (!this.hypothesis.trim()) {
					uni.showToast({ title: this.t("dept_prd_err_hypo"), icon: "none" });
					return;
				}
				if (this.set.size === 0) {
					uni.showToast({ title: this.t("dept_prd_err_pm"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_prd_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #eef2ff;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #eef2ff, #c7d2fe);
		border: 1rpx solid #a5b4fc;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #4f46e5;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #312e81;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #4338ca;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
	}
	.card.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 12rpx;
	}
	.flush {
		margin-bottom: 0 !important;
	}
	.pick {
		padding: 20rpx;
		background: #eef2ff;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #312e81;
		font-weight: 700;
	}
	.ta {
		min-height: 160rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #f8fafc;
		border-radius: 12rpx;
	}
	.modes {
		display: flex;
		gap: 12rpx;
	}
	.mode {
		padding: 14rpx 28rpx;
		border-radius: 999rpx;
		background: #e0e7ff;
		font-size: 26rpx;
		color: #4338ca;
	}
	.mode.on {
		background: #4f46e5;
		color: #fff;
		font-weight: 800;
	}
	.tiles {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.tile {
		padding: 14rpx 20rpx;
		border-radius: 12rpx;
		background: #f1f5f9;
		font-size: 24rpx;
		color: #475569;
		border: 2rpx solid transparent;
	}
	.tile.on {
		border-color: #6366f1;
		background: #eef2ff;
		color: #312e81;
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
		background: #e0e7ff;
		color: #3730a3;
	}
	.pad {
		height: 48rpx;
	}
</style>
