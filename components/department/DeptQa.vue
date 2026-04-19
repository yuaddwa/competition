<!-- 测试部：覆盖范围 + 严重级别 + 环境（职能：质量门禁） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">{{ t('dept_qa_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_qa_scope_h') }}</text>
			<textarea v-model="scope" class="ta" :placeholder="t('dept_qa_scope_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_qa_sev_h') }}</text>
			<view class="sev">
				<view v-for="s in severities" :key="s" class="sev-i" :class="{ on: sev.has(s) }" @click="flipSev(s)">
					<text>{{ s }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_qa_env_h') }}</text>
			<picker mode="selector" :range="envs" :value="envIdx" @change="e => (envIdx = +e.detail.value)">
				<view class="pick">{{ envs[envIdx] }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_qa_team_h') }}</text>
			<view class="list">
				<view v-for="x in translatedDepartment.services" :key="x.id" class="li" @click="tog(x.id)">
					<text class="mark">{{ qa.has(x.id) ? '✓' : '' }}</text>
					<view>
						<text class="nm">{{ cleanDeptLabel(x.name) }}</text>
						<text class="sm">{{ x.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_qa_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_qa_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptQa",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				scope: "",
				severities: ["P0", "P1", "P2", "P3"],
				sev: new Set(["P0", "P1"]),
				envIdx: 1,
				qa: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			envs() {
				return [0, 1, 2, 3].map((i) => this.t(`dept_qa_env_${i}`));
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			flipSev(s) {
				const n = new Set(this.sev);
				if (n.has(s)) n.delete(s);
				else n.add(s);
				this.sev = n;
			},
			tog(id) {
				const n = new Set(this.qa);
				if (n.has(id)) n.delete(id);
				else n.add(id);
				this.qa = n;
			},
			reset() {
				this.scope = "";
				this.sev = new Set(["P0", "P1"]);
				this.envIdx = 1;
				this.qa = new Set();
			},
			submit() {
				if (!this.scope.trim()) {
					uni.showToast({ title: this.t("dept_qa_err_scope"), icon: "none" });
					return;
				}
				if (this.sev.size === 0) {
					uni.showToast({ title: this.t("dept_qa_err_severity"), icon: "none" });
					return;
				}
				if (this.qa.size === 0) {
					uni.showToast({ title: this.t("dept_qa_err_role"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_qa_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #f0fdfa;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #f0fdfa, #99f6e4);
		border: 1rpx solid #5eead4;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #0f766e;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #134e4a;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #115e59;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.ta {
		min-height: 140rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #f8fafc;
		border-radius: 12rpx;
	}
	.sev {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.sev-i {
		padding: 14rpx 22rpx;
		border-radius: 12rpx;
		background: #ecfdf5;
		border: 2rpx solid #a7f3d0;
		font-size: 26rpx;
		font-weight: 700;
		color: #047857;
	}
	.sev-i.on {
		background: #14b8a6;
		color: #fff;
		border-color: #0f766e;
	}
	.pick {
		padding: 20rpx;
		background: #ecfdf5;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #115e59;
		font-weight: 700;
	}
	.list .li {
		display: flex;
		gap: 12rpx;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #ecfdf5;
	}
	.mark {
		width: 36rpx;
		color: #0d9488;
		font-weight: 800;
		font-size: 32rpx;
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
		background: #ccfbf1;
		color: #115e59;
	}
	.pad {
		height: 48rpx;
	}
</style>
