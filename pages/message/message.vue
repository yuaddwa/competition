<template>
	<view class="page">
		<AppTabBar current="message" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";

	export default {
		components: { AppTabBar },
		onLoad() {
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background-color: #f1f5f9;
		box-sizing: border-box;
	}
</style>
