<!-- 学术部：学科视角 + 论证任务 + 单一首席学者（职能：设定自洽） -->
<template>
	<scroll-view scroll-y class="page">
		<view class="hero">
			<text class="eyebrow">叙事与世界观</text>
			<text class="title">{{ cleanDeptLabel(department.name) }}</text>
			<text class="desc">{{ department.desc }}</text>
		</view>

		<view class="card">
			<text class="h">学科视角</text>
			<view class="disc">
				<text v-for="d in disciplines" :key="d.key" class="d" :class="{ on: disc === d.key }" @click="disc = d.key">{{ d.label }}</text>
			</view>
			<text class="hint">视角决定提问方式；下方学者列表与数据一致，用于强调当前论证主线。</text>
		</view>

		<view class="card">
			<text class="h">论证 / 设定任务</text>
			<textarea v-model="task" class="ta" placeholder="要澄清的矛盾、需要考证的史实或人物动机线索" />
		</view>

		<view class="card">
			<text class="h">首席学者（单选）</text>
			<view class="sch">
				<view v-for="s in department.services" :key="s.id" class="sch-i" :class="{ on: lead === s.id }" @click="lead = s.id">
					<text class="sn">{{ cleanDeptLabel(s.name) }}</text>
					<text class="si">{{ s.intro }}</text>
				</view>
			</view>
		</view>

		<view class="actions">
			<button class="btn ghost" @click="reset">重置</button>
			<button class="btn primary" type="primary" @click="submit">生成学术任务书</button>
		</view>
		<view class="pad" />
	</scroll-view>
</template>

<script>
	import { cleanDeptLabel } from "@/utils/deptUi";

	export default {
		name: "DeptAcademic",
		props: { department: { type: Object, required: true } },
		data() {
			return {
				disciplines: [
					{ key: "anthro", label: "人类学" },
					{ key: "hist", label: "历史" },
					{ key: "psych", label: "心理" },
				],
				disc: "anthro",
				task: "",
				lead: "",
			};
		},
		methods: {
			cleanDeptLabel,
			reset() {
				this.disc = "anthro";
				this.task = "";
				this.lead = "";
			},
			submit() {
				if (!this.task.trim()) {
					uni.showToast({ title: "请填写论证任务", icon: "none" });
					return;
				}
				if (!this.lead) {
					uni.showToast({ title: "请选择首席学者", icon: "none" });
					return;
				}
				uni.showToast({ title: "任务书已生成（待接后端）", icon: "success" });
			},
		},
	};
</script>

<style scoped>
	.page {
		max-height: 100vh;
		background: #fafaf9;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hero {
		padding: 28rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #fafaf9, #e7e5e4);
		border: 1rpx solid #a8a29e;
		margin-bottom: 20rpx;
	}
	.eyebrow {
		font-size: 22rpx;
		color: #57534e;
		font-weight: 700;
		letter-spacing: 0.05em;
	}
	.title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #292524;
		margin-top: 8rpx;
	}
	.desc {
		display: block;
		font-size: 24rpx;
		color: #57534e;
		margin-top: 10rpx;
		line-height: 1.45;
	}
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #e7e5e4;
	}
	.h {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 14rpx;
	}
	.disc {
		display: flex;
		gap: 12rpx;
		flex-wrap: wrap;
		margin-bottom: 12rpx;
	}
	.d {
		padding: 12rpx 22rpx;
		border-radius: 999rpx;
		border: 2rpx solid #d6d3d1;
		font-size: 24rpx;
		color: #57534e;
	}
	.d.on {
		border-color: #57534e;
		background: #fafaf9;
		font-weight: 800;
		color: #1c1917;
	}
	.hint {
		font-size: 22rpx;
		color: #78716c;
		line-height: 1.45;
	}
	.ta {
		min-height: 180rpx;
		width: 100%;
		padding: 16rpx;
		font-size: 26rpx;
		line-height: 1.55;
		box-sizing: border-box;
		background: #fafaf9;
		border-radius: 12rpx;
		border: 1rpx solid #e7e5e4;
	}
	.sch {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	.sch-i {
		padding: 18rpx;
		border-radius: 14rpx;
		border: 2rpx solid #e7e5e4;
		background: #fafafa;
	}
	.sch-i.on {
		border-color: #57534e;
		background: #fafaf9;
	}
	.sn {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1c1917;
	}
	.si {
		display: block;
		font-size: 22rpx;
		color: #78716c;
		margin-top: 6rpx;
		line-height: 1.4;
	}
	.actions {
		display: flex;
		gap: 16rpx;
	}
	.btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 42rpx;
		font-weight: 700;
		font-size: 28rpx;
	}
	.btn.ghost {
		background: #e7e5e4;
		color: #44403c;
	}
	.pad {
		height: 48rpx;
	}
</style>
