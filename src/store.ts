import type { ActivityItem, JoinInput, NotificationRecord, NotificationType, QueueEntry, QueueState } from "./types";

const STORAGE_KEY = "queuecare-demo-state-v1";
const CHANNEL_NAME = "queuecare-live-updates";
const THRESHOLDS: Array<{ ahead: number; type: NotificationType }> = [
  { ahead: 10, type: "ten_ahead" },
  { ahead: 5, type: "five_ahead" },
  { ahead: 3, type: "three_ahead" },
  { ahead: 1, type: "next" }
];

const notificationCopy: Record<NotificationType, string> = {
  ten_ahead: "Approximately 10 people are ahead of you.",
  five_ahead: "Approximately 5 people are ahead of you.",
  three_ahead: "Approximately 3 people are ahead of you.",
  next: "You are next. Please be ready.",
  called: "Your token is called. Please proceed to the doctor."
};

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function initialState(): QueueState {
  const date = new Date().toISOString().slice(0, 10);
  return {
    sessionId: `clinic-demo-${date}`,
    sessionDate: date,
    clinicName: "Aster Lane Clinic",
    status: "open",
    acceptingTokens: true,
    nextTokenNumber: 1,
    entries: [],
    notifications: [],
    activity: [{ id: uid("activity"), label: "Queue opened", detail: "Automatically opened at 6:00 PM", time: now(), tone: "green" }]
  };
}

function readState(): QueueState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as QueueState : initialState();
  } catch {
    return initialState();
  }
}

let state = readState();
let serverMode = false;
let socket: WebSocket | null = null;
let serverReady: Promise<void> = Promise.resolve();
const listeners = new Set<(value: QueueState) => void>();
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

channel?.addEventListener("message", event => {
  if (event.data?.type === "state") {
    state = event.data.state as QueueState;
    listeners.forEach(listener => listener(state));
  }
});

function publish(next: QueueState) {
  state = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  channel?.postMessage({ type: "state", state });
  listeners.forEach(listener => listener(state));
}

function addActivity(value: QueueState, label: string, detail: string, tone: ActivityItem["tone"]): ActivityItem[] {
  return [{ id: uid("activity"), label, detail, time: now(), tone }, ...value.activity].slice(0, 12);
}

function orderedEntries(value = state) {
  return [...value.entries].sort((a, b) => Number(b.priority) - Number(a.priority) || a.tokenNumber - b.tokenNumber);
}

function waitingEntries(value = state) {
  return orderedEntries(value).filter(entry => entry.status === "waiting");
}

function peopleAhead(entry: QueueEntry, value = state) {
  return waitingEntries(value).findIndex(candidate => candidate.id === entry.id);
}

function createNotification(entry: QueueEntry, type: NotificationType): NotificationRecord {
  return {
    id: `${state.sessionId}:${entry.id}:${type}`,
    entryId: entry.id,
    type,
    status: "sent",
    message: notificationCopy[type],
    createdAt: now()
  };
}

function sendNewNotifications(value: QueueState): QueueState {
  const notifications = [...value.notifications];
  for (const entry of waitingEntries(value)) {
    const ahead = peopleAhead(entry, value);
    for (const threshold of THRESHOLDS) {
      const id = `${value.sessionId}:${entry.id}:${threshold.type}`;
      if (ahead <= threshold.ahead && !notifications.some(item => item.id === id)) {
        notifications.push(createNotification(entry, threshold.type));
      }
    }
  }
  return { ...value, notifications };
}

