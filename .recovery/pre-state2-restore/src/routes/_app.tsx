import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, FlaskConical, Pill, Settings, FileText,
  UserCog, Bell, LogOut, ChevronLeft, ChevronRight, User as UserIcon, Beaker, Stethoscope, BarChart3,
} from "lucide-react";
import logo from "@/assets/discover_bio_logo.svg";
import { ReportsModal } from "@/components/app/ReportsModal";
import { EncounterCopilotDock } from "@/copilot/components/EncounterCopilotDock";
import { CopilotProvider } from "@/copilot/context/CopilotProvider";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { getEdSnapshot } from "@/lib/edApi";

export const Route = createFileRoute("/_app")({
  loader: async () => getEdSnapshot(),
  component: AppShell,
});

const clinicalNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/masters/medications", label: "Medication Master", icon: Pill },
  { to: "/masters/lab-panels", label: "Lab Panel Master", icon: Beaker },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/staff", label: "Staff", icon: UserCog },
  { to: "/masters/medications", label: "Medication Master", icon: Pill },
  { to: "/masters/lab-panels", label: "Lab Panel Master", icon: Beaker },
  { to: "/settings", label: "Settings", icon: Settings },
];

const analyticsNav = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/analytics-v2", label: "Analytics Ver 2", icon: BarChart3 },
  { to: "/analytics-v3", label: "Analytics Ver 3", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const { patients, wards } = Route.useLoaderData();
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
  const nav = user.role === "analytics" ? analyticsNav : user.role === "admin" ? adminNav : clinicalNav;

  return (
    <CopilotProvider>
      <CopilotRouteBindings currentPath={path} patients={patients} role={user.role} />
      <div className="min-h-screen flex flex-col bg-background">
        <header className="h-14 flex items-center justify-between gap-3 px-3 sm:px-4 text-navy-foreground shadow-soft sticky top-0 z-40" style={{ background: "var(--navy)" }}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Discover BioInsights" className="h-10 w-10 object-contain" />
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Discover BioInsights</div>
              <div className="hidden sm:block text-[11px] opacity-70 -mt-0.5">Emergency Analytics Platform</div>
            </div>
          </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CopilotHeaderButton />
              {user.role === "analytics" ? (
                <button onClick={() => setReportsOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
                  <FileText className="h-4 w-4" /> Reports
                </button>
              ) : null}
            <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-orange/20 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange" />
            </button>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <div className="h-7 w-7 rounded-full bg-coral grid place-items-center text-xs font-semibold">
                  {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="hidden lg:block text-sm leading-tight text-left">
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
          <aside className={`${collapsed ? "xl:w-16" : "xl:w-56"} w-16 sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 transition-all flex flex-col text-sidebar-foreground shadow-soft`} style={{ background: "var(--sidebar)" }}>
            <nav className="flex-1 p-2 space-y-1">
              {nav.map(({ to, label, icon: Icon }) => {
                const active = path === to || path.startsWith(to + "/");
                return (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-orange text-orange-foreground font-semibold shadow-soft" : "hover:bg-white/5"}`}>
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="hidden xl:inline">{label}</span>}
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => setCollapsed(c => !c)}
              className="hidden xl:grid m-2 h-9 rounded-xl hover:bg-orange/10 place-items-center text-sm transition-colors">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </aside>

          <main className="flex-1 min-w-0 overflow-auto">
            <Outlet />
          </main>
        </div>
        <EncounterCopilotDock floating />
        {reportsOpen && <ReportsModal patients={patients} wards={wards} onClose={() => setReportsOpen(false)} />}
      </div>
    </CopilotProvider>
  );
}

function CopilotHeaderButton() {
  const { open, setOpen } = useCopilot();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/20"
    >
      <Stethoscope className="h-4 w-4" />
      Copilot
    </button>
  );
}

function CopilotRouteBindings({
  currentPath,
  patients,
  role,
}: {
  currentPath: string;
  patients: { id: string; name: string; bed: string; status: "ed" | "obs" | "discharged" }[];
  role: "doctor" | "nurse" | "admin" | "analytics";
}) {
  const navigate = useNavigate();
  const { setRouteBindings } = useCopilot();

  useEffect(() => {
      const routeAliases =
        role === "analytics"
          ? ["/analytics", "/analytics-v2", "/analytics-v3", "/settings"]
          : ["/dashboard", "/patients", "/register", "/settings", "/masters/medications", "/masters/lab-panels", "/rapid"];
      setRouteBindings({
        currentRoute: currentPath,
        availableRoutes: routeAliases,
        availablePatients: patients.map((patient) => ({
          id: patient.id,
          name: patient.name,
          bed: patient.bed,
          status: patient.status,
        })),
        navigateRoute: (route) => {
        const to = route.startsWith("/") ? route : `/${route}`;
        navigate({ to: to as never });
      },
      openPatient: (patientId) => {
        navigate({ to: "/patient/$id/workspace", params: { id: patientId } });
      },
    });

    return () => setRouteBindings(null);
  }, [currentPath, navigate, patients, role, setRouteBindings]);

  return null;
}
