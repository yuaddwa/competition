<!-- 测试部：覆盖范围 + 严重级别 + 环境（职能：质量门禁） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">质量门禁</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">验证范围</text>
			<textarea v-model="scope" class="ta" placeholder="链路、接口、浏览器矩阵、回归集名称…" />
		</view>

		<view class="card">
			<text class="h">关注严重级别（多选）</text>
			<view class="sev">
				<view v-for="s in severities" :key="s" class="sev-i" :class="{ on: sev.has(s) }" @click="flipSev(s)">
					<text>{{ s }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">验证环境</text>
			<picker mode="selector" :range="envs" :value="envIdx" @change="e => (envIdx = +e.detail.value)">
				<view class="pick">{{ envs[envIdx] }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">测试编组</text>
			<view class="list">
				<view v-for="x in department.services" :key="x.id" class="li" @click="tog(x.id)">
					<text class="mark">{{ qa.has(x.id) ? '✓' : '' }}</text>
					<view>
						<text class="nm">{{ cleanDeptLabel(x.name) }}</text>
						<text class="sm">{{ x.intro }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">出具验证单</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptQa",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				scope: "",
				severities: ["P0", "P1", "P2", "P3"],
				sev: new Set(["P0", "P1"]),
				envs: ["开发", "预发 / Staging", "生产只读镜像", "生产（受控窗口）"],
				envIdx: 1,
				qa: new Set(),
			};
		},
		methods: {
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
					uni.showToast({ title: "请填写验证范围", icon: "none" });
					return;
				}
				if (this.sev.size === 0) {
					uni.showToast({ title: "请选择严重级别", icon: "none" });
					return;
				}
				if (this.qa.size === 0) {
					uni.showToast({ title: "请选择测试角色", icon: "none" });
					return;
				}
				uni.showToast({ title: "验证单已出具（待接后端）", icon: "success" });
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
