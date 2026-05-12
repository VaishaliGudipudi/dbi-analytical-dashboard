import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stethoscope, HeartPulse, BarChart3, Briefcase } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/")({ component: Login });

const roles: { id: Role; label: string; desc: string; Icon: any }[] = [
  { id: "doctor", label: "Doctor", desc: "Patient care & clinical workflow", Icon: Stethoscope },
  { id: "nurse", label: "Nurse", desc: "Triage & vitals documentation", Icon: HeartPulse },
  { id: "analytics", label: "Analytics", desc: "ED operational & clinical insights", Icon: BarChart3 },
  { id: "admin", label: "Admin", desc: "Department & performance reports", Icon: Briefcase },
];

function Login() {
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState("dr.tejaswi@hospital.in");
  const [password, setPassword] = useState("demo");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name =
      role === "doctor" ? "Dr. Tejaswi" :
      role === "nurse" ? "Nurse Anita" :
      role === "analytics" ? "Analyst Rao" : "Admin Patel";
    login({ name, email, role });
    navigate({ to: role === "analytics" || role === "admin" ? "/analytics" : "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--navy)" }}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <img src={logo} alt="Discover BioInsights" className="h-14 w-14 rounded-2xl object-contain bg-white shadow-soft-lg" />
              <span className="text-2xl font-semibold text-navy-foreground tracking-tight">Discover BioInsights</span>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.85 0.02 80)" }}>Emergency Analytics Platform</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {roles.map(({ id, label, desc, Icon }) => {
              const active = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={`rounded-2xl p-5 text-left transition-all shadow-soft hover:shadow-soft-lg ${active ? "-translate-y-0.5 ring-2" : "bg-card ring-1 ring-transparent"}`}
                  style={active ? { background: "var(--amber-emerg)", color: "white", boxShadow: "0 8px 24px -8px var(--amber-emerg)" } : undefined}
                >
                  <Icon className={`h-7 w-7 mb-3 ${active ? "text-white" : "text-coral"}`} />
                  <div className={`font-semibold text-base ${active ? "text-white" : "text-navy"}`}>{label}</div>
                  <div className={`text-xs mt-1 ${active ? "text-white/85" : "text-muted-foreground"}`}>{desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="bg-card rounded-2xl p-6 shadow-soft-lg space-y-3">
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
          </form>
        </div>
      </div>
      <footer className="text-center text-xs py-4" style={{ color: "oklch(0.7 0.02 80)" }}>
        Discover BioInsights v1.0 — Apollo Hospitals, Hyderabad
      </footer>
    </div>
  );
}
