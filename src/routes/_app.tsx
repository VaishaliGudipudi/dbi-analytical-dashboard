import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, FlaskConical, Pill, Settings,
  BarChart3, FileText, UserCog, Bell, LogOut, Activity, ChevronLeft, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_app")({ component: AppShell });

const clinicalNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/staff", label: "Staff", icon: UserCog },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;
  const nav = user.role === "admin" ? adminNav : clinicalNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="h-14 flex items-center justify-between px-4 text-navy-foreground shadow-soft sticky top-0 z-40" style={{ background: "var(--navy)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-coral grid place-items-center">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Discover BioInsights</div>
            <div className="text-[11px] opacity-70 -mt-0.5">Emergency Analytics Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-coral" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
            <div className="h-7 w-7 rounded-full bg-coral grid place-items-center text-xs font-semibold">
              {user.name.split(" ").map(n => n[0]).slice(0,2).join("")}
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">{user.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate({ to: "/" }); }}
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`${collapsed ? "w-16" : "w-56"} transition-all flex flex-col text-sidebar-foreground shadow-soft`} style={{ background: "var(--sidebar)" }}>
          <nav className="flex-1 p-2 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = path === to || path.startsWith(to + "/");
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-coral text-coral-foreground font-semibold shadow-soft" : "hover:bg-white/5"}`}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
          <button onClick={() => setCollapsed(c => !c)}
            className="m-2 h-9 rounded-xl hover:bg-white/5 grid place-items-center text-sm">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
