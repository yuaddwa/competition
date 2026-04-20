<template>
	<view class="page agent-assign-page" :class="{ 'theme-dark': isDarkMode }">
		<view class="tip-card">
			<text class="tip-title">{{ t("agent_model_assign_tip_title") }}</text>
			<text class="tip-text">{{ t("agent_model_assign_tip") }}</text>
		</view>

		<view v-if="items.length === 0" class="empty-box">
			<text class="empty-t">{{ t("agent_model_empty") }}</text>
		</view>

		<template v-else>
			<view class="batch-bar">
				<view class="batch-row">
					<view class="chk-wrap" @click="toggleSelectAll">
						<view class="chk" :class="{ on: allSelected }" />
						<text class="chk-label">{{ t("agent_model_select_all") }}</text>
					</view>
				</view>
				<view class="batch-row batch-input-row">
					<input
						class="batch-input"
						type="text"
						v-model="batchModel"
						:placeholder="t('agent_model_batch_placeholder')"
						placeholder-class="ph"
					/>
					<view class="batch-btn" @click="applyBatch">
						<text class="batch-btn-t">{{ t("agent_model_apply_batch") }}</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-y class="list-scroll" :show-scrollbar="false">
				<view v-for="row in items" :key="row.id" class="agent-card">
					<view class="agent-row-top">
						<view class="chk-wrap" @click.stop="toggleOne(row.id)">
							<view class="chk" :class="{ on: row.selected }" />
						</view>
						<view class="agent-meta">
							<text class="agent-name">{{ row.displayName }}</text>
							<text class="agent-role">{{ row.displayRole }}</text>
						</view>
					</view>
					<view class="field">
						<text class="label">{{ t("model_label_model_name") }}</text>
						<input
							class="input"
							type="text"
							v-model="row.model"
							:placeholder="t('agent_model_row_placeholder')"
							placeholder-class="ph"
						/>
					</view>
					<view class="row-save" @click="saveOne(row)">
						<text class="row-save-t">{{ t("agent_model_save_one") }}</text>
					</view>
				</view>
			</scroll-view>

			<view class="btn-save" :class="{ 'btn-save-disabled': saving }" @click="saveAll">
				<text class="btn-save-t">{{ saving ? t("saving") : t("agent_model_save_all") }}</text>
			</view>
		</template>
	</view>
</template>

