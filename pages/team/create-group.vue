<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">{{ t('basic_info') }}</view>
		<view class="card">
			<text class="label"><text class="req">*</text>{{ t('group_name') }}</text>
			<input class="inp" v-model="name" :placeholder="t('group_name_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('client_project_shortname') }}</text>
			<input class="inp" v-model="clientName" :placeholder="t('client_project_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('deliverable_description') }}</text>
			<textarea class="ta" v-model="deliverable" :placeholder="t('deliverable_placeholder')" placeholder-class="ph" />
		</view>

		<view class="section-t">{{ t('plan_reminder') }}</view>
		<view class="card">
			<text class="label">{{ t('expected_delivery_date') }}</text>
			<picker mode="date" :value="deadline" @change="onDeadline">
				<view class="picker-line">{{ deadline || t('select_date_optional') }}</view>
			</picker>
		</view>
		<view class="card">
			<text class="label">{{ t('daily_report_reminder_time') }}</text>
			<picker mode="selector" :range="timeOptions" :value="notifyIdx" @change="onNotify">
				<view class="picker-line">{{ timeOptions[notifyIdx] }}</view>
			</picker>
			<text class="hint">{{ t('daily_report_reminder_hint') }}</text>
		</view>

		<view class="section-t">{{ t('other') }}</view>
		<view class="card">
			<text class="label">{{ t('remarks') }}</text>
			<textarea class="ta" v-model="desc" :placeholder="t('remarks_placeholder')" placeholder-class="ph" />
		</view>

		<button class="btn" type="primary" :loading="busy" @click="submit">{{ t('create_project_group') }}</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addProjectGroup } from "@/utils/virtualTeamStore";
	import { t, getLanguage } from "@/utils/lang";

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
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			onDeadline(e) {
				this.deadline = (e.detail && e.detail.value) || "";
			},
			onNotify(e) {
				this.notifyIdx = Number(e.detail.value) || 0;
			},
			submit() {
				const n = (this.name || "").trim();
				if (!n) {
				uni.showToast({ title: this.t('please_enter_group_name'), icon: "none" });
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
				uni.showToast({ title: this.t('created'), icon: "success" });
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
