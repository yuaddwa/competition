<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">身份与角色</view>
		<view class="card">
			<text class="label"><text class="req">*</text>称呼</text>
			<input class="inp" v-model="name" placeholder="例如：小艾、阿强、陈经理" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label"><text class="req">*</text>岗位 / 职责</text>
			<input class="inp" v-model="role" placeholder="例如：项目经理、前端、后端、运维、测试" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">性别（展示用）</text>
			<picker mode="selector" :range="genderOptions" :value="genderIdx" @change="onGender">
				<view class="picker-line">{{ genderOptions[genderIdx] }}</view>
			</picker>
		</view>

		<view class="section-t">人设与经历</view>
		<view class="card">
			<text class="label">性格关键词</text>
			<input class="inp" v-model="personality" placeholder="例如：稳重、偏细节、沟通直接" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">爱好 / 口头禅（可选）</text>
			<input class="inp" v-model="hobbies" placeholder="用于让对话更自然" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">项目经历摘要</text>
			<textarea class="ta" v-model="experience" placeholder="例如：做过 3 个电商小程序、熟悉支付与订单" placeholder-class="ph" />
		</view>

		<view class="section-t">协作偏好</view>
		<view class="card">
			<text class="label">回复风格</text>
			<picker mode="selector" :range="replyOptions" :value="replyIdx" @change="onReply">
				<view class="picker-line">{{ replyOptions[replyIdx] }}</view>
			</picker>
			<text class="hint">后续对接 AI 时，将优先按此风格生成回复与日报。</text>
		</view>
		<view class="card">
			<text class="label">补充说明</text>
			<textarea class="ta" v-model="remark" placeholder="对老板的工作习惯、禁忌、对接方式等" placeholder-class="ph" />
		</view>

		<text class="foot-note">创建后为本地数字员工；可一键「裁员」停用（后续版本）。</text>
		<button class="btn" type="primary" :loading="busy" @click="submit">创建数字员工</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addDigitalAgent } from "@/utils/virtualTeamStore";

	export default {
		data() {
			return {
				name: "",
				role: "",
				personality: "",
				hobbies: "",
				experience: "",
				remark: "",
				busy: false,
				genderOptions: ["保密", "男", "女"],
				genderIdx: 0,
				replyOptions: ["简洁", "详细", "先说结论再展开"],
				replyIdx: 1,
			};
		},
		methods: {
			onGender(e) {
				this.genderIdx = Number(e.detail.value) || 0;
			},
			onReply(e) {
				this.replyIdx = Number(e.detail.value) || 0;
			},
			submit() {
				const n = (this.name || "").trim();
				const r = (this.role || "").trim();
				if (!n) {
					uni.showToast({ title: "请填写称呼", icon: "none" });
					return;
				}
				if (!r) {
					uni.showToast({ title: "请填写岗位", icon: "none" });
					return;
				}
				this.busy = true;
				try {
					addDigitalAgent({
						name: n,
						role: r,
						gender: this.genderOptions[this.genderIdx] || "保密",
						personality: this.personality,
						hobbies: this.hobbies,
						experience: this.experience,
						replyStyle: this.replyOptions[this.replyIdx] || "详细",
						remark: this.remark,
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
		min-height: 140rpx;
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
	.foot-note {
		display: block;
		font-size: 22rpx;
		color: #999;
		line-height: 1.5;
		margin: 16rpx 8rpx 24rpx;
	}
	.btn {
		margin-top: 8rpx;
	}
	.foot-pad {
		height: 48rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
