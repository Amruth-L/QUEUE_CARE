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
  Pause,
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
  Zap
} from "lucide-react";
import type { QueueEntry, QueueState } from "./types";
import { aheadFor, currentToken, formatRelativeTime, queueStore } from "./store";

const useQueue = () => useSyncExternalStore(queueStore.subscribe, queueStore.getState, queueStore.getState);

function App() {
  const query = new URLSearchParams(window.location.search);
  const [route, setRoute] = useState(query.has("join") ? "patient" : query.has("doctor") ? "doctor" : "home");
  const [doctorAuthenticated, setDoctorAuthenticated] = useState(() => Boolean(sessionStorage.getItem("queuecare-doctor-token")));
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
    <div className="min-h-screen" style={{ backgroundColor: "#f5f8fc", color: "#0d1f35" }}>
      <Header route={route} navigate={navigate} />
      <div className="fade-in">
        {route === "home" && <Home navigate={navigate} state={state} />}
        {route === "patient" && <PatientJoin state={state} navigate={navigate} />}
        {route === "doctor" && (doctorAuthenticated
          ? <DoctorDashboard state={state} navigate={navigate} onLogout={() => { sessionStorage.removeItem("queuecare-doctor-token"); setDoctorAuthenticated(false); }} />
          : <DoctorAuth onSuccess={() => setDoctorAuthenticated(true)} />
        )}
      </div>
      <footer style={{ borderTop: "1px solid #e4eaf2" }} className="mt-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs font-medium" style={{ color: "#94a3b8" }}>
          <span>QueueCare · receptionist-free waiting</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} style={{ color: "#10b981" }} /> Private queue session</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Header ────────────────────────────────────── */
