<!-- 付费媒体：预算节拍 + 渠道开关 + 投放目标（职能：效果与花费） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">投放与效果</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">预算节拍（自评）</text>
			<text class="pct">{{ pacing }}%</text>
			<slider :value="pacing" min="0" max="100" activeColor="#ea580c" @changing="onPace" @change="onPace" show-value />
			<text class="hint">用于对齐「是否该加码/收量」，不接真实账户也可先填主观节奏。</text>
		</view>

		<view class="card">
			<text class="h">启用渠道</text>
			<view class="ch-row">
				<view v-for="c in channels" :key="c.key" class="ch" :class="{ on: chOn.has(c.key) }" @click="flipCh(c.key)">
					<text>{{ c.label }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">投放目标 / KPI</text>
			<textarea v-model="kpi" class="ta" placeholder="例如：CPA ↓12%，再营销列表扩充至 5 万设备" />
		</view>

		<view class="card">
			<text class="h">协同角色</text>
			<view class="list">
				<view v-for="s in department.services" :key="s.id" class="li" @click="toggle(s.id)">
					<text class="tick">{{ roster.has(s.id) ? "✓" : "" }}</text>
					<view class="grow">
						<text class="nm">{{ cleanDeptLabel(s.name) }}</text>
						<text class="sm">{{ s.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">生成投放动作单</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptPaid",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				pacing: 42,
				channels: [
					{ key: "search", label: "搜索" },
					{ key: "social", label: "信息流" },
					{ key: "shop", label: "电商" },
				],
				chOn: new Set(["search"]),
				kpi: "",
				roster: new Set(),
			};
		},
		methods: {
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
					uni.showToast({ title: "请填写 KPI 方向", icon: "none" });
					return;
				}
				if (this.roster.size === 0) {
					uni.showToast({ title: "请勾选协同角色", icon: "none" });
					return;
				}
				uni.showToast({ title: "投放单已生成（待接后端）", icon: "success" });
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
