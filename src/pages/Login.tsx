import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Package,
  CreditCard,
} from "lucide-react";
import { useAppStore } from "../store";
import { Button } from "../components/ui";
import { api, errorMessage } from "../lib/api";
export default function Login() {
  const s = useAppStore();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [setupToken, setSetupToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(s.needsSetup ? "/setup" : "/login", {
        name,
        email,
        password,
        ...(s.needsSetup ? { setupToken } : {}),
      });
      await s.checkAuth();
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusy(false);
  }
  return (
    <div className="grid min-h-screen grid-cols-2">
      <section className="relative flex flex-col justify-between bg-noir p-16 text-white">
        <div className="text-xl font-medium tracking-[.25em] text-gold">
          VENDA
          <span className="ml-4 text-xs tracking-normal text-white/30">
            BY FRESHMARK
          </span>
        </div>
        <div>
          <p className="eyebrow mb-6 text-gold">OPERATIONS INTELLIGENCE</p>
          <h1 className="max-w-md text-2xl leading-tight">
            Every delivery.
            <br />
            Every shelf.
            <br />
            <span className="text-gold">One clear view.</span>
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-7 text-white/40">
            The connected workspace for FreshMark Retail Zimbabwe. Built for the
            people keeping retail moving.
          </p>
          <div className="mt-12 flex gap-8 text-sm text-white/50">
            {[
              [Truck, "Logistics"],
              [Package, "Inventory"],
              [CreditCard, "Supplier credit"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Truck;
              return (
                <div className="flex items-center gap-2" key={String(label)}>
                  <I aria-hidden size={15} className="text-gold" />
                  {String(label)}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-white/20">
          HARARE, ZIMBABWE · FRESHMARK RETAIL
        </p>
      </section>
      <section className="flex items-center justify-center bg-ivory">
        <form className="w-[340px]" onSubmit={(e) => void submit(e)}>
          <ShieldCheck aria-hidden size={28} className="mb-6 text-gold" />
          <p className="eyebrow mb-3">YOUR WORKSPACE AWAITS</p>
          <h1>{s.needsSetup ? "Welcome to VENDA" : "Welcome back"}</h1>
          <p className="mb-8 mt-3 leading-5 text-muted">
            {s.needsSetup
              ? "Create the first administrator account to initialise your FreshMark workspace."
              : "Sign in to your FreshMark operations workspace."}
          </p>
          <div className="space-y-5">
            {s.needsSetup && s.setupProtected && (
              <label className="field">
                Workspace setup key
                <input
                  aria-label="Workspace setup key"
                  type="password"
                  autoComplete="off"
                  required
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                />
                <span className="text-xs">
                  Use the SETUP_TOKEN in your hosting environment. Required only
                  once.
                </span>
              </label>
            )}
            {s.needsSetup && (
              <label className="field">
                Full name
                <input
                  autoComplete="name"
                  aria-label="Full name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label className="field">
              Work email
              <input
                autoComplete="username"
                aria-label="Work email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              Password{s.needsSetup ? " · at least 12 characters" : ""}
              <input
                aria-label="Password"
                type="password"
                autoComplete={
                  s.needsSetup ? "new-password" : "current-password"
                }
                required
                minLength={s.needsSetup ? 12 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded bg-danger-tint p-3 text-danger"
              >
                {error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={busy}>
              {busy
                ? "Connecting…"
                : s.needsSetup
                  ? "Create workspace"
                  : "Sign in"}
              <ArrowRight aria-hidden size={13} />
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            Secure access · Role-based permissions · FreshMark Zimbabwe
          </p>
        </form>
      </section>
    </div>
  );
}
