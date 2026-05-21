import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { User, Lock, Palette, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/settings")({ component: Page });

type Tab = "profile" | "password" | "display" | "notifications";

function Page() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage your account, password and preferences</p>
      <div className="grid grid-cols-[220px_1fr] gap-5">
        <div className="space-y-1.5">
          {([
            {id:"profile" as Tab,label:"Profile & Account",Icon:User},
            {id:"password" as Tab,label:"Password",Icon:Lock},
            {id:"display" as Tab,label:"Display",Icon:Palette},
            {id:"notifications" as Tab,label:"Notifications",Icon:Bell},
          ]).map(t => {
            const active = tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${active?"text-white shadow-soft":"bg-card text-navy border border-border hover:bg-secondary/40"}`}
                style={active?{background:"var(--amber-emerg)"}:undefined}>
                <t.Icon className="h-4 w-4"/>{t.label}
              </button>
            );
          })}
        </div>
        <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
          {tab==="profile" && <Profile user={user!}/>}
          {tab==="password" && <Password/>}
          {tab==="display" && <Display/>}
          {tab==="notifications" && <Notifications/>}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral";
function L({label,children}:any){return <div><label className="text-xs font-semibold text-navy block mb-1">{label}</label>{children}</div>;}

function Profile({ user }: any) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState("+91 9876543210");
  const [dept, setDept] = useState("Emergency Medicine");
  return (
    <form onSubmit={e=>{e.preventDefault();toast.success("Profile updated");}} className="space-y-4">
      <h2 className="font-bold text-navy">Profile & Account</h2>
      <div className="grid grid-cols-2 gap-4">
        <L label="Full Name"><input value={name} onChange={e=>setName(e.target.value)} className={inp}/></L>
        <L label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inp}/></L>
        <L label="Phone"><input value={phone} onChange={e=>setPhone(e.target.value)} className={inp}/></L>
        <L label="Department"><input value={dept} onChange={e=>setDept(e.target.value)} className={inp}/></L>
        <L label="Role"><input value={user.role} disabled className={`${inp} bg-secondary/40`}/></L>
      </div>
      <button className="px-5 py-2 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Save Profile</button>
    </form>
  );
}
function Password() {
  const [a,setA]=useState(""); const [b,setB]=useState(""); const [c,setC]=useState("");
  return (
    <form onSubmit={e=>{e.preventDefault(); if(b!==c)return toast.error("Passwords don't match"); toast.success("Password changed");}} className="space-y-4 max-w-md">
      <h2 className="font-bold text-navy">Change Password</h2>
      <L label="Current Password"><input type="password" value={a} onChange={e=>setA(e.target.value)} className={inp}/></L>
      <L label="New Password"><input type="password" value={b} onChange={e=>setB(e.target.value)} className={inp}/></L>
      <L label="Confirm New Password"><input type="password" value={c} onChange={e=>setC(e.target.value)} className={inp}/></L>
      <button className="px-5 py-2 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Update Password</button>
    </form>
  );
}
function Display() {
  const [theme,setTheme]=useState("light"); const [density,setDensity]=useState("comfortable");
  return (
    <form onSubmit={e=>{e.preventDefault();toast.success("Display preferences saved");}} className="space-y-4 max-w-md">
      <h2 className="font-bold text-navy">Display Preferences</h2>
      <L label="Theme"><select value={theme} onChange={e=>setTheme(e.target.value)} className={inp}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></L>
      <L label="Density"><select value={density} onChange={e=>setDensity(e.target.value)} className={inp}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></L>
      <button className="px-5 py-2 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Save</button>
    </form>
  );
}
function Notifications() {
  const [crit,setCrit]=useState(true); const [bed,setBed]=useState(true); const [email,setEmail]=useState(false);
  return (
    <form onSubmit={e=>{e.preventDefault();toast.success("Notifications updated");}} className="space-y-3">
      <h2 className="font-bold text-navy mb-2">Notifications</h2>
      {[{l:"Critical alerts (Level I patients)",v:crit,s:setCrit},{l:"Bed/ward capacity warnings",v:bed,s:setBed},{l:"Email digest (daily)",v:email,s:setEmail}].map((x,i)=>(
        <label key={i} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-secondary/30">
          <input type="checkbox" checked={x.v} onChange={e=>x.s(e.target.checked)} className="h-4 w-4 accent-coral"/>
          <span className="text-sm text-navy">{x.l}</span>
        </label>
      ))}
      <button className="px-5 py-2 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Save</button>
    </form>
  );
}
