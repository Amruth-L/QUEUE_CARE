import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  HeartPulse,
  History,
  House,
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
import { aheadFor, currentToken, formatRelativeTime, queueStore } from "./store";

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
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-btn transition-all duration-150
        hover:bg-ink-soft hover:-translate-y-px hover:shadow-btn-lg
        active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald px-5 py-3 text-sm font-bold text-white shadow-btn-emerald border border-emerald-dark transition-all duration-150
        hover:bg-emerald-dark hover:-translate-y-px hover:shadow-btn-emerald-lg
        active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm transition-all duration-150
        hover:bg-mist hover:border-slate-300 hover:-translate-y-px hover:shadow
        active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition-all duration-150
        hover:bg-red-100 hover:border-red-300 hover:text-red-700 hover:-translate-y-px hover:shadow-sm
        active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 transition-all duration-150
        hover:bg-slate-200 hover:text-slate-800 hover:-translate-y-px
        active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Card wrapper */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

/** Input field */
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-mist px-4 py-3 text-sm font-sans text-ink outline-none placeholder:text-slate-muted
        transition-all duration-150 focus:border-emerald focus:bg-white focus:ring-2 focus:ring-emerald/10
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
    <div className="min-h-screen bg-mist text-ink font-sans">
      <Header route={route} navigate={navigate} />
      <div className="animate-fade-in">
        {route === "home" && <Home navigate={navigate} state={state} />}
        {route === "patient" && <PatientJoin state={state} navigate={navigate} />}
        {route === "doctor" && (
          doctorAuthenticated
            ? <DoctorDashboard
                state={state}
                navigate={navigate}
                onLogout={() => {
                  sessionStorage.removeItem("queuecare-doctor-token");
                  setDoctorAuthenticated(false);
                }}
              />
            : <DoctorAuth onSuccess={() => setDoctorAuthenticated(true)} />
        )}
      </div>
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs font-medium text-slate-muted">
          <span>QueueCare · receptionist-free waiting</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald" /> Private queue session
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Header ────────────────────────────────────── */
function Header({ route, navigate }: { route: string; navigate: (route: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => navigate("home")} className="flex items-center gap-3 transition hover:opacity-80">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-emerald-glow">
            <HeartPulse size={18} />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-ink">QueueCare</span>
            <span className="block text-[11px] text-slate-muted">virtual waiting room</span>
          </span>
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <LiveDot />
          <span className="text-xs font-semibold text-slate-soft">Live queue</span>
        </div>

        <BtnGhost
          onClick={() => navigate(route === "doctor" ? "home" : "doctor")}
          className="!px-4 !py-2 !text-xs"
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
      <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-2 lg:items-center lg:pt-24">
        <div>
          <Badge variant="green" className="mb-6">
            <Sparkles size={12} /> Less waiting. More care.
          </Badge>
          <h1 className="max-w-xl text-5xl font-black leading-[1.06] tracking-tight text-ink sm:text-6xl">
            Your place in line,{" "}
            <span className="text-emerald">without the line.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-soft">
            Scan the clinic QR, get your token, and wait comfortably nearby.
            We'll keep you updated on WhatsApp as your turn gets closer.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
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
      <section className="border-y border-border bg-white">
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
    <div className="animate-slide-up mx-auto w-full max-w-md">
      <div className="rounded-2xl bg-ink p-6 text-white sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald">Aster Lane Clinic</p>
            <p className="mt-1 text-sm text-white/50">Evening queue · open now</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-[.65rem] font-bold text-emerald-glow">
            ● LIVE
          </span>
        </div>

        <div className="py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-white/35">Now serving</p>
          <p className="mt-2 text-8xl font-black tracking-tight">{currentToken(state)?.tokenNumber ?? "—"}</p>
          <p className="mt-3 text-sm text-white/45">{waiting} people waiting</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[.06] p-4">
            <p className="text-[11px] font-semibold text-white/35">Next update</p>
            <p className="mt-1 text-sm font-bold">WhatsApp</p>
          </div>
          <div className="rounded-xl bg-emerald/12 p-4">
            <p className="text-[11px] font-semibold text-emerald-glow/60">Session</p>
            <p className="mt-1 text-sm font-bold text-emerald-glow">Until doctor ends</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Card className="p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-xlight text-emerald">
        {icon}
      </div>
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-soft">{text}</p>
    </Card>
  );
}

