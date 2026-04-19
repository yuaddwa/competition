<template>
	<view class="page">
		<view class="card">
			<view class="head">
			<view class="avatar-wrap" @click="chooseAvatar">
				<image
					v-if="avatarDisplay"
					class="avatar-img"
					:src="avatarDisplay"
					mode="aspectFill"
				/>
				<text v-else class="avatar-text">{{ avatarChar }}</text>
				<view class="avatar-badge">
					<text class="avatar-badge-t">{{ t('change') }}</text>
				</view>
			</view>
			<view class="head-main">
				<text class="name">{{ displayName }}</text>
				<text class="sub">{{ phoneText }}</text>
				<text v-if="emailLine" class="sub mail">{{ emailLine }}</text>
			</view>
		</view>

		<view class="group">
			<view class="row row-border">
				<text class="lab">{{ t('nickname') }}</text>
				<input
					class="nick-input"
					v-model.trim="nickname"
					maxlength="20"
					:placeholder="t('please_enter_nickname')"
					placeholder-class="ph"
				/>
			</view>
			<view class="row row-border">
				<text class="lab">{{ t('phone_number') }}</text>
				<text class="val">{{ user.phone || user.mobile || "-" }}</text>
			</view>
		</view>
		<button class="btn" type="primary" :loading="saving" @click="saveNickname">{{ t('save_nickname') }}</button>
		</view>
	</view>
</template>

<script>
	import { getToken, getUserInfo, setUserInfo } from "@/utils/index";
	import { t, getLanguage } from "@/utils/lang";
	import {
		getAuthProfile,
		patchAuthNickname,
		uploadAuthAvatar,
		mergeProfileIntoUser,
		resolveAvatarDisplayUrl,
	} from "@/clientApi/authApi";

	export default {
		data() {
			return {
				user: {},
				nickname: "",
				avatarUrl: "",
				saving: false,
				uploading: false,
			};
		},
		computed: {
			displayName() {
				const n =
					this.nickname ||
					this.user.nickname ||
					this.user.name ||
					this.user.username ||
					this.t("my_profile_default");
				return n;
			},
			avatarChar() {
				return this.displayName && this.displayName.length ? this.displayName.slice(0, 1) : this.t("profile_avatar_me");
			},
			avatarDisplay() {
				return resolveAvatarDisplayUrl(this.avatarUrl || this.user.avatarUrl);
			},
			phoneText() {
				const p = this.user.phone || this.user.mobile || "";
				if (!p || String(p).length < 7) return this.t("please_complete_phone");
				const s = String(p);
				return `${s.slice(0, 3)}****${s.slice(-4)}`;
			},
			emailLine() {
				const e = this.user.email;
				return e && String(e).trim() ? String(e).trim() : "";
			},
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: this.t("profile_info_nav") });
			} catch (e) {
				//
			}
			if (!getToken()) {
				uni.showToast({ title: this.t("please_login_first"), icon: "none" });
				setTimeout(() => {
					uni.redirectTo({ url: "/pages/login/login" });
				}, 400);
				return;
			}
			this.hydrateLocal();
			this.syncProfileFromServer();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			hydrateLocal() {
				this.user = getUserInfo() || {};
				this.nickname = this.user.nickname != null ? String(this.user.nickname) : "";
				this.avatarUrl = this.user.avatarUrl || "";
			},
			async syncProfileFromServer() {
				try {
					const profile = await getAuthProfile();
					if (!profile || typeof profile !== "object") return;
					const merged = mergeProfileIntoUser(getUserInfo() || {}, profile);
					setUserInfo(merged);
					this.user = merged;
					if ("nickname" in profile && profile.nickname != null) {
						this.nickname = String(profile.nickname);
					}
					const av = profile.avatarUrl ?? profile.avatar ?? profile.avatarURL;
					if (av != null && String(av).trim()) {
						this.avatarUrl = String(av).trim();
					}
				} catch (e) {
					console.warn("[profile-info] GET /api/auth/profile", e);
				}
			},
			async saveNickname() {
				if (this.saving) return;
				const nextNickname = (this.nickname || "").trim();
				if (nextNickname.length > 20) {
				uni.showToast({ title: this.t('nickname_max_20'), icon: "none" });
				return;
			}
			this.saving = true;
			try {
				await patchAuthNickname(nextNickname);
				const merged = mergeProfileIntoUser(getUserInfo() || {}, {
					nickname: nextNickname,
				});
				setUserInfo(merged);
				this.user = merged;
				this.nickname = nextNickname;
				uni.showToast({ title: this.t('saved'), icon: "success" });
				} catch (e) {
					console.warn("[profile-info] PATCH nickname", e);
				} finally {
					this.saving = false;
				}
			},
			chooseAvatar() {
				if (this.uploading) return;
				uni.chooseImage({
					count: 1,
					sizeType: ["compressed"],
					sourceType: ["album", "camera"],
					success: async (res) => {
						const path = res.tempFilePaths && res.tempFilePaths[0];
						if (!path) return;
						this.uploading = true;
						uni.showLoading({ title: this.t("uploading"), mask: true });
						try {
							const data = await uploadAuthAvatar(path);
							const merged = mergeProfileIntoUser(getUserInfo() || {}, data || {});
							setUserInfo(merged);
							this.user = merged;
							const av = (data && (data.avatarUrl ?? data.avatar)) || merged.avatarUrl;
							if (av) this.avatarUrl = String(av).trim();
							uni.showToast({ title: this.t("avatar_updated"), icon: "success" });
						} catch (e) {
							console.warn("[profile-info] avatar upload", e);
						} finally {
							this.uploading = false;
							uni.hideLoading();
						}
					},
				});
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 28rpx;
		box-sizing: border-box;
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
		border: 1rpx solid #e2e8f0;
	}

	.head {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid #e2e8f0;
		margin-bottom: 16rpx;
	}

	.avatar-wrap {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		border-radius: 18rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.avatar-img {
		width: 120rpx;
		height: 120rpx;
		border-radius: 18rpx;
	}

	.avatar-text {
		font-size: 44rpx;
		font-weight: 700;
		color: #fff;
	}

	.avatar-badge {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 4rpx 0;
		background: rgba(15, 23, 42, 0.55);
		text-align: center;
	}

	.avatar-badge-t {
		font-size: 20rpx;
		color: #fff;
	}

	.head-main {
		margin-left: 22rpx;
		min-width: 0;
		flex: 1;
	}

	.name {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.3;
	}

	.sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #64748b;
	}

	.sub.mail {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #94a3b8;
		word-break: break-all;
	}

	.group {
		background: #fff;
	}

	.row {
		min-height: 92rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.row-border {
		border-bottom: 1rpx solid #e2e8f0;
	}

	.lab {
		font-size: 28rpx;
		color: #475569;
	}

	.val {
		max-width: 66%;
		text-align: right;
		font-size: 28rpx;
		color: #0f172a;
		word-break: break-all;
	}

	.nick-input {
		flex: 1;
		min-width: 0;
		margin-left: 24rpx;
		height: 64rpx;
		text-align: right;
		font-size: 28rpx;
		color: #0f172a;
	}

	.ph {
		color: #94a3b8;
	}

	.btn {
		margin-top: 28rpx;
		height: 86rpx;
		line-height: 86rpx;
		border: none;
		border-radius: 43rpx;
		font-size: 30rpx;
		font-weight: 700;
		background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
	}

	.btn::after {
		border: none;
	}
</style>
