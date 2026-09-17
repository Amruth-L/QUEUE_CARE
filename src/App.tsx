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

/* ─── QueueCare Brand Logo Component ───────────────── */
function QueueCareLogo({
  size = "md",
  showSubtitle = true,
  light = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  light?: boolean;
}) {
  const iconSizes = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
    xl: "h-16 w-16 rounded-3xl",
  };
  const svgSizes = {
    sm: 16,
    md: 20,
    lg: 26,
    xl: 34,
  };
  const titleSizes = {
    sm: "text-xs",
    md: "text-[14px]",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <div className="flex items-center gap-3">
      {/* Red medical shield mark */}
      <div
        className={`relative grid place-items-center bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-md shadow-red-500/25 ring-1 ring-white/20 transition-transform duration-200 hover:scale-105 shrink-0 ${iconSizes[size]}`}
      >
        <svg
          width={svgSizes[size]}
          height={svgSizes[size]}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white drop-shadow-xs"
        >
          {/* Medical Cross in Crisp White */}
          <path
            d="M9 3.5C9 2.67 9.67 2 10.5 2H13.5C14.33 2 15 2.67 15 3.5V8.5H20.5C21.33 8.5 22 9.17 22 10V14C22 14.83 21.33 15.5 20.5 15.5H15V20.5C15 21.33 14.33 22 13.5 22H10.5C9.67 22 9 21.33 9 20.5V15.5H3.5C2.67 15.5 2 14.83 2 14V10C2 9.17 2.67 8.5 3.5 8.5H9V3.5Z"
            fill="currentColor"
            opacity="0.96"
          />
          {/* Center EKG pulse line */}
          <path
            d="M3.5 12H7.5L9.5 7.5L13 16.5L15 10.5L16.5 12H20.5"
            stroke="#b91c1c"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <span className={`block font-black tracking-tight ${titleSizes[size]} ${light ? "text-white" : "text-ink"}`}>
          Queue<span className="text-red-600">Care</span>
        </span>
        {showSubtitle && (
          <span className={`block text-[9.5px] font-bold tracking-wider uppercase ${light ? "text-red-200" : "text-slate-muted"}`}>
            Virtual Waiting Room
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Shared primitive components ───────────────── */

/** Primary CTA button — vibrant medical red gradient */
function BtnPrimary({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 px-6 py-4 text-sm font-bold tracking-wide text-white shadow-btn-red transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-btn-red-lg active:translate-y-0 active:scale-[.975]
        focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Accent button — matches primary medical red */
function BtnAccent({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 px-6 py-4 text-sm font-bold tracking-wide text-white shadow-btn-red transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-btn-red-lg active:translate-y-0 active:scale-[.975]
        focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Dark / secondary solid button */
function BtnDark({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-ink-soft to-ink-xsoft px-6 py-4 text-sm font-bold tracking-wide text-white shadow-btn transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-btn-lg active:translate-y-0 active:scale-[.975]
        focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Ghost / secondary button */
function BtnGhost({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 text-sm font-semibold text-ink shadow-xs backdrop-blur-sm transition-all duration-200
        hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/40 hover:text-red-700 hover:shadow-md
        active:translate-y-0 active:scale-[.975] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Danger button */
function BtnDanger({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-bold text-red-600 transition-all duration-200
        hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-md
        active:translate-y-0 active:scale-[.975] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Subtle utility button */
function BtnSubtle({
  onClick, disabled, children, className = "",
}: { onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500 transition-all duration-150
        hover:bg-slate-200 hover:text-slate-800
        active:scale-[.975] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}`}
    >
      {children}
    </button>
  );
}

/** Card wrapper */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.6rem] border border-border/70 bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

/** Input field */
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-sans text-ink outline-none placeholder:text-slate-muted/80
        transition-all duration-200 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15
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
    green: "bg-red-50 text-red-700 border border-red-200/80",
    blue:  "bg-blue-50 text-blue-700 border border-blue-100",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    red:   "bg-red-50 text-red-700 border border-red-200/80",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[.68rem] font-bold tracking-widest uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Animated live dot — vibrant red */
function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
    </span>
  );
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
      // If the user navigated back while on the patient token view,
      // clear the stored entry so the join form shows again.
      if (current.has("join") && sessionStorage.getItem("queuecare-patient-entry-back")) {
        sessionStorage.removeItem("queuecare-patient-entry");
        sessionStorage.removeItem("queuecare-patient-entry-back");
      }
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
        {route === "patient" && <PatientJoin state={state} navigate={navigate} />}
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
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600"></span>
            QueueCare · receptionist-free virtual waiting
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-red-600" /> Private queue session
          </span>
        </div>
      </footer>}
    </div>
  );
}

/* ─── Header ────────────────────────────────── */
function Header({ route, navigate }: { route: string; navigate: (route: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
        <button onClick={() => navigate("home")} className="rounded-2xl p-1 transition-all hover:opacity-85 focus-visible:outline-none">
          <QueueCareLogo size="md" />
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-red-100 bg-red-50/80 px-3.5 py-1.5 sm:flex shadow-xs">
          <LiveDot />
          <span className="text-xs font-bold text-red-700">Live queue session</span>
        </div>

        <BtnGhost
          onClick={() => navigate(route === "doctor" ? "patient" : "doctor")}
          className="!px-3.5 !py-2 !text-xs !font-semibold sm:!px-4 border-red-100 hover:border-red-200 hover:bg-red-50/40"
        >
          <Stethoscope size={13} className="text-red-600" />
          {route === "doctor" ? "Patient view" : "Doctor dashboard"}
        </BtnGhost>
      </div>
    </header>
  );
}

/* ─── Home ────────────────────────────────────── */
function Home({ navigate, state }: { navigate: (route: string) => void; state: QueueState }) {
  return (
    <main>
      {/* Hero */}
      <section className="hero-grid relative mx-auto grid max-w-7xl gap-12 overflow-hidden px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pt-24">
        {/* Ambient glow in medical red */}
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-64 w-64 rounded-full bg-red-600/5 blur-3xl" />
        <div className="relative z-10">
          <Badge variant="red" className="mb-7 shadow-xs">
            <Sparkles size={11} /> Less waiting. More care.
          </Badge>
          <h1 className="max-w-xl text-5xl font-black leading-[1.03] tracking-[-.05em] text-ink sm:text-6xl lg:text-[4.5rem]">
            Your place in line,{" "}
            <span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 bg-clip-text text-transparent">without the line.</span>
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
              <Stethoscope size={16} className="text-red-600" /> Doctor view
            </BtnGhost>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { icon: <ShieldCheck size={12} />, label: "No app download" },
              { icon: <MessageCircle size={12} />, label: "WhatsApp updates" },
              { icon: <MapPin size={12} />, label: "Join near clinic" },
            ].map(({ icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-soft shadow-xs backdrop-blur-sm">
                <span className="text-red-600">{icon}</span> {label}
              </span>
            ))}
          </div>
        </div>

        <QueuePreview state={state} />
      </section>

      {/* Feature strip */}
      <section className="border-y border-border/70 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-14 sm:grid-cols-3">
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
  const token = currentToken(state);
  return (
    <div className="[animation:var(--animate-slide-up)] relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-red-500/12 blur-3xl" />
      <div className="rounded-[1.8rem] border border-red-100 bg-white p-6 shadow-2xl shadow-red-500/10 sm:p-8">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-red-600">{state.clinicName}</p>
            <p className="mt-1 text-xs text-slate-soft">Virtual waiting room · open now</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[.65rem] font-bold text-red-700">
            <LiveDot /> LIVE
          </span>
        </div>

        {/* Big token number */}
        <div className="py-9 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-muted">Now serving</p>
          <p className="mt-2 text-8xl font-black tracking-tight text-red-600">{token ? tokenLabel(token.tokenNumber) : "—"}</p>
          <p className="mt-3 text-sm font-semibold text-slate-soft">{waiting} {waiting === 1 ? "person" : "people"} waiting</p>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold text-slate-muted uppercase tracking-wider">Next update</p>
            <p className="mt-1 text-sm font-bold text-ink">WhatsApp</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
            <p className="text-[10px] font-semibold text-red-700/70 uppercase tracking-wider">Session</p>
            <p className="mt-1 text-sm font-bold text-red-700">Until doctor ends</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Card className="group cursor-default p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-red-200 hover:shadow-card-hover">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-btn-red">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-soft">{text}</p>
    </Card>
  );
}

/* ─── Patient Join ─────────────────────────────── */
function PatientJoin({ state, navigate }: { state: QueueState; navigate: (r: string) => void }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [completedNotice, setCompletedNotice] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const clinicId = new URLSearchParams(window.location.search).get("join") ?? "clinic-demo";

  // Stored entry
  const [entryId, setEntryId] = useState(() => sessionStorage.getItem("queuecare-patient-entry") ?? "");
  const existingEntry = state.entries.find(e => e.id === entryId) ?? null;

  // Browser back button handler: if user was viewing token and hits browser Back, return to join form
  useEffect(() => {
    const onPop = () => {
      if (entryId) {
        setEntryId("");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [entryId]);

  const join = async () => {
    setError("");
    setCompletedNotice(null);
    const normalized = phone.replace(/[^\d+]/g, "");
    if (!/^\+?\d{10,15}$/.test(normalized)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // 1. If this phone ALREADY has an active token in the queue, immediately display it!
    const activeExisting = state.entries.find(
      e => e.phone === normalized && (e.status === "waiting" || e.status === "called")
    );
    if (activeExisting) {
      sessionStorage.setItem("queuecare-patient-entry", activeExisting.id);
      window.history.pushState({ tokenView: true, id: activeExisting.id }, "", window.location.href);
      setEntryId(activeExisting.id);
      return;
    }

    // 2. If this phone was already completed or skipped in this session:
    const pastExisting = state.entries.find(
      e => e.phone === normalized && (e.status === "completed" || e.status === "skipped")
    );
    if (pastExisting) {
      setCompletedNotice(pastExisting);
      return;
    }

    setLoading(true);
    try {
      const entry = await queueStore.join({ phone: normalized, clinicId });
      sessionStorage.setItem("queuecare-patient-entry", entry.id);
      window.history.pushState({ tokenView: true, id: entry.id }, "", window.location.href);
      setEntryId(entry.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join the queue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = () => {
    sessionStorage.removeItem("queuecare-patient-entry");
    sessionStorage.removeItem("queuecare-patient-entry-back");
    setEntryId("");
  };

  const handleBackToJoin = () => {
    setEntryId("");
  };

  if (existingEntry) {
    return (
      <PatientToken
        entry={existingEntry}
        state={state}
        onBack={handleBackToJoin}
        onLeave={handleLeaveQueue}
        onRequestAnother={handleBackToJoin}
      />
    );
  }

  return (
    <main className="patient-canvas mx-auto flex min-h-screen max-w-md items-center px-5 py-10 sm:px-6 [animation:var(--animate-fade-in)]">
      <section className="w-full">
        {/* Back to home */}
        <button
          onClick={() => navigate("home")}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-muted transition hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to home
        </button>

        {/* Icon + branding */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-6 w-fit">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-ink via-ink-soft to-ink-xsoft text-emerald-glow shadow-btn">
              <HeartPulse size={26} strokeWidth={2.2} />
            </div>
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald text-[9px] font-black text-white shadow-btn-emerald">
              <Check size={10} strokeWidth={3} />
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald">{state.clinicName}</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-ink">Join the queue</h1>
          <p className="mt-3 text-sm leading-6 text-slate-soft">Enter your mobile number to receive your token and live updates.</p>
        </div>

        <Card className="overflow-hidden">
          <div className="p-5 sm:p-6">
            <label className="mb-1.5 block text-sm font-bold text-ink">Mobile number</label>
            <div className="relative mb-5">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-muted" />
              <Input
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  if (error) setError("");
                  if (completedNotice) setCompletedNotice(null);
                }}
                onKeyDown={e => e.key === "Enter" && !loading && phone.trim() && join()}
                placeholder="98765 43210"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="pl-11"
              />
            </div>

            {completedNotice && (
              <div role="alert" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs">
                <div className="flex items-start gap-2 text-amber-900 font-semibold mb-2">
                  <Info size={16} className="shrink-0 mt-0.5 text-amber-700" />
                  <span>
                    Token A{completedNotice.tokenNumber} for this number is already{" "}
                    <span className="font-bold">{completedNotice.status}</span>.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem("queuecare-patient-entry", completedNotice.id);
                      setEntryId(completedNotice.id);
                    }}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-700 transition"
                  >
                    View Token A{completedNotice.tokenNumber}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      queueStore.resetDemo();
                      setCompletedNotice(null);
                      setPhone("");
                      setError("");
                    }}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                  >
                    Reset demo queue
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="mb-5 flex gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold leading-5 text-red-700">
                <Info size={17} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p>{error}</p>
                  {error.includes("no longer active") && (
                    <button
                      type="button"
                      onClick={() => {
                        queueStore.resetDemo();
                        setError("");
                        setPhone("");
                      }}
                      className="mt-2 inline-block text-xs font-bold underline hover:opacity-80"
                    >
                      Reset demo queue to test again
                    </button>
                  )}
                </div>
              </div>
            )}

            <BtnPrimary onClick={join} disabled={loading || !phone.trim()} className="w-full">
              <Zap size={16} className="text-emerald-glow" />
              {loading ? "Getting your token…" : "Get token"}
              {!loading && <ArrowRight size={15} />}
            </BtnPrimary>
          </div>

          <div className="border-t border-border/60 bg-mist px-5 py-3.5 text-center text-[11px] leading-5 text-slate-muted">
            Need a token for a family member? Scan again after 5 minutes.
          </div>
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
function PatientToken({ entry, state, onBack, onLeave, onRequestAnother }: {
  entry: QueueEntry; state: QueueState;
  onBack: () => void;
  onLeave: () => void;
  onRequestAnother: () => void;
}) {
  const liveEntry = state.entries.find(i => i.id === entry.id) ?? entry;
  const called = liveEntry.status === "called";
  const skipped = liveEntry.status === "skipped";
  const completed = liveEntry.status === "completed";

  return (
    <main className="patient-canvas mx-auto flex min-h-screen max-w-md items-start justify-center px-5 py-8 sm:px-6 animate-fade-in">
      <section className="w-full pt-4">
        {/* Top bar with back button + clinic brand */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-muted shadow-sm transition hover:bg-white hover:text-ink"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-ink to-ink-soft text-emerald-glow shadow-btn">
              <HeartPulse size={13} />
            </span>
            <span>
              <span className="block text-xs font-extrabold text-ink">{state.clinicName}</span>
              <span className="block text-[9px] font-medium text-slate-muted">virtual waiting room</span>
            </span>
          </div>
        </div>

        {/* Called alert banner */}
        {called && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-light bg-emerald-xlight px-4 py-3.5">
            <Bell size={18} className="shrink-0 text-emerald" />
            <p className="text-sm font-bold text-emerald-text">Token {tokenLabel(liveEntry.tokenNumber)} called — please proceed to the consultation room now.</p>
          </div>
        )}

        {/* Rich queue status */}
        <QueueStatusCard liveEntry={liveEntry} state={state} />

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-muted">
          We'll also alert you on WhatsApp as your turn approaches.
        </p>

        {completed && (
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <BtnPrimary onClick={onLeave} className="w-full">
              <Check size={16} /> Consultation complete · Done
            </BtnPrimary>
          </div>
        )}

        {!completed && !skipped && (
          <div className="mt-5 space-y-2.5 text-center">
            <button
              onClick={onRequestAnother}
              className="mx-auto block text-xs font-bold text-emerald underline-offset-4 hover:underline"
            >
              Get a token for a family member
            </button>
            <button
              onClick={onLeave}
              className="text-[11px] font-semibold text-slate-muted transition hover:text-red-600"
            >
              Leave queue / cancel token
            </button>
          </div>
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
function DoctorDashboard({ state, navigate, onLogout }: {
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
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 [animation:var(--animate-fade-in)]">
      {/* Top bar */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-light bg-emerald-xlight px-3 py-1 text-[11px] font-bold text-emerald-text">
            <LiveDot /> SESSION LIVE
          </div>
          <h1 className="text-3xl font-black tracking-[-.04em] text-ink sm:text-4xl">Good evening, Doctor.</h1>
          <p className="mt-1.5 text-sm text-slate-soft">
            Your queue is active — <span className="font-semibold text-ink">{waiting.length} patient{waiting.length !== 1 ? "s" : ""}</span> waiting.
          </p>
        </div>
        <BtnGhost onClick={onLogout} className="!px-4 !py-2.5 !text-xs">
          <X size={13} /> Sign out
        </BtnGhost>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Current token hero */}
          <div className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-ink via-ink-soft to-ink-xsoft p-6 text-white shadow-card sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald/12 blur-3xl" />
            <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-blue-500/8 blur-3xl" />
            <div className="mb-6 flex items-start justify-between">
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-glow">Currently serving</p>
                <div className="mt-3 flex items-end gap-4">
                  <span className="text-8xl font-black leading-none tracking-tight">{called ? tokenLabel(called.tokenNumber) : "—"}</span>
                </div>
              </div>
              <div className="relative rounded-2xl bg-white/8 p-3 text-emerald-glow ring-1 ring-white/10 backdrop-blur-sm">
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
              icon={<Send size={19} />}
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
              icon={<SkipForward size={19} />}
              label="Skip current"
              badge="Skip"
              accent="amber"
              onClick={() => safe(() => queueStore.skip(), "Current token skipped")}
              disabled={!called}
            />
            <ActionBtn
              icon={<RefreshCw size={19} />}
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
                <button
                  type="button"
                  onClick={() => navigate("patient")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-ink px-3 py-2 text-xs font-bold text-white transition-all hover:bg-ink-soft active:scale-[.98]"
                >
                  <ArrowRight size={13} /> Test join
                </button>
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-dark bg-emerald px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-dark active:scale-[.97]"
                >
                  <ArrowRight size={13} /> Open panel
                </a>
              </div>
            </div>
          </Card>

          {/* Session controls */}
          <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-muted">Session controls</p>
                <p className="mt-1 font-black text-ink">
                  {state.acceptingTokens ? "Accepting new tokens" : "No new tokens"}
                </p>
              </div>
              <Badge variant={state.acceptingTokens ? "green" : "amber"}>
                {state.status.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2.5 p-5">
              <BtnDanger
                onClick={() => safe(() => queueStore.endSession(), "Session ended")}
                disabled={state.status !== "open"}
                className="w-full"
              >
                <X size={15} /> End session
              </BtnDanger>
              <BtnSubtle
                onClick={() => { queueStore.resetDemo(); notify("Demo queue reset"); }}
                className="w-full"
              >
                <RefreshCw size={13} /> Reset demo queue
              </BtnSubtle>
            </div>
          </Card>

          <ActivityFeed state={state} />
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 rounded-2xl bg-ink/95 px-5 py-3.5 text-sm font-bold text-white shadow-2xl backdrop-blur-md [animation:var(--animate-toast-in)]" style={{ transform: "translateX(-50%)" }}>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald text-white">
            <Check size={13} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </main>
  );
}

/* ─── Action button (dashboard) ──────────────────── */
function ActionBtn({
  icon, label, badge, accent, primary, onClick, disabled,
}: {
  icon: ReactNode; label: string; badge: string;
  accent: "blue" | "emerald" | "amber" | "purple";
  primary?: boolean; onClick: () => void; disabled?: boolean;
}) {
  const accentMap = {
    blue:    { iconWrap: "bg-blue-100 text-blue-600",       badge: "bg-blue-100 text-blue-700" },
    emerald: { iconWrap: "bg-emerald-dark text-white",       badge: "bg-emerald-dark text-white" },
    amber:   { iconWrap: "bg-amber-100 text-amber-600",      badge: "bg-amber-100 text-amber-700" },
    purple:  { iconWrap: "bg-violet-100 text-violet-600",    badge: "bg-violet-100 text-violet-700" },
  };
  const { iconWrap, badge: badgeCls } = accentMap[accent];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex min-h-36 flex-col items-start justify-between gap-5 rounded-[1.4rem] p-4 text-left w-full",
        "transition-all duration-200 active:scale-[.975] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:pointer-events-none",
        primary
          ? "bg-gradient-to-br from-emerald to-emerald-dark text-white shadow-btn-emerald hover:-translate-y-1 hover:shadow-btn-emerald-lg"
          : "bg-white border border-border/60 text-ink shadow-card hover:-translate-y-1 hover:border-slate-200 hover:shadow-card-hover",
      ].join(" ")}
    >
      {/* Top row: icon chip + badge */}
      <span className="flex w-full items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconWrap}`}>
          {icon}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${primary ? "bg-white/15 text-white" : badgeCls}`}>
          {badge}
        </span>
      </span>
      {/* Label */}
      <span className={`text-sm font-bold leading-tight ${primary ? "text-white" : "text-ink"}`}>{label}</span>
    </button>
  );
}

/* ─── Dashboard metric (inside dark hero) ─────────── */
function DashMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/6 p-3.5 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

/* ─── Queue table ─────────────────────────────── */
function QueueTable({ state, onRecall }: { state: QueueState; onRecall: (id: string) => void }) {
  const entries = [...state.entries]
    .filter(e => ["waiting", "skipped"].includes(e.status))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.tokenNumber - b.tokenNumber);

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-muted">Up next</p>
          <h2 className="mt-1 text-xl font-black text-ink">Live patient queue</h2>
        </div>
        <Badge variant="slate">{entries.length} active</Badge>
      </div>

      <div className="divide-y divide-border/40">
        {entries.length === 0
          ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-xlight text-emerald">
                <Users size={20} />
              </div>
              <p className="text-sm font-bold text-ink">Queue is clear</p>
              <p className="mt-1 text-xs text-slate-muted">New patient tokens will appear here live.</p>
            </div>
          )
          : entries.slice(0, 8).map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3.5 px-5 py-4 transition-colors duration-150 hover:bg-mist/60">
              <div className={[
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black",
                entry.status === "skipped"
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                  : idx === 0
                    ? "bg-emerald-xlight text-emerald ring-1 ring-emerald-light"
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
                ? <BtnGhost onClick={() => onRecall(entry.id)} className="!px-3.5 !py-2 !text-xs">Recall</BtnGhost>
                : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-muted">···{entry.phone?.slice(-4) ?? "—"}</span>
              }
            </div>
          ))
        }
      </div>
    </Card>
  );
}

/* ─── Activity feed ────────────────────────────── */
function ActivityFeed({ state }: { state: QueueState }) {
  const dotCls = (tone: string) => ({
    green: "bg-emerald ring-4 ring-emerald-xlight",
    amber: "bg-amber-400 ring-4 ring-amber-50",
    blue:  "bg-blue-400 ring-4 ring-blue-50",
    slate: "bg-slate-300 ring-4 ring-slate-100",
  })[tone] ?? "bg-slate-300 ring-4 ring-slate-100";

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-muted">Activity</p>
          <h2 className="mt-1 font-black text-ink">Recent updates</h2>
        </div>
        <History size={16} className="text-slate-faint" />
      </div>
      <div className="space-y-4 p-6">
        {state.activity.slice(0, 5).map(item => (
          <div key={item.id} className="flex gap-3.5">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotCls(item.tone)}`} />
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
