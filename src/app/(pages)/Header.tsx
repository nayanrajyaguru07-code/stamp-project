"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Cookies from "js-cookie";

/* ============================================================
   HEADER COMPONENT
=============================================================== */
export function Header({
  route,
  setRoute,
}: {
  route: "home" | "generate" | "dashboard";
  setRoute: (route: "home" | "generate" | "dashboard") => void;
}) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const adminToken = localStorage.getItem("adminAccessToken");

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminAccessToken");
      const localUser = localStorage.getItem("user");
      let isLocalAdmin = false;
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.role === "admin" || parsed.role === "Admin") {
            isLocalAdmin = true;
          }
        } catch (e) {}
      }
      return !!adminToken || isLocalAdmin;
    };

    if (adminToken && !user) {
      // Fake user object for UI persistence
      const adminUser = {
        name: "Admin",
        email: "admin@system.local",
        role: "Admin",
      };

      // Store in localStorage for AuthContext hydration
      localStorage.setItem("authToken", adminToken);

      window.dispatchEvent(new Event("auth-updated"));
    }

    setIsAdmin(checkAdmin());
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => {
      setAuthMode("login");
      setIsAuthOpen(true);
      setIsMobileMenuOpen(false);
    };

    window.addEventListener("open-login", handleOpenLogin);
    return () => window.removeEventListener("open-login", handleOpenLogin);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const adminToken = Cookies.get("adminAccessToken");
      const localUser = localStorage.getItem("user");
      let isLocalAdmin = false;
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.role === "admin" || parsed.role === "Admin") {
            isLocalAdmin = true;
          }
        } catch (e) {}
      }
      setIsAdmin(!!adminToken || isLocalAdmin);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (r: "home" | "generate" | "dashboard") => {
    setRoute(r);
    setIsMobileMenuOpen(false);
  };

  const openProfile = () => {
    setIsProfileOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-6 py-4">
        <div className="rounded-2xl border border-gray-300 bg-white shadow-xl p-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                sizes="48px"
                className="object-contain rounded-full"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Stamp Designer</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Precision • Creativity • Tools
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setRoute("home")}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                route === "home"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Home
            </button>

            {isAdmin && (
              <button
                onClick={() => setRoute("dashboard")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  route === "dashboard"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Dashboard
              </button>
            )}

            <button
              onClick={() => {
                if (!user) {
                  setIsAuthOpen(true);
                  return;
                }
                setRoute("generate");
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                route === "generate"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Generator
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {authLoading ? (
              <div className="px-5 py-2.5 text-gray-400">Loading...</div>
            ) : user || isAdmin ? (
              <button
                onClick={openProfile}
                className="px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium"
              >
                {isAdmin ? "Admin" : user?.name}
              </button>
            ) : (
              <button
                onClick={openLogin}
                className="px-5 py-2.5 rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all"
              >
                Login
              </button>
            )}
          </nav>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </header>
      {/* MOBILE MENU */}
      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl rounded-l-3xl p-6 flex flex-col animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-bold">Menu</div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Profile Card */}
            {(user || isAdmin) && (
              <div
                onClick={openProfile}
                className="cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center gap-4 mb-6 shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {isAdmin ? "A" : user?.name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="font-semibold">
                    {isAdmin ? "Admin" : user?.name}
                  </div>
                  <div className="text-xs opacity-80">
                    {isAdmin ? "Administrator" : user?.email}
                  </div>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 space-y-3">
              <MobileNavButton
                label="Home"
                active={route === "home"}
                onClick={() => handleNavClick("home")}
              />

              <MobileNavButton
                label="Generator"
                active={route === "generate"}
                onClick={() => {
                  if (!user && !isAdmin) {
                    setIsAuthOpen(true);
                    setIsMobileMenuOpen(false);
                    return;
                  }
                  handleNavClick("generate");
                }}
              />

              {isAdmin && (
                <MobileNavButton
                  label="Dashboard"
                  active={route === "dashboard"}
                  onClick={() => handleNavClick("dashboard")}
                  badge="Admin"
                />
              )}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-6 border-t space-y-3">
              {user || isAdmin ? (
                <button
                  onClick={openProfile}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                >
                  Open Profile
                </button>
              ) : (
                <button
                  onClick={openLogin}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold shadow"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER AUTH DIALOG */}
      <AuthDialog
        open={isAuthOpen}
        mode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
        onAdminLogin={() => {
          setIsAuthOpen(false);
          setIsAdminAuthOpen(true);
        }}
      />

      {/* ADMIN AUTH DIALOG */}
      <AdminLoginDialog
        open={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
      />

      {/* 
      
      
      */}
      <ProfileDialog
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

// ------------------
//  button style
// ------------------

function MobileNavButton({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow"
          : "bg-gray-50 hover:bg-gray-100 text-gray-800"
      }`}
    >
      <span>{label}</span>

      {badge && (
        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

<style jsx>{`
  .animate-slideIn {
    animation: slideIn 0.25s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`}</style>;

/* ============================================================
   AUTH DIALOG
=============================================================== */
function AuthDialog({
  open,
  mode,
  onClose,
  onModeChange,
  onAdminLogin,
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onModeChange: (mode: "login" | "register") => void;
  onAdminLogin: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white"
          >
            ✕
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Welcome Back" : "Join Us"}
            </h2>
          </div>
        </div>

        <div className="p-8 pt-6">
          {mode === "login" ? (
            <LoginForm onSuccess={onClose} />
          ) : (
            <RegisterForm onSuccess={() => onModeChange("login")} />
          )}

          {mode === "login" && (
            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              <div>
                Don’t have an account?{" "}
                <button
                  className="text-indigo-600 font-semibold"
                  onClick={() => onModeChange("register")}
                >
                  Create Account
                </button>
              </div>

              <div>
                Are you an admin?{" "}
                <button
                  onClick={onAdminLogin}
                  className="text-red-600 font-semibold"
                >
                  Admin Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN FORM
=============================================================== */
function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return toast.error(data.message);

    login(data.token, data.user);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full border px-4 py-3 rounded-xl"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full border px-4 py-3 rounded-xl"
      />
      <button
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
      >
        {loading ? "Logging in..." : "Sign In"}
      </button>
    </form>
  );
}

/* ============================================================
   REGISTER FORM
=============================================================== */
function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_no, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone_no, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return toast.error(data.message);

    toast.success("Account created! Please login.");
    onSuccess?.();
  }

  return (
    <form onSubmit={register} className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full border px-3 py-2.5 rounded-xl"
      />
      <input
        value={phone_no}
        onChange={(e) => setPhoneNo(e.target.value)}
        placeholder="Phone"
        className="w-full border px-3 py-2.5 rounded-xl"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full border px-3 py-2.5 rounded-xl"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full border px-3 py-2.5 rounded-xl"
      />
      <button
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}

/* ============================================================
   ADMIN LOGIN DIALOG
=============================================================== */
function AdminLoginDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const ADMIN_SECRET = "harrypotter";

  const MAX_TRIES = 5;
  const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

  // ⚠️ Demo only — move this check to backend for real security

  if (!open) return null;

  function getLockInfo() {
    const lockUntil = localStorage.getItem("adminLockUntil");
    const tries = localStorage.getItem("adminTries");
    return {
      lockUntil: lockUntil ? Number(lockUntil) : null,
      tries: tries ? Number(tries) : 0,
    };
  }

  function setLockInfo(tries: number, lockUntil?: number) {
    localStorage.setItem("adminTries", String(tries));
    if (lockUntil) {
      localStorage.setItem("adminLockUntil", String(lockUntil));
    }
  }

  function resetLockInfo() {
    localStorage.removeItem("adminTries");
    localStorage.removeItem("adminLockUntil");
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();

    const { lockUntil, tries } = getLockInfo();

    // 🔒 Check if locked
    if (lockUntil && Date.now() < lockUntil) {
      const minsLeft = Math.ceil((lockUntil - Date.now()) / 60000);
      toast.error(`Admin login blocked. Try again in ${minsLeft} minute(s).`);
      return;
    }

    // 🔐 Secret check (client-side UX only)
    if (secret !== ADMIN_SECRET) {
      const newTries = tries + 1;

      if (newTries >= MAX_TRIES) {
        const until = Date.now() + LOCK_TIME_MS;
        setLockInfo(newTries, until);
        toast.error(
          "Too many failed attempts. Admin login blocked for 30 minutes.",
        );
      } else {
        setLockInfo(newTries);
        toast.error(
          `Invalid secret key. ${MAX_TRIES - newTries} attempt(s) left.`,
        );
      }

      return;
    }

    // ✅ Secret correct → reset tries
    resetLockInfo();

    // Continue real admin login
    setLoading(true);

    const res = await fetch("/api/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        secret,
        isAdmin: true,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return toast.error(data.message || "Admin login failed");

   // Save admin auth properly
localStorage.setItem("adminAccessToken", data.token);
localStorage.setItem(
  "user",
  JSON.stringify({
    id: 0,
    name: "Admin",
    email: "admin",
    role: "admin",
    credits: 0,
  })
);

// Notify app
window.dispatchEvent(new Event("auth-updated"));

toast.success("Admin logged in!");
onClose();

  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white"
          >
            ✕
          </button>
          <div className="text-white text-xl font-bold">👑 Admin Login</div>
        </div>

        <form onSubmit={handleAdminLogin} className="p-8 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin Email"
            className="w-full border px-4 py-3 rounded-xl"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full border px-4 py-3 rounded-xl"
            required
          />
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            type="password"
            placeholder="Secret Key"
            className="w-full border px-4 py-3 rounded-xl"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE DIALOG
=============================================================== */
function ProfileDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const isAdmin = Cookies.get("adminAccessToken");

  if (!open || (!user && !isAdmin)) return null;

  const displayName = isAdmin ? "Admin" : user?.name || "User";
  const displayEmail = isAdmin ? "admin@system.local" : user?.email || "-";
  const plan = isAdmin ? "Administrator" : user?.plan || "Free Plan";
  const credits = isAdmin ? "∞" : (user?.credits ?? 0);

  function handleLogout() {
    if (isAdmin) {
      Cookies.remove("adminAccessToken");
    }
    logout();
    onClose();
    window.location.href = "/"; // redirect home
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="text-lg font-semibold">{displayName}</div>
            <div className="text-sm opacity-80">{displayEmail}</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <ProfileRow label="Current Plan" value={plan} badge />

          <ProfileRow
            label="Credits Remaining"
            value={String(credits)}
            highlight
          />

          {!isAdmin && user?.phone_no && (
            <ProfileRow label="Phone" value={user.phone_no} />
          )}

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold shadow hover:bg-red-700 transition"
            >
              Logout
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  badge,
  highlight,
}: {
  label: string;
  value: string;
  badge?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>

      {badge ? (
        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
          {value}
        </span>
      ) : (
        <span
          className={`text-sm font-semibold ${
            highlight ? "text-green-600" : "text-gray-800"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}  