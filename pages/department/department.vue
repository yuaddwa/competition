<template>
	<view class="department-page" v-if="department">
		<view class="header-card">
			<text class="department-name">{{ cleanLabel(department.name) }}</text>
			<text class="department-desc">{{ department.desc }}</text>
		</view>

		<view class="role-list">
			<view
				v-for="(service, index) in department.services"
				:key="service.id"
				class="role-card"
				:class="`size-${index % 3}`"
				@click="openDetail(service)"
			>
				<text class="role-name">{{ cleanLabel(service.name) }}</text>
				<text class="role-intro">{{ service.intro }}</text>
			</view>
		</view>
	</view>

	<view class="empty-page" v-else>
		<text>未找到该部门</text>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";

	export default {
		data() {
			return {
				department: null
			};
		},
		onLoad(options) {
			const id = (options && options.id) || "";
			this.department = agentDepartments.find((item) => item.id === id) || null;
		},
		methods: {
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			},
			openDetail(service) {
				uni.showModal({
					title: this.cleanLabel(service.name),
					content: `专业：${service.expertise}\n使用时机：${service.whenToUse}`,
					showCancel: false
				});
			}
		}
	};
</script>

<style>
	.department-page {
		min-height: 100vh;
		padding: 24rpx;
		background: #f6f8fb;
		box-sizing: border-box;
	}

	.header-card {
		padding: 28rpx;
		background: #fff;
		border-radius: 18rpx;
	}

	.department-name {
		display: block;
		font-size: 36rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.department-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #6f7a89;
	}

	.role-list {
		margin-top: 20rpx;
		column-count: 2;
		column-gap: 16rpx;
	}

	.role-card {
		display: inline-block;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 16rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 1rpx solid #e8edf5;
		padding: 24rpx;
		break-inside: avoid;
	}

	.role-name {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: #1f2d3d;
	}

	.role-intro {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #6f7a89;
		line-height: 1.5;
	}

	.role-card.size-1 .role-intro {
		-webkit-line-clamp: 3;
	}

	.role-card.size-2 .role-intro {
		-webkit-line-clamp: 2;
	}

	.role-card.size-0 .role-intro {
		-webkit-line-clamp: 4;
	}

	.role-intro {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}

	.empty-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #7f8a9a;
		font-size: 28rpx;
	}
</style>

