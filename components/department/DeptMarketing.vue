<!-- 市场部：战役简报 + 渠道矩阵（职能：传播节奏） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_mkt_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_mkt_campaign_h') }}</text>
			<input v-model="campaign" class="inp" :placeholder="t('dept_mkt_campaign_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_mkt_matrix_h') }}</text>
			<view class="matrix">
				<view v-for="m in matrix" :key="m.key" class="cell" :class="{ on: mx.has(m.key) }" @click="flip(m.key)">
					<text class="mk">{{ m.label }}</text>
					<text class="mv">{{ mx.has(m.key) ? t('dept_mkt_mv_on') : t('dept_mkt_mv_off') }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_mkt_brief_h') }}</text>
			<textarea v-model="brief" class="ta" :placeholder="t('dept_mkt_brief_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_mkt_team_h') }}</text>
			<view class="tags">
				<text
					v-for="s in translatedDepartment.services"
					:key="s.id"
					class="tag"
					:class="{ on: bag.has(s.id) }"
					@click="tog(s.id)"
				>{{ cleanDeptLabel(s.name) }}</text>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_mkt_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_mkt_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptMarketing",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				campaign: "",
				mx: new Set(["douyin"]),
				brief: "",
				bag: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			matrix() {
				return [
					{ key: "douyin", label: this.t("dept_mkt_mx_douyin") },
					{ key: "wx", label: this.t("dept_mkt_mx_wx") },
					{ key: "seo", label: this.t("dept_mkt_mx_seo") },
					{ key: "kol", label: this.t("dept_mkt_mx_kol") },
				];
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			flip(k) {
				const n = new Set(this.mx);
				if (n.has(k)) n.delete(k);
				else n.add(k);
				this.mx = n;
			},
			tog(id) {
				const n = new Set(this.bag);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.bag = n;
			},
			reset() {
				this.campaign = "";
				this.mx = new Set(["douyin"]);
				this.brief = "";
				this.bag = new Set();
			},
			submit() {
				if (!this.campaign.trim()) {
					uni.showToast({ title: this.t("dept_mkt_err_theme"), icon: "none" });
					return;
				}
				if (this.bag.size === 0) {
					uni.showToast({ title: this.t("dept_mkt_err_role"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_mkt_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #fdf2f8;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
		border: 1rpx solid #f9a8d4;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #db2777;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #831843;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #9d174d;
		margin-top: 10rpx;
		line-height: 1.45;
		opacity: 0.95;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #fce7f3;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.inp {
		width: 100%;
		height: 80rpx;
		padding: 0 16rpx;
		background: #fdf2f8;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}
	.matrix {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12rpx;
	}
	.cell {
		padding: 20rpx;
		border-radius: 14rpx;
		background: #fdf2f8;
		border: 2rpx solid #fce7f3;
	}
	.cell.on {
		border-color: #db2777;
		background: #fce7f3;
	}
	.mk {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #831843;
	}
	.mv {
		display: block;
		font-size: 22rpx;
		color: #db2777;
		margin-top: 6rpx;
	}
	.ta {
		min-height: 160rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #fdf2f8;
		border-radius: 12rpx;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.tag {
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #fce7f3;
		font-size: 24rpx;
		color: #9d174d;
		border: 2rpx solid transparent;
	}
	.tag.on {
		border-color: #db2777;
		font-weight: 700;
		background: #fbcfe8;
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
		background: #fce7f3;
		color: #9d174d;
	}
	.pad {
		height: 48rpx;
	}
</style>
