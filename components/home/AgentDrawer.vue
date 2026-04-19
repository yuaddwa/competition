<template>
	<view v-if="visible" class="drawer-mask" @click="$emit('close')">
		<view class="drawer-panel" @click.stop>
			<view class="drawer-head">
				<text class="drawer-title">{{ cleanLabel(service.name || '') }}</text>
				<text class="drawer-close" @click="$emit('close')">{{ t('agent_drawer_close') }}</text>
			</view>
			<text class="drawer-description">{{ service.detail }}</text>
			<view class="drawer-meta">
				<text>{{ t('agent_drawer_expertise') }}{{ service.expertise }}</text>
				<text>{{ t('agent_drawer_when') }}{{ service.whenToUse }}</text>
			</view>
			<button class="drawer-action" @click="$emit('create-task')">{{ t('agent_drawer_create_task') }}</button>
		</view>
	</view>
</template>

<script>
	import { t, getLanguage } from "@/utils/lang";
	export default {
		name: "AgentDrawer",
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			service: {
				type: Object,
				default: () => ({})
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			}
		}
	}
</script>

<style scoped>
	.drawer-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: flex-end;
		z-index: 999;
	}

	.drawer-panel {
		width: 100%;
		background: #fff;
		border-top-left-radius: 24rpx;
		border-top-right-radius: 24rpx;
		padding: 30rpx;
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.drawer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.drawer-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.drawer-close {
		font-size: 24rpx;
		color: #7f8a9a;
	}

	.drawer-description {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		line-height: 1.7;
		color: #42536a;
	}

	.drawer-meta {
		margin-top: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		font-size: 24rpx;
		color: #617187;
	}

	.drawer-action {
		margin-top: 30rpx;
		height: 78rpx;
		line-height: 78rpx;
		border-radius: 39rpx;
		background: #006dff;
		color: #fff;
		font-size: 28rpx;
	}
</style>

