"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

type User = {
  phone_no: string;
  id: string;
  name: string;
  email: string;
  credits: number;
  plan?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Restore session on refresh
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser();
  }, []);

  // 🔄 Validate token + fetch fresh user
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login.php", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Session expired");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      localStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Call this after successful login
  const login = (token: string, user: User) => {
    localStorage.setItem("authToken", token);
    setUser(user);
    toast.success("Logged in successfully!");
  };

  // 🚪 Logout everywhere
  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    toast.success("Logged out.");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔌 Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
