<!-- 付费媒体：预算节拍 + 渠道开关 + 投放目标（职能：效果与花费） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_paid_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_paid_pace_h') }}</text>
			<text class="pct">{{ pacing }}%</text>
			<slider :value="pacing" min="0" max="100" activeColor="#ea580c" @changing="onPace" @change="onPace" show-value />
			<text class="hint">{{ t('dept_paid_pace_hint') }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_paid_channels_h') }}</text>
			<view class="ch-row">
				<view v-for="c in channels" :key="c.key" class="ch" :class="{ on: chOn.has(c.key) }" @click="flipCh(c.key)">
					<text>{{ c.label }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_paid_kpi_h') }}</text>
			<textarea v-model="kpi" class="ta" :placeholder="t('dept_paid_kpi_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_paid_roles_h') }}</text>
			<view class="list">
				<view v-for="s in translatedDepartment.services" :key="s.id" class="li" @click="toggle(s.id)">
					<text class="tick">{{ roster.has(s.id) ? "✓" : "" }}</text>
					<view class="grow">
						<text class="nm">{{ cleanDeptLabel(s.name) }}</text>
						<text class="sm">{{ s.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_paid_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_paid_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptPaid",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				pacing: 42,
				chOn: new Set(["search"]),
				kpi: "",
				roster: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			channels() {
				return [
					{ key: "search", label: this.t("dept_paid_ch_search") },
					{ key: "social", label: this.t("dept_paid_ch_social") },
					{ key: "shop", label: this.t("dept_paid_ch_shop") },
				];
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			onPace(e) {
				this.pacing = Number(e.detail.value);
			},
			flipCh(k) {
				const n = new Set(this.chOn);
				if (n.has(k)) n.delete(k);
				else n.add(k);
				this.chOn = n;
			},
			toggle(id) {
				const n = new Set(this.roster);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.roster = n;
			},
			reset() {
				this.pacing = 42;
				this.chOn = new Set(["search"]);
				this.kpi = "";
				this.roster = new Set();
			},
			submit() {
				if (!this.kpi.trim()) {
					uni.showToast({ title: this.t("dept_paid_err_kpi"), icon: "none" });
					return;
				}
				if (this.roster.size === 0) {
					uni.showToast({ title: this.t("dept_paid_err_role"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_paid_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #fff7ed;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #fffbeb, #fed7aa);
		border: 1rpx solid #fdba74;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #c2410c;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #7c2d12;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #9a3412;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #ffedd5;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 12rpx;
	}
	.pct {
		display: block;
		font-size: 44rpx;
		font-weight: 800;
		color: #ea580c;
		margin-bottom: 8rpx;
	}
	.hint {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		margin-top: 12rpx;
		line-height: 1.4;
	}
	.ch-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.ch {
		padding: 14rpx 22rpx;
		border-radius: 999rpx;
		background: #fff7ed;
		border: 2rpx solid #fed7aa;
		font-size: 24rpx;
		color: #9a3412;
	}
	.ch.on {
		background: #ffedd5;
		border-color: #ea580c;
		font-weight: 700;
	}
	.ta {
		min-height: 140rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #fffbeb;
		border-radius: 12rpx;
	}
	.list .li {
		display: flex;
		gap: 12rpx;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #ffedd5;
	}
	.tick {
		width: 36rpx;
		color: #ea580c;
		font-weight: 800;
	}
	.grow {
		flex: 1;
	}
	.nm {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
	}
	.sm {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin-top: 4rpx;
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
		background: #ffedd5;
		color: #9a3412;
	}
	.pad {
		height: 48rpx;
	}
</style>
