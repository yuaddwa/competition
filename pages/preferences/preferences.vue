<template>
	<view class="preferences-page">
		<view class="header">
			<text class="header-title">{{ t('preferences_title') }}</text>
			<text class="header-subtitle">{{ t('preferences_subtitle') }}</text>
		</view>

		<view class="content">
			<view class="section">
				<text class="section-title">{{ t('company_industry') }}</text>
				<view class="option-group">
					<view 
						v-for="industry in industries" 
						:key="industry.value"
						class="option-item"
						:class="{ active: selectedIndustry === industry.value }"
						@click="selectedIndustry = industry.value"
					>
						<text class="option-text">{{ industry.label }}</text>
						<view v-if="selectedIndustry === industry.value" class="option-check">✓</view>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">{{ t('ai_employee_personality') }}</text>
				<view class="option-group">
					<view 
						v-for="personality in personalities" 
						:key="personality.value"
						class="option-item"
						:class="{ active: selectedPersonality === personality.value }"
						@click="selectedPersonality = personality.value"
					>
						<text class="option-text">{{ personality.label }}</text>
						<view v-if="selectedPersonality === personality.value" class="option-check">✓</view>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">{{ t('company_size') }}</text>
				<view class="option-group">
					<view 
						v-for="size in companySizes" 
						:key="size.value"
						class="option-item"
						:class="{ active: selectedCompanySize === size.value }"
						@click="selectedCompanySize = size.value"
					>
						<text class="option-text">{{ size.label }}</text>
						<view v-if="selectedCompanySize === size.value" class="option-check">✓</view>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">AI团队管理偏好</text>
				<view class="checkbox-group">
					<view 
						v-for="preference in teamPreferences" 
						:key="preference.value"
						class="checkbox-item"
						@click="togglePreference(preference.value)"
					>
						<view class="checkbox" :class="{ checked: selectedPreferences.includes(preference.value) }">
							<view v-if="selectedPreferences.includes(preference.value)" class="checkbox-check">✓</view>
						</view>
						<text class="checkbox-text">{{ preference.label }}</text>
					</view>
				</view>
			</view>

			<!-- 推荐部门和角色 -->
			<view v-if="recommendedDepartments.length > 0" class="section">
				<text class="section-title">推荐的AI部门和角色</text>
				<view class="recommendation-group">
					<view v-for="dept in recommendedDepartments" :key="dept.id" class="recommendation-item">
						<text class="dept-name">{{ dept.name }}</text>
						<view class="role-list">
							<view v-for="role in dept.recommendedRoles" :key="role.id" class="role-item">
								<text class="role-name">{{ role.name }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="footer">
			<button class="next-btn" :disabled="!isFormValid" @click="savePreferences">
				{{ t('continue') }}
			</button>
		</view>
	</view>
</template>

<script>
	import { t, getLanguage } from "@/utils/lang";
	import agentDepartments from "@/data/agentDepartments";
	export default {
		data() {
				return {
					selectedIndustry: '',
					selectedPersonality: '',
					selectedCompanySize: '',
					selectedPreferences: [],
					recommendedDepartments: [],
					industries: [
						{ label: t('industry_tech'), value: 'tech' },
						{ label: t('industry_finance'), value: 'finance' },
						{ label: t('industry_healthcare'), value: 'healthcare' },
						{ label: t('industry_education'), value: 'education' },
						{ label: t('industry_retail'), value: 'retail' },
						{ label: t('industry_other'), value: 'other' }
					],
					personalities: [
						{ label: t('personality_professional'), value: 'professional' },
						{ label: t('personality_creative'), value: 'creative' },
						{ label: t('personality_friendly'), value: 'friendly' },
						{ label: t('personality_analytical'), value: 'analytical' }
					],
					companySizes: [
						{ label: t('size_small'), value: 'small' },
						{ label: t('size_medium'), value: 'medium' },
						{ label: t('size_large'), value: 'large' }
					],
					teamPreferences: [
						{ label: '快速执行', value: 'quick_execution' },
						{ label: '详细汇报', value: 'detailed_reporting' },
						{ label: '主动创新', value: 'proactive_innovation' },
						{ label: '成本意识', value: 'cost_awareness' },
						{ label: '客户导向', value: 'customer_orientation' },
						{ label: '数据驱动', value: 'data_driven' }
					]
				};
			},
		computed: {
			isFormValid() {
				return this.selectedIndustry && this.selectedPersonality && this.selectedCompanySize;
			}
		},
		watch: {
			selectedIndustry: function() {
				this.updateRecommendations();
			},
			selectedPersonality: function() {
				this.updateRecommendations();
			},
			selectedCompanySize: function() {
				this.updateRecommendations();
			},
			selectedPreferences: function() {
				this.updateRecommendations();
			}
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: t("preferences_title", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			togglePreference(preference) {
					const index = this.selectedPreferences.indexOf(preference);
					if (index === -1) {
						this.selectedPreferences.push(preference);
					} else {
						this.selectedPreferences.splice(index, 1);
					}
				},
				updateRecommendations() {
					if (!this.selectedIndustry || !this.selectedPersonality || !this.selectedCompanySize) {
						this.recommendedDepartments = [];
						return;
					}

					// 根据行业、性格和公司规模推荐部门和角色
					const recommendations = [];

					// 技术行业推荐
					if (this.selectedIndustry === 'tech') {
						recommendations.push({
							id: 'engineering',
							name: '💻 工程部',
							recommendedRoles: [
								{ id: 'eng-frontend', name: '🎨 前端开发者' },
								{ id: 'eng-backend', name: '🏗️ 后端架构师' },
								{ id: 'eng-ai', name: '🤖 人工智能工程师' }
							]
						});
						recommendations.push({
							id: 'design',
							name: '🎨 设计部',
							recommendedRoles: [
								{ id: 'des-ui', name: '🎯 UI 设计师' },
								{ id: 'des-ux', name: '🔍 用户体验研究员' }
							]
						});
					}

					// 金融行业推荐
					if (this.selectedIndustry === 'finance') {
						recommendations.push({
							id: 'finance',
							name: '💵 财务部',
							recommendedRoles: [
								{ id: 'fin-bookkeeper', name: '📒 Bookkeeper & Controller' },
								{ id: 'fin-fpa', name: '📈 FP&A Analyst' },
								{ id: 'fin-tax', name: '🏛️ Tax Strategist' }
							]
						});
						recommendations.push({
							id: 'sales',
							name: '💼 销售部',
							recommendedRoles: [
								{ id: 'sales-deal', name: '♟️ 交易策略师' }
							]
						});
					}

					// 医疗行业推荐
					if (this.selectedIndustry === 'healthcare') {
						recommendations.push({
							id: 'support',
							name: '🛟 支援部',
							recommendedRoles: [
								{ id: 'sup-response', name: '💬 支援响应者' },
								{ id: 'sup-compliance', name: '⚖️ 法律合规检查器' }
							]
						});
					}

					// 教育行业推荐
					if (this.selectedIndustry === 'education') {
						recommendations.push({
							id: 'academic',
							name: '📚 学术部',
							recommendedRoles: [
								{ id: 'ac-anthro', name: '🌍 人类学家' },
								{ id: 'ac-history', name: '📚 历史学家' }
							]
						});
						recommendations.push({
							id: 'marketing',
							name: '📢 市场部',
							recommendedRoles: [
								{ id: 'mkt-content', name: '📝 内容创作者' }
							]
						});
					}

					// 零售行业推荐
					if (this.selectedIndustry === 'retail') {
						recommendations.push({
							id: 'marketing',
							name: '📢 市场部',
							recommendedRoles: [
								{ id: 'mkt-growth', name: '🚀 增长黑客' },
								{ id: 'mkt-seo', name: '🔍 SEO 专家' }
							]
						});
						recommendations.push({
							id: 'sales',
							name: '💼 销售部',
							recommendedRoles: [
								{ id: 'sales-outbound', name: '🎯 出站战略家' }
							]
						});
					}

					// 其他行业推荐
					if (this.selectedIndustry === 'other') {
						recommendations.push({
							id: 'product',
							name: '📊 产品部',
							recommendedRoles: [
								{ id: 'prd-pm', name: '🧭 产品经理' }
							]
						});
						recommendations.push({
							id: 'pm',
							name: '🎬 项目管理部',
							recommendedRoles: [
								{ id: 'pm-shepherd', name: '🐑 牧羊人计划' }
							]
						});
					}

					// 根据公司规模调整推荐
					if (this.selectedCompanySize === 'large') {
						// 大型公司推荐更多角色
						recommendations.forEach(dept => {
							if (dept.id === 'engineering') {
								dept.recommendedRoles.push({ id: 'eng-mobile', name: '📱 移动应用构建器' });
							}
							if (dept.id === 'design') {
								dept.recommendedRoles.push({ id: 'des-arch', name: '🏛️ 用户体验架构师' });
							}
						});
					}

					// 根据管理偏好调整推荐
					if (this.selectedPreferences.includes('data_driven')) {
						recommendations.push({
							id: 'support',
							name: '🛟 支援部',
							recommendedRoles: [
								{ id: 'sup-analytics', name: '📊 分析记者' }
							]
						});
					}

					if (this.selectedPreferences.includes('customer_orientation')) {
						recommendations.push({
							id: 'support',
							name: '🛟 支援部',
							recommendedRoles: [
								{ id: 'sup-response', name: '💬 支援响应者' }
							]
						});
					}

					if (this.selectedPreferences.includes('proactive_innovation')) {
						recommendations.push({
							id: 'special',
							name: '🎯 专业部门',
							recommendedRoles: [
								{ id: 'sp-orchestrator', name: '🎭 特工策划者' }
							]
						});
					}

					// 去重
					const uniqueDepartments = [];
					const deptIds = new Set();
					recommendations.forEach(dept => {
						if (!deptIds.has(dept.id)) {
							deptIds.add(dept.id);
							uniqueDepartments.push(dept);
						}
					});

					this.recommendedDepartments = uniqueDepartments;
				},
				savePreferences() {
					if (!this.isFormValid) return;

					const preferences = {
						industry: this.selectedIndustry,
						personality: this.selectedPersonality,
						companySize: this.selectedCompanySize,
						teamPreferences: this.selectedPreferences,
						hasCompleted: true
					};

					// 存储偏好设置
					uni.setStorageSync('userPreferences', preferences);

					// 跳转到首页
					uni.switchTab({
						url: "/pages/home/home"
					});
				}
		}
	};
</script>

<style scoped>
	.preferences-page {
		min-height: 100vh;
		background-color: #f1f5f9;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: linear-gradient(165deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
		padding: 60rpx 32rpx 40rpx;
		color: #fff;
	}

	.header-title {
		font-size: 44rpx;
		font-weight: 800;
		margin-bottom: 12rpx;
		display: block;
	}

	.header-subtitle {
		font-size: 24rpx;
		opacity: 0.9;
		line-height: 1.5;
		display: block;
	}

	.content {
		flex: 1;
		padding: 32rpx;
	}

	.section {
		margin-bottom: 40rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 20rpx;
		display: block;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.option-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 2rpx solid #e2e8f0;
		transition: all 0.2s ease;
	}

	.option-item:active {
		background: #f8fafc;
	}

	.option-item.active {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.05);
	}

	.option-text {
		font-size: 28rpx;
		color: #0f172a;
	}

	.option-check {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background: #6366f1;
		color: #fff;
		font-size: 24rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.checkbox-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 24rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 2rpx solid #e2e8f0;
		transition: all 0.2s ease;
	}

	.checkbox-item:active {
		background: #f8fafc;
	}

	.checkbox {
		width: 36rpx;
		height: 36rpx;
		border-radius: 8rpx;
		border: 2rpx solid #e2e8f0;
		margin-right: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.checkbox.checked {
		background: #6366f1;
		border-color: #6366f1;
	}

	.checkbox-check {
		color: #fff;
		font-size: 24rpx;
		font-weight: 700;
	}

	.checkbox-text {
		font-size: 28rpx;
		color: #0f172a;
		flex: 1;
	}

	.footer {
		padding: 32rpx;
		padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
		background: #fff;
		border-top: 1rpx solid #e2e8f0;
	}

	.next-btn {
		width: 100%;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 700;
		border: none;
		background: linear-gradient(135deg, #6366f1, #9333ea) !important;
		color: #fff;
		box-shadow: 0 16rpx 36rpx rgba(99, 102, 241, 0.35);
	}

	.next-btn::after {
		border: none;
	}

	/* 推荐部门和角色样式 */
	.recommendation-group {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.recommendation-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		border: 2rpx solid #e2e8f0;
	}

	.dept-name {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 16rpx;
		display: block;
	}

	.role-list {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.role-item {
		background: #f1f5f9;
		border-radius: 12rpx;
		padding: 12rpx 16rpx;
		flex-shrink: 0;
	}

	.role-name {
		font-size: 24rpx;
		color: #64748b;
	}
</style>