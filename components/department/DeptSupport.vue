<!-- 支援部：工单类型 + SLA 档位 + 诉求摘要（职能：客户闭环） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">客户与内部支援</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">工单类型</text>
			<picker mode="selector" :range="types" :value="typeIdx" @change="onType">
				<view class="pick">{{ types[typeIdx] }}</view>
			</picker>
		</view>

		<view class="card">
			<text class="h">响应 SLA</text>
			<view class="sla">
				<view v-for="s in slaOpts" :key="s.key" class="sla-i" :class="{ on: sla === s.key }" @click="sla = s.key">
					<text class="sk">{{ s.label }}</text>
					<text class="sd">{{ s.desc }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="h">诉求摘要</text>
			<textarea v-model="body" class="ta" placeholder="现象、影响面、已尝试操作、期望恢复时间" />
		</view>

		<view class="card">
			<text class="h">指派能力</text>
			<view class="tabs">
				<view v-for="x in department.services" :key="x.id" class="tab" :class="{ on: assign === x.id }" @click="assign = x.id">
					<text>{{ cleanDeptLabel(x.name) }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">创建支援单</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptSupport",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				types: ["功能咨询", "故障 / 不可用", "账单与合规", "数据与报表"],
				typeIdx: 0,
				slaOpts: [
					{ key: "std", label: "标准", desc: "工作日队列" },
					{ key: "urgent", label: "紧急", desc: "升级与值班" },
				],
				sla: "std",
				body: "",
				assign: "",
			};
		},
		methods: {
			cleanDeptLabel,
			onType(e) {
				this.typeIdx = Number(e.detail.value);
			},
			reset() {
				this.typeIdx = 0;
				this.sla = "std";
				this.body = "";
				this.assign = "";
			},
			submit() {
				if (!this.body.trim()) {
					uni.showToast({ title: "请填写诉求摘要", icon: "none" });
					return;
				}
				if (!this.assign) {
					uni.showToast({ title: "请选择指派能力", icon: "none" });
					return;
				}
				uni.showToast({ title: "支援单已创建（待接后端）", icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #faf5ff;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #faf5ff, #e9d5ff);
		border: 1rpx solid #d8b4fe;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #7e22ce;
		font-weight: 700;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #581c87;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #6b21a8;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #f3e8ff;
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
		background: #faf5ff;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #6b21a8;
		font-weight: 700;
	}
	.sla {
		display: flex;
		gap: 14rpx;
	}
	.sla-i {
		flex: 1;
		padding: 18rpx;
		border-radius: 14rpx;
		border: 2rpx solid #e9d5ff;
		background: #fafafa;
	}
	.sla-i.on {
		border-color: #9333ea;
		background: #faf5ff;
	}
	.sk {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #581c87;
	}
	.sd {
		display: block;
		font-size: 22rpx;
		color: #9333ea;
		margin-top: 6rpx;
	}
	.ta {
		min-height: 160rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		box-sizing: border-box;
		background: #fafafa;
		border-radius: 12rpx;
	}
	.tabs {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	.tab {
		padding: 18rpx;
		border-radius: 14rpx;
		border: 2rpx solid #ede9fe;
		font-size: 26rpx;
		color: #475569;
		text-align: center;
	}
	.tab.on {
		border-color: #9333ea;
		background: #f5f3ff;
		font-weight: 800;
		color: #581c87;
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
		background: #f3e8ff;
		color: #6b21a8;
	}
	.pad {
		height: 48rpx;
	}
</style>
