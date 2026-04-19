<!-- 兼容旧入口：直接进入首页，无需登录 -->
<template>
	<view class="splash" />
</template>

<script>
	export default {
		onLoad() {
			uni.reLaunch({
				url: "/pages/home/home",
			});
		},
	};
</script>

<style scoped>
	.splash {
		min-height: 100vh;
		background: #f8fafc;
	}
</style>
