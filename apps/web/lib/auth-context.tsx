"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth } from "./api";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("aissisted_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await auth.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem("aissisted_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password);
    localStorage.setItem("aissisted_token", data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await auth.register(email, password);
    localStorage.setItem("aissisted_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("aissisted_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
