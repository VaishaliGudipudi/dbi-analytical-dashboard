import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Briefcase, HeartPulse, Stethoscope, X } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import logo from "@/assets/discover_bio_logo.svg";

export const Route = createFileRoute("/")({ component: Login });

const roles: { id: Role; label: string; desc: string; Icon: any }[] = [
  { id: "doctor", label: "Doctor", desc: "Patient care & clinical workflow", Icon: Stethoscope },
  { id: "nurse", label: "Nurse", desc: "Triage & vitals documentation", Icon: HeartPulse },
  { id: "admin", label: "Admin", desc: "Department & performance reports", Icon: Briefcase },
];

function Login() {
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState("dr.tejaswi@hospital.in");
  const [password, setPassword] = useState("demo");
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name =
      role === "doctor" ? "Dr. Tejaswi" :
      role === "nurse" ? "Nurse Anita" : "Admin Patel";
    login({ name, email, role });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen overflow-hidden flex flex-col" style={{ background: "var(--navy)" }}>
      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-3 mb-2">
              <img src={logo} alt="Discover BioInsights" className="h-12 w-12 object-contain" />
              <span className="text-2xl font-semibold text-navy-foreground tracking-tight">Discover BioInsights</span>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.85 0.02 80)" }}>Emergency Analytics Platform</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            {roles.map(({ id, label, desc, Icon }) => {
              const active = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={`rounded-2xl p-4 text-left transition-all shadow-soft hover:shadow-soft-lg ${active ? "-translate-y-0.5 ring-2" : "bg-card ring-1 ring-transparent"}`}
                  style={active ? { background: "var(--amber-emerg)", color: "white", boxShadow: "0 8px 24px -8px var(--amber-emerg)" } : undefined}
                >
                  <Icon className={`h-6 w-6 mb-3 ${active ? "text-white" : "text-coral"}`} />
                  <div className={`font-semibold text-base ${active ? "text-white" : "text-navy"}`}>{label}</div>
                  <div className={`text-xs mt-1 ${active ? "text-white/85" : "text-muted-foreground"}`}>{desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="bg-card rounded-2xl p-5 shadow-soft-lg space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
            </div>
            <button type="submit" className="w-full rounded-lg py-3 font-semibold text-white shadow-soft transition-transform active:scale-[0.99]"
              style={{ background: "var(--amber-emerg)" }}>
              Sign in as {roles.find(r => r.id === role)?.label}
            </button>
            <a
              href="mailto:contactus@discoverbioinsights.com?subject=Password%20reset%20request"
              className="block w-full rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-navy transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-coral"
            >
              Forgot password?
            </a>
          </form>
        </div>
      </div>
      {showSecurityNotice && (
        <div className="fixed bottom-14 left-4 right-4 z-50 rounded-lg border border-amber-300 bg-amber-50 p-3 pr-10 text-amber-950 shadow-soft-lg md:left-auto md:right-5 md:max-w-xs">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Security Notice</p>
              <p className="mt-1 text-xs leading-4">
                Only sign in on <strong>app.discoverbioinsights.com</strong> or an approved
                hospital environment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSecurityNotice(false)}
            className="absolute right-2 top-2 rounded-md p-1 text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Dismiss security notice"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <footer className="space-y-1 text-center text-xs py-2" style={{ color: "oklch(0.7 0.02 80)" }}>
        <p>Discover BioInsights v1.0</p>
        <p>
          Support:{" "}
          <a className="font-semibold text-navy-foreground hover:underline" href="mailto:contactus@discoverbioinsights.com">
            contactus@discoverbioinsights.com
          </a>{" "}
          |{" "}
          <a className="font-semibold text-navy-foreground hover:underline" href="https://www.discoverbioinsights.com">
            www.discoverbioinsights.com
          </a>
        </p>
      </footer>
    </div>
  );
}
