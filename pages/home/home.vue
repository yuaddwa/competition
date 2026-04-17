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
				placeholder="搜索部门（例如：工程、市场、产品）"
				confirm-type="search"
			/>
			<text v-if="keyword" class="search-clear" @click="keyword = ''">清空</text>
		</view>

		<view class="department-grid">
			<view
				v-for="(department, index) in filteredDepartments"
				:key="department.id"
				class="department-tile"
				:class="tileClass(index)"
				@click="openDepartment(department)"
			>
				<text class="tile-title">{{ cleanLabel(department.name) }}</text>
				<text class="tile-desc">{{ department.desc }}</text>
				<text class="tile-count">{{ department.services.length }} 个角色</text>
			</view>
		</view>
		<view v-if="filteredDepartments.length === 0" class="empty-tip">没有匹配的部门，试试其他关键词</view>

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

	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";

	export default {
		data() {
			return {
				currentPage: 'home',
				keyword: '',
				departments: agentDepartments
			}
		},
		computed: {
			filteredDepartments() {
				const key = this.keyword.trim().toLowerCase();
				if (!key) return this.departments;
				return this.departments.filter((department) =>
					`${department.name} ${department.desc}`.toLowerCase().includes(key)
				);
			}
		},
		methods: {
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			},
			tileClass(index) {
				const pattern = [
					"shape-wide tone-a",
					"shape-compact tone-b",
					"shape-compact tone-c",
					"shape-wide tone-d",
					"shape-compact tone-e",
					"shape-compact tone-f"
				];
				return pattern[index % pattern.length];
			},
			openDepartment(department) {
				uni.navigateTo({
					url: `/pages/department/department?id=${department.id}`
				});
			},
			handleBrandCta() {
				uni.showToast({ title: '请选择一个部门进入', icon: 'none' });
			},
			handleCreateTask() {
				uni.showToast({ title: '任务创建功能开发中', icon: 'none' });
			},
			handleOpenWorkflow() {
				uni.showToast({ title: '工作流入口开发中', icon: 'none' });
			},
			navigateTo(page) {
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
		background: #f4f6fb;
		box-sizing: border-box;
	}

	.brand-section {
		display: flex;
		flex-direction: column;
		padding: 40rpx 30rpx;
		background: linear-gradient(135deg, #3158ff 0%, #6d4dff 55%, #8f59ff 100%);
		border-radius: 24rpx;
		color: #fff;
		box-shadow: 0 10rpx 28rpx rgba(86, 92, 255, 0.28);
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
		background: rgba(255, 255, 255, 0.95);
		color: #3f4df2;
		font-size: 26rpx;
		font-weight: 600;
		border-radius: 34rpx;
	}

	.search-box {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		background: #ffffff;
		border-radius: 14rpx;
		padding: 0 20rpx;
		border: 1rpx solid #dfe6f6;
		box-shadow: 0 4rpx 14rpx rgba(31, 45, 77, 0.05);
	}

	.search-input {
		flex: 1;
		height: 76rpx;
		font-size: 26rpx;
		color: #1f2d3d;
	}

	.search-clear {
		font-size: 24rpx;
		color: #5160f2;
	}

	.department-grid {
		margin-top: 24rpx;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		grid-auto-rows: 12rpx;
		grid-auto-flow: dense;
		gap: 14rpx;
		align-items: stretch;
	}

	.department-tile {
		grid-column: span 3;
		grid-row: span 9;
		background: #fff;
		border: 1rpx solid #dfe6f2;
		border-radius: 22rpx;
		padding: 18rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-shadow: 0 8rpx 18rpx rgba(20, 38, 70, 0.05);
		position: relative;
		overflow: hidden;
	}

	.department-tile::after {
		content: "";
		position: absolute;
		right: -30rpx;
		top: -30rpx;
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
	}

	.department-tile.shape-wide {
		grid-column: span 4;
		grid-row: span 9;
	}

	.department-tile.shape-compact {
		grid-column: span 2;
		grid-row: span 9;
	}

	.department-tile.tone-a {
		background: linear-gradient(160deg, #ffffff 0%, #eef4ff 100%);
	}

	.department-tile.tone-b {
		background: linear-gradient(160deg, #ffffff 0%, #f2efff 100%);
	}

	.department-tile.tone-c {
		background: linear-gradient(160deg, #ffffff 0%, #ecfaf5 100%);
	}

	.department-tile.tone-d {
		background: linear-gradient(160deg, #ffffff 0%, #fff1e8 100%);
	}

	.department-tile.tone-e {
		background: linear-gradient(160deg, #ffffff 0%, #edf8ff 100%);
	}

	.department-tile.tone-f {
		background: linear-gradient(160deg, #ffffff 0%, #fff4e8 100%);
	}

	.tile-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.tile-desc {
		margin-top: 10rpx;
		font-size: 20rpx;
		color: #6f7a89;
		line-height: 1.5;
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	.tile-count {
		margin-top: 16rpx;
		font-size: 20rpx;
		color: #4e5cf0;
		font-weight: 600;
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
		border: 1rpx solid #dfe6f2;
	}

	.action-btn {
		flex: 1;
		height: 78rpx;
		line-height: 78rpx;
		font-size: 28rpx;
		border-radius: 39rpx;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #3f5dff, #6f54ff);
		color: #fff;
		box-shadow: 0 8rpx 18rpx rgba(76, 90, 255, 0.24);
	}

	.action-btn.secondary {
		background: #edf2ff;
		color: #4a5af2;
	}

	.tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		height: 100rpx;
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