"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, User, X } from "lucide-react";
import { AnimatedBackground } from "./_components/AnimatedBackground";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";
import { LoadingBar } from "./_components/LoadingBar";
import { OverlayPanel } from "./_components/OverlayPanel";
import { SignInForm } from "./_components/SignInForm";
import { SuccessAnimation } from "./_components/SuccessAnimation";
import { TiltCard } from "./_components/TiltCard";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/get-session", {
          headers: { "Content-Type": "application/json" },
        });
        const session = await res.json();
        if (session?.user?.name) setExistingUser(session.user.name);
      } catch {
        // No existing session
      }
    }
    checkSession();
  }, []);

  function handleSuccess(msg: string) {
    setSuccessMsg(msg);
    setShowSuccess(true);
  }

  function handleRedirectExisting() {
    router.push("/dashboard/student");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 bg-transparent transition-colors duration-500">
      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation message={successMsg} onComplete={() => setShowSuccess(false)} />
        )}
      </AnimatePresence>

      <AnimatedBackground isDark={isDark} />

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 18 }}
        className="absolute top-6 left-6 z-30"
      >
        <motion.div
          whileHover={{ scale: 1.08, boxShadow: "0 8px 30px rgba(2, 136, 209, 0.25)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="rounded-full bg-linear-to-r from-[#29b6f6] to-[#0288d1] p-[2px]"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white dark:bg-slate-800
                       text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600
                       transition-colors duration-200"
          >
            <motion.svg
              animate={{ x: [0, -4, 0] }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </motion.svg>
            Home
          </Link>
        </motion.div>
      </motion.div>

      {/* Theme toggle */}
      <motion.div
        initial={{ opacity: 0, x: 30, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 18 }}
        className="absolute top-6 right-6 z-30"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center
                     text-slate-600 dark:text-yellow-400 hover:shadow-lg transition-all duration-200 cursor-pointer
                     border border-slate-200 dark:border-slate-600"
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Returning user banner */}
      <AnimatePresence>
        {existingUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-sky-100 dark:border-slate-600">
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Welcome back, <strong className="text-sky-600">{existingUser}</strong>!
              </span>
              <button
                onClick={handleRedirectExisting}
                className="px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition-colors cursor-pointer"
              >
                Continue →
              </button>
              <button
                onClick={() => setExistingUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop card */}
      <TiltCard className="relative w-full max-w-[820px] min-h-[540px] rounded-[28px] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 hidden md:block">
        <LoadingBar isLoading={isFormLoading} />

        <div className="relative w-full min-h-[540px] bg-white dark:bg-slate-800 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-8 py-8">
            <SignInForm onSuccess={handleSuccess} onLoadingChange={setIsFormLoading} />
          </div>

          <div className="absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-8 py-8">
            <ForgotPasswordForm onBack={() => setIsSignUp(false)} />
          </div>

          <OverlayPanel isSignUp={isSignUp} onToggle={() => setIsSignUp(!isSignUp)} />
        </div>
      </TiltCard>

      {/* Mobile card */}
      <div className="md:hidden w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden transition-colors duration-500"
        >
          <div className="flex bg-slate-50 dark:bg-slate-700">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3.5 text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                !isSignUp
                  ? "text-sky-600 border-b-2 border-sky-500 bg-white dark:bg-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3.5 text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                isSignUp
                  ? "text-sky-600 border-b-2 border-sky-500 bg-white dark:bg-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Forgot Password
            </button>
          </div>
          <div className="px-6 py-8">
            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <motion.div key="m-signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <SignInForm onSuccess={handleSuccess} onLoadingChange={setIsFormLoading} />
                </motion.div>
              ) : (
                <motion.div key="m-forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <ForgotPasswordForm onBack={() => setIsSignUp(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