function Header({ route, navigate }: { route: string; navigate: (route: string) => void }) {
  return (
    <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e4eaf2" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => navigate("home")} className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: "#0d1f35", color: "#10b981" }}>
            <HeartPulse size={18} />
          </span>
          <span>
            <span className="block text-sm font-800 font-extrabold" style={{ color: "#0d1f35" }}>QueueCare</span>
            <span className="block text-[11px]" style={{ color: "#94a3b8" }}>virtual waiting room</span>
          </span>
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="dot-live" />
          <span className="text-xs font-semibold" style={{ color: "#64748b" }}>Live queue</span>
        </div>

        <button
          onClick={() => navigate(route === "doctor" ? "home" : "doctor")}
          className="btn-ghost"
          style={{ padding: ".45rem 1rem", fontSize: ".8rem" }}
        >
          <Stethoscope size={15} />
          {route === "doctor" ? "Patient view" : "Doctor dashboard"}
        </button>
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
          <div className="badge badge-green mb-6">
            <Sparkles size={12} /> Less waiting. More care.
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.06] tracking-[-0.04em] sm:text-6xl" style={{ color: "#0d1f35" }}>
            Your place in line,{" "}
            <span style={{ color: "#10b981" }}>without the line.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7" style={{ color: "#64748b" }}>
            Scan the clinic QR, get your token, and wait comfortably nearby.
            We'll keep you updated on WhatsApp as your turn gets closer.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate("patient")} className="btn-primary">
              <QrCode size={17} /> Join the queue <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate("doctor")} className="btn-ghost">
              <Stethoscope size={16} /> Doctor view
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold" style={{ color: "#94a3b8" }}>
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} style={{ color: "#10b981" }} /> No app download</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} style={{ color: "#10b981" }} /> WhatsApp updates</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} style={{ color: "#10b981" }} /> Join near clinic</span>
          </div>
        </div>

        <QueuePreview state={state} />
      </section>

      {/* Feature strip */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid #e4eaf2", borderBottom: "1px solid #e4eaf2" }}>
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
    <div className="slide-up mx-auto w-full max-w-md">
      <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: "#0d1f35", color: "#fff" }}>
        <div className="flex items-center justify-between pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: "#10b981" }}>Aster Lane Clinic</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.5)" }}>Evening queue · open now</p>
          </div>
          <span className="badge" style={{ background: "rgba(16,185,129,.15)", color: "#34d399", fontSize: ".65rem" }}>● LIVE</span>
        </div>

        <div className="py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: "rgba(255,255,255,.35)" }}>Now serving</p>
          <p className="mt-2 text-8xl font-black tracking-[-0.07em]">{currentToken(state)?.tokenNumber ?? "—"}</p>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>{waiting} people waiting</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,.06)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,.35)" }}>Next update</p>
            <p className="mt-1 text-sm font-bold">WhatsApp</p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(16,185,129,.12)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "rgba(52,211,153,.6)" }}>Session</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#34d399" }}>Until doctor ends</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="card p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: "#f0fdf4", color: "#10b981" }}>
        {icon}
      </div>
      <h3 className="font-bold" style={{ color: "#0d1f35" }}>{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "#64748b" }}>{text}</p>
    </div>
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
          <button onClick={() => navigate("home")} className="mb-8 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94a3b8" }}>
            <ArrowLeft size={15} /> Back to home
          </button>
          <div className="badge badge-green mb-5">
            <MapPin size={12} /> Aster Lane Clinic · Session open
          </div>
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl" style={{ color: "#0d1f35" }}>
            Join the queue<br /><span style={{ color: "#10b981" }}>from here.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7" style={{ color: "#64748b" }}>
            You're joining through the clinic QR. Your place is based on the real-time order you enter.
          </p>
          <div className="mt-8 space-y-3">
            <Step n="01" text="Be within 10–100 meters of the clinic" />
            <Step n="02" text="Enter the patient details below" />
            <Step n="03" text="Keep WhatsApp open for updates" />
          </div>
        </div>

        {/* Form card */}
        <div className="card p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em]" style={{ color: "#94a3b8" }}>New queue entry</p>
              <h2 className="mt-2 text-xl font-black" style={{ color: "#0d1f35" }}>Who are you registering?</h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: "#f0fdf4", color: "#10b981" }}>
              <Users size={19} />
            </div>
          </div>

          {/* Toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-xl p-1 mb-6" style={{ backgroundColor: "#f5f8fc" }}>
            <button
              onClick={() => setAssisted(false)}
              className="rounded-lg py-2.5 text-sm font-bold transition"
              style={!assisted ? { backgroundColor: "#fff", color: "#0d1f35", boxShadow: "0 1px 4px rgba(13,31,53,.1)" } : { color: "#94a3b8" }}
            >Myself</button>
            <button
              onClick={() => setAssisted(true)}
              className="rounded-lg py-2.5 text-sm font-bold transition"
              style={assisted ? { backgroundColor: "#fff", color: "#0d1f35", boxShadow: "0 1px 4px rgba(13,31,53,.1)" } : { color: "#94a3b8" }}
            >Someone else</button>
          </div>

          {assisted && (
            <div className="mb-5 flex gap-3 rounded-xl p-4 text-sm leading-5" style={{ backgroundColor: "#eff6ff", color: "#1e40af" }}>
              <Info size={17} className="mt-0.5 shrink-0" />
              <span>Registering an elder? Use your own phone. WhatsApp updates will come to you.</span>
            </div>
          )}

          <label className="block text-sm font-bold mb-1" style={{ color: "#0d1f35" }}>
            Patient name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={assisted ? "Enter elder's name" : "Enter your name"}
            className="input mb-5"
          />

          <label className="block text-sm font-bold mb-1" style={{ color: "#0d1f35" }}>
            WhatsApp number
          </label>
          <div className="relative mb-5">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
              className="input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 mb-6" style={{ color: "#64748b" }}>
            <input
              checked={optedIn}
              onChange={e => setOptedIn(e.target.checked)}
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            I agree to receive queue updates on WhatsApp for this clinic session.
          </label>

          {error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <button onClick={join} disabled={!optedIn || loading} className="btn-primary w-full">
            <Zap size={16} style={{ color: "#34d399" }} />
            {loading ? "Joining…" : "Get my token"}
            <ArrowRight size={15} />
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold" style={{ color: "#94a3b8" }}>
            <ShieldCheck size={12} style={{ color: "#10b981" }} /> Your token is only valid for today's session
          </p>
        </div>
      </div>
    </main>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-black" style={{ backgroundColor: "#fff", color: "#10b981", boxShadow: "0 1px 4px rgba(13,31,53,.1)" }}>{n}</span>
      <span className="text-sm" style={{ color: "#64748b" }}>{text}</span>
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
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16 fade-in">
      <div className="text-center mb-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: "#f0fdf4", color: "#10b981" }}>
          <Check size={26} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: "#10b981" }}>
          {called ? "Your turn is ready" : skipped ? "Token skipped" : "You're in the queue"}
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-7xl" style={{ color: "#0d1f35" }}>
          Token <span style={{ color: "#10b981" }}>{liveEntry.tokenNumber}</span>
        </h1>
        <p className="mt-3 text-sm" style={{ color: "#64748b" }}>{liveEntry.patientName} · Aster Lane Clinic</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Stat label="People ahead" value={called ? "Now" : skipped ? "Skipped" : String(ahead ?? 0)} icon={<Users size={18} />} tone="green" />
        <Stat label="Current token" value={String(currentToken(state)?.tokenNumber ?? "—")} icon={<Activity size={18} />} tone="slate" />
        <Stat label="Updates" value="WhatsApp" icon={<MessageCircle size={18} />} tone="amber" />
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black" style={{ color: "#0d1f35" }}>Live queue status</h2>
            <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>Updates automatically in real time.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#10b981" }}>
            <span className="dot-live" /> Live
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: "#e4eaf2" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: called ? "100%" : `${Math.max(8, 100 - ((ahead ?? 0) / Math.max(1, state.entries.length)) * 100)}%`,
              backgroundColor: "#10b981",
              transition: "width .7s cubic-bezier(.4,0,.2,1)"
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold" style={{ color: "#94a3b8" }}>
          <span>Joined</span>
          <span>{called ? "Called!" : ahead === 1 ? "You're next" : `${ahead ?? 0} ahead`}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="badge badge-green"><MessageCircle size={12} /> WhatsApp alerts active</span>
          <span className="badge badge-slate"><Clock3 size={12} /> Session open</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => navigate("home")} className="btn-ghost" style={{ fontSize: ".8rem", padding: ".5rem 1.1rem" }}>
          <House size={15} /> Return home
        </button>
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
      const res = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallengeId(data.challengeId); setMaskedPhone(data.maskedPhone); setDemoCode(data.demoCode ?? "");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send OTP."); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem("queuecare-doctor-token", data.token); onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify OTP."); }
    finally { setLoading(false); }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-4xl items-center justify-center px-6 py-12 fade-in">
      <div className="w-full overflow-hidden rounded-2xl" style={{ border: "1px solid #e4eaf2", boxShadow: "0 1px 3px rgba(13,31,53,.06), 0 6px 24px rgba(13,31,53,.07)" }}>
        <div className="grid lg:grid-cols-[.85fr_1.15fr]">

          {/* Left panel */}
          <div className="hidden p-10 lg:block" style={{ backgroundColor: "#0d1f35", color: "#fff" }}>
            <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: "#10b981", color: "#fff" }}>
              <Stethoscope size={22} />
            </div>
            <p className="mt-10 text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: "#34d399" }}>Doctor portal</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em]">Your clinic queue,<br />under control.</h2>
            <p className="mt-4 text-sm leading-6" style={{ color: "rgba(255,255,255,.5)" }}>
              Sign in securely to call the next patient, recall a missed turn, and keep the waiting room moving.
            </p>
            <div className="mt-10 space-y-3 text-sm" style={{ color: "rgba(255,255,255,.6)" }}>
              <span className="flex items-center gap-3"><ShieldCheck size={16} style={{ color: "#34d399" }} /> OTP-protected access</span>
              <span className="flex items-center gap-3"><MessageCircle size={16} style={{ color: "#34d399" }} /> Live patient updates</span>
              <span className="flex items-center gap-3"><Activity size={16} style={{ color: "#34d399" }} /> One-tap queue control</span>
            </div>
          </div>

          {/* Right form */}
          <div className="p-7 sm:p-10" style={{ backgroundColor: "#fff" }}>
            <div className="flex items-center gap-2 text-xs font-bold mb-6" style={{ color: "#10b981" }}>
              <ShieldCheck size={14} /> Secure doctor sign in
            </div>

            {!challengeId ? (
              <>
                <h2 className="text-2xl font-black tracking-[-0.04em]" style={{ color: "#0d1f35" }}>Welcome back</h2>
                <p className="mt-2 text-sm leading-6 mb-7" style={{ color: "#64748b" }}>
                  Enter the registered doctor mobile number to receive a one-time password.
                </p>
                <label className="block text-sm font-bold mb-1" style={{ color: "#0d1f35" }}>Mobile number</label>
                <div className="relative mb-6">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel"
                    className="input" style={{ paddingLeft: "2.5rem" }} />
                </div>
                <button onClick={requestCode} disabled={loading} className="btn-primary w-full">
                  {loading ? "Sending…" : "Continue"} <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setChallengeId("")} className="text-xs font-bold mb-6 flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                  <ArrowLeft size={13} /> Change number
                </button>
                <h2 className="text-2xl font-black tracking-[-0.04em]" style={{ color: "#0d1f35" }}>Verify your number</h2>
                <p className="mt-2 text-sm leading-6 mb-7" style={{ color: "#64748b" }}>
                  We sent a 6-digit OTP to <strong style={{ color: "#0d1f35" }}>{maskedPhone}</strong>.
                </p>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  className="input mb-4 text-center text-2xl font-black tracking-[.5em]"
                />
                {demoCode && (
                  <div className="mb-5 rounded-xl px-4 py-3 text-xs font-semibold leading-5" style={{ backgroundColor: "#fefce8", color: "#92400e" }}>
                    <Info size={13} className="mr-1 inline" /> Local demo OTP: <strong className="tracking-widest">{demoCode}</strong>
                  </div>
                )}
                <button onClick={verifyCode} disabled={loading || code.length !== 6} className="btn-primary w-full mb-4">
                  {loading ? "Verifying…" : "Verify & open dashboard"} <ArrowRight size={15} />
                </button>
                <button onClick={requestCode} className="w-full text-center text-xs font-bold" style={{ color: "#94a3b8" }}>
                  Resend code
                </button>
              </>
            )}

            {error && (
              <div className="mt-5 rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-5" style={{ color: "#94a3b8" }}>
              Only the clinic doctor should access queue controls.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Stat card ─────────────────────────────────── */
function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: "green" | "blue" | "amber" | "slate" }) {
  const colors = {
    green: { bg: "#f0fdf4", icon: "#10b981" },
    blue:  { bg: "#eff6ff", icon: "#3b82f6" },
    amber: { bg: "#fffbeb", icon: "#f59e0b" },
    slate: { bg: "#f8fafc", icon: "#64748b" },
  };
  return (
    <div className="card p-5">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: colors[tone].bg, color: colors[tone].icon }}>
        {icon}
      </div>
      <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="mt-1 text-xl font-black" style={{ color: "#0d1f35" }}>{value}</p>
    </div>
  );
}

