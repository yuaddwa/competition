<template>
	<view class="recommend-page">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="navbar">
				<view class="navbar-side" />
				<view class="navbar-center">
					<text class="navbar-title">{{ t('recommend') }}</text>
				</view>
				<view class="navbar-side" />
			</view>
		</view>

		<scroll-view scroll-y class="content">
			<view class="recommendations-section">
				<view class="section-header">
					<text class="section-title">{{ t('recommended_departments') }}</text>
					<text class="section-subtitle">{{ t('based_on_preferences') }}</text>
				</view>

				<view v-for="dept in recommendedDepartments" :key="dept.id" class="department-card">
					<text class="dept-name">{{ dept.name }}</text>
					<text class="dept-desc">{{ dept.desc }}</text>

					<view class="roles-list">
						<view v-for="role in dept.recommendedRoles" :key="role.id" class="role-item" @click="startChatWithRole(dept.id, role.id)">
							<text class="role-name">{{ role.name }}</text>
							<text class="role-intro">{{ role.intro }}</text>
							<view class="chat-button">
								<text class="chat-icon">💬</text>
								<text class="chat-text">{{ t('start_chat') }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<AppTabBar current="recommend" />
	</view>
</template>

<script>
	import { t, getLanguage } from "@/utils/lang";
	import agentDepartments from "@/data/agentDepartments";
	import AppTabBar from "@/components/AppTabBar.vue";

	export default {
		components: { AppTabBar },
		data() {
			return {
				statusBarPx: 20,
				recommendedDepartments: [],
				userPreferences: null,
			};
		},
		computed: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: this.t("recommend") });
			} catch (e) {
				//
			}
			this.initRecommendations();
		},
		methods: {
			initRecommendations() {
				const preferences = uni.getStorageSync('userPreferences');
				if (preferences) {
					this.userPreferences = preferences;
					this.generateRecommendations();
				} else {
					this.userPreferences = {
						industry: "other",
						companySize: "small",
						teamPreferences: [],
					};
					this.generateRecommendations();
				}
			},
			generateRecommendations() {
				if (!this.userPreferences) return;

				const { industry, companySize, teamPreferences } = this.userPreferences;
				const recommendations = [];

				// 根据行业推荐部门
				if (industry === 'tech') {
					recommendations.push(this.getDepartmentWithRoles('engineering', [
						'eng-frontend',
						'eng-backend',
						'eng-ai'
					]));
					recommendations.push(this.getDepartmentWithRoles('design', [
						'des-ui',
						'des-ux'
					]));
				}

				if (industry === 'finance') {
					recommendations.push(this.getDepartmentWithRoles('finance', [
						'fin-bookkeeper',
						'fin-fpa',
						'fin-tax'
					]));
					recommendations.push(this.getDepartmentWithRoles('sales', [
						'sales-deal'
					]));
				}

				if (industry === 'healthcare') {
					recommendations.push(this.getDepartmentWithRoles('support', [
						'sup-response',
						'sup-compliance'
					]));
				}

				if (industry === 'education') {
					recommendations.push(this.getDepartmentWithRoles('academic', [
						'ac-anthro',
						'ac-history'
					]));
					recommendations.push(this.getDepartmentWithRoles('marketing', [
						'mkt-content'
					]));
				}

				if (industry === 'retail') {
					recommendations.push(this.getDepartmentWithRoles('marketing', [
						'mkt-growth',
						'mkt-seo'
					]));
					recommendations.push(this.getDepartmentWithRoles('sales', [
						'sales-outbound'
					]));
				}

				if (industry === 'other') {
					recommendations.push(this.getDepartmentWithRoles('product', [
						'prd-pm'
					]));
					recommendations.push(this.getDepartmentWithRoles('pm', [
						'pm-shepherd'
					]));
				}

				// 根据公司规模调整推荐
				if (companySize === 'large') {
					recommendations.forEach(dept => {
						if (dept.id === 'engineering') {
							const mobileRole = agentDepartments
								.find(d => d.id === 'engineering')
								.services.find(s => s.id === 'eng-mobile');
							if (mobileRole) {
								dept.recommendedRoles.push(mobileRole);
							}
						}
						if (dept.id === 'design') {
							const archRole = agentDepartments
								.find(d => d.id === 'design')
								.services.find(s => s.id === 'des-arch');
							if (archRole) {
								dept.recommendedRoles.push(archRole);
							}
						}
					});
				}

				// 根据管理偏好调整推荐
				if (teamPreferences.includes('data_driven')) {
					const supportDept = this.getDepartmentWithRoles('support', [
						'sup-analytics'
					]);
					if (!recommendations.some(d => d.id === 'support')) {
						recommendations.push(supportDept);
					}
				}

				if (teamPreferences.includes('customer_orientation')) {
					const supportDept = this.getDepartmentWithRoles('support', [
						'sup-response'
					]);
					if (!recommendations.some(d => d.id === 'support')) {
						recommendations.push(supportDept);
					}
				}

				if (teamPreferences.includes('proactive_innovation')) {
					const specialDept = this.getDepartmentWithRoles('special', [
						'sp-orchestrator'
					]);
					if (!recommendations.some(d => d.id === 'special')) {
						recommendations.push(specialDept);
					}
				}

				this.recommendedDepartments = recommendations;
			},
			getDepartmentWithRoles(deptId, roleIds) {
				const department = agentDepartments.find(d => d.id === deptId);
				if (!department) return null;

				const recommendedRoles = department.services.filter(service => 
					roleIds.includes(service.id)
				);

				return {
					...department,
					recommendedRoles
				};
			},
			startChatWithRole(deptId, roleId) {
				// 跳转到聊天页面，与推荐的角色对话
				uni.navigateTo({
					url: `/pages/chat/chat?mode=virtual&kind=agent&id=${roleId}&title=${encodeURIComponent(this.getRoleName(roleId))}`
				});
			},
			getRoleName(roleId) {
				// 从agentDepartments中获取角色名称
				for (const dept of agentDepartments) {
					const role = dept.services.find(s => s.id === roleId);
					if (role) {
						return role.name;
					}
				}
				return roleId;
			}
		},
	};
