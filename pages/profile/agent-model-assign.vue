<template>
	<view class="page agent-assign-page" :class="{ 'theme-dark': isDarkMode }">
		<scroll-view scroll-y class="main-scroll" :show-scrollbar="false">
			<view class="tip-card">
				<text class="tip-title">{{ t("agent_model_assign_tip_title") }}</text>
				<text class="tip-text">{{ t("agent_model_assign_tip") }}</text>
			</view>

			<view class="tip-card tip-card-sub">
				<text class="tip-title">{{ t("model_settings_tip_title") }}</text>
				<text class="tip-text">{{ t("model_settings_tip") }}</text>
			</view>

			<view class="add-model-entry" hover-class="add-model-entry-hover" @click="openAddModelPanel">
				<text class="add-model-entry-t">{{ t("agent_model_add_model_btn") }}</text>
				<text class="add-model-entry-arrow">›</text>
			</view>

			<view class="add-model-entry view-models-entry" hover-class="add-model-entry-hover" @click="openSavedModelsPanel">
				<text class="add-model-entry-t add-model-entry-t-secondary">{{ t("agent_model_view_models_btn") }}</text>
				<text class="add-model-entry-arrow">›</text>
			</view>

			<view class="staff-block">
				<text class="staff-list-caption">{{ t("agent_model_staff_list_title") }}</text>
				<view v-if="items.length === 0" class="empty-box">
					<text class="empty-t">{{ t("agent_model_empty") }}</text>
				</view>
				<view v-else class="staff-list">
					<view v-for="row in items" :key="row.id" class="staff-name-row">
						<picker
							mode="selector"
							:range="pickRangeLabels"
							:value="pickerIndexForRow(row)"
							@change="onRowPresetChange($event, row.id)"
						>
							<view class="staff-name-tap">
								<text class="staff-name-text">{{ row.displayName }}</text>
							</view>
						</picker>
					</view>
				</view>
			</view>

			<view class="scroll-pad" />
		</scroll-view>

		<view v-if="addModelPanelOpen" class="add-model-mask" @click="closeAddModelPanel">
			<view class="add-model-sheet" @click.stop>
				<view class="sheet-head">
					<text class="sheet-cancel" @click="closeAddModelPanel">{{ t("cancel") }}</text>
					<text class="sheet-head-title">{{ t("agent_model_add_model_btn") }}</text>
					<view class="sheet-head-spacer" />
				</view>
				<scroll-view scroll-y class="sheet-scroll" :show-scrollbar="false">
					<view class="sheet-inner">
						<view class="sheet-tip-card">
							<text class="sheet-tip-title">{{ t("model_settings_tip_title") }}</text>
							<text class="sheet-tip-text">{{ t("model_settings_tip") }}</text>
						</view>

						<view class="section-label">{{ t("model_section_connection") }}</view>
						<view class="form-card">
							<view class="field">
								<text class="label">{{ t("model_label_api_key") }}</text>
								<input
									class="input"
									type="text"
									password
									v-model="apiKey"
									:placeholder="t('model_placeholder_key')"
									placeholder-class="ph"
									@input="clearAddModelSheetError"
								/>
							</view>
							<view class="field field-last">
								<text class="label">{{ t("model_label_base_url") }}</text>
								<input
									class="input"
									type="text"
									v-model="baseUrl"
									placeholder="https://api.openai.com/v1"
									placeholder-class="ph"
									@input="clearAddModelSheetError"
								/>
							</view>
						</view>

						<view class="section-label">{{ t("model_section_model") }}</view>
						<view class="form-card">
							<view class="field field-last">
								<text class="label">{{ t("model_label_model_name") }}</text>
								<input
									class="input"
									type="text"
									v-model="model"
									placeholder="gpt-4o-mini"
									placeholder-class="ph"
									@input="clearAddModelSheetError"
								/>
							</view>
						</view>

						<view v-if="addModelSheetError" class="sheet-error-banner">
							<text class="sheet-error-text">{{ addModelSheetError }}</text>
						</view>

						<view class="btn-conn btn-conn-sheet" :class="{ 'btn-disabled': verifying }" @click="addModelConnection">
							<text class="btn-conn-t">{{ verifying ? t("model_verify_loading") : t("agent_model_add_model_btn") }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<view v-if="savedModelsOpen" class="add-model-mask" @click="closeSavedModelsPanel">
			<view class="add-model-sheet" @click.stop>
				<view class="sheet-head">
					<text class="sheet-cancel" @click="onSavedModelsHeadCancel">{{ savedModelDetail ? t("nav_back") : t("cancel") }}</text>
					<text class="sheet-head-title">{{ savedModelDetail ? t("agent_model_detail_title") : t("agent_model_view_models_btn") }}</text>
					<view class="sheet-head-spacer" />
				</view>
				<scroll-view v-if="!savedModelDetail" scroll-y class="sheet-scroll" :show-scrollbar="false">
					<view class="sheet-inner">
						<view v-if="savedModelsList.length === 0" class="empty-box empty-box-sheet">
							<text class="empty-t">{{ t("agent_model_view_empty") }}</text>
						</view>
						<view v-else class="saved-models-wrap">
							<view
								v-for="item in savedModelsList"
								:key="item.id"
								class="saved-model-row"
								hover-class="saved-model-row-hover"
								@tap="openSavedModelDetail(item)"
							>
								<text class="saved-model-row-name">{{ item.model }}</text>
								<text class="saved-model-row-arrow">›</text>
							</view>
						</view>
					</view>
				</scroll-view>
				<view v-else class="sheet-detail-wrap">
					<scroll-view scroll-y class="sheet-scroll sheet-scroll-detail" :show-scrollbar="false">
						<view class="sheet-inner sheet-inner-detail">
							<view class="detail-block">
								<text class="detail-label">{{ t("model_label_model_name") }}</text>
								<text class="detail-value">{{ savedModelDetail.model }}</text>
							</view>
							<view class="detail-block">
								<text class="detail-label">{{ t("model_label_base_url") }}</text>
								<text class="detail-value detail-mono">{{ savedModelDetail.baseUrl || t("agent_model_field_empty") }}</text>
							</view>
							<view class="detail-block">
								<text class="detail-label">{{ t("model_label_api_key") }}</text>
								<text class="detail-value detail-mono detail-key">{{ savedModelDetail.apiKey || t("agent_model_field_empty") }}</text>
							</view>
						</view>
					</scroll-view>
					<view class="sheet-detail-footer">
						<view v-if="!savedModelDeleteConfirm" class="btn-delete-saved" hover-class="btn-delete-saved-hover" @tap.stop="savedModelDeleteConfirm = true">
							<text class="btn-delete-saved-t">{{ t("agent_model_delete_saved") }}</text>
						</view>
						<view v-else class="saved-delete-confirm">
							<text class="saved-delete-confirm-t">{{ t("agent_model_delete_saved_body", { name: savedModelDetail.model }) }}</text>
							<view class="saved-delete-row">
								<view class="btn-delete-cancel" hover-class="btn-delete-cancel-hover" @tap.stop="savedModelDeleteConfirm = false">
									<text class="btn-delete-cancel-t">{{ t("cancel") }}</text>
								</view>
								<view class="btn-delete-ok" hover-class="btn-delete-ok-hover" @tap.stop="executeDeleteSavedModel">
									<text class="btn-delete-ok-t">{{ t("agent_model_confirm_delete") }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { loadDigitalAgents, displayAgentName } from "@/utils/virtualTeamStore";
	import { getAgentModel, setAgentModel } from "@/utils/agentModelMap";
	import {
		getModelPresets,
		addSavedModelEntry,
		isSameApiAlreadySaved,
		isModelNameTaken,
		getSavedModels,
		removeSavedModel,
	} from "@/utils/staffModelPresets";
	import { getLlmSettings, setLlmSettings, validateLlmSettings } from "@/utils/llmSettings";
	import { verifyLlmConnection } from "@/utils/openaiCompatible";
	import { t, getLanguage } from "@/utils/lang";

	export default {
		data() {
			return {
				apiKey: "",
				baseUrl: "",
				model: "",
				verifying: false,
				addModelSheetError: "",
				addModelPanelOpen: false,
				savedModelsOpen: false,
				savedModelDetail: null,
				savedModelDeleteConfirm: false,
				savedModelsList: [],
				items: [],
				presets: [],
				isDarkMode: false,
			};
		},
		computed: {
			/** 可选模型值：已「添加模型」的 + 各员工当前已保存且不在列表中的（兼容旧数据） */
			pickRangeValues() {
				const seen = new Set();
				const vals = [];
				for (const p of this.presets) {
					if (!seen.has(p)) {
						seen.add(p);
						vals.push(p);
					}
				}
				for (const row of this.items) {
					const m = String(row.model || "").trim();
					if (m && !seen.has(m)) {
						seen.add(m);
						vals.push(m);
					}
				}
				return vals;
			},
			pickRangeLabels() {
				return this.pickRangeValues;
			},
		},
		onLoad() {
			const s = getLlmSettings();
			this.apiKey = s.apiKey;
			this.baseUrl = s.baseUrl;
			this.model = s.model;
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
			openAddModelPanel() {
				const s = getLlmSettings();
				this.apiKey = s.apiKey;
				this.baseUrl = s.baseUrl;
				this.model = s.model;
				this.addModelSheetError = "";
				this.addModelPanelOpen = true;
			},
			clearAddModelSheetError() {
				this.addModelSheetError = "";
			},
			closeAddModelPanel() {
				if (this.verifying) return;
				this.addModelSheetError = "";
				this.addModelPanelOpen = false;
			},
			openSavedModelsPanel() {
				this.reloadPresets();
				this.savedModelDetail = null;
				this.savedModelDeleteConfirm = false;
				this.savedModelsOpen = true;
			},
			closeSavedModelsPanel() {
				this.savedModelsOpen = false;
				this.savedModelDetail = null;
			},
			onSavedModelsHeadCancel() {
				if (this.savedModelDetail) {
					this.savedModelDetail = null;
					this.savedModelDeleteConfirm = false;
					return;
				}
				this.closeSavedModelsPanel();
			},
			openSavedModelDetail(item) {
				this.savedModelDeleteConfirm = false;
				this.savedModelDetail = item ? { ...item } : null;
			},
			executeDeleteSavedModel() {
				const d = this.savedModelDetail;
				if (!d) return;
				const id = d.id != null && String(d.id).trim() !== "" ? String(d.id).trim() : "";
				if (!id) {
					this.closeSavedModelsPanel();
					setTimeout(() => {
						uni.showToast({ title: this.t("agent_model_delete_failed"), icon: "none" });
					}, 80);
					return;
				}
				removeSavedModel(id);
				this.reloadPresets();
				this.closeSavedModelsPanel();
				setTimeout(() => {
					uni.showToast({ title: this.t("agent_model_deleted"), icon: "success" });
				}, 80);
			},
			reloadPresets() {
				this.presets = getModelPresets();
				this.savedModelsList = getSavedModels();
			},
			reloadList() {
				this.reloadPresets();
				const agents = loadDigitalAgents();
				this.items = agents.map((a) => {
					const displayName = displayAgentName(a);
					return {
						id: a.id,
						displayName: displayName || this.t("digital_employee_fallback"),
						model: getAgentModel(a.id),
					};
				});
			},
			pickerIndexForRow(row) {
				const vals = this.pickRangeValues;
				if (vals.length === 0) return 0;
				const m = String(row.model || "").trim();
				if (!m) return 0;
				const idx = vals.indexOf(m);
				return idx >= 0 ? idx : 0;
			},
			async addModelConnection() {
				if (this.verifying) return;
				this.addModelSheetError = "";
				const result = validateLlmSettings({
					apiKey: this.apiKey,
					baseUrl: this.baseUrl,
					model: this.model,
				});
				if (!result.ok) {
					this.addModelSheetError = this.t(result.messageKey);
					return;
				}
				if (isSameApiAlreadySaved(result.values)) {
					this.addModelSheetError = this.t("agent_model_api_already_added");
					return;
				}
				if (isModelNameTaken(result.values.model)) {
					this.addModelSheetError = this.t("agent_model_name_exists");
					return;
				}
				this.verifying = true;
				uni.showLoading({
					title: this.t("model_verify_loading"),
					mask: true,
				});
				try {
					await verifyLlmConnection({
						apiKey: result.values.apiKey,
						baseUrl: result.values.baseUrl,
						model: result.values.model,
					});
				} catch (e) {
					const key = e && e.messageKey ? e.messageKey : "model_verify_failed";
					let title = this.t(key);
					const detail = e && e.detail ? String(e.detail).trim() : "";
					if (
						detail &&
						(key === "model_verify_chat_failed" || key === "model_verify_http" || key === "model_verify_network")
					) {
						const short = detail.length > 72 ? `${detail.slice(0, 72)}…` : detail;
						title = `${title}（${short}）`;
					}
					this.addModelSheetError = title;
					return;
				} finally {
					uni.hideLoading();
					this.verifying = false;
				}
				setLlmSettings(result.values);
				this.apiKey = result.values.apiKey;
				this.baseUrl = result.values.baseUrl;
				this.model = result.values.model;
				addSavedModelEntry(result.values);
				this.reloadPresets();
				this.addModelSheetError = "";
				this.closeAddModelPanel();
				uni.showToast({ title: this.t("agent_model_added_to_list"), icon: "success" });
			},
			onRowPresetChange(e, agentId) {
				const i = Number((e.detail && e.detail.value) ?? 0);
				if (!agentId) return;
				const prev = String((this.items.find((x) => x.id === agentId) || {}).model || "").trim();
				const val = this.pickRangeValues[i] || "";
				if (prev === String(val || "").trim()) return;
				this.items = this.items.map((x) => (x.id === agentId ? { ...x, model: val } : x));
				setAgentModel(agentId, val);
				uni.showToast({ title: this.t("agent_model_saved"), icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f1f5f9;
		box-sizing: border-box;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		padding: 28rpx;
		padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.scroll-pad {
		height: 24rpx;
	}

	.tip-card {
		background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #c7d2fe;
	}

	.tip-card-sub {
		margin-bottom: 28rpx;
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

	.section-label {
		font-size: 24rpx;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 12rpx;
		padding-left: 8rpx;
	}

	.form-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 8rpx 28rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.field {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.field-last {
		border-bottom: none;
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

	.btn-conn {
		margin-bottom: 36rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-radius: 46rpx;
		padding: 28rpx;
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.28);
	}

	.btn-disabled {
		opacity: 0.72;
		pointer-events: none;
	}

	.btn-conn-t {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
	}

	.add-model-entry {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 18rpx;
		padding: 28rpx 32rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
		border: 1rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.add-model-entry-hover {
		opacity: 0.92;
	}

	.add-model-entry-t {
		font-size: 30rpx;
		font-weight: 700;
		color: #2563eb;
	}

	.add-model-entry-arrow {
		font-size: 36rpx;
		color: #94a3b8;
		font-weight: 300;
		line-height: 1;
	}

	.view-models-entry {
		margin-top: 16rpx;
	}

	.add-model-entry-t-secondary {
		color: #475569;
		font-weight: 600;
	}

	.saved-models-wrap {
		padding-bottom: 16rpx;
	}

	.saved-model-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 18rpx;
		padding: 28rpx 32rpx;
		margin-bottom: 8rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
		border: 1rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.saved-model-row-hover {
		opacity: 0.92;
	}

	.saved-model-row-name {
		flex: 1;
		font-size: 30rpx;
		font-weight: 600;
		color: #0f172a;
		padding-right: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.saved-model-row-arrow {
		font-size: 32rpx;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.empty-box-sheet {
		padding-top: 32rpx;
		padding-bottom: 48rpx;
	}

	.sheet-inner-detail {
		padding-bottom: 48rpx;
	}

	.detail-block {
		margin-bottom: 28rpx;
	}

	.detail-label {
		display: block;
		font-size: 24rpx;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 10rpx;
	}

	.detail-value {
		display: block;
		font-size: 28rpx;
		color: #0f172a;
		line-height: 1.5;
		word-break: break-all;
	}

	.detail-mono {
		font-family: ui-monospace, Menlo, Consolas, monospace;
		font-size: 24rpx;
	}

	.detail-key {
		color: #334155;
	}

	.btn-delete-saved {
		margin-top: 16rpx;
		padding: 24rpx;
		border-radius: 16rpx;
		background: rgba(220, 38, 38, 0.08);
		border: 1rpx solid rgba(220, 38, 38, 0.35);
		box-sizing: border-box;
	}

	.btn-delete-saved-hover {
		opacity: 0.9;
	}

	.btn-delete-saved-t {
		display: block;
		text-align: center;
		font-size: 28rpx;
		font-weight: 600;
		color: #dc2626;
	}

	.add-model-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 1000;
		background: rgba(15, 23, 42, 0.48);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: stretch;
	}

	.add-model-sheet {
		width: 100%;
		max-height: 88vh;
		background: #f1f5f9;
		border-radius: 28rpx 28rpx 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.sheet-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 28rpx 16rpx;
		flex-shrink: 0;
		border-bottom: 1rpx solid #e2e8f0;
		background: #f8fafc;
	}

	.sheet-cancel {
		font-size: 28rpx;
		color: #64748b;
		min-width: 100rpx;
	}

	.sheet-head-title {
		flex: 1;
		text-align: center;
		font-size: 32rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.sheet-head-spacer {
		min-width: 100rpx;
	}

	.sheet-scroll {
		height: calc(88vh - 120rpx);
		max-height: calc(88vh - 120rpx);
		min-height: 280rpx;
		width: 100%;
	}

	.sheet-detail-wrap {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		max-height: calc(88vh - 88rpx);
		width: 100%;
	}

	.sheet-scroll-detail {
		flex: 1;
		min-height: 200rpx;
		width: 100%;
	}

	.sheet-detail-footer {
		flex-shrink: 0;
		padding: 16rpx 28rpx 24rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
		background: #f1f5f9;
		border-top: 1rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.saved-delete-confirm {
		width: 100%;
	}

	.saved-delete-confirm-t {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.5;
		margin-bottom: 20rpx;
	}

	.saved-delete-row {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		gap: 20rpx;
	}

	.btn-delete-cancel {
		flex: 1;
		padding: 22rpx 20rpx;
		border-radius: 16rpx;
		background: #fff;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.btn-delete-cancel-hover {
		opacity: 0.9;
	}

	.btn-delete-cancel-t {
		display: block;
		text-align: center;
		font-size: 28rpx;
		font-weight: 600;
		color: #64748b;
	}

	.btn-delete-ok {
		flex: 1;
		padding: 22rpx 20rpx;
		border-radius: 16rpx;
		background: #dc2626;
		box-sizing: border-box;
	}

	.btn-delete-ok-hover {
		opacity: 0.92;
	}

	.btn-delete-ok-t {
		display: block;
		text-align: center;
		font-size: 28rpx;
		font-weight: 700;
		color: #fff;
	}

	.sheet-inner {
		padding: 24rpx 28rpx 40rpx;
		box-sizing: border-box;
	}

	.sheet-tip-card {
		background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-bottom: 24rpx;
		border: 1rpx solid #c7d2fe;
	}

	.sheet-tip-title {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #312e81;
		margin-bottom: 8rpx;
	}

	.sheet-tip-text {
		font-size: 22rpx;
		color: #4338ca;
		line-height: 1.5;
	}

	.btn-conn-sheet {
		margin-bottom: 0;
		margin-top: 8rpx;
	}

	.sheet-error-banner {
		background: rgba(220, 38, 38, 0.1);
		border: 1rpx solid rgba(220, 38, 38, 0.35);
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-bottom: 20rpx;
		box-sizing: border-box;
	}

	.sheet-error-text {
		font-size: 26rpx;
		color: #b91c1c;
		line-height: 1.45;
		word-break: break-all;
	}

	.staff-block {
		margin-top: 4rpx;
	}

	.staff-list-caption {
		display: block;
		font-size: 22rpx;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 10rpx;
		padding-left: 8rpx;
		line-height: 1.3;
	}

	.empty-box {
		padding: 48rpx 24rpx;
		text-align: center;
	}

	.empty-t {
		font-size: 28rpx;
		color: #64748b;
		line-height: 1.6;
	}

	.staff-list {
		margin-top: 4rpx;
	}

	.staff-name-row {
		background: #fff;
		border-radius: 18rpx;
		margin-bottom: 8rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
		overflow: hidden;
	}

	.staff-name-tap {
		padding: 28rpx 32rpx;
	}

	.staff-name-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #0f172a;
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

	.agent-assign-page.theme-dark .section-label,
	[data-theme="dark"] .agent-assign-page .section-label {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .form-card,
	[data-theme="dark"] .agent-assign-page .form-card {
		background: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.agent-assign-page.theme-dark .field,
	[data-theme="dark"] .agent-assign-page .field {
		border-bottom-color: var(--border-color) !important;
	}

	.agent-assign-page.theme-dark .label,
	[data-theme="dark"] .agent-assign-page .label {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .input,
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

	.agent-assign-page.theme-dark .empty-t,
	[data-theme="dark"] .agent-assign-page .empty-t {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .staff-list-caption,
	[data-theme="dark"] .agent-assign-page .staff-list-caption {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .staff-name-row,
	[data-theme="dark"] .agent-assign-page .staff-name-row {
		background: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.agent-assign-page.theme-dark .staff-name-text,
	[data-theme="dark"] .agent-assign-page .staff-name-text {
		color: var(--text-primary) !important;
	}

	.agent-assign-page.theme-dark .add-model-entry,
	[data-theme="dark"] .agent-assign-page .add-model-entry {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.agent-assign-page.theme-dark .add-model-entry-t,
	[data-theme="dark"] .agent-assign-page .add-model-entry-t {
		color: #93c5fd !important;
	}

	.agent-assign-page.theme-dark .add-model-entry-arrow,
	[data-theme="dark"] .agent-assign-page .add-model-entry-arrow {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .add-model-mask,
	[data-theme="dark"] .agent-assign-page .add-model-mask {
		background: rgba(0, 0, 0, 0.55) !important;
	}

	.agent-assign-page.theme-dark .add-model-sheet,
	[data-theme="dark"] .agent-assign-page .add-model-sheet {
		background: var(--bg-primary) !important;
	}

	.agent-assign-page.theme-dark .sheet-head,
	[data-theme="dark"] .agent-assign-page .sheet-head {
		background: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	.agent-assign-page.theme-dark .sheet-cancel,
	[data-theme="dark"] .agent-assign-page .sheet-cancel {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .sheet-head-title,
	[data-theme="dark"] .agent-assign-page .sheet-head-title {
		color: var(--text-primary) !important;
	}

	.agent-assign-page.theme-dark .sheet-detail-footer,
	[data-theme="dark"] .agent-assign-page .sheet-detail-footer {
		background: var(--bg-primary) !important;
		border-top-color: var(--border-color) !important;
	}

	.agent-assign-page.theme-dark .saved-delete-confirm-t,
	[data-theme="dark"] .agent-assign-page .saved-delete-confirm-t {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .btn-delete-cancel,
	[data-theme="dark"] .agent-assign-page .btn-delete-cancel {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	.agent-assign-page.theme-dark .btn-delete-cancel-t,
	[data-theme="dark"] .agent-assign-page .btn-delete-cancel-t {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .sheet-tip-card,
	[data-theme="dark"] .agent-assign-page .sheet-tip-card {
		background: linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%) !important;
		border-color: rgba(99, 102, 241, 0.4) !important;
	}

	.agent-assign-page.theme-dark .sheet-tip-title,
	[data-theme="dark"] .agent-assign-page .sheet-tip-title {
		color: #c7d2fe !important;
	}

	.agent-assign-page.theme-dark .sheet-tip-text,
	[data-theme="dark"] .agent-assign-page .sheet-tip-text {
		color: #a5b4fc !important;
	}

	.agent-assign-page.theme-dark .sheet-error-banner,
	[data-theme="dark"] .agent-assign-page .sheet-error-banner {
		background: rgba(248, 113, 113, 0.12) !important;
		border-color: rgba(248, 113, 113, 0.4) !important;
	}

	.agent-assign-page.theme-dark .sheet-error-text,
	[data-theme="dark"] .agent-assign-page .sheet-error-text {
		color: #fca5a5 !important;
	}

	.agent-assign-page.theme-dark .add-model-entry-t-secondary,
	[data-theme="dark"] .agent-assign-page .add-model-entry-t-secondary {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .saved-model-row,
	[data-theme="dark"] .agent-assign-page .saved-model-row {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.agent-assign-page.theme-dark .saved-model-row-name,
	[data-theme="dark"] .agent-assign-page .saved-model-row-name {
		color: var(--text-primary) !important;
	}

	.agent-assign-page.theme-dark .saved-model-row-arrow,
	[data-theme="dark"] .agent-assign-page .saved-model-row-arrow {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .detail-label,
	[data-theme="dark"] .agent-assign-page .detail-label {
		color: var(--text-secondary) !important;
	}

	.agent-assign-page.theme-dark .detail-value,
	[data-theme="dark"] .agent-assign-page .detail-value {
		color: var(--text-primary) !important;
	}

	.agent-assign-page.theme-dark .detail-key,
	[data-theme="dark"] .agent-assign-page .detail-key {
		color: #cbd5e1 !important;
	}

	.agent-assign-page.theme-dark .btn-delete-saved,
	[data-theme="dark"] .agent-assign-page .btn-delete-saved {
		background: rgba(248, 113, 113, 0.12) !important;
		border-color: rgba(248, 113, 113, 0.35) !important;
	}

	.agent-assign-page.theme-dark .btn-delete-saved-t,
	[data-theme="dark"] .agent-assign-page .btn-delete-saved-t {
		color: #fca5a5 !important;
	}
</style>
