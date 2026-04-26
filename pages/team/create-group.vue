<template>
	<scroll-view scroll-y class="page">
		<view class="section-t">{{ t('basic_info') }}</view>
		<view class="card">
			<text class="label"><text class="req">*</text>{{ t('group_name') }}</text>
			<input class="inp" v-model="name" :placeholder="t('group_name_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('client_project_shortname') }}</text>
			<input class="inp" v-model="clientName" :placeholder="t('client_project_placeholder')" placeholder-class="ph" />
		</view>
		<view class="card">
			<text class="label">{{ t('deliverable_description') }}</text>
			<textarea class="ta" v-model="deliverable" :placeholder="t('deliverable_placeholder')" placeholder-class="ph" />
		</view>

		<view class="section-t">{{ t('plan_reminder') }}</view>
		<view class="card">
			<text class="label">{{ t('expected_delivery_date') }}</text>
			<picker mode="date" :value="deadline" @change="onDeadline">
				<view class="picker-line">{{ deadline || t('select_date_optional') }}</view>
			</picker>
		</view>
		<view class="card">
			<text class="label">{{ t('daily_report_reminder_time') }}</text>
			<picker mode="selector" :range="timeOptions" :value="notifyIdx" @change="onNotify">
				<view class="picker-line">{{ timeOptions[notifyIdx] }}</view>
			</picker>
			<text class="hint">{{ t('daily_report_reminder_hint') }}</text>
		</view>

		<view class="section-t">{{ t('other') }}</view>
		<view class="card">
			<text class="label">{{ t('remarks') }}</text>
			<textarea class="ta" v-model="desc" :placeholder="t('remarks_placeholder')" placeholder-class="ph" />
		</view>
		<view class="section-t">选择群成员（真实员工）</view>
		<view class="card">
			<view v-if="loadingEmployees" class="hint">员工加载中...</view>
			<view v-else-if="employeeOptions.length === 0" class="hint">暂无可选员工，请先在后端创建员工</view>
			<view v-else>
				<view
					v-for="emp in employeeOptions"
					:key="emp.id"
					class="member-row"
					:class="{ 'member-row-active': selectedEmployeeIds.includes(emp.id) }"
					@tap="toggleMember(emp.id)"
				>
					<view class="member-check">{{ selectedEmployeeIds.includes(emp.id) ? "✓" : "" }}</view>
					<view class="member-main">
						<text class="member-name">{{ emp.name }}</text>
						<text class="member-meta">{{ emp.department || "未分组" }} · {{ emp.role || "成员" }}</text>
					</view>
				</view>
			</view>
		</view>

		<button class="btn" type="primary" :loading="busy" @click="submit">{{ t('create_project_group') }}</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addProjectGroup } from "@/utils/virtualTeamStore";
	import { t, getLanguage } from "@/utils/lang";
	import { listMyUserAgents, listUserAgents } from "@/clientApi/agentsApi";

	export default {
		data() {
			return {
				name: "",
				clientName: "",
				deliverable: "",
				deadline: "",
				desc: "",
				busy: false,
				loadingEmployees: false,
				employeeOptions: [],
				selectedEmployeeIds: [],
				timeOptions: ["20:00", "20:30", "21:00", "21:30", "22:00"],
				notifyIdx: 2,
			};
		},
		onShow() {
			this.loadEmployees();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			onDeadline(e) {
				this.deadline = (e.detail && e.detail.value) || "";
			},
			onNotify(e) {
				this.notifyIdx = Number(e.detail.value) || 0;
			},
			async loadEmployees() {
				this.loadingEmployees = true;
				try {
					let rows = await listMyUserAgents();
					if (!Array.isArray(rows) || rows.length === 0) {
						// 部分账号拿不到 userId 时，降级为后端全量返回（再由前端展示）
						rows = await listUserAgents();
					}
					this.employeeOptions = (Array.isArray(rows) ? rows : [])
						.map((r) => ({
							id: String(r?.id || r?.agentId || "").trim(),
							name: String(r?.displayName || r?.name || "").trim(),
							role: String(r?.jobTitle || r?.rolePosition || "").trim(),
							department: String(r?.department || "").trim(),
							avatar: String(r?.avatar || r?.avatarUrl || r?.headImg || r?.headimg || "").trim(),
						}))
						.filter((r) => r.id && r.name);
					this.selectedEmployeeIds = this.selectedEmployeeIds.filter((id) =>
						this.employeeOptions.some((e) => e.id === id)
					);
				} catch (e) {
					this.employeeOptions = [];
					uni.showToast({ title: "员工加载失败", icon: "none" });
				} finally {
					this.loadingEmployees = false;
				}
			},
			toggleMember(id) {
				const i = this.selectedEmployeeIds.indexOf(id);
				if (i >= 0) this.selectedEmployeeIds.splice(i, 1);
				else this.selectedEmployeeIds.push(id);
			},
			submit() {
				const n = (this.name || "").trim();
				if (!n) {
				uni.showToast({ title: this.t('please_enter_group_name'), icon: "none" });
				return;
			}
			this.busy = true;
			try {
				addProjectGroup({
					name: n,
					desc: this.desc,
					clientName: this.clientName,
					deliverable: this.deliverable,
					deadline: this.deadline,
					notifyTime: this.timeOptions[this.notifyIdx] || "21:00",
					members: this.employeeOptions.filter((e) => this.selectedEmployeeIds.includes(e.id)),
				});
				uni.showToast({ title: this.t('created'), icon: "success" });
					setTimeout(() => uni.navigateBack(), 400);
				} finally {
					this.busy = false;
				}
			},
		},
	};
</script>

<style>
	.page {
		min-height: 100vh;
		max-height: 100vh;
		background: #ededed;
		padding: 32rpx 24rpx 0;
		box-sizing: border-box;
		overflow-y: auto;
	}
	.section-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #888;
		margin: 8rpx 0 16rpx 8rpx;
	}
	.card {
		background: #fff;
		border-radius: 12rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
	}
	.label {
		display: block;
		font-size: 26rpx;
		color: #576b95;
		margin-bottom: 16rpx;
	}
	.req {
		color: #fa5151;
		margin-right: 4rpx;
	}
	.inp {
		font-size: 30rpx;
		color: #111;
	}
	.ta {
		width: 100%;
		min-height: 160rpx;
		font-size: 28rpx;
		color: #111;
	}
	.ph {
		color: #bbb;
	}
	.picker-line {
		font-size: 30rpx;
		color: #111;
		padding: 8rpx 0;
	}
	.hint {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #b2b2b2;
		line-height: 1.4;
	}
	.member-row {
		display: flex;
		align-items: center;
		padding: 14rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.member-row-active {
		background: #f8fbff;
	}
	.member-check {
		width: 36rpx;
		height: 36rpx;
		line-height: 36rpx;
		text-align: center;
		border-radius: 50%;
		border: 1rpx solid #2563eb;
		color: #2563eb;
		font-size: 24rpx;
		margin-right: 12rpx;
	}
	.member-main {
		flex: 1;
		min-width: 0;
	}
	.member-name {
		display: block;
		font-size: 28rpx;
		color: #0f172a;
		font-weight: 600;
	}
	.member-meta {
		display: block;
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #64748b;
	}
	.btn {
		margin-top: 32rpx;
	}
	.foot-pad {
		height: 48rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