export const queueStore = {
  subscribe(listener: (value: QueueState) => void) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
  getState() {
    return state;
  },
  join(input: JoinInput) {
    return serverReady.then(async () => {
      if (serverMode) {
      return fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
        .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not join the queue."); return result as QueueEntry; });
      }
      if (state.status !== "open" || !state.acceptingTokens) throw new Error("New tokens are not available right now.");
      if (!input.patientName.trim()) throw new Error("Please enter the patient name.");
      if (!input.phone.trim()) throw new Error("Please enter a WhatsApp number.");
      const normalizedPhone = input.phone.replace(/[^\d+]/g, "");
      if (state.entries.some(entry => ["waiting", "called", "skipped"].includes(entry.status) && entry.phone === normalizedPhone)) {
        throw new Error("This phone already has an active token for today.");
      }
      const entry: QueueEntry = {
        id: uid("token"),
        tokenNumber: state.nextTokenNumber,
        patientName: input.patientName.trim(),
        phone: normalizedPhone,
        status: "waiting",
        priority: false,
        createdAt: now(),
        updatedAt: now()
      };
      let next = { ...state, nextTokenNumber: state.nextTokenNumber + 1, entries: [...state.entries, entry] };
      next = sendNewNotifications(next);
      next = { ...next, activity: addActivity(next, `Token ${entry.tokenNumber} joined`, input.assisted ? `${entry.patientName} · assisted by family member` : entry.patientName, "blue") };
      publish(next);
      return entry;
    });
  },
  async next() {
    await serverReady;
    if (serverMode) { await serverAction("/api/action/next"); return; }
    if (state.status !== "open") throw new Error("The session is not open.");
    const current = state.entries.find(entry => entry.status === "called");
    const nextCandidate = orderedEntries(state).find(entry => entry.status === "waiting");
    if (!nextCandidate) return;
    let next = { ...state, entries: state.entries.map(entry => entry.id === current?.id ? { ...entry, status: "completed" as const, updatedAt: now() } : entry) };
    next = { ...next, entries: next.entries.map(entry => entry.id === nextCandidate.id ? { ...entry, status: "called" as const, updatedAt: now() } : entry) };
    const notification: NotificationRecord = { id: `${next.sessionId}:${nextCandidate.id}:called`, entryId: nextCandidate.id, type: "called", status: "sent", message: notificationCopy.called, createdAt: now() };
    next = { ...next, notifications: next.notifications.some(item => item.id === notification.id) ? next.notifications : [...next.notifications, notification] };
    next = sendNewNotifications(next);
    next = { ...next, activity: addActivity(next, `Token ${nextCandidate.tokenNumber} called`, nextCandidate.patientName, "green") };
    publish(next);
  },
  async call() {
    await serverReady;
    if (serverMode) { await serverAction("/api/action/call"); return; }
    const current = currentToken(state);
    if (!current) throw new Error("There is no active token to call.");
    publish({ ...state, activity: addActivity(state, `Token ${current.tokenNumber} announced`, current.patientName, "green") });
  },
  async skip() {
    await serverReady;
    if (serverMode) { await serverAction("/api/action/skip"); return; }
    const current = state.entries.find(entry => entry.status === "called");
    if (!current) throw new Error("There is no called token to skip.");
    let next = { ...state, entries: state.entries.map(entry => entry.id === current.id ? { ...entry, status: "skipped" as const, updatedAt: now() } : entry) };
    next = sendNewNotifications(next);
    next = { ...next, activity: addActivity(next, `Token ${current.tokenNumber} skipped`, `${current.patientName} can be recalled`, "amber") };
    publish(next);
  },
  async recall(entryId: string) {
    await serverReady;
    if (serverMode) { await serverAction("/api/action/recall", { entryId }); return; }
    const entry = state.entries.find(item => item.id === entryId && item.status === "skipped");
    if (!entry) throw new Error("Only skipped tokens can be recalled.");
    let next = { ...state, entries: state.entries.map(item => item.id === entryId ? { ...item, status: "waiting" as const, priority: true, updatedAt: now() } : item) };
    next = sendNewNotifications(next);
    next = { ...next, activity: addActivity(next, `Token ${entry.tokenNumber} recalled`, `${entry.patientName} moved to priority line`, "blue") };
    publish(next);
  },
  stopNewTokens() {
    if (serverMode) { void serverReady.then(() => serverAction("/api/action/stop")); return; }
    publish({ ...state, acceptingTokens: false, activity: addActivity(state, "New tokens stopped", "Existing patients remain in the queue", "amber") });
  },
  endSession() {
    if (serverMode) { void serverReady.then(() => serverAction("/api/action/end")); return; }
    publish({ ...state, status: "ended", acceptingTokens: false, activity: addActivity(state, "Session ended", "No more tokens can be generated", "slate") });
  },
  resetDemo() {
    publish(initialState());
  }
};

async function serverAction(path: string, input: Record<string, string> = {}) {
  const token = sessionStorage.getItem("queuecare-doctor-token");
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Queue action failed.");
  return result;
}

async function connectServer() {
  if (typeof window === "undefined") return;
  try {
    const response = await fetch("/api/state");
    if (!response.ok) return;
    state = await response.json() as QueueState;
    serverMode = true;
    listeners.forEach(listener => listener(state));
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socket.onmessage = event => {
      const message = JSON.parse(event.data) as { type: string; state: QueueState };
      if (message.type === "state") {
        state = message.state;
        listeners.forEach(listener => listener(state));
      }
    };
  } catch {
    serverMode = false;
  }
}

serverReady = connectServer();

export function aheadFor(entry: QueueEntry, value = state) {
  return entry.status === "waiting" ? peopleAhead(entry, value) : null;
}

export function currentToken(value = state) {
  return value.entries.find(entry => entry.status === "called") ?? null;
}

export function formatRelativeTime(iso: string) {
  const difference = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(difference / 60000);
  if (minutes === 0) return "just now";
  if (minutes === 1) return "1 min ago";
  return `${minutes} min ago`;
}
