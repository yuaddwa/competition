<!-- 销售部：管道阶段 + 机会卡片 + 下一步（职能：赢单节奏） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">商机管道</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">当前阶段</text>
			<view class="pipe">
				<view
					v-for="p in stages"
					:key="p.key"
					class="pipe-i"
					:class="{ on: stage === p.key }"
					@click="stage = p.key"
				>
					<text class="dot">{{ stage === p.key ? "●" : "○" }}</text>
					<text class="plab">{{ p.label }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">机会名称</text>
			<input v-model="dealName" class="inp" placeholder="例如：某集团年度框架谈判" />
		</view>

		<view class="card">
			<text class="h">下一步 / 阻挡点</text>
			<textarea v-model="nextStep" class="ta" placeholder="要写清下一步会议、材料、或竞品动态" />
		</view>

		<view class="card">
			<text class="h">请哪类销售能力介入</text>
			<view class="radio-list">
				<view v-for="s in department.services" :key="s.id" class="radio" @click="pick = s.id">
					<text class="r">{{ pick === s.id ? "◉" : "○" }}</text>
					<view>
						<text class="nm">{{ cleanDeptLabel(s.name) }}</text>
						<text class="sm">{{ s.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">清空</button>
			<button class="btn primary" type="primary" @click="submit">同步赢单草稿</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptSales",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				stages: [
					{ key: "disc", label: "发现" },
					{ key: "qual", label: "验证" },
					{ key: "prop", label: "方案" },
					{ key: "close", label: "收尾" },
				],
				stage: "qual",
				dealName: "",
				nextStep: "",
				pick: "",
			};
		},
		methods: {
			cleanDeptLabel,
			reset() {
				this.stage = "qual";
				this.dealName = "";
				this.nextStep = "";
				this.pick = "";
			},
			submit() {
				if (!this.dealName.trim()) {
					uni.showToast({ title: "请填写机会名称", icon: "none" });
					return;
				}
				if (!this.pick) {
					uni.showToast({ title: "请选择销售角色", icon: "none" });
					return;
				}
				uni.showToast({ title: "赢单草稿已保存（待接后端）", icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #ecfeff;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #ecfeff, #a5f3fc);
		border: 1rpx solid #67e8f9;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #0891b2;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #164e63;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #155e75;
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
	.pipe {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.pipe-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.pipe-i.on .dot {
		color: #0891b2;
	}
	.pipe-i.on .plab {
		color: #0e7490;
		font-weight: 800;
	}
	.dot {
		font-size: 28rpx;
		color: #94a3b8;
	}
	.plab {
		font-size: 20rpx;
		color: #64748b;
		margin-top: 6rpx;
	}
	.inp {
		width: 100%;
		height: 80rpx;
		padding: 0 16rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
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
	.radio-list {
		display: flex;
		flex-direction: column;
		gap: 14rpx;
	}
	.radio {
		display: flex;
		gap: 12rpx;
		padding: 16rpx;
		border-radius: 14rpx;
		border: 2rpx solid #e2e8f0;
	}
	.r {
		font-size: 32rpx;
		color: #0891b2;
		line-height: 1.2;
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
		line-height: 1.35;
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
		background: #cffafe;
		color: #155e75;
	}
	.pad {
		height: 48rpx;
	}
</style>
