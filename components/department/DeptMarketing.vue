<!-- 市场部：战役简报 + 渠道矩阵（职能：传播节奏） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">增长与传播</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">战役代号 / 主题</text>
			<input v-model="campaign" class="inp" placeholder="例如：新品上市 · 第二波认知" />
		</view>

		<view class="card">
			<text class="h">渠道矩阵（触达）</text>
			<view class="matrix">
				<view v-for="m in matrix" :key="m.key" class="cell" :class="{ on: mx.has(m.key) }" @click="flip(m.key)">
					<text class="mk">{{ m.label }}</text>
					<text class="mv">{{ mx.has(m.key) ? "主推" : "待定" }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">核心信息与素材诉求</text>
			<textarea v-model="brief" class="ta" placeholder="一句话主张、三条证据、要的素材规格" />
		</view>

		<view class="card">
			<text class="h">编组（可多选）</text>
			<view class="tags">
				<text
					v-for="s in department.services"
					:key="s.id"
					class="tag"
					:class="{ on: bag.has(s.id) }"
					@click="tog(s.id)"
				>{{ cleanDeptLabel(s.name) }}</text>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">生成战役简报</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptMarketing",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				campaign: "",
				matrix: [
					{ key: "douyin", label: "短视频" },
					{ key: "wx", label: "微信生态" },
					{ key: "seo", label: "搜索/SEO" },
					{ key: "kol", label: "达人" },
				],
				mx: new Set(["douyin"]),
				brief: "",
				bag: new Set(),
			};
		},
		methods: {
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
					uni.showToast({ title: "请填写战役主题", icon: "none" });
					return;
				}
				if (this.bag.size === 0) {
					uni.showToast({ title: "请至少选择一名角色", icon: "none" });
					return;
				}
				uni.showToast({ title: "简报已生成（待接后端）", icon: "success" });
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
