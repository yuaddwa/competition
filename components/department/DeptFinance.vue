<!-- 财务部：会计期间 + 作业类型 + 财务诉求（职能：口径与合规） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_fin_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_fin_period_h') }}</text>
			<picker mode="date" fields="month" :value="period" @change="onPeriod">
				<view class="pick">{{ period || t('dept_fin_period_ph') }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_fin_job_h') }}</text>
			<view class="tabs">
				<view v-for="j in jobs" :key="j.key" class="tab" :class="{ on: job === j.key }" @click="job = j.key">
					<text class="jk">{{ j.label }}</text>
					<text class="jd">{{ j.hint }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_fin_ask_h') }}</text>
			<textarea v-model="ask" class="ta" :placeholder="t('dept_fin_ask_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_fin_role_h') }}</text>
			<view class="list">
				<view v-for="s in translatedDepartment.services" :key="s.id" class="li" @click="pick = s.id">
					<text class="dot">{{ pick === s.id ? "●" : "○" }}</text>
					<view>
						<text class="nm">{{ cleanDeptLabel(s.name) }}</text>
						<text class="sm">{{ s.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_fin_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_fin_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptFinance",
		props: { department: { type: Object, required: true } },
		data() {
			const d = new Date();
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			return {
				period: `${y}-${m}`,
				job: "close",
				ask: "",
				pick: "",
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			jobs() {
				return [
					{ key: "close", label: this.t("dept_fin_job_close_l"), hint: this.t("dept_fin_job_close_h") },
					{ key: "fpa", label: this.t("dept_fin_job_fpa_l"), hint: this.t("dept_fin_job_fpa_h") },
					{ key: "tax", label: this.t("dept_fin_job_tax_l"), hint: this.t("dept_fin_job_tax_h") },
				];
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			onPeriod(e) {
				const v = e.detail.value || "";
				if (v.length >= 7) this.period = v.slice(0, 7);
				else this.period = v;
			},
			reset() {
				const d = new Date();
				const y = d.getFullYear();
				const m = String(d.getMonth() + 1).padStart(2, "0");
				this.period = `${y}-${m}`;
				this.job = "close";
				this.ask = "";
				this.pick = "";
			},
			submit() {
				if (!this.ask.trim()) {
					uni.showToast({ title: this.t("dept_fin_err_ask"), icon: "none" });
					return;
				}
				if (!this.pick) {
					uni.showToast({ title: this.t("dept_fin_err_role"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_fin_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #f7fee7;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #f7fee7, #d9f99d);
		border: 1rpx solid #a3e635;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #4d7c0f;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #365314;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #3f6212;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #ecfccb;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.pick {
		padding: 20rpx;
		background: #ecfccb;
		border-radius: 12rpx;
		font-size: 30rpx;
		font-weight: 800;
		color: #365314;
	}
	.tabs {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	.tab {
		padding: 18rpx;
		border-radius: 14rpx;
		border: 2rpx solid #d9f99d;
		background: #fafafa;
	}
	.tab.on {
		border-color: #65a30d;
		background: #f7fee7;
	}
	.jk {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #365314;
	}
	.jd {
		display: block;
		font-size: 22rpx;
		color: #65a30d;
		margin-top: 4rpx;
	}
	.ta {
		min-height: 140rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #fafafa;
		border-radius: 12rpx;
	}
	.list .li {
		display: flex;
		gap: 12rpx;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #ecfccb;
	}
	.dot {
		font-size: 28rpx;
		color: #65a30d;
		width: 36rpx;
	}
	.nm {
		display: block;
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
		background: #ecfccb;
		color: #365314;
	}
	.pad {
		height: 48rpx;
	}
</style>
