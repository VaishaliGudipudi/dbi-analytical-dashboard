import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, FlaskConical, Pill, Settings, BarChart3, FileText,
  UserCog, Bell, LogOut, ChevronLeft, ChevronRight, User as UserIcon, Beaker,
} from "lucide-react";
import logo from "@/assets/discover_bio_logo.svg";
import { ReportsModal } from "@/components/app/ReportsModal";

export const Route = createFileRoute("/_app")({ component: AppShell });

const clinicalNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/analytics", label: "Performance Analytics", icon: BarChart3 },
  { to: "/masters/medications", label: "Medication Master", icon: Pill },
  { to: "/masters/lab-panels", label: "Lab Panel Master", icon: Beaker },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/analytics", label: "Performance Analytics", icon: BarChart3 },
  { to: "/staff", label: "Staff", icon: UserCog },
  { to: "/masters/medications", label: "Medication Master", icon: Pill },
  { to: "/masters/lab-panels", label: "Lab Panel Master", icon: Beaker },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;
  const nav = user.role === "admin" ? adminNav : clinicalNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="h-14 flex items-center justify-between px-4 text-navy-foreground shadow-soft sticky top-0 z-40" style={{ background: "var(--navy)" }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Discover BioInsights" className="h-10 w-10 object-contain" />
          <div>
            <div className="text-sm font-semibold tracking-tight">Discover BioInsights</div>
            <div className="text-[11px] opacity-70 -mt-0.5">Emergency Analytics Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setReportsOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
            <FileText className="h-4 w-4" /> Reports
          </button>
          <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-orange/20 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange" />
          </button>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <div className="h-7 w-7 rounded-full bg-coral grid place-items-center text-xs font-semibold">
                {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="text-sm leading-tight text-left">
                <div className="font-medium">{user.name}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">{user.role}</div>
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-card text-navy shadow-soft-lg border border-border overflow-hidden z-50">
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/40">
                  <UserIcon className="h-4 w-4" /> Profile & Account
                </Link>
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/40">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <div className="border-t border-border" />
                <button onClick={() => { logout(); navigate({ to: "/" }); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/40 text-coral">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`${collapsed ? "w-16" : "w-56"} sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 transition-all flex flex-col text-sidebar-foreground shadow-soft`} style={{ background: "var(--sidebar)" }}>
          <nav className="flex-1 p-2 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = path === to || path.startsWith(to + "/");
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-orange text-orange-foreground font-semibold shadow-soft" : "hover:bg-white/5"}`}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
          <button onClick={() => setCollapsed(c => !c)}
            className="m-2 h-9 rounded-xl hover:bg-orange/10 grid place-items-center text-sm transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
      {reportsOpen && <ReportsModal onClose={() => setReportsOpen(false)} />}
    </div>
  );
}
