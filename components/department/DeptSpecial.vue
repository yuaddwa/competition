<!-- 专业部门：编排步骤链 + MCP 开关 + 专家池（职能：复杂编排） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_spe_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_spe_brief_h') }}</text>
			<textarea v-model="brief" class="ta" :placeholder="t('dept_spe_brief_ph')" />
		</view>

		<view class="card row-between">
			<text class="h flush">{{ t('dept_spe_mcp_h') }}</text>
			<switch :checked="mcp" color="#ca8a04" @change="mcp = $event.detail.value" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_spe_steps_h') }}</text>
			<view v-for="(st, i) in steps" :key="i" class="st-row">
				<text class="sn">{{ i + 1 }}</text>
				<input v-model="steps[i]" class="inp" :placeholder="t('dept_spe_step_ph')" />
				<text class="rm" @click="steps.splice(i, 1)">−</text>
			</view>
			<button class="add" size="mini" type="default" @click="steps.push('')">{{ t('dept_spe_step_add') }}</button>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_spe_pool_h') }}</text>
			<view class="pool">
				<view v-for="s in translatedDepartment.services" :key="s.id" class="p" :class="{ on: pool.has(s.id) }" @click="flip(s.id)">
					<text>{{ cleanDeptLabel(s.name) }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_spe_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_spe_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptSpecial",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				brief: "",
				mcp: false,
				steps: [""],
				pool: new Set(),
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
			flip(id) {
				const n = new Set(this.pool);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.pool = n;
			},
			reset() {
				this.brief = "";
				this.mcp = false;
				this.steps = [""];
				this.pool = new Set();
			},
			submit() {
				if (!this.brief.trim()) {
					uni.showToast({ title: this.t("dept_spe_err_brief"), icon: "none" });
					return;
				}
				const ok = this.steps.some((x) => (x || "").trim());
				if (!ok) {
					uni.showToast({ title: this.t("dept_spe_err_step"), icon: "none" });
					return;
				}
				if (this.pool.size === 0) {
					uni.showToast({ title: this.t("dept_spe_err_expert"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_spe_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #18181b;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #3f3f46, #52525b);
		border: 2rpx solid #eab308;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #fde047;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #fafafa;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #d4d4d8;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #27272a;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #3f3f46;
	}
	.card.row-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #fafafa;
		margin-bottom: 12rpx;
	}
	.flush {
		margin-bottom: 0 !important;
	}
	.ta {
		min-height: 140rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #18181b;
		border-radius: 12rpx;
		color: #fafafa;
		border: 1rpx solid #52525b;
	}
	.st-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 10rpx;
	}
	.sn {
		width: 36rpx;
		text-align: center;
		font-weight: 800;
		color: #eab308;
	}
	.inp {
		flex: 1;
		height: 72rpx;
		padding: 0 12rpx;
		background: #18181b;
		border-radius: 10rpx;
		color: #fafafa;
		font-size: 26rpx;
		border: 1rpx solid #52525b;
	}
	.rm {
		color: #a1a1aa;
		font-size: 36rpx;
		padding: 0 8rpx;
	}
	.add {
		margin-top: 8rpx;
	}
	.pool {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.p {
		padding: 14rpx 20rpx;
		border-radius: 12rpx;
		border: 2rpx solid #52525b;
		font-size: 24rpx;
		color: #d4d4d8;
	}
	.p.on {
		border-color: #eab308;
		color: #fef08a;
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
		background: #3f3f46;
		color: #fafafa;
	}
	.pad {
		height: 48rpx;
	}
</style>
