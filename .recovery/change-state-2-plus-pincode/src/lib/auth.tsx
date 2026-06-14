import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "doctor" | "nurse" | "admin" | "analytics";
export interface User { name: string; email: string; role: Role; }

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("dbi.user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const login = (u: User) => {
    window.localStorage.setItem("dbi.user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    window.localStorage.removeItem("dbi.user");
    setUser(null);
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
}
