/**
 * 可选 WebSocket：配置 VITE_WS_URL 后，后端推送任意 JSON 时可触发工作台刷新。
 * 未配置时为零开销；消息格式兼容 { workflowId } 或广播到所有已订阅工作流。
 */

const byWorkflow = new Map();

let connecting = false;
let reconnectTimer = null;
/** 避免在已有连接未关闭前重复 connectSocket */
let socketActive = false;

export function getRealtimeWsUrl() {
	const u = import.meta.env.VITE_WS_URL;
	return typeof u === "string" && u.trim() ? u.trim().replace(/\/+$/, "") : "";
}

function notifyWorkflow(workflowId) {
	const set = byWorkflow.get(workflowId);
	if (!set) return;
	set.forEach((fn) => {
		try {
			fn();
		} catch (e) {
			console.warn("[realtime] callback", e);
		}
	});
}

function notifyAll() {
	byWorkflow.forEach((_set, wid) => notifyWorkflow(wid));
}

function hasSubscribers() {
	return byWorkflow.size > 0;
}

function scheduleReconnect() {
	if (!hasSubscribers()) return;
	if (reconnectTimer) clearTimeout(reconnectTimer);
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null;
		connectIfNeeded();
	}, 3500);
}

function attachSocketHandlers() {
	uni.onSocketOpen(() => {
		connecting = false;
		socketActive = true;
		if (import.meta.env.MODE === "development") {
			console.log("[realtime] socket open");
		}
	});
	uni.onSocketMessage((res) => {
		try {
			const raw = res.data;
			const data = typeof raw === "string" ? JSON.parse(raw) : raw;
			const wid = data && (data.workflowId || data.workflow_id);
			if (wid && byWorkflow.has(String(wid))) {
				notifyWorkflow(String(wid));
			} else {
				notifyAll();
			}
		} catch {
			notifyAll();
		}
	});
	uni.onSocketError(() => {
		connecting = false;
		socketActive = false;
		scheduleReconnect();
	});
	uni.onSocketClose(() => {
		connecting = false;
		socketActive = false;
		scheduleReconnect();
	});
}

let handlersAttached = false;

function connectIfNeeded() {
	const url = getRealtimeWsUrl();
	if (!url || !hasSubscribers()) return;
	if (connecting || socketActive) return;
	connecting = true;
	if (!handlersAttached) {
		attachSocketHandlers();
		handlersAttached = true;
	}
	uni.connectSocket({
		url,
		fail: () => {
			connecting = false;
			socketActive = false;
			scheduleReconnect();
		},
	});
}

function disconnectIfIdle() {
	if (hasSubscribers()) return;
	try {
		uni.closeSocket({});
	} catch {
		//
	}
	connecting = false;
	socketActive = false;
}

/**
 * @param {string} workflowId
 * @param {() => void} onPush
 * @returns {() => void} unsubscribe
 */
export function subscribeWorkflowChannel(workflowId, onPush) {
	if (!workflowId || typeof onPush !== "function") {
		return () => {};
	}
	const key = String(workflowId);
	if (!byWorkflow.has(key)) byWorkflow.set(key, new Set());
	byWorkflow.get(key).add(onPush);
	connectIfNeeded();
	return () => {
		const set = byWorkflow.get(key);
		if (set) {
			set.delete(onPush);
			if (set.size === 0) byWorkflow.delete(key);
		}
		disconnectIfIdle();
	};
}