<script>
	import {
		loadDigitalAgents,
		displayAgentName,
		displayAgentRole,
	} from "@/utils/virtualTeamStore";
	import { getAgentModel, setAgentModel, setAgentModelBatch } from "@/utils/agentModelMap";
	import { t, getLanguage } from "@/utils/lang";

	export default {
		data() {
			return {
				items: [],
				batchModel: "",
				saving: false,
				isDarkMode: false,
			};
		},
		computed: {
			allSelected() {
				return this.items.length > 0 && this.items.every((x) => x.selected);
			},
		},
		onLoad() {
			this.reloadList();
			this.loadDarkMode();
		},
		onShow() {
			this.reloadList();
			this.loadDarkMode();
			try {
				uni.setNavigationBarTitle({ title: t("agent_model_assign_nav", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			loadDarkMode() {
				try {
					const settings = uni.getStorageSync("userSettings");
					let parsed = {};
					if (settings) {
						parsed = typeof settings === "string" ? JSON.parse(settings) : settings;
					}
					this.isDarkMode = !!parsed.isDarkMode;
				} catch {
					this.isDarkMode = false;
				}
			},
			updateTheme(isDark) {
				this.isDarkMode = !!isDark;
			},
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			reloadList() {
				const agents = loadDigitalAgents();
				this.items = agents.map((a) => {
					const displayName = displayAgentName(a);
					const displayRole = displayAgentRole(a);
					return {
						id: a.id,
						displayName: displayName || this.t("digital_employee_fallback"),
						displayRole: displayRole || "",
						model: getAgentModel(a.id),
						selected: false,
					};
				});
			},
			toggleSelectAll() {
				const next = !this.allSelected;
				this.items = this.items.map((x) => ({ ...x, selected: next }));
			},
			toggleOne(id) {
				this.items = this.items.map((x) =>
					x.id === id ? { ...x, selected: !x.selected } : x,
				);
			},
			saveOne(row) {
				setAgentModel(row.id, row.model);
				uni.showToast({ title: this.t("agent_model_saved"), icon: "success" });
			},
			applyBatch() {
				const ids = this.items.filter((x) => x.selected).map((x) => x.id);
				if (ids.length === 0) {
					uni.showToast({ title: this.t("agent_model_none_selected"), icon: "none" });
					return;
				}
				const m = String(this.batchModel || "").trim();
				setAgentModelBatch(ids, m);
				this.items = this.items.map((x) =>
					ids.includes(x.id) ? { ...x, model: m } : x,
				);
				this.batchModel = "";
				uni.showToast({
					title: this.t("agent_model_batch_applied", { count: ids.length }),
					icon: "success",
				});
			},
			saveAll() {
				if (this.saving) return;
				this.saving = true;
				try {
					for (const row of this.items) {
						setAgentModel(row.id, row.model);
					}
					uni.showToast({ title: this.t("agent_model_saved"), icon: "success" });
				} finally {
					this.saving = false;
				}
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 28rpx;
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.tip-card {
		background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 24rpx;
		border: 1rpx solid #c7d2fe;
		flex-shrink: 0;
	}

	.tip-title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #312e81;
		margin-bottom: 12rpx;
	}

	.tip-text {
		font-size: 24rpx;
		color: #4338ca;
		line-height: 1.55;
	}

	.empty-box {
		padding: 80rpx 24rpx;
		text-align: center;
	}

	.empty-t {
		font-size: 28rpx;
		color: #64748b;
		line-height: 1.6;
	}

	.batch-bar {
		flex-shrink: 0;
		margin-bottom: 20rpx;
	}

	.batch-row {
		margin-bottom: 16rpx;
	}

	.batch-input-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
	}

	.batch-input {
		flex: 1;
		min-height: 72rpx;
		font-size: 28rpx;
		color: #0f172a;
		padding: 12rpx 20rpx;
		border-radius: 16rpx;
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.batch-btn {
		flex-shrink: 0;
		padding: 20rpx 28rpx;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
	}

	.batch-btn-t {
		font-size: 26rpx;
		color: #fff;
		font-weight: 600;
	}

	.chk-wrap {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.chk {
		width: 36rpx;
		height: 36rpx;
		border-radius: 8rpx;
		border: 2rpx solid #94a3b8;
		margin-right: 16rpx;
		box-sizing: border-box;
	}

	.chk.on {
		background: #2563eb;
		border-color: #2563eb;
	}

	.chk-label {
		font-size: 28rpx;
		color: #475569;
	}

	.list-scroll {
		flex: 1;
		max-height: 62vh;
		margin-bottom: 24rpx;
	}

	.agent-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.agent-row-top {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 16rpx;
	}

	.agent-meta {
		flex: 1;
		min-width: 0;
	}

	.agent-name {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 6rpx;
	}

	.agent-role {
		display: block;
		font-size: 24rpx;
		color: #64748b;
	}

	.field {
		margin-bottom: 16rpx;
	}

	.label {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #475569;
		margin-bottom: 12rpx;
	}

	.input {
		width: 100%;
		min-height: 72rpx;
		font-size: 28rpx;
		color: #0f172a;
		padding: 12rpx 20rpx;
		border-radius: 16rpx;
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.ph {
		color: #94a3b8;
	}

	.row-save {
		align-self: flex-start;
		padding: 12rpx 20rpx;
		border-radius: 12rpx;
		background: #eff6ff;
		border: 1rpx solid #bfdbfe;
	}

	.row-save-t {
		font-size: 24rpx;
		color: #2563eb;
		font-weight: 600;
	}

	.btn-save {
		flex-shrink: 0;
		margin-top: 8rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-radius: 46rpx;
		padding: 28rpx;
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.28);
	}

	.btn-save-disabled {
		opacity: 0.72;
		pointer-events: none;
	}

	.btn-save-t {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
	}
</style>

<style>
	.agent-assign-page.theme-dark {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--border-color: #334155;
		--card-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.3);
		--input-bg: #1a2332;
		--input-border: #3f4f63;
		--input-placeholder: #94a3b8;
		--primary-color: #2563eb;
	}

	.agent-assign-page.theme-dark,
	[data-theme="dark"] .agent-assign-page {
		background: var(--bg-primary) !important;
	}

	.agent-assign-page.theme-dark .tip-card,
	[data-theme="dark"] .agent-assign-page .tip-card {
		background: linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%) !important;
		border-color: rgba(99, 102, 241, 0.4) !important;
		box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.35) !important;
	}

	.agent-assign-page.theme-dark .tip-title,
	[data-theme="dark"] .agent-assign-page .tip-title {
		color: #c7d2fe !important;
	}

	.agent-assign-page.theme-dark .tip-text,
	[data-theme="dark"] .agent-assign-page .tip-text {
		color: #a5b4fc !important;
	}

	.agent-assign-page.theme-dark .empty-t,
	[data-theme="dark"] .agent-assign-page .empty-t {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .agent-card,
	[data-theme="dark"] .agent-assign-page .agent-card {
		background: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.agent-assign-page.theme-dark .agent-name,
	[data-theme="dark"] .agent-assign-page .agent-name {
		color: var(--text-primary) !important;
	}

	.agent-assign-page.theme-dark .agent-role,
	[data-theme="dark"] .agent-assign-page .agent-role,
	.agent-assign-page.theme-dark .chk-label,
	[data-theme="dark"] .agent-assign-page .chk-label {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .label,
	[data-theme="dark"] .agent-assign-page .label {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .batch-input,
	.agent-assign-page.theme-dark .input,
	[data-theme="dark"] .agent-assign-page .batch-input,
	[data-theme="dark"] .agent-assign-page .input {
		background: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border-color: var(--input-border) !important;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.35) !important;
	}

	.agent-assign-page.theme-dark .ph,
	[data-theme="dark"] .agent-assign-page .ph {
		color: var(--input-placeholder) !important;
	}

	.agent-assign-page.theme-dark .row-save,
	[data-theme="dark"] .agent-assign-page .row-save {
		background: rgba(37, 99, 235, 0.15) !important;
		border-color: rgba(99, 102, 241, 0.35) !important;
	}

	.agent-assign-page.theme-dark .row-save-t,
	[data-theme="dark"] .agent-assign-page .row-save-t {
		color: #93c5fd !important;
	}
</style>