/* ─── Doctor Dashboard ──────────────────────────── */
function DoctorDashboard({ state, navigate, onLogout }: { state: QueueState; navigate: (route: string) => void; onLogout: () => void }) {
  const [qr, setQr] = useState("");
  const [toast, setToast] = useState("");
  const waiting  = state.entries.filter(e => e.status === "waiting");
  const skipped  = state.entries.filter(e => e.status === "skipped");
  const called   = currentToken(state);
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
    try { await action(); notify(msg); } catch (e) { notify(e instanceof Error ? e.message : "Something went wrong"); }
  };

  const callCurrent = () => {
    if (!called) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Token number ${called.tokenNumber}, ${called.patientName}, please proceed to the doctor.`);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    void safe(() => queueStore.call(), `Token ${called.tokenNumber} announced`);
  };

  const copy = () => { navigator.clipboard?.writeText(joinUrl); notify("Patient join link copied"); };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 fade-in">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: "#10b981" }}>
            <span className="dot-live" /> SESSION LIVE · 6:00 PM
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl" style={{ color: "#0d1f35" }}>Good evening, Doctor.</h1>
          <p className="mt-1.5 text-sm" style={{ color: "#64748b" }}>Your queue is in your hands. {waiting.length} patients are waiting.</p>
        </div>
        <button onClick={onLogout} className="btn-ghost" style={{ padding: ".45rem 1rem", fontSize: ".8rem" }}>Sign out</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Current token hero */}
          <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: "#0d1f35", color: "#fff" }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: "#34d399" }}>Currently serving</p>
                <div className="mt-3 flex items-end gap-4">
                  <span className="text-8xl font-black leading-none tracking-[-0.08em]">{called?.tokenNumber ?? "—"}</span>
                  {called && <span className="mb-2 text-sm" style={{ color: "rgba(255,255,255,.55)" }}>{called.patientName}</span>}
                </div>
              </div>
              <div className="rounded-xl p-2.5" style={{ backgroundColor: "rgba(255,255,255,.08)", color: "#34d399" }}>
                <Activity size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DashboardMetric label="Waiting"      value={String(waiting.length)} />
              <DashboardMetric label="Skipped"      value={String(skipped.length)} />
              <DashboardMetric label="Called today" value={String(state.entries.filter(e => e.status === "completed" || e.status === "called").length)} />
              <DashboardMetric label="Status"       value={state.acceptingTokens ? "Open" : "Stopped"} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ActionBtn
              icon={<Send size={20} />}
              label="Call current"
              badge="Speaker"
              color="#3b82f6"
              bgHover="#eff6ff"
              onClick={callCurrent}
              disabled={!called}
            />
            <ActionBtn
              icon={<ChevronRight size={22} />}
              label="Next patient"
              badge="Main"
              color="#fff"
              bgColor="#10b981"
              bgHover="#059669"
              onClick={() => safe(() => queueStore.next(), called ? `Token ${waiting[0]?.tokenNumber ?? "—"} called` : "Next patient called")}
            />
            <ActionBtn
              icon={<SkipForward size={20} />}
              label="Skip current"
              badge="Skip"
              color="#f59e0b"
              bgHover="#fffbeb"
              onClick={() => safe(() => queueStore.skip(), "Current token skipped")}
              disabled={!called}
            />
            <ActionBtn
              icon={<RefreshCw size={20} />}
              label="Recall skipped"
              badge="Recall"
              color="#8b5cf6"
              bgHover="#f5f3ff"
              onClick={() => { const first = skipped[0]; if (first) void safe(() => queueStore.recall(first.id), "Token recalled"); }}
              disabled={skipped.length === 0}
            />
          </div>

          <QueueTable state={state} onRecall={(id) => safe(() => queueStore.recall(id), "Token recalled to priority line")} />
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5">
          {/* QR card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em]" style={{ color: "#94a3b8" }}>Permanent clinic QR</p>
                <h2 className="mt-1.5 text-lg font-black" style={{ color: "#0d1f35" }}>Put this on the wall</h2>
              </div>
              <QrCode size={22} style={{ color: "#10b981" }} />
            </div>
            <div className="mx-auto w-fit rounded-xl p-3" style={{ border: "1px solid #e4eaf2" }}>
              {qr
                ? <img src={qr} alt="Clinic join QR code" className="h-44 w-44" />
                : <div className="grid h-44 w-44 place-items-center" style={{ backgroundColor: "#f5f8fc" }}><RefreshCw className="animate-spin" style={{ color: "#c8d6e3" }} /></div>
              }
            </div>
            <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: "#f0fdf4" }}>
              <p className="flex items-center gap-2 text-xs font-black" style={{ color: "#065f46" }}><Check size={13} /> QR is ready for scanning</p>
              <p className="mt-1 break-all text-[11px] leading-4" style={{ color: "#059669", opacity: .75 }}>{joinUrl}</p>
            </div>
            <p className="mt-3 text-center text-xs leading-5" style={{ color: "#94a3b8" }}>
              Patients scan this same QR every day. It accepts tokens only while the session is open.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={copy} className="btn-ghost" style={{ fontSize: ".8rem", padding: ".6rem" }}>
                <Copy size={14} /> Copy link
              </button>
              <a href={joinUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ fontSize: ".8rem", padding: ".6rem", textDecoration: "none" }}>
                <ArrowRight size={14} /> Test join
              </a>
            </div>
          </div>

          {/* Session controls */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em]" style={{ color: "#94a3b8" }}>Session controls</p>
                <p className="mt-1.5 font-black" style={{ color: "#0d1f35" }}>{state.acceptingTokens ? "Accepting new tokens" : "No new tokens"}</p>
              </div>
              <span className={`badge ${state.acceptingTokens ? "badge-green" : "badge-amber"}`}>
                {state.status.toUpperCase()}
              </span>
            </div>
            <button onClick={() => safe(() => queueStore.endSession(), "Session ended")} disabled={state.status !== "open"} className="btn-danger w-full mb-3">
              <X size={15} /> End session
            </button>
            <button onClick={() => { queueStore.resetDemo(); notify("Demo queue reset"); }} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition" style={{ color: "#94a3b8" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f8fc")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <RefreshCw size={13} /> Reset demo queue
            </button>
          </div>

          <ActivityFeed state={state} />
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-2xl" style={{ backgroundColor: "#0d1f35" }}>
          <Check size={15} style={{ color: "#34d399" }} /> {toast}
        </div>
      )}
    </main>
  );
}

function ActionBtn({
  icon, label, badge, color, bgColor, bgHover, onClick, disabled
}: {
  icon: ReactNode; label: string; badge: string; color: string;
  bgColor?: string; bgHover?: string; onClick: () => void; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = bgColor ?? (hovered && !disabled ? bgHover ?? "#f8fafc" : "#fff");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex min-h-28 flex-col items-start justify-between rounded-2xl p-4 text-left font-black transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        backgroundColor: bg,
        border: bgColor ? "none" : "1px solid #e4eaf2",
        color: bgColor ? color : "#0d1f35",
        boxShadow: bgColor ? "0 2px 10px rgba(16,185,129,.25)" : "0 1px 3px rgba(13,31,53,.06)",
      }}
    >
      <span className="flex w-full items-center justify-between">
        <span style={{ color: bgColor ? color : color }}>{icon}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase" style={{ backgroundColor: bgColor ? "rgba(255,255,255,.2)" : "#f1f5f9", color: bgColor ? "#fff" : "#64748b" }}>
          {badge}
        </span>
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,.07)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.35)" }}>{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function QueueTable({ state, onRecall }: { state: QueueState; onRecall: (id: string) => void }) {
  const entries = [...state.entries]
    .filter(e => ["waiting", "skipped"].includes(e.status))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.tokenNumber - b.tokenNumber);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em]" style={{ color: "#94a3b8" }}>Up next</p>
          <h2 className="mt-1.5 text-xl font-black" style={{ color: "#0d1f35" }}>Live patient queue</h2>
        </div>
        <span className="badge badge-slate">{entries.length} active</span>
      </div>

      <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
        {entries.length === 0
          ? <div className="py-10 text-center text-sm" style={{ color: "#94a3b8" }}>No patients waiting right now.</div>
          : entries.slice(0, 8).map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 py-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black"
                style={entry.status === "skipped"
                  ? { backgroundColor: "#fefce8", color: "#d97706" }
                  : idx === 0
                    ? { backgroundColor: "#d1fae5", color: "#065f46" }
                    : { backgroundColor: "#f1f5f9", color: "#475569" }}
              >
                {entry.tokenNumber}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: "#0d1f35" }}>{entry.patientName}</p>
                <p className="mt-0.5 text-xs" style={{ color: "#94a3b8" }}>
                  {entry.status === "skipped" ? "Skipped · ready to recall" : `${idx} ahead`}
                </p>
              </div>
              {entry.status === "skipped"
                ? <button onClick={() => onRecall(entry.id)} className="btn-ghost" style={{ padding: ".35rem .85rem", fontSize: ".75rem" }}>Recall</button>
                : <span className="text-xs font-semibold" style={{ color: "#c8d6e3" }}>···{entry.phone.slice(-4)}</span>
              }
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ActivityFeed({ state }: { state: QueueState }) {
  const dotColor = (tone: string) => ({ green: "#10b981", amber: "#f59e0b", blue: "#3b82f6", slate: "#cbd5e1" })[tone] ?? "#cbd5e1";
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em]" style={{ color: "#94a3b8" }}>Activity</p>
          <h2 className="mt-1.5 font-black" style={{ color: "#0d1f35" }}>Recent updates</h2>
        </div>
        <History size={17} style={{ color: "#c8d6e3" }} />
      </div>
      <div className="space-y-4">
        {state.activity.slice(0, 5).map(item => (
          <div key={item.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor(item.tone) }} />
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: "#475569" }}>{item.label}</p>
              <p className="truncate text-[11px]" style={{ color: "#94a3b8" }}>{item.detail} · {formatRelativeTime(item.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

