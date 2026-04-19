<!-- 工程部：迭代目标 + 技术债队列 + 发布窗口 + 小队编组 -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero eng">
			<text class="eyebrow">{{ t('dept_eng_eyebrow') }}</text>
			<text class="title">{{ cleanDeptLabel(translatedDepartment.name) }}</text>
			<text class="desc">{{ translatedDepartment.desc }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_eng_sprint_h') }}</text>
			<textarea v-model="sprintGoal" class="ta" :placeholder="t('dept_eng_sprint_ph')" />
		</view>

		<view class="card">
			<text class="h">{{ t('dept_eng_debt_h') }}</text>
			<view class="td-row">
				<input v-model="debtDraft" class="inp" :placeholder="t('dept_eng_debt_ph')" @confirm="addDebt" />
				<button class="mini" size="mini" type="primary" @click="addDebt">{{ t('dept_eng_debt_add') }}</button>
			</view>
			<view v-for="(d, i) in techDebts" :key="i" class="td-item">
				<text class="td-dot">•</text>
				<text class="td-text">{{ d }}</text>
				<text class="td-del" @click="techDebts.splice(i, 1)">{{ t('dept_eng_debt_del') }}</text>
			</view>
			<text v-if="!techDebts.length" class="muted">{{ t('dept_eng_debt_empty') }}</text>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_eng_release_h') }}</text>
			<picker mode="selector" :range="releaseSlots" :value="releaseIdx" @change="onRelease">
				<view class="pick-line">{{ releaseSlots[releaseIdx] }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">{{ t('dept_eng_squad_h') }}</text>
			<text class="sub">{{ t('dept_eng_squad_sub') }}</text>
			<view class="chip-grid">
				<view
					v-for="s in translatedDepartment.services"
					:key="s.id"
					class="chip"
					:class="{ on: squad.has(s.id) }"
					@click="toggle(s.id)"
				>
					<text>{{ cleanDeptLabel(s.name) }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">{{ t('dept_eng_reset') }}</button>
			<button class="btn primary" type="primary" @click="submit">{{ t('dept_eng_submit') }}</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DeptEngineering",
		props: {
			department: { type: Object, required: true },
		},
		data() {
			return {
				sprintGoal: "",
				debtDraft: "",
				techDebts: [],
				releaseIdx: 0,
				squad: new Set(),
			};
		},
		computed: {
			translatedDepartment() {
				return translateDepartment(this.department, getLanguage());
			},
			releaseSlots() {
				return [0, 1, 2, 3].map((i) => this.t(`dept_eng_release_slot_${i}`));
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanDeptLabel,
			onRelease(e) {
				this.releaseIdx = Number(e.detail.value);
			},
			addDebt() {
				const line = (this.debtDraft || "").trim();
				if (!line) return;
				this.techDebts.push(line);
				this.debtDraft = "";
			},
			toggle(id) {
				const next = new Set(this.squad);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				this.squad = next;
			},
			reset() {
				this.sprintGoal = "";
				this.techDebts = [];
				this.releaseIdx = 0;
				this.squad = new Set();
			},
			submit() {
				if (!this.sprintGoal.trim()) {
					uni.showToast({ title: this.t("dept_eng_err_goal"), icon: "none" });
					return;
				}
				if (this.squad.size === 0) {
					uni.showToast({ title: this.t("dept_eng_err_peer"), icon: "none" });
					return;
				}
				uni.showToast({ title: this.t("dept_eng_ok"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #0b1220;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero.eng {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(160deg, #0f172a, #1e3a5f);
		color: #e2e8f0;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #38bdf8;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #94a3b8;
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
		margin-bottom: 12rpx;
	}
	.sub {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin-bottom: 14rpx;
	}
	.ta {
		min-height: 140rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		box-sizing: border-box;
	}
	.td-row {
		display: flex;
		gap: 12rpx;
		align-items: center;
		margin-bottom: 12rpx;
	}
	.inp {
		flex: 1;
		height: 72rpx;
		padding: 0 16rpx;
		background: #f1f5f9;
		border-radius: 12rpx;
		font-size: 26rpx;
	}
	.mini {
		flex-shrink: 0;
	}
	.td-item {
		display: flex;
		align-items: flex-start;
		gap: 8rpx;
		padding: 10rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
		font-size: 24rpx;
		color: #334155;
	}
	.td-dot {
		color: #0ea5e9;
	}
	.td-text {
		flex: 1;
	}
	.td-del {
		color: #94a3b8;
		font-size: 22rpx;
	}
	.muted {
		font-size: 22rpx;
		color: #94a3b8;
	}
	.pick-line {
		padding: 20rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		font-size: 26rpx;
		color: #0f172a;
	}
	.chip-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.chip {
		padding: 14rpx 20rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		font-size: 24rpx;
		color: #475569;
		border: 2rpx solid transparent;
	}
	.chip.on {
		background: #eff6ff;
		border-color: #2563eb;
		color: #1d4ed8;
		font-weight: 700;
	}
	.actions {
		display: flex;
		gap: 16rpx;
		margin-top: 8rpx;
	}
	.btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 42rpx;
		font-size: 28rpx;
		font-weight: 700;
	}
	.btn.ghost {
		background: #1e293b;
		color: #e2e8f0;
	}
	.pad {
		height: 48rpx;
	}
</style>
