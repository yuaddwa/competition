<template>
	<view />
</template>

<script>
	/** 已合并至「员工与模型」，保留路由以兼容旧链接 */
	export default {
		onLoad() {
			uni.redirectTo({ url: "/pages/profile/agent-model-assign" });
		},
	};
</script>
