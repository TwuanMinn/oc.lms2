"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Mail } from "lucide-react";
import { toast } from "sonner";
import { IconInput } from "./IconInput";
import { ShimmerButton } from "./ShimmerButton";
import { StaggerContainer, StaggerItem } from "./Stagger";

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/reset-password" }),
      });

      if (res.ok) {
        setIsSent(true);
        toast.success("Reset link sent! Check your email.");
      } else {
        setIsSent(true);
        toast.success("If this email exists, a reset link was sent.");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      animate={hasError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => setHasError(false)}
      className="w-full flex flex-col items-center"
    >
      <StaggerContainer className="w-full flex flex-col items-center">
        <StaggerItem>
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-sky-500" />
              <span className="text-sm font-bold text-sky-600 tracking-wide">GREEN ACADEMY</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-widest">
              Learn · Grow · Succeed
            </p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isSent ? "Check Your Email" : "Reset Password"}
          </h1>
        </StaggerItem>

        <StaggerItem>
          <p className="text-xs text-slate-400 mb-5 text-center max-w-[260px]">
            {isSent
              ? "We've sent a password reset link to your email address."
              : "Enter your email and we'll send you a reset link"}
          </p>
        </StaggerItem>

        {isSent ? (
          <StaggerItem className="w-full">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[240px]">
                Didn&apos;t get the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSent(false);
                    setEmail("");
                  }}
                  className="text-sky-500 font-semibold hover:underline cursor-pointer"
                >
                  try again
                </button>
              </p>
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-sky-500 font-semibold hover:underline cursor-pointer mt-2"
              >
                ← Back to Sign In
              </button>
            </div>
          </StaggerItem>
        ) : (
          <StaggerItem className="w-full">
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <div>
                <IconInput
                  icon={Mail}
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>

              <ShimmerButton type="submit" disabled={isLoading || !email.trim()} isLoading={isLoading}>
                Send Reset Link
              </ShimmerButton>

              <p className="text-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs text-sky-500 font-semibold hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </p>
            </form>
          </StaggerItem>
        )}
      </StaggerContainer>
    </motion.div>
  );
}
