import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Copy,
  HeartPulse,
  History,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Stethoscope,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { QueueEntry, QueueState } from "./types";
import { aheadFor, currentToken, formatRelativeTime, queueStore, tokenLabel } from "./store";

const useQueue = () => useSyncExternalStore(queueStore.subscribe, queueStore.getState, queueStore.getState);

/* ─── Shared primitive components ───────────────── */

/** Primary CTA button — dark navy fill */
function BtnPrimary({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-ink to-ink-soft px-5 py-3 text-sm font-bold text-white shadow-btn transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-btn-lg active:translate-y-0 active:scale-[.985]
        focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Accent button — emerald fill */
function BtnAccent({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald to-emerald-dark px-5 py-3 text-sm font-bold text-white shadow-btn-emerald border border-emerald-dark transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-btn-emerald-lg active:translate-y-0 active:scale-[.985]
        focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Ghost / secondary button — white surface with border */
function BtnGhost({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm transition-all duration-200
        hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md
        active:translate-y-0 active:scale-[.985] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Danger button — red tint */
function BtnDanger({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition-all duration-200
        hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-sm
        active:translate-y-0 active:scale-[.985] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Subtle utility button — slate tint */
function BtnSubtle({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 transition-all duration-200
        hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-800
        active:translate-y-0 active:scale-[.985] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Card wrapper */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.35rem] border border-border bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

/** Input field */
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-slate-50 px-4 py-3.5 text-sm font-sans text-ink outline-none placeholder:text-slate-muted
        transition-all duration-200 focus:border-emerald focus:bg-white focus:ring-4 focus:ring-emerald/10
        ${className}`}
    />
  );
}

/** Badge */
function Badge({ children, variant = "slate", className = "" }: {
  children: ReactNode;
  variant?: "green" | "blue" | "amber" | "slate" | "red";
  className?: string;
}) {
  const variants = {
    green: "bg-emerald-light text-emerald-text",
    blue: "bg-blue-100 text-blue-900",
    amber: "bg-amber-100 text-amber-900",
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[.7rem] font-bold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Animated live dot */
function LiveDot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-emerald animate-pulse-dot" />;
}

/* ─── App shell ─────────────────────────────────── */
function App() {
  const query = new URLSearchParams(window.location.search);
  const [route, setRoute] = useState(query.has("join") ? "patient" : query.has("doctor") ? "doctor" : "home");
  const [doctorAuthenticated, setDoctorAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem("queuecare-doctor-token"))
  );
  const state = useQueue();

  const navigate = (next: string) => {
    const url = next === "doctor" ? "?doctor=1" : next === "patient" ? "?join=clinic-demo" : "/";
    window.history.pushState({}, "", url);
    setRoute(next);
  };

  useEffect(() => {
    const onPop = () => {
      const current = new URLSearchParams(window.location.search);
      setRoute(current.has("join") ? "patient" : current.has("doctor") ? "doctor" : "home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="app-canvas min-h-screen text-ink font-sans">
      {route !== "patient" && <Header route={route} navigate={navigate} />}
      <div className="animate-fade-in">
        {route === "home" && <Home navigate={navigate} state={state} />}
        {route === "patient" && <PatientJoin state={state} />}
        {route === "doctor" && (
          doctorAuthenticated
            ? <DoctorDashboard
                state={state}
                navigate={navigate}
                onLogout={() => {
                  sessionStorage.removeItem("queuecare-doctor-token");
                  setDoctorAuthenticated(false);
                  void queueStore.refreshServerConnection();
                }}
              />
            : <DoctorAuth onSuccess={() => setDoctorAuthenticated(true)} />
        )}
      </div>
      {route !== "patient" && <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs font-medium text-slate-muted">
          <span>QueueCare · receptionist-free waiting</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald" /> Private queue session
          </span>
        </div>
      </footer>}
    </div>
  );
}

/* ─── Header ────────────────────────────────────── */
function Header({ route, navigate }: { route: string; navigate: (route: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-white/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6">
        <button onClick={() => navigate("home")} className="flex items-center gap-3 rounded-xl transition hover:opacity-80 focus-visible:outline-none">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ink to-ink-soft text-emerald-glow shadow-btn">
            <HeartPulse size={18} />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-ink">QueueCare</span>
            <span className="block text-[11px] font-medium text-slate-muted">virtual waiting room</span>
          </span>
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <LiveDot />
          <span className="text-xs font-semibold text-slate-soft">Live queue</span>
        </div>

        <BtnGhost
          onClick={() => navigate(route === "doctor" ? "home" : "doctor")}
          className="!px-3.5 !py-2.5 !text-xs sm:!px-4"
        >
          <Stethoscope size={14} />
          {route === "doctor" ? "Patient view" : "Doctor dashboard"}
        </BtnGhost>
      </div>
    </header>
  );
}

/* ─── Home ──────────────────────────────────────── */
function Home({ navigate, state }: { navigate: (route: string) => void; state: QueueState }) {
  return (
    <main>
      {/* Hero */}
      <section className="hero-grid relative mx-auto grid max-w-7xl gap-14 overflow-hidden px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pt-24">
        <div className="relative z-10">
          <Badge variant="green" className="mb-6">
            <Sparkles size={12} /> Less waiting. More care.
          </Badge>
          <h1 className="max-w-xl text-5xl font-black leading-[1.04] tracking-[-.045em] text-ink sm:text-6xl lg:text-[4.25rem]">
            Your place in line,{" "}
            <span className="text-emerald">without the line.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-soft">
            Scan the clinic QR, get your token, and wait comfortably nearby.
            We'll keep you updated on WhatsApp as your turn gets closer.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <BtnPrimary onClick={() => navigate("patient")}>
              <QrCode size={17} /> Join the queue <ArrowRight size={15} />
            </BtnPrimary>
            <BtnGhost onClick={() => navigate("doctor")}>
              <Stethoscope size={16} /> Doctor view
            </BtnGhost>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-muted">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald" /> No app download</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} className="text-emerald" /> WhatsApp updates</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald" /> Join near clinic</span>
          </div>
        </div>

        <QueuePreview state={state} />
      </section>

      {/* Feature strip */}
      <section className="border-y border-border bg-white/80">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-14 sm:grid-cols-3">
          <Feature icon={<QrCode size={20} />} title="One quick scan" text="The clinic QR stays on the wall. Scan it when you arrive." />
          <Feature icon={<Bell size={20} />} title="Stay in the loop" text="Get alerts at 10, 5, 3, 1 people ahead, and when called." />
          <Feature icon={<Users size={20} />} title="Bring someone along" text="A family member can register an elder from their own phone." />
        </div>
      </section>
    </main>
  );
}

function QueuePreview({ state }: { state: QueueState }) {
  const waiting = state.entries.filter(e => e.status === "waiting").length;
  return (
    <div className="animate-slide-up relative mx-auto w-full max-w-md">
      <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-emerald/10 blur-2xl" />
      <div className="rounded-[1.65rem] bg-gradient-to-br from-ink via-ink to-ink-soft p-6 text-white shadow-card sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald">Aster Lane Clinic</p>
            <p className="mt-1 text-sm text-white/50">Evening queue · open now</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-dark px-2.5 py-1 text-[.65rem] font-bold text-white">
            ● LIVE
          </span>
        </div>

        <div className="py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-white/35">Now serving</p>
          <p className="mt-2 text-8xl font-black tracking-tight">{currentToken(state) ? tokenLabel(currentToken(state)!.tokenNumber) : "—"}</p>
          <p className="mt-3 text-sm text-white/45">{waiting} people waiting</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-soft p-4">
            <p className="text-[11px] font-semibold text-white/35">Next update</p>
            <p className="mt-1 text-sm font-bold">WhatsApp</p>
          </div>
          <div className="rounded-xl bg-emerald-dark p-4">
            <p className="text-[11px] font-semibold text-emerald-light">Session</p>
            <p className="mt-1 text-sm font-bold text-white">Until doctor ends</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Card className="group p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-xlight text-emerald transition-transform duration-200 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-soft">{text}</p>
    </Card>
  );
}

/* ─── Patient Join ──────────────────────────────── */
function PatientJoin({ state }: { state: QueueState }) {
  const [phone, setPhone] = useState("");
  const [entryId, setEntryId] = useState(() => sessionStorage.getItem("queuecare-patient-entry") ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const clinicId = new URLSearchParams(window.location.search).get("join") ?? "clinic-demo";
  const existingEntry = state.entries.find(entry => entry.id === entryId) ?? null;

  const join = async () => {
    setError("");
    setLoading(true);
    try {
      const entry = await queueStore.join({ phone, clinicId });
      sessionStorage.setItem("queuecare-patient-entry", entry.id);
      setEntryId(entry.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the queue.");
    } finally {
      setLoading(false);
    }
  };

  if (existingEntry) return <PatientToken entry={existingEntry} state={state} onRequestAnother={() => setEntryId("")} />;

  return (
    <main className="patient-canvas mx-auto flex min-h-screen max-w-md items-center px-5 py-8 sm:px-6">
      <section className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-ink to-ink-soft text-emerald-glow shadow-btn">
            <HeartPulse size={22} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald">{state.clinicName}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-ink">Join the queue</h1>
          <p className="mt-3 text-sm leading-6 text-slate-soft">Enter your mobile number to get your token and live queue updates.</p>
        </div>

        <Card className="p-5 ring-1 ring-white/70 sm:p-6">
          <label className="mb-2 block text-sm font-bold text-ink">Mobile number</label>
          <div className="relative mb-5">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" type="tel" inputMode="tel" autoComplete="tel" className="pl-9" />
          </div>

          {error && <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"><Info size={17} className="mt-0.5 shrink-0" />{error}</div>}

          <BtnPrimary onClick={join} disabled={loading || !phone.trim()} className="min-h-12 w-full">
            <Zap size={16} className="text-emerald-glow" />
            {loading ? "Getting token…" : "Get token"}
            <ArrowRight size={15} />
          </BtnPrimary>

          <p className="mt-4 text-center text-[11px] leading-5 text-slate-muted">Need a token for a family member? Scan again after 5 minutes while your first token is still active.</p>
        </Card>
      </section>
    </main>
  );
}

/* ─── Animated number — re-triggers pop on every value change ─ */
function AnimatedNumber({ value, className = "" }: { value: string | number; className?: string }) {
  return (
    <span key={String(value)} className={`inline-block [animation:var(--animate-num-pop)] ${className}`}>
      {value}
    </span>
  );
}

/* ─── Queue Status Card ─────────────────────────── */
const AVG_CONSULT_MINUTES = 5;

type QueueStatusInfo = {
  statusLabel: string;
  statusVariant: "green" | "blue" | "amber" | "slate" | "red";
  headline: string;
  subline: string;
  patientsAhead: number | null;
  patientsBehind: number | null;
  queuePosition: number | null;
  estimatedWait: number | null;
  currentServing: string;
};

function deriveQueueStatus(liveEntry: QueueEntry, state: QueueState): QueueStatusInfo {
  const orderedWaiting = [...state.entries]
    .filter(e => e.status === "waiting")
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.tokenNumber - b.tokenNumber);

  const current = currentToken(state);
  const currentServing = current ? tokenLabel(current.tokenNumber) : "—";

  if (liveEntry.status === "called") {
    return { statusLabel: "YOUR TURN", statusVariant: "green", headline: "Please proceed now", subline: "The doctor is ready for you", patientsAhead: 0, patientsBehind: orderedWaiting.length, queuePosition: 0, estimatedWait: 0, currentServing };
  }
  if (liveEntry.status === "skipped") {
    return { statusLabel: "SKIPPED", statusVariant: "amber", headline: "Your token was skipped", subline: "Please check with the clinic reception", patientsAhead: null, patientsBehind: null, queuePosition: null, estimatedWait: null, currentServing };
  }
  if (liveEntry.status === "completed") {
    return { statusLabel: "COMPLETED", statusVariant: "slate", headline: "Consultation complete", subline: "Thank you for visiting", patientsAhead: null, patientsBehind: null, queuePosition: null, estimatedWait: null, currentServing };
  }

  // status === "waiting"
  const myIndex = orderedWaiting.findIndex(e => e.id === liveEntry.id);
  const patientsAhead = myIndex === -1 ? 0 : myIndex;
  const patientsBehind = myIndex === -1 ? 0 : orderedWaiting.length - myIndex - 1;
  const queuePosition = patientsAhead + 1;
  const estimatedWait = patientsAhead * AVG_CONSULT_MINUTES;

  if (patientsAhead === 0) {
    return { statusLabel: "NEXT UP", statusVariant: "blue", headline: "You're next!", subline: "Get ready — the doctor will call you soon", patientsAhead, patientsBehind, queuePosition, estimatedWait, currentServing };
  }
  if (patientsAhead <= 3) {
    return { statusLabel: "ALMOST YOUR TURN", statusVariant: "blue", headline: `You're #${queuePosition} in the queue`, subline: "Please stay nearby — your turn is coming up", patientsAhead, patientsBehind, queuePosition, estimatedWait, currentServing };
  }
  return { statusLabel: "WAITING", statusVariant: "slate", headline: `You're #${queuePosition} in the queue`, subline: "Relax nearby — we'll update you on WhatsApp", patientsAhead, patientsBehind, queuePosition, estimatedWait, currentServing };
}

function QueueStatusCard({ liveEntry, state }: { liveEntry: QueueEntry; state: QueueState }) {
  const info = deriveQueueStatus(liveEntry, state);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [displayTime, setDisplayTime] = useState("just now");
  const prevAheadRef = useRef<number | null>(info.patientsAhead);

  // Detect when queue changes to update the timestamp
  useEffect(() => {
    if (prevAheadRef.current !== info.patientsAhead) {
      prevAheadRef.current = info.patientsAhead;
      setLastUpdated(new Date());
    }
  }, [info.patientsAhead, liveEntry.status]);

  // Update relative time display every 30s
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diff < 10) setDisplayTime("just now");
      else if (diff < 60) setDisplayTime(`${diff}s ago`);
      else setDisplayTime(`${Math.floor(diff / 60)}m ago`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const isCalled = liveEntry.status === "called";
  const isTerminal = liveEntry.status === "completed" || liveEntry.status === "skipped";

  return (
    <div className="animate-slide-up w-full">
      {/* Status badge */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <Badge variant={info.statusVariant} className="!px-3 !py-1.5 !text-[.72rem]">
          {isCalled ? <Bell size={11} className="animate-pulse-dot" /> : null}
          {info.statusLabel}
        </Badge>
      </div>

      {/* Main position headline */}
      <Card className="overflow-hidden ring-1 ring-white/70">
        {/* Hero section */}
        <div className={`px-6 py-7 text-center ${
          isCalled ? "bg-gradient-to-br from-emerald-xlight to-white" :
          isTerminal ? "bg-mist" : "bg-white"
        }`}>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-muted">Your token</p>
          <p className={`mt-0.5 text-6xl font-black tracking-[-.06em] ${
            isCalled ? "text-emerald" : "text-ink"
          }`}>
            <AnimatedNumber value={tokenLabel(liveEntry.tokenNumber)} />
          </p>
          <p className={`mt-2 text-sm font-semibold ${
            isCalled ? "text-emerald-text" : isTerminal ? "text-slate-soft" : "text-ink"
          }`}>{info.headline}</p>
          <p className="mt-1 text-xs text-slate-muted">{info.subline}</p>
        </div>

        {/* Now serving row */}
        <div className="flex items-center justify-between border-y border-border bg-mist/60 px-5 py-3.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-soft">
            <Clock size={13} /> Now serving
          </span>
          <span className="text-xl font-black tracking-tight text-ink">
            <AnimatedNumber value={info.currentServing} />
          </span>
        </div>

        {/* Stats grid — only when waiting or called */}
        {!isTerminal && (
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-muted">Ahead</p>
              <p className="mt-1 text-2xl font-black text-ink">
                {isCalled
                  ? <span className="text-emerald text-lg font-bold">—</span>
                  : <AnimatedNumber value={info.patientsAhead ?? 0} />}
              </p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-muted">Behind</p>
              <p className="mt-1 text-2xl font-black text-ink">
                <AnimatedNumber value={info.patientsBehind ?? 0} />
              </p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-muted">Est. wait</p>
              <p className="mt-1 text-2xl font-black text-ink">
                {isCalled
                  ? <span className="text-emerald text-lg font-bold">Now</span>
                  : info.estimatedWait === 0
                    ? <span className="text-[.95rem] font-bold text-slate-soft leading-none pt-1 block">Very soon</span>
                    : <AnimatedNumber value={`~${info.estimatedWait}m`} className="text-[1.3rem]" />}
              </p>
            </div>
          </div>
        )}

        {/* Live indicator footer */}
        <div className="flex items-center justify-center gap-2 bg-mist px-5 py-3.5 text-xs text-slate-soft">
          <LiveDot />
          <span>Queue updated <span className="font-semibold">{displayTime}</span></span>
        </div>
      </Card>
    </div>
  );
}

/* ─── Patient Token ─────────────────────────────── */
function PatientToken({ entry, state, onRequestAnother }: { entry: QueueEntry; state: QueueState; onRequestAnother: () => void }) {
  const liveEntry = state.entries.find(i => i.id === entry.id) ?? entry;
  const called = liveEntry.status === "called";
  const skipped = liveEntry.status === "skipped";
  const completed = liveEntry.status === "completed";

  return (
    <main className="patient-canvas mx-auto flex min-h-screen max-w-md items-start justify-center px-5 py-8 sm:px-6 animate-fade-in">
      <section className="w-full pt-4">
        {/* Clinic brand */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-ink to-ink-soft text-emerald-glow shadow-btn">
            <HeartPulse size={16} />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-ink">{state.clinicName}</span>
            <span className="block text-[10px] font-medium text-slate-muted">virtual waiting room</span>
          </span>
        </div>

        {/* Called alert banner */}
        {called && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-light bg-emerald-xlight px-4 py-3.5">
            <Bell size={18} className="shrink-0 text-emerald" />
            <p className="text-sm font-bold text-emerald-text">Token {tokenLabel(liveEntry.tokenNumber)} called — please proceed to the consultation room now.</p>
          </div>
        )}

        {/* Rich queue status */}
        <QueueStatusCard liveEntry={liveEntry} state={state} />

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-muted">
          We'll also alert you on WhatsApp as your turn approaches.
        </p>
        {!completed && !skipped && (
          <button
            onClick={onRequestAnother}
            className="mx-auto mt-4 block text-xs font-bold text-emerald underline-offset-4 hover:underline"
          >
            Get a token for a family member
          </button>
        )}
      </section>
    </main>
  );
}

function PatientMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="flex items-center justify-between px-5 py-5"><p className="text-sm font-semibold text-slate-soft">{label}</p><p className={`text-right font-black tracking-[-.035em] ${emphasis ? "text-3xl text-emerald" : "text-2xl text-ink"}`}>{value}</p></div>;
}

/* ─── Doctor Auth ───────────────────────────────── */
function DoctorAuth({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Safely parse a fetch Response as JSON, handling empty or non-JSON bodies. */
  const safeJson = async (res: Response): Promise<Record<string, unknown>> => {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return res.json() as Promise<Record<string, unknown>>;
    }
    const text = await res.text();
    if (import.meta.env.DEV) {
      console.warn(`[QueueCare] Non-JSON response from ${res.url} (${res.status}):`, text || "<empty body>");
    }
    if (!text) {
      throw new Error("The server is not reachable. Please ensure the API server is running and try again.");
    }
    throw new Error(text);
  };

  const requestCode = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data.error as string) || "Could not send OTP.");
      setChallengeId(data.challengeId as string);
      setMaskedPhone(data.maskedPhone as string);
      setDemoCode((data.demoCode as string) ?? "");
    } catch (err) {
      if (import.meta.env.DEV) console.error("[QueueCare] requestCode error:", err);
      setError(err instanceof Error ? err.message : "Could not send OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data.error as string) || "Could not verify OTP.");
      sessionStorage.setItem("queuecare-doctor-token", data.token as string);
      await queueStore.refreshServerConnection();
      onSuccess();
    } catch (err) {
      if (import.meta.env.DEV) console.error("[QueueCare] verifyCode error:", err);
      setError(err instanceof Error ? err.message : "Could not verify OTP. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-5 py-10 sm:px-6 sm:py-12 animate-fade-in">
      <div className="w-full overflow-hidden rounded-[1.6rem] border border-border bg-white shadow-card">
        <div className="grid lg:grid-cols-[.85fr_1.15fr]">

          {/* Left panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-ink to-ink-soft p-10 text-white lg:block">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald/20 blur-3xl" />
            <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald to-emerald-dark shadow-btn-emerald">
              <Stethoscope size={22} />
            </div>
            <p className="relative mt-10 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-glow">Doctor portal</p>
            <h2 className="relative mt-3 text-3xl font-black leading-tight tracking-[-.04em]">
              Your clinic queue,<br />under control.
            </h2>
            <p className="relative mt-4 text-sm leading-6 text-white/60">
              Sign in securely to call the next patient, recall a missed turn, and keep the waiting room moving.
            </p>
            <div className="relative mt-10 space-y-3 text-sm text-white/70">
              <span className="flex items-center gap-3"><ShieldCheck size={16} className="text-emerald-glow" /> OTP-protected access</span>
              <span className="flex items-center gap-3"><MessageCircle size={16} className="text-emerald-glow" /> Live patient updates</span>
              <span className="flex items-center gap-3"><Activity size={16} className="text-emerald-glow" /> One-tap queue control</span>
            </div>
          </div>

          {/* Right form */}
          <div className="bg-white p-7 sm:p-10">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold text-emerald">
              <ShieldCheck size={14} /> Secure doctor sign in
            </div>

            {!challengeId ? (
              <>
                <h2 className="text-3xl font-black tracking-[-.04em] text-ink">Welcome back</h2>
                <p className="mb-7 mt-2 text-sm leading-6 text-slate-soft">
                  Enter the registered doctor mobile number to receive a one-time password.
                </p>
                <label className="mb-1 block text-sm font-bold text-ink">Mobile number</label>
                <div className="relative mb-6">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    className="pl-9"
                  />
                </div>
                <BtnPrimary onClick={requestCode} disabled={loading || !phone.trim()} className="w-full">
                  {loading ? "Sending…" : "Continue"} <ArrowRight size={15} />
                </BtnPrimary>
              </>
            ) : (
              <>
                <button
                  onClick={() => setChallengeId("")}
                  className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-muted transition hover:text-ink"
                >
                  <ArrowLeft size={13} /> Change number
                </button>
                <h2 className="text-3xl font-black tracking-[-.04em] text-ink">Verify your number</h2>
                <p className="mb-7 mt-2 text-sm leading-6 text-slate-soft">
                  We sent a 6-digit OTP to <strong className="text-ink">{maskedPhone}</strong>.
                </p>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  className="mb-4 text-center text-2xl font-black tracking-[.5em]"
                />
                {demoCode && (
                  <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
                    <Info size={13} className="mr-1 inline" /> Local demo OTP:{" "}
                    <strong className="tracking-widest">{demoCode}</strong>
                  </div>
                )}
                <BtnPrimary onClick={verifyCode} disabled={loading || code.length !== 6} className="mb-4 w-full">
                  {loading ? "Verifying…" : "Verify & open dashboard"} <ArrowRight size={15} />
                </BtnPrimary>
                <button
                  onClick={requestCode}
                  className="w-full text-center text-xs font-bold text-slate-muted transition hover:text-ink"
                >
                  Resend code
                </button>
              </>
            )}

            {error && (
              <div role="alert" className="mt-5 flex gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <Info size={17} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-5 text-slate-muted">
              Only the clinic doctor should access queue controls.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Stat card ─────────────────────────────────── */
function StatCard({ label, value, icon, tone }: {
  label: string; value: string; icon: ReactNode;
  tone: "green" | "blue" | "amber" | "slate";
}) {
  const toneClasses = {
    green: { wrap: "bg-emerald-xlight text-emerald" },
    blue:  { wrap: "bg-blue-50 text-blue-500" },
    amber: { wrap: "bg-amber-50 text-amber-500" },
    slate: { wrap: "bg-slate-100 text-slate-soft" },
  };
  return (
    <Card className="p-5">
      <div className={`mb-4 grid h-9 w-9 place-items-center rounded-xl ${toneClasses[tone].wrap}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-slate-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{value}</p>
    </Card>
  );
}

/* ─── Doctor Dashboard ──────────────────────────── */
function DoctorDashboard({ state, navigate: _navigate, onLogout }: {
  state: QueueState; navigate: (route: string) => void; onLogout: () => void;
}) {
  const [qr, setQr] = useState("");
  const [doctorQr, setDoctorQr] = useState("");
  const [toast, setToast] = useState("");
  const waiting = state.entries.filter(e => e.status === "waiting");
  const skipped = state.entries.filter(e => e.status === "skipped");
  const called  = currentToken(state);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const joinUrl   = `${baseUrl}/?join=clinic-demo`;
  const doctorUrl = `${baseUrl}/?doctor=1`;

  useEffect(() => {
    fetch("/api/config").then(r => r.ok ? r.json() : null).then(cfg => {
      if (cfg?.publicUrl) setBaseUrl(cfg.publicUrl);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(joinUrl,   { width: 320, margin: 2, color: { dark: "#0d1f35", light: "#ffffff" } }).then(setQr);
    QRCode.toDataURL(doctorUrl, { width: 320, margin: 2, color: { dark: "#0d1f35", light: "#ffffff" } }).then(setDoctorQr);
  }, [joinUrl, doctorUrl]);

  const notify = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 3000); };
  const safe = async (action: () => Promise<void> | void, msg: string) => {
    try { await action(); notify(msg); }
    catch (e) { notify(e instanceof Error ? e.message : "Something went wrong"); }
  };

  const callCurrent = () => {
    if (!called) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Token ${tokenLabel(called.tokenNumber)}, please proceed to the doctor.`
      );
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    void safe(() => queueStore.call(), `Token ${tokenLabel(called.tokenNumber)} announced`);
  };

  const copyPatient = () => { navigator.clipboard?.writeText(joinUrl);   notify("Patient join link copied"); };
  const copyDoctor  = () => { navigator.clipboard?.writeText(doctorUrl); notify("Doctor link copied"); };

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9 animate-fade-in">
      {/* Top bar */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald">
            <LiveDot /> SESSION LIVE · 6:00 PM
          </div>
          <h1 className="text-3xl font-black tracking-[-.04em] text-ink sm:text-4xl">Good evening, Doctor.</h1>
          <p className="mt-1.5 text-sm text-slate-soft">
            Your queue is in your hands. {waiting.length} patients are waiting.
          </p>
        </div>
        <BtnGhost onClick={onLogout} className="!px-4 !py-2 !text-xs">Sign out</BtnGhost>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Current token hero */}
          <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-ink via-ink to-ink-soft p-6 text-white shadow-card sm:p-8">
            <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-emerald/15 blur-3xl" />
            <div className="mb-6 flex items-start justify-between">
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-glow">Currently serving</p>
                <div className="mt-3 flex items-end gap-4">
                  <span className="text-8xl font-black leading-none tracking-tight">{called ? tokenLabel(called.tokenNumber) : "—"}</span>
                </div>
              </div>
              <div className="relative rounded-xl bg-ink-soft p-2.5 text-emerald-glow">
                <Activity size={20} />
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DashMetric label="Waiting"      value={String(waiting.length)} />
              <DashMetric label="Skipped"      value={String(skipped.length)} />
              <DashMetric label="Called today" value={String(state.entries.filter(e => e.status === "completed" || e.status === "called").length)} />
              <DashMetric label="Status"       value={state.acceptingTokens ? "Open" : "Stopped"} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ActionBtn
              icon={<Send size={20} />}
              label="Call current"
              badge="Speaker"
              accent="blue"
              onClick={callCurrent}
              disabled={!called}
            />
            <ActionBtn
              icon={<ChevronRight size={22} />}
              label="Next patient"
              badge="Main"
              accent="emerald"
              primary
              onClick={() => safe(() => queueStore.next(), waiting[0] ? `Token ${tokenLabel(waiting[0].tokenNumber)} called` : "Next patient called")}
            />
            <ActionBtn
              icon={<SkipForward size={20} />}
              label="Skip current"
              badge="Skip"
              accent="amber"
              onClick={() => safe(() => queueStore.skip(), "Current token skipped")}
              disabled={!called}
            />
            <ActionBtn
              icon={<RefreshCw size={20} />}
              label="Recall skipped"
              badge="Recall"
              accent="purple"
              onClick={() => { const first = skipped[0]; if (first) void safe(() => queueStore.recall(first.id), "Token recalled"); }}
              disabled={skipped.length === 0}
            />
          </div>

          <QueueTable state={state} onRecall={id => safe(() => queueStore.recall(id), "Token recalled to priority line")} />
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5">

          {/* ── Patient QR card ── */}
          <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
            {/* Header strip */}
            <div className="flex items-center justify-between bg-emerald-xlight px-5 py-3.5 border-b border-emerald-light">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald text-white">
                  <Users size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-text">Patient QR</p>
                  <p className="text-xs font-bold text-emerald-dark">Put this on the wall</p>
                </div>
              </div>
              <QrCode size={18} className="text-emerald" />
            </div>

            <div className="p-5">
              {/* QR image */}
              <div className="mx-auto w-fit rounded-xl border border-border p-3">
                {qr
                  ? <img src={qr} alt="Patient join QR code" className="h-40 w-40" />
                  : <div className="grid h-40 w-40 place-items-center bg-mist">
                      <RefreshCw className="animate-spin text-slate-faint" />
                    </div>
                }
              </div>

              {/* URL strip */}
              <div className="mt-3.5 rounded-lg bg-emerald-xlight px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-text">
                  <Check size={11} /> Patient join link
                </p>
                <p className="mt-0.5 break-all text-[10px] leading-4 text-emerald-dark/70">{joinUrl}</p>
              </div>

              <p className="mt-2.5 text-center text-[11px] leading-4 text-slate-muted">
                Patients scan this to join the queue. Works every day.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <BtnGhost onClick={copyPatient} className="!px-3 !py-2 !text-xs">
                  <Copy size={13} /> Copy link
                </BtnGhost>
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-ink px-3 py-2 text-xs font-bold text-white transition-all hover:bg-ink-soft active:scale-[.98]"
                >
                  <ArrowRight size={13} /> Test join
                </a>
              </div>
            </div>
          </Card>

          {/* ── Doctor QR card ── */}
          <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
            {/* Header strip */}
            <div className="flex items-center justify-between bg-ink px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald text-white">
                  <Stethoscope size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-glow">Doctor QR</p>
                  <p className="text-xs font-bold text-white">Private · for doctor only</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-ink-soft px-2 py-0.5 text-[10px] font-bold text-emerald-glow">
                <ShieldCheck size={10} /> Secure
              </span>
            </div>

            <div className="p-5">
              {/* QR image */}
              <div className="mx-auto w-fit rounded-xl border border-border p-3">
                {doctorQr
                  ? <img src={doctorQr} alt="Doctor dashboard QR code" className="h-40 w-40" />
                  : <div className="grid h-40 w-40 place-items-center bg-mist">
                      <RefreshCw className="animate-spin text-slate-faint" />
                    </div>
                }
              </div>

              {/* URL strip */}
              <div className="mt-3.5 rounded-lg bg-amber-50 px-3 py-2.5 border border-amber-100">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800">
                  <ShieldCheck size={11} /> Only share with the doctor
                </p>
                <p className="mt-0.5 break-all text-[10px] leading-4 text-amber-700/70">{doctorUrl}</p>
              </div>

              <p className="mt-2.5 text-center text-[11px] leading-4 text-slate-muted">
                Scanning this opens secure doctor sign-in. An active doctor session opens the dashboard.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <BtnGhost onClick={copyDoctor} className="!px-3 !py-2 !text-xs">
                  <Copy size={13} /> Copy link
                </BtnGhost>
                <a
                  href={doctorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-dark bg-emerald px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-dark active:scale-[.98]"
                >
                  <ArrowRight size={13} /> Open panel
                </a>
              </div>
            </div>
          </Card>

          {/* Session controls */}
          <Card className="p-6 transition-shadow duration-200 hover:shadow-card-hover">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">Session controls</p>
                <p className="mt-1.5 font-black text-ink">
                  {state.acceptingTokens ? "Accepting new tokens" : "No new tokens"}
                </p>
              </div>
              <Badge variant={state.acceptingTokens ? "green" : "amber"}>
                {state.status.toUpperCase()}
              </Badge>
            </div>
            <BtnDanger
              onClick={() => safe(() => queueStore.endSession(), "Session ended")}
              disabled={state.status !== "open"}
              className="mb-3 w-full"
            >
              <X size={15} /> End session
            </BtnDanger>
            <BtnSubtle
              onClick={() => { queueStore.resetDemo(); notify("Demo queue reset"); }}
              className="w-full"
            >
              <RefreshCw size={13} /> Reset demo queue
            </BtnSubtle>
          </Card>

          <ActivityFeed state={state} />
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl animate-slide-up">
          <Check size={15} className="text-emerald-glow" /> {toast}
        </div>
      )}
    </main>
  );
}

/* ─── Action button (dashboard) ─────────────────── */
function ActionBtn({
  icon, label, badge, accent, primary, onClick, disabled,
}: {
  icon: ReactNode; label: string; badge: string;
  accent: "blue" | "emerald" | "amber" | "purple";
  primary?: boolean; onClick: () => void; disabled?: boolean;
}) {
  const accentMap = {
    blue:    { iconWrap: "bg-blue-100 text-blue-600",    badge: "bg-blue-100 text-blue-700" },
    emerald: { iconWrap: "bg-emerald-dark text-white",    badge: "bg-emerald-dark text-white" },
    amber:   { iconWrap: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700" },
    purple:  { iconWrap: "bg-violet-100 text-violet-600", badge: "bg-violet-100 text-violet-700" },
  };
  const { iconWrap, badge: badgeCls } = accentMap[accent];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex min-h-32 flex-col items-start justify-between gap-6 rounded-[1.25rem] p-4 text-left w-full",
        "transition-all duration-200 active:scale-[.985] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none",
        primary
          ? "bg-gradient-to-br from-emerald to-emerald-dark border border-emerald-dark text-white shadow-btn-emerald hover:-translate-y-0.5 hover:shadow-btn-emerald-lg"
          : "bg-white border border-border text-ink shadow-sm hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-card",
      ].join(" ")}
    >
      {/* Top row: icon chip + badge */}
      <span className="flex w-full items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconWrap}`}>
          {icon}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${primary ? "bg-emerald-dark text-white" : badgeCls}`}>
          {badge}
        </span>
      </span>
      {/* Label */}
      <span className={`text-sm font-bold leading-tight ${primary ? "text-white" : "text-ink"}`}>{label}</span>
    </button>
  );
}

/* ─── Dashboard metric (inside dark hero) ───────── */
function DashMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-soft p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

/* ─── Queue table ───────────────────────────────── */
function QueueTable({ state, onRecall }: { state: QueueState; onRecall: (id: string) => void }) {
  const entries = [...state.entries]
    .filter(e => ["waiting", "skipped"].includes(e.status))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.tokenNumber - b.tokenNumber);

  return (
    <Card className="p-6 transition-shadow duration-200 hover:shadow-card-hover">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">Up next</p>
          <h2 className="mt-1.5 text-xl font-black text-ink">Live patient queue</h2>
        </div>
        <Badge variant="slate">{entries.length} active</Badge>
      </div>

      <div className="divide-y divide-slate-100">
        {entries.length === 0
          ? <div className="py-12 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-emerald-xlight text-emerald"><Users size={19} /></div><p className="text-sm font-bold text-ink">Queue is clear</p><p className="mt-1 text-xs text-slate-muted">New patient tokens will appear here live.</p></div>
          : entries.slice(0, 8).map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-xl px-2 py-4 transition-colors duration-150 hover:bg-mist">
              <div className={[
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black",
                entry.status === "skipped"
                  ? "bg-amber-50 text-amber-600"
                  : idx === 0
                    ? "bg-emerald-light text-emerald-text"
                    : "bg-slate-100 text-slate-600",
              ].join(" ")}>
                {tokenLabel(entry.tokenNumber)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">Token {tokenLabel(entry.tokenNumber)}</p>
                <p className="mt-0.5 text-xs text-slate-muted">
                  {entry.status === "skipped" ? "Skipped · ready to recall" : `${idx} ahead`}
                </p>
              </div>
              {entry.status === "skipped"
                ? <BtnGhost onClick={() => onRecall(entry.id)} className="!px-3 !py-1.5 !text-xs">Recall</BtnGhost>
                : <span className="text-xs font-semibold text-slate-faint">···{entry.phone?.slice(-4) ?? "—"}</span>
              }
            </div>
          ))
        }
      </div>
    </Card>
  );
}

/* ─── Activity feed ─────────────────────────────── */
function ActivityFeed({ state }: { state: QueueState }) {
  const dotCls = (tone: string) => ({
    green: "bg-emerald",
    amber: "bg-amber-400",
    blue:  "bg-blue-400",
    slate: "bg-slate-300",
  })[tone] ?? "bg-slate-300";

  return (
    <Card className="p-6 transition-shadow duration-200 hover:shadow-card-hover">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">Activity</p>
          <h2 className="mt-1.5 font-black text-ink">Recent updates</h2>
        </div>
        <History size={17} className="text-slate-faint" />
      </div>
      <div className="space-y-4">
        {state.activity.slice(0, 5).map(item => (
          <div key={item.id} className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotCls(item.tone)}`} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-600">{item.label}</p>
              <p className="truncate text-[11px] text-slate-muted">
                {item.detail} · {formatRelativeTime(item.time)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default App;
