import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "doctor" | "nurse" | "admin" | "analytics";
export interface User { name: string; email: string; role: Role; }

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const lockedUser: User = {
  name: "Analytics Viewer",
  email: "analytics@discoverbioinsights.com",
  role: "analytics",
};

function normalizeAnalyticsUser(user: User | null) {
  if (!user) return lockedUser;
  return {
    ...lockedUser,
    ...user,
    role: "analytics",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") return lockedUser;
    try {
      const raw = window.localStorage.getItem("dbi.user");
      return normalizeAnalyticsUser(raw ? JSON.parse(raw) : null);
    } catch {
      return lockedUser;
    }
  });
  const login = (u: User) => {
    const nextUser = normalizeAnalyticsUser(u);
    window.localStorage.setItem("dbi.user", JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const logout = () => {
    window.localStorage.setItem("dbi.user", JSON.stringify(lockedUser));
    setUser(lockedUser);
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
}
