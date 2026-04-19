<!-- 设计部：课题轨道 + 交付物勾选 + 无障碍开关（职能：体验与产出规格） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">体验与视觉</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">课题轨道</text>
			<view class="seg">
				<view v-for="t in tracks" :key="t.key" class="seg-i" :class="{ on: track === t.key }" @click="track = t.key">
					<text>{{ t.label }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">本轮交付物</text>
			<view v-for="item in deliverables" :key="item.key" class="check-row" @click="toggleDel(item.key)">
				<text class="box">{{ delSet.has(item.key) ? "☑" : "☐" }}</text>
				<text class="check-l">{{ item.label }}</text>
			</view>
		</view>

		<view class="card row-between">
			<text class="h flush">无障碍审计</text>
			<switch :checked="a11y" color="#7c3aed" @change="a11y = $event.detail.value" />
		</view>

		<view class="card">
			<text class="h">备注 / 约束</text>
			<textarea v-model="notes" class="ta" placeholder="品牌边界、像素规则、交互动效上限等" />
		</view>

		<view class="card">
			<text class="h">席位（选角色）</text>
			<view class="seat-list">
				<view
					v-for="s in department.services"
					:key="s.id"
					class="seat"
					:class="{ on: picked === s.id }"
					@click="picked = s.id"
				>
					<text class="seat-n">{{ cleanDeptLabel(s.name) }}</text>
					<text class="seat-i">{{ s.intro }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">生成设计工单</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptDesign",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				track: "ui",
				tracks: [
					{ key: "ui", label: "界面" },
					{ key: "ux", label: "用研" },
					{ key: "system", label: "系统" },
				],
				deliverables: [
					{ key: "hifi", label: "高保真关键页面" },
					{ key: "empty", label: "空状态 / 错误态" },
					{ key: "ds", label: "组件库增量" },
				],
				delSet: new Set(["hifi"]),
				a11y: false,
				notes: "",
				picked: "",
			};
		},
		methods: {
			cleanDeptLabel,
			toggleDel(key) {
				const n = new Set(this.delSet);
				if (n.has(key)) n.delete(key);
				else n.add(key);
				this.delSet = n;
			},
			reset() {
				this.track = "ui";
				this.delSet = new Set(["hifi"]);
				this.a11y = false;
				this.notes = "";
				this.picked = "";
			},
			submit() {
				if (this.delSet.size === 0) {
					uni.showToast({ title: "请勾选至少一项交付物", icon: "none" });
					return;
				}
				if (!this.picked) {
					uni.showToast({ title: "请选定一个主设计席位", icon: "none" });
					return;
				}
				uni.showToast({ title: "设计工单已生成（待接后端）", icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: linear-gradient(180deg, #faf5ff 0%, #f5f3ff 100%);
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #faf5ff, #e9d5ff);
		border: 1rpx solid #ddd6fe;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #7c3aed;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #4c1d95;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #6b21a8;
		margin-top: 10rpx;
		opacity: 0.9;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #ede9fe;
	}
	.row-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.flush {
		margin-bottom: 0 !important;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.seg {
		display: flex;
		gap: 12rpx;
	}
	.seg-i {
		flex: 1;
		text-align: center;
		padding: 18rpx;
		border-radius: 14rpx;
		background: #f5f3ff;
		font-size: 26rpx;
		color: #6b21a8;
		border: 2rpx solid transparent;
	}
	.seg-i.on {
		border-color: #a78bfa;
		background: #ede9fe;
		font-weight: 800;
	}
	.check-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 14rpx 0;
		border-bottom: 1rpx solid #f5f3ff;
	}
	.box {
		font-size: 32rpx;
		color: #7c3aed;
	}
	.check-l {
		font-size: 26rpx;
		color: #334155;
	}
	.ta {
		min-height: 120rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		background: #fafafa;
		border-radius: 12rpx;
		box-sizing: border-box;
	}
	.seat-list {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	.seat {
		padding: 18rpx;
		border-radius: 14rpx;
		border: 2rpx solid #e9d5ff;
		background: #fafafa;
	}
	.seat.on {
		border-color: #9333ea;
		background: #faf5ff;
	}
	.seat-n {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
	}
	.seat-i {
		display: block;
		font-size: 22rpx;
		color: #64748b;
		margin-top: 6rpx;
		line-height: 1.4;
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
		background: #ede9fe;
		color: #6b21a8;
	}
	.pad {
		height: 48rpx;
	}
</style>
