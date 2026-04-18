<template>
	<view class="home-page">
		<scroll-view scroll-y class="scroll" :show-scrollbar="false">
			<view class="hero">
				<text class="hero-kicker">组织 · 沟通</text>
				<text class="hero-title">指挥中心</text>
				<text class="hero-desc">优先展示与高管直接对齐的部门；其余部门按条线收起，避免首页拥挤。</text>
			</view>

			<view class="section">
				<view class="section-head">
					<text class="section-title">高管直连</text>
					<text class="section-desc">节奏与决策对齐的核心入口</text>
				</view>
				<view class="featured-grid">
					<view
						v-for="department in featuredDepartments"
						:key="department.id"
						class="tile featured"
						:style="tileStyle(department.id)"
						@click="openDepartment(department)"
					>
						<text class="tile-title">{{ cleanLabel(department.name) }}</text>
						<text class="tile-desc">{{ department.desc }}</text>
						<text class="tile-count">{{ department.services.length }} 个角色</text>
					</view>
				</view>
			</view>

			<view class="expand-toggle" @click="showOrgRest = !showOrgRest">
				<text class="expand-text">{{ showOrgRest ? "收起组织条线" : `查看其余 ${otherDeptCount} 个部门（按条线）` }}</text>
				<text class="expand-icon">{{ showOrgRest ? "︿" : "﹀" }}</text>
			</view>

			<view v-if="showOrgRest" class="org-rest">
				<view v-for="(block, bi) in groupedOtherSections" :key="bi" class="org-block">
					<text class="org-block-title">{{ block.title }}</text>
					<view class="org-grid">
						<view
							v-for="department in block.departments"
							:key="department.id"
							class="tile org"
							:style="tileStyle(department.id)"
							@click="openDepartment(department)"
						>
							<text class="tile-title sm">{{ cleanLabel(department.name) }}</text>
							<text class="tile-desc sm">{{ department.desc }}</text>
							<text class="tile-count sm">{{ department.services.length }} 个角色</text>
						</view>
					</view>
				</view>
			</view>

			<view class="scroll-pad" />
		</scroll-view>

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
	import { HOME_FEATURED_IDS, HOME_OTHER_GROUPS } from "@/data/companyHierarchy";

	export default {
		data() {
			return {
				currentPage: "home",
				departments: agentDepartments,
				showOrgRest: false,
			};
		},
		computed: {
			deptMap() {
				const m = {};
				for (const d of this.departments) {
					m[d.id] = d;
				}
				return m;
			},
			featuredDepartments() {
				return HOME_FEATURED_IDS.map((id) => this.deptMap[id]).filter(Boolean);
			},
			groupedOtherSections() {
				return HOME_OTHER_GROUPS.map((g) => ({
					title: g.title,
					departments: g.departmentIds.map((id) => this.deptMap[id]).filter(Boolean),
				})).filter((block) => block.departments.length > 0);
			},
			otherDeptCount() {
				return Math.max(0, this.departments.length - this.featuredDepartments.length);
			},
		},
		methods: {
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			},
			tileStyle(departmentId) {
				const map = {
					engineering: { bg: "linear-gradient(160deg, #ffffff 0%, #eaf2ff 100%)", border: "#cfe0ff", accent: "#3d67ff", glow: "rgba(80, 132, 255, 0.22)" },
					design: { bg: "linear-gradient(160deg, #ffffff 0%, #f4ecff 100%)", border: "#e1d2ff", accent: "#7b4dff", glow: "rgba(142, 86, 255, 0.2)" },
					paid: { bg: "linear-gradient(160deg, #ffffff 0%, #fff2e8 100%)", border: "#ffd9c2", accent: "#ff7b2f", glow: "rgba(255, 145, 84, 0.2)" },
					sales: { bg: "linear-gradient(160deg, #ffffff 0%, #eaf8ff 100%)", border: "#c8e9ff", accent: "#1689d9", glow: "rgba(84, 174, 235, 0.2)" },
					marketing: { bg: "linear-gradient(160deg, #ffffff 0%, #fff0f6 100%)", border: "#ffd3e8", accent: "#e04b8b", glow: "rgba(236, 112, 171, 0.2)" },
					product: { bg: "linear-gradient(160deg, #ffffff 0%, #f1f4ff 100%)", border: "#d7defd", accent: "#5567db", glow: "rgba(111, 124, 226, 0.2)" },
					pm: { bg: "linear-gradient(160deg, #ffffff 0%, #f2fff4 100%)", border: "#cfeeda", accent: "#2f9d5b", glow: "rgba(97, 197, 136, 0.2)" },
					qa: { bg: "linear-gradient(160deg, #ffffff 0%, #edfaff 100%)", border: "#cdeeff", accent: "#1d8fc2", glow: "rgba(92, 187, 224, 0.2)" },
					support: { bg: "linear-gradient(160deg, #ffffff 0%, #f7f2ff 100%)", border: "#dfd2ff", accent: "#7450cc", glow: "rgba(136, 106, 214, 0.2)" },
					spatial: { bg: "linear-gradient(160deg, #ffffff 0%, #eef8ff 100%)", border: "#cfe6ff", accent: "#3a78d6", glow: "rgba(94, 152, 230, 0.2)" },
					special: { bg: "linear-gradient(160deg, #ffffff 0%, #fff4ec 100%)", border: "#ffd9c5", accent: "#dc6b33", glow: "rgba(235, 142, 95, 0.2)" },
					finance: { bg: "linear-gradient(160deg, #ffffff 0%, #eefbf5 100%)", border: "#cde8dd", accent: "#2c8f68", glow: "rgba(101, 193, 153, 0.2)" },
					academic: { bg: "linear-gradient(160deg, #ffffff 0%, #f5f6ff 100%)", border: "#dfe1fb", accent: "#5a63c9", glow: "rgba(127, 136, 224, 0.2)" },
				};
				const theme = map[departmentId] || { bg: "linear-gradient(160deg, #ffffff 0%, #f2f6ff 100%)", border: "#dfe6f2", accent: "#4e5cf0", glow: "rgba(92, 120, 255, 0.2)" };
				return {
					"--tile-bg": theme.bg,
					"--tile-border": theme.border,
					"--tile-accent": theme.accent,
					"--tile-glow": theme.glow,
				};
			},
			openDepartment(department) {
				uni.navigateTo({
					url: `/pages/department/department?id=${department.id}`,
				});
			},
			navigateTo(page) {
				uni.redirectTo({
					url: `/pages/${page}/${page}`,
				});
			},
		},
	};
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
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f4f6fb;
		box-sizing: border-box;
	}

	.scroll {
		flex: 1;
		height: 0;
		padding: 28rpx 28rpx 0;
		box-sizing: border-box;
	}

	.hero {
		margin-bottom: 28rpx;
	}

	.hero-kicker {
		display: block;
		font-size: 22rpx;
		font-weight: 600;
		color: #64748b;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.hero-title {
		display: block;
		margin-top: 8rpx;
		font-size: 44rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.hero-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.section-head {
		margin-bottom: 18rpx;
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 800;
		color: #1e293b;
	}

	.section-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #94a3b8;
	}

	.featured-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
	}

	.tile {
		background: var(--tile-bg, #fff);
		border: 1rpx solid var(--tile-border, #dfe6f2);
		border-radius: 22rpx;
		padding: 22rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 200rpx;
		box-shadow: 0 8rpx 18rpx rgba(20, 38, 70, 0.05);
		position: relative;
		overflow: hidden;
	}

	.tile::after {
		content: "";
		position: absolute;
		right: -30rpx;
		top: -30rpx;
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: var(--tile-glow, rgba(255, 255, 255, 0.5));
	}

	.tile-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.tile-title.sm {
		font-size: 26rpx;
	}

	.tile-desc {
		margin-top: 10rpx;
		font-size: 20rpx;
		color: #6f7a89;
		line-height: 1.45;
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	.tile-desc.sm {
		font-size: 19rpx;
		-webkit-line-clamp: 2;
	}

	.tile-count {
		margin-top: 16rpx;
		font-size: 20rpx;
		color: var(--tile-accent, #4e5cf0);
		font-weight: 600;
	}

	.tile-count.sm {
		font-size: 19rpx;
		margin-top: 12rpx;
	}

	.expand-toggle {
		margin: 8rpx 0 24rpx;
		padding: 22rpx 20rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 1rpx solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.04);
	}

	.expand-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #334155;
		flex: 1;
		padding-right: 16rpx;
	}

	.expand-icon {
		font-size: 28rpx;
		color: #94a3b8;
	}

	.org-rest {
		padding-bottom: 8rpx;
	}

	.org-block {
		margin-bottom: 28rpx;
	}

	.org-block-title {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #475569;
		margin-bottom: 14rpx;
		border-left: 6rpx solid #3b82f6;
		padding-left: 12rpx;
	}

	.org-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12rpx;
	}

	.tile.org {
		min-height: 168rpx;
		padding: 18rpx;
	}

	.scroll-pad {
		height: 200rpx;
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
