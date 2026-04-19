<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">{{ t('identity_role') }}</view>
		<view class="card">
			<text class="label"><text class="req">*</text>{{ t('name_title') }}</text>
			<input class="inp" v-model="name" :placeholder="t('name_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label"><text class="req">*</text>{{ t('position_responsibility') }}</text>
			<input class="inp" v-model="role" :placeholder="t('position_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('gender_display') }}</text>
			<picker mode="selector" :range="genderPickLabels" :value="genderIdx" @change="onGender">
				<view class="picker-line">{{ genderPickLabels[genderIdx] }}</view>
			</picker>
		</view>

		<view class="section-t">{{ t('personality_experience') }}</view>
		<view class="card">
			<text class="label">{{ t('personality_keywords') }}</text>
			<input class="inp" v-model="personality" :placeholder="t('personality_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('hobbies_catchphrases') }}</text>
			<input class="inp" v-model="hobbies" :placeholder="t('hobbies_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('project_experience_summary') }}</text>
			<textarea class="ta" v-model="experience" :placeholder="t('experience_placeholder')" placeholder-class="ph" />
		</view>

		<view class="section-t">{{ t('collaboration_preference') }}</view>
		<view class="card">
			<text class="label">{{ t('reply_style') }}</text>
			<picker mode="selector" :range="replyPickLabels" :value="replyIdx" @change="onReply">
				<view class="picker-line">{{ replyPickLabels[replyIdx] }}</view>
			</picker>
			<text class="hint">{{ t('reply_style_hint') }}</text>
		</view>
		<view class="card">
			<text class="label">{{ t('additional_notes') }}</text>
			<textarea class="ta" v-model="remark" :placeholder="t('additional_notes_placeholder')" placeholder-class="ph" />
		</view>

		<text class="foot-note">{{ t('agent_creation_note') }}</text>
		<button class="btn" type="primary" :loading="busy" @click="submit">{{ t('create_digital_agent') }}</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addDigitalAgent } from "@/utils/virtualTeamStore";
	import { t, getLanguage } from "@/utils/lang";

	const GENDER_VALUES = ["unspecified", "male", "female"];
	const REPLY_VALUES = ["brief", "detailed", "bluf_first"];

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
				genderIdx: 0,
				replyIdx: 1,
			};
		},
		computed: {
			genderPickLabels() {
				return [this.t("gender_option_private"), this.t("gender_option_male"), this.t("gender_option_female")];
			},
			replyPickLabels() {
				return [this.t("reply_option_brief"), this.t("reply_option_detailed"), this.t("reply_option_bluf")];
			},
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
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
				uni.showToast({ title: this.t('please_enter_name'), icon: "none" });
				return;
			}
			if (!r) {
				uni.showToast({ title: this.t('please_enter_position'), icon: "none" });
				return;
			}
			this.busy = true;
			try {
				addDigitalAgent({
					name: n,
					role: r,
					gender: GENDER_VALUES[this.genderIdx] || "unspecified",
					personality: this.personality,
					hobbies: this.hobbies,
					experience: this.experience,
					replyStyle: REPLY_VALUES[this.replyIdx] || "detailed",
					remark: this.remark,
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
