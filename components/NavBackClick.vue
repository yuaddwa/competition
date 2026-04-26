<template>
	<view class="nav-back-root" hover-class="nav-back-hover" @click.stop="handleBack">
		<text class="nav-back-arrow"><</text>
		<text v-if="showLabel" class="nav-back-label">{{ backLabel }}</text>
	</view>
</template>

<script>
	import { t, getLanguage } from "@/utils/lang";
	/**
	 * 自定义导航页用：不依赖 iconfont，避免字形缺失导致「有热区无图标」。
	 * navigateBack 失败时（无上一页）可配置 fallbackTab 跳转到 Tab。
	 */
	export default {
		name: "NavBackClick",
		props: {
			delta: { type: Number, default: 1 },
			/** 是否显示「返回」文字（默认仅显示箭头） */
			showLabel: { type: Boolean, default: false },
			/** 无栈可退时跳转的 tabBar 路径，如 /pages/message/message */
			fallbackTab: { type: String, default: "/pages/message/message" },
		},
		computed: {
			backLabel() {
				return t("nav_back", getLanguage());
			},
		},
		methods: {
			handleBack() {
				uni.navigateBack({
					delta: this.delta,
					fail: () => {
						if (this.fallbackTab) {
							uni.switchTab({ url: this.fallbackTab });
						}
					},
				});
			},
		},
	};
</script>

<style scoped>
	.nav-back-root {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		min-width: 120rpx;
		min-height: 64rpx;
		padding: 4rpx 8rpx 4rpx 0;
		margin-right: 8rpx;
		flex-shrink: 0;
		position: relative;
		z-index: 10;
	}

	.nav-back-hover {
		opacity: 0.55;
	}

	.nav-back-arrow {
		font-size: 40rpx;
		line-height: 1;
		color: #111827;
		font-weight: 600;
		margin-right: 4rpx;
	}

	.nav-back-label {
		font-size: 28rpx;
		line-height: 1;
		color: #111827;
		font-weight: 500;
	}
</style>