</script>

<style scoped>
	.recommend-page {
		min-height: 100vh;
		background: #f4f6fb;
		display: flex;
		flex-direction: column;
	}

	.navbar-wrap {
		background: #fff;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.navbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 88rpx;
		padding: 0 28rpx;
	}

	.navbar-side {
		flex: 1;
		min-width: 80rpx;
	}

	.navbar-center {
		flex: 2;
		text-align: center;
	}

	.navbar-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.content {
		flex: 1;
		padding: 24rpx;
	}

	/* 推荐部分 */
	.recommendations-section {
		margin-top: 16rpx;
	}

	.section-header {
		margin-bottom: 24rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 8rpx;
	}

	.section-subtitle {
		font-size: 24rpx;
		color: #64748b;
	}

	.department-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 32rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
	}

	.dept-name {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 8rpx;
	}

	.dept-desc {
		font-size: 24rpx;
		color: #64748b;
		margin-bottom: 24rpx;
		line-height: 1.4;
	}

	.roles-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.role-item {
		background: #f8fafc;
		border-radius: 16rpx;
		padding: 24rpx;
		border: 1rpx solid #e2e8f0;
		transition: all 0.2s ease;
	}

	.role-item:active {
		background: #eff6ff;
		border-color: #93c5fd;
	}

	.role-name {
		font-size: 26rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 8rpx;
		display: block;
	}

	.role-intro {
		font-size: 22rpx;
		color: #64748b;
		margin-bottom: 16rpx;
		display: block;
	}

	.chat-button {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		align-self: flex-start;
		padding: 12rpx 20rpx;
		background: #dbeafe;
		border-radius: 999rpx;
	}

	.chat-icon {
		font-size: 24rpx;
	}

	.chat-text {
		font-size: 22rpx;
		font-weight: 600;
		color: #1d4ed8;
	}
</style>