/* ─── Patient Join ──────────────────────────────── */
function PatientJoin({ state, navigate }: { state: QueueState; navigate: (route: string) => void }) {
  const [assisted, setAssisted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [optedIn, setOptedIn] = useState(true);
  const [joined, setJoined] = useState<QueueEntry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setError(""); setLoading(true);
    try { setJoined(await queueStore.join({ patientName: name, phone, assisted })); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not join the queue."); }
    finally { setLoading(false); }
  };

  if (joined) return <PatientToken entry={joined} state={state} navigate={navigate} />;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">

        {/* Left info */}
        <div className="pt-2">
          <button
            onClick={() => navigate("home")}
            className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-muted transition hover:text-ink"
          >
            <ArrowLeft size={15} /> Back to home
          </button>
          <Badge variant="green" className="mb-5">
            <MapPin size={12} /> Aster Lane Clinic · Session open
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Join the queue<br /><span className="text-emerald">from here.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-soft">
            You're joining through the clinic QR. Your place is based on the real-time order you enter.
          </p>
          <div className="mt-8 space-y-3">
            <Step n="01" text="Be within 10–100 meters of the clinic" />
            <Step n="02" text="Enter the patient details below" />
            <Step n="03" text="Keep WhatsApp open for updates" />
          </div>
        </div>

        {/* Form card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">New queue entry</p>
              <h2 className="mt-2 text-xl font-black text-ink">Who are you registering?</h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-xlight text-emerald">
              <Users size={19} />
            </div>
          </div>

          {/* Toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
            <button
              onClick={() => setAssisted(false)}
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                !assisted ? "bg-white text-ink shadow-sm" : "text-slate-muted hover:text-ink"
              }`}
            >
              Myself
            </button>
            <button
              onClick={() => setAssisted(true)}
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                assisted ? "bg-white text-ink shadow-sm" : "text-slate-muted hover:text-ink"
              }`}
            >
              Someone else
            </button>
          </div>

          {assisted && (
            <div className="mb-5 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm leading-5 text-blue-800">
              <Info size={17} className="mt-0.5 shrink-0" />
              <span>Registering an elder? Use your own phone. WhatsApp updates will come to you.</span>
            </div>
          )}

          <label className="mb-1 block text-sm font-bold text-ink">Patient name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={assisted ? "Enter elder's name" : "Enter your name"}
            className="mb-5"
          />

          <label className="mb-1 block text-sm font-bold text-ink">WhatsApp number</label>
          <div className="relative mb-5">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
              className="pl-9"
            />
          </div>

          <label className="mb-6 flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-slate-soft">
            <input
              checked={optedIn}
              onChange={e => setOptedIn(e.target.checked)}
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald"
            />
            I agree to receive queue updates on WhatsApp for this clinic session.
          </label>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <BtnPrimary onClick={join} disabled={!optedIn || loading} className="w-full">
            <Zap size={16} className="text-emerald-glow" />
            {loading ? "Joining…" : "Get my token"}
            <ArrowRight size={15} />
          </BtnPrimary>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-muted">
            <ShieldCheck size={12} className="text-emerald" /> Your token is only valid for today's session
          </p>
        </Card>
      </div>
    </main>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-black text-emerald shadow-sm">
        {n}
      </span>
      <span className="text-sm text-slate-soft">{text}</span>
    </div>
  );
}

/* ─── Patient Token ─────────────────────────────── */
function PatientToken({ entry, state, navigate }: { entry: QueueEntry; state: QueueState; navigate: (route: string) => void }) {
  const liveEntry = state.entries.find(i => i.id === entry.id) ?? entry;
  const ahead = aheadFor(liveEntry, state);
  const called = liveEntry.status === "called";
  const skipped = liveEntry.status === "skipped";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16 animate-fade-in">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-xlight text-emerald">
          <Check size={26} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald">
          {called ? "Your turn is ready" : skipped ? "Token skipped" : "You're in the queue"}
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-ink sm:text-7xl">
          Token <span className="text-emerald">{liveEntry.tokenNumber}</span>
        </h1>
        <p className="mt-3 text-sm text-slate-soft">{liveEntry.patientName} · Aster Lane Clinic</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="People ahead" value={called ? "Now" : skipped ? "Skipped" : String(ahead ?? 0)} icon={<Users size={18} />} tone="green" />
        <StatCard label="Current token" value={String(currentToken(state)?.tokenNumber ?? "—")} icon={<Activity size={18} />} tone="slate" />
        <StatCard label="Updates" value="WhatsApp" icon={<MessageCircle size={18} />} tone="amber" />
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-black text-ink">Live queue status</h2>
            <p className="mt-1 text-sm text-slate-muted">Updates automatically in real time.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald">
            <LiveDot /> Live
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-emerald transition-[width] duration-700"
            style={{
              width: called
                ? "100%"
                : `${Math.max(8, 100 - ((ahead ?? 0) / Math.max(1, state.entries.length)) * 100)}%`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-muted">
          <span>Joined</span>
          <span>{called ? "Called!" : ahead === 1 ? "You're next" : `${ahead ?? 0} ahead`}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="green"><MessageCircle size={12} /> WhatsApp alerts active</Badge>
          <Badge variant="slate"><Clock3 size={12} /> Session open</Badge>
        </div>
      </Card>

      <div className="mt-6 text-center">
        <BtnGhost onClick={() => navigate("home")} className="!px-4 !py-2 !text-xs">
          <House size={15} /> Return home
        </BtnGhost>
      </div>
    </main>
  );
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

  const requestCode = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallengeId(data.challengeId);
      setMaskedPhone(data.maskedPhone);
      setDemoCode(data.demoCode ?? "");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send OTP."); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem("queuecare-doctor-token", data.token);
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify OTP."); }
    finally { setLoading(false); }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-4xl items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full overflow-hidden rounded-2xl border border-border shadow-card">
        <div className="grid lg:grid-cols-[.85fr_1.15fr]">

          {/* Left panel */}
          <div className="hidden bg-ink p-10 text-white lg:block">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald">
              <Stethoscope size={22} />
            </div>
            <p className="mt-10 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-glow">Doctor portal</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight">
              Your clinic queue,<br />under control.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Sign in securely to call the next patient, recall a missed turn, and keep the waiting room moving.
            </p>
            <div className="mt-10 space-y-3 text-sm text-white/60">
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
                <h2 className="text-2xl font-black tracking-tight text-ink">Welcome back</h2>
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
                <BtnPrimary onClick={requestCode} disabled={loading} className="w-full">
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
                <h2 className="text-2xl font-black tracking-tight text-ink">Verify your number</h2>
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
                  <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
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
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
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
  const [toast, setToast] = useState("");
  const waiting = state.entries.filter(e => e.status === "waiting");
  const skipped = state.entries.filter(e => e.status === "skipped");
  const called  = currentToken(state);
  const [joinUrl, setJoinUrl] = useState(`${window.location.origin}/?join=clinic-demo`);

  useEffect(() => {
    fetch("/api/config").then(r => r.ok ? r.json() : null).then(cfg => {
      if (cfg?.publicUrl) setJoinUrl(`${cfg.publicUrl}/?join=clinic-demo`);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { width: 360, margin: 2, color: { dark: "#0d1f35", light: "#ffffff" } }).then(setQr);
  }, [joinUrl]);

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
        `Token number ${called.tokenNumber}, ${called.patientName}, please proceed to the doctor.`
      );
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    void safe(() => queueStore.call(), `Token ${called.tokenNumber} announced`);
  };

  const copy = () => { navigator.clipboard?.writeText(joinUrl); notify("Patient join link copied"); };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      {/* Top bar */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald">
            <LiveDot /> SESSION LIVE · 6:00 PM
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Good evening, Doctor.</h1>
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
          <div className="rounded-2xl bg-ink p-6 text-white sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-glow">Currently serving</p>
                <div className="mt-3 flex items-end gap-4">
                  <span className="text-8xl font-black leading-none tracking-tight">{called?.tokenNumber ?? "—"}</span>
                  {called && <span className="mb-2 text-sm text-white/55">{called.patientName}</span>}
                </div>
              </div>
              <div className="rounded-xl bg-white/[.08] p-2.5 text-emerald-glow">
                <Activity size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              onClick={() => safe(() => queueStore.next(), called ? `Token ${waiting[0]?.tokenNumber ?? "—"} called` : "Next patient called")}
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
          {/* QR card */}
          <Card className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">Permanent clinic QR</p>
                <h2 className="mt-1.5 text-lg font-black text-ink">Put this on the wall</h2>
              </div>
              <QrCode size={22} className="text-emerald" />
            </div>
            <div className="mx-auto w-fit rounded-xl border border-border p-3">
              {qr
                ? <img src={qr} alt="Clinic join QR code" className="h-44 w-44" />
                : <div className="grid h-44 w-44 place-items-center bg-mist">
                    <RefreshCw className="animate-spin text-slate-faint" />
                  </div>
              }
            </div>
            <div className="mt-4 rounded-xl bg-emerald-xlight p-3.5">
              <p className="flex items-center gap-2 text-xs font-black text-emerald-text">
                <Check size={13} /> QR is ready for scanning
              </p>
              <p className="mt-1 break-all text-[11px] leading-4 text-emerald-dark/75">{joinUrl}</p>
            </div>
            <p className="mt-3 text-center text-xs leading-5 text-slate-muted">
              Patients scan this same QR every day. It accepts tokens only while the session is open.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <BtnGhost onClick={copy} className="!px-3 !py-2 !text-xs">
                <Copy size={14} /> Copy link
              </BtnGhost>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/20 bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-ink-soft"
              >
                <ArrowRight size={14} /> Test join
              </a>
            </div>
          </Card>

          {/* Session controls */}
          <Card className="p-6">
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl">
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
    blue:    { icon: "text-blue-500",   badge: "bg-blue-100 text-blue-700" },
    emerald: { icon: "text-emerald",     badge: "bg-emerald/20 text-white" },
    amber:   { icon: "text-amber-500",  badge: "bg-amber-100 text-amber-700" },
    purple:  { icon: "text-violet-500", badge: "bg-violet-100 text-violet-700" },
  };
  const { icon: iconCls, badge: badgeCls } = accentMap[accent];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex min-h-28 flex-col items-start justify-between rounded-2xl p-4 text-left font-black",
        "transition-all duration-150 active:scale-[.97]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "bg-emerald border border-emerald-dark text-white shadow-btn-emerald hover:bg-emerald-dark hover:-translate-y-px hover:shadow-btn-emerald-lg"
          : "bg-white border border-border text-ink shadow-sm hover:bg-mist hover:-translate-y-px hover:shadow",
      ].join(" ")}
    >
      <span className="flex w-full items-center justify-between">
        <span className={primary ? "text-white" : iconCls}>{icon}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${primary ? "bg-white/20 text-white" : badgeCls}`}>
          {badge}
        </span>
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

/* ─── Dashboard metric (inside dark hero) ───────── */
function DashMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[.07] p-3">
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
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-muted">Up next</p>
          <h2 className="mt-1.5 text-xl font-black text-ink">Live patient queue</h2>
        </div>
        <Badge variant="slate">{entries.length} active</Badge>
      </div>

      <div className="divide-y divide-slate-100">
        {entries.length === 0
          ? <div className="py-10 text-center text-sm text-slate-muted">No patients waiting right now.</div>
          : entries.slice(0, 8).map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 py-4">
              <div className={[
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black",
                entry.status === "skipped"
                  ? "bg-amber-50 text-amber-600"
                  : idx === 0
                    ? "bg-emerald-light text-emerald-text"
                    : "bg-slate-100 text-slate-600",
              ].join(" ")}>
                {entry.tokenNumber}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{entry.patientName}</p>
                <p className="mt-0.5 text-xs text-slate-muted">
                  {entry.status === "skipped" ? "Skipped · ready to recall" : `${idx} ahead`}
                </p>
              </div>
              {entry.status === "skipped"
                ? <BtnGhost onClick={() => onRecall(entry.id)} className="!px-3 !py-1.5 !text-xs">Recall</BtnGhost>
                : <span className="text-xs font-semibold text-slate-faint">···{entry.phone.slice(-4)}</span>
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
    <Card className="p-6">
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
