<template>
	<view class="home-page">
		<view class="brand-section">
			<text class="brand-name">AI 一人公司</text>
			<text class="brand-tagline">建设未来，一次承诺一个。</text>
			<button class="brand-cta" @click="handleBrandCta">开始协作</button>
		</view>

		<view class="search-box">
			<input
				v-model="keyword"
				class="search-input"
				placeholder="搜索代理人（例如：前端、SEO、产品）"
				confirm-type="search"
			/>
			<text v-if="keyword" class="search-clear" @click="keyword = ''">清空</text>
		</view>

		<department-section
			v-for="department in filteredDepartments"
			:key="department.id"
			:department="department"
			@select-service="openServiceDetail"
		/>
		<view v-if="filteredDepartments.length === 0" class="empty-tip">没有匹配的代理人，试试其他关键词</view>

		<view class="bottom-action">
			<button class="action-btn secondary" @click="handleCreateTask">创建任务</button>
			<button class="action-btn primary" @click="handleOpenWorkflow">进入工作流</button>
		</view>

		<view class="tab-bar">
			<view class="tab-item" :class="{ active: currentPage === 'home' }" @click="navigateTo('home')">
				<text class="tab-icon iconfont">&#xe64f;</text>
				<text class="tab-text">首页</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'project' }" @click="navigateTo('project')">
				<text class="tab-icon iconfont">&#xe620;</text>
				<text class="tab-text">项目</text>
			</view>
			<view class="tab-item center-item">
				<view class="center-button" @click="navigateTo('add')">
					<text class="center-icon iconfont"></text>
				</view>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'message' }" @click="navigateTo('message')">
				<text class="tab-icon iconfont">&#xe87c;</text>
				<text class="tab-text">消息</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'profile' }" @click="navigateTo('profile')">
				<text class="tab-icon iconfont">&#xe654;</text>
				<text class="tab-text">个人</text>
			</view>
		</view>

		<agent-drawer
			:visible="showDrawer"
			:service="selectedService"
			@close="closeServiceDetail"
			@create-task="handleCreateTask"
		/>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";
	import DepartmentSection from "@/components/home/DepartmentSection.vue";
	import AgentDrawer from "@/components/home/AgentDrawer.vue";

	export default {
		components: {
			DepartmentSection,
			AgentDrawer
		},
		data() {
			return {
				currentPage: 'home',
				keyword: '',
				showDrawer: false,
				selectedService: {},
				departments: agentDepartments
			}
		},
		computed: {
			filteredDepartments() {
				const key = this.keyword.trim().toLowerCase();
				if (!key) return this.departments;
				return this.departments
					.map((department) => {
						const departmentMatched = `${department.name} ${department.desc}`.toLowerCase().includes(key);
						if (departmentMatched) return department;
						const services = department.services.filter((service) => {
							const searchText = `${service.name} ${service.intro} ${service.expertise} ${service.whenToUse}`.toLowerCase();
							return searchText.includes(key);
						});
						return { ...department, services };
					})
					.filter((department) => department.services.length > 0);
			}
		},
		methods: {
			openServiceDetail(service) {
				this.selectedService = service;
				this.showDrawer = true;
			},
			closeServiceDetail() {
				this.showDrawer = false;
			},
			handleBrandCta() {
				uni.showToast({ title: '请选择下方 AI 角色开始协作', icon: 'none' });
			},
			handleCreateTask() {
				uni.showToast({ title: '任务创建功能开发中', icon: 'none' });
			},
			handleOpenWorkflow() {
				uni.showToast({ title: '工作流入口开发中', icon: 'none' });
			},
			navigateTo(page) {
				if (page === this.currentPage) return;
				uni.redirectTo({
					url: `/pages/${page}/${page}`
				});
			}
		}
	}
</script>

<style>
	@font-face {
		font-family: 'iconfont';
		src: url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
	}

	.home-page {
		min-height: 100vh;
		padding: 30rpx;
		padding-bottom: 220rpx;
		background: #f6f8fb;
		box-sizing: border-box;
	}

	.brand-section {
		display: flex;
		flex-direction: column;
		padding: 40rpx 30rpx;
		background: linear-gradient(135deg, #006dff, #4a98ff);
		border-radius: 24rpx;
		color: #fff;
	}

	.brand-name {
		font-size: 42rpx;
		font-weight: 700;
	}

	.brand-tagline {
		margin-top: 12rpx;
		font-size: 26rpx;
		opacity: 0.95;
	}

	.brand-cta {
		margin-top: 24rpx;
		width: 220rpx;
		height: 68rpx;
		line-height: 68rpx;
		background: #fff;
		color: #006dff;
		font-size: 26rpx;
		font-weight: 600;
		border-radius: 34rpx;
	}

	.search-box {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 14rpx;
		padding: 0 20rpx;
		border: 1rpx solid #e6ebf2;
	}

	.search-input {
		flex: 1;
		height: 76rpx;
		font-size: 26rpx;
		color: #1f2d3d;
	}

	.search-clear {
		font-size: 24rpx;
		color: #006dff;
	}

	.empty-tip {
		margin-top: 20rpx;
		text-align: center;
		font-size: 24rpx;
		color: #8a97a8;
	}

	.bottom-action {
		display: flex;
		align-items: center;
		gap: 18rpx;
		margin-top: 28rpx;
		padding: 24rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 78rpx;
		line-height: 78rpx;
		font-size: 28rpx;
		border-radius: 39rpx;
	}

	.action-btn.primary {
		background: #006dff;
		color: #fff;
	}

	.action-btn.secondary {
		background: #ecf2ff;
		color: #006dff;
	}

	.tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		z-index: 100;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 100%;
	}

	.tab-text {
		font-size: 20rpx;
		color: #666;
	}

	.tab-item.active .tab-text {
		color: #333;
		font-weight: 700;
	}

	.center-item {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		flex: 1;
	}

	.center-button {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: #007aff;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: -40rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.center-icon {
		font-size: 40rpx;
		color: #fff;
	}

	.tab-icon {
		font-size: 36rpx;
		margin-bottom: 8rpx;
	}

</style>