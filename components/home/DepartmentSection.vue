<template>
	<view class="department-card">
		<view class="department-header">
			<text class="department-title">{{ cleanLabel(translatedDept.name) }}</text>
			<text class="department-desc">{{ translatedDept.desc }}</text>
		</view>

		<view class="service-list">
			<view
				class="service-item"
				v-for="service in translatedDept.services"
				:key="service.id"
				@click="$emit('select-service', service)"
			>
				<view class="service-top">
					<text class="service-name">{{ cleanLabel(service.name) }}</text>
					<text class="service-arrow">></text>
				</view>
				<text class="service-intro">{{ service.intro }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { t, getLanguage, translateDepartment } from "@/utils/lang";

	export default {
		name: "DepartmentSection",
		props: {
			department: {
				type: Object,
				required: true
			}
		},
		computed: {
			translatedDept() {
				return translateDepartment(this.department, getLanguage());
			}
		},
		methods: {
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			}
		}
	}
</script>

<style scoped>
	.department-card {
		margin-top: 24rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.department-header {
		margin-bottom: 20rpx;
	}

	.department-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.department-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #7f8a9a;
	}

	.service-list {
		display: flex;
		flex-direction: column;
		gap: 18rpx;
	}

	.service-item {
		padding: 20rpx;
		background: #f7f9fc;
		border-radius: 16rpx;
		border: 1rpx solid #edf2f7;
	}

	.service-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.service-name {
		display: block;
		font-size: 30rpx;
		color: #212a36;
		font-weight: 600;
	}

	.service-intro {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #6f7a89;
	}

	.service-arrow {
		font-size: 24rpx;
		color: #94a3b8;
	}
</style>

