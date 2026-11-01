/** Server-backed React store. Never issue local tokens when the API is offline. */
let state = {
  sessionId: "",
  sessionDate: "",
  clinicId: "clinic-demo",
  clinicName: "Aster Lane Clinic",
  status: "closed",
  acceptingTokens: false,
  nextTokenNumber: 1,
  entries: [],
  notifications: [],
  activity: [],
  connection: "connecting",
  connectionError: "",
};
const listeners = new Set();
let socket;
let reconnectTimer;
let generation = 0;

function publish(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function request(path, input) {
  const token = sessionStorage.getItem("queuecare-doctor-token");
  let response;
  try {
    response = await fetch(path, {
      method: input === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Cannot reach the queue server. Check your connection and try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The queue server returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) throw new Error(result.error ?? "Queue action failed.");
  return result;
}

function acceptState(next) {
  publish({ ...next, connection: "connected", connectionError: "" });
}

function disconnected(error) {
  publish({ ...state, connection: "offline", connectionError: error.message });
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    void connectServer();
  }, 3000);
}

async function connectServer() {
  if (typeof window === "undefined") return;
  const currentGeneration = ++generation;
  clearTimeout(reconnectTimer);
  if (socket) {
    socket.onclose = null;
    socket.close();
  }
  // Drop privileged details immediately when the authentication context changes.
  publish({
    ...state,
    entries: state.entries.map(({ phone, patientName, ...entry }) => entry),
    connection: "connecting",
  });
  try {
    const next = await request("/api/state");
    if (currentGeneration !== generation) return;
    acceptState(next);
    const token = sessionStorage.getItem("queuecare-doctor-token");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(
      `${protocol}//${window.location.host}/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    );
    socket.onmessage = (event) => {
      if (currentGeneration !== generation) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "state") acceptState(message.state);
      } catch {
        /* Ignore malformed messages; the next server snapshot repairs state. */
      }
    };
    socket.onclose = () => {
      if (currentGeneration === generation)
        disconnected(new Error("Live updates disconnected. Reconnecting…"));
    };
  } catch (error) {
    if (currentGeneration === generation) disconnected(error);
  }
}

async function serverAction(path, input = {}) {
  const next = await request(path, input);
  acceptState(next);
  return next;
}

export const queueStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState() {
    return state;
  },
  async join(input) {
    const entry = await request("/api/join", input);
    // Show the committed token even if its WebSocket update is delayed.
    if (!state.entries.some((item) => item.id === entry.id)) {
      publish({ ...state, entries: [...state.entries, entry] });
    }
    return entry;
  },
  next: () => serverAction("/api/action/next"),
  call: () => serverAction("/api/action/call"),
  skip: () => serverAction("/api/action/skip"),
  recall: (entryId) => serverAction("/api/action/recall", { entryId }),
  stopNewTokens: () => serverAction("/api/action/stop"),
  endSession: () => serverAction("/api/action/end"),
  async resetDemo() {
    await serverAction("/api/demo/reset");
    sessionStorage.removeItem("queuecare-patient-entry");
    sessionStorage.removeItem("queuecare-patient-entry-back");
  },
  refreshServerConnection: connectServer,
};

if (typeof window !== "undefined") void connectServer();

export function aheadFor(entry, value = state) {
  if (entry.status !== "waiting") return null;
  return [...value.entries]
    .filter((item) => item.status === "waiting")
    .sort(
      (a, b) =>
        Number(b.priority) - Number(a.priority) ||
        a.tokenNumber - b.tokenNumber,
    )
    .findIndex((item) => item.id === entry.id);
}
export function currentToken(value = state) {
  return value.entries.find((entry) => entry.status === "called") ?? null;
}
export function tokenLabel(tokenNumber) {
  return `A${tokenNumber}`;
}
export function formatRelativeTime(iso) {
  const minutes = Math.floor(
    Math.max(0, Date.now() - new Date(iso).getTime()) / 60000,
  );
  return minutes === 0
    ? "just now"
    : minutes === 1
      ? "1 min ago"
      : `${minutes} min ago`;
}
