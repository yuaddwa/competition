<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">基本信息</view>
		<view class="card">
			<text class="label"><text class="req">*</text>群名称</text>
			<input class="inp" v-model="name" placeholder="例如：某某客户 · 交付群" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">客户 / 项目简称</text>
			<input class="inp" v-model="clientName" placeholder="方便在列表里一眼识别" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">交付物说明</text>
			<textarea class="ta" v-model="deliverable" placeholder="例如：小程序商城 + 管理后台；验收标准、关键里程碑等" placeholder-class="ph" />
		</view>

		<view class="section-t">计划与提醒</view>
		<view class="card">
			<text class="label">期望上线 / 交付日</text>
			<picker mode="date" :value="deadline" @change="onDeadline">
				<view class="picker-line">{{ deadline || "选择日期（可选）" }}</view>
			</picker>
		</view>
		<view class="card">
			<text class="label">群内日报提醒时间</text>
			<picker mode="selector" :range="timeOptions" :value="notifyIdx" @change="onNotify">
				<view class="picker-line">{{ timeOptions[notifyIdx] }}</view>
			</picker>
			<text class="hint">创建后，员工将在此时间前后提交日报（演示）</text>
		</view>

		<view class="section-t">其他</view>
		<view class="card">
			<text class="label">备注</text>
			<textarea class="ta" v-model="desc" placeholder="项目背景、客户对接人、沟通禁忌等" placeholder-class="ph" />
		</view>

		<button class="btn" type="primary" :loading="busy" @click="submit">创建项目群</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addProjectGroup } from "@/utils/virtualTeamStore";

	export default {
		data() {
			return {
				name: "",
				clientName: "",
				deliverable: "",
				deadline: "",
				desc: "",
				busy: false,
				timeOptions: ["20:00", "20:30", "21:00", "21:30", "22:00"],
				notifyIdx: 2,
			};
		},
		methods: {
			onDeadline(e) {
				this.deadline = (e.detail && e.detail.value) || "";
			},
			onNotify(e) {
				this.notifyIdx = Number(e.detail.value) || 0;
			},
			submit() {
				const n = (this.name || "").trim();
				if (!n) {
					uni.showToast({ title: "请填写群名称", icon: "none" });
					return;
				}
				this.busy = true;
				try {
					addProjectGroup({
						name: n,
						desc: this.desc,
						clientName: this.clientName,
						deliverable: this.deliverable,
						deadline: this.deadline,
						notifyTime: this.timeOptions[this.notifyIdx] || "21:00",
					});
					uni.showToast({ title: "已创建", icon: "success" });
					setTimeout(() => uni.navigateBack(), 400);
				} finally {
					this.busy = false;
				}
			},
		},
	};
</script>

<style>
	.page {
		min-height: 100vh;
		max-height: 100vh;
		background: #ededed;
		padding: 32rpx 24rpx 0;
		box-sizing: border-box;
		overflow-y: auto;
	}
	.section-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #888;
		margin: 8rpx 0 16rpx 8rpx;
	}
	.card {
		background: #fff;
		border-radius: 12rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
	}
	.label {
		display: block;
		font-size: 26rpx;
		color: #576b95;
		margin-bottom: 16rpx;
	}
	.req {
		color: #fa5151;
		margin-right: 4rpx;
	}
	.inp {
		font-size: 30rpx;
		color: #111;
	}
	.ta {
		width: 100%;
		min-height: 160rpx;
		font-size: 28rpx;
		color: #111;
	}
	.ph {
		color: #bbb;
	}
	.picker-line {
		font-size: 30rpx;
		color: #111;
		padding: 8rpx 0;
	}
	.hint {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #b2b2b2;
		line-height: 1.4;
	}
	.btn {
		margin-top: 32rpx;
	}
	.foot-pad {
		height: 48rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
