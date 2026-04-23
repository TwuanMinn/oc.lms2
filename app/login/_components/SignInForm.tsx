"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Check, Github, Globe, GraduationCap, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import { signIn } from "@/lib/auth-client";
import { IconInput } from "./IconInput";
import { ShimmerButton } from "./ShimmerButton";
import { SocialIcon } from "./SocialIcon";
import { StaggerContainer, StaggerItem } from "./Stagger";

type Props = {
  onSuccess: (msg: string) => void;
  onLoadingChange: (v: boolean) => void;
};

export function SignInForm({ onSuccess, onLoadingChange }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hasError, setHasError] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const emailValue = watch("email") ?? "";
  const { ref: emailFormRef, ...emailRest } = register("email");

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    onLoadingChange(true);
    setHasError(false);
    try {
      const result = await signIn.email({ email: data.email, password: data.password });
      if (result.error) {
        toast.error(result.error.message ?? "Invalid credentials");
        setHasError(true);
      } else {
        onSuccess("Welcome back! 🎉");
        toast.success("Signed in successfully");
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          setTimeout(() => router.push(callbackUrl), 1800);
        } else {
          const sessionRes = await fetch("/api/auth/get-session", {
            headers: { "Content-Type": "application/json" },
          });
          const session = await sessionRes.json();
          const role = session?.user?.role;
          setTimeout(() => {
            if (role === "ADMIN") router.push("/dashboard/admin");
            else if (role === "TEACHER") router.push("/dashboard/teacher");
            else router.push("/dashboard/student");
          }, 1800);
        }
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
      setHasError(true);
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Sign in</h1>
        </StaggerItem>

        <StaggerItem>
          <div className="flex items-center gap-4 mb-3">
            <SocialIcon label="GitHub">
              <Github className="w-4 h-4" />
            </SocialIcon>
            <SocialIcon label="Google">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="SSO">
              <Globe className="w-4 h-4" />
            </SocialIcon>
          </div>
        </StaggerItem>

        <StaggerItem>
          <p className="text-xs text-slate-400 mb-5">Or sign in using E-Mail Address</p>
        </StaggerItem>

        <StaggerItem className="w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3">
            <div>
              <IconInput
                icon={Mail}
                id="signin-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                ref={(e) => {
                  emailFormRef(e);
                  emailRef.current = e;
                }}
                {...emailRest}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500 pl-4">{errors.email.message}</p>}
            </div>

            <div>
              <IconInput
                icon={Lock}
                id="signin-password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                showToggle
                showCapsWarning
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 pl-4">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    rememberMe ? "bg-sky-500 border-sky-500" : "border-slate-300 group-hover:border-sky-400"
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 text-white" />}
                </div>
                <span
                  className="text-xs text-slate-500 dark:text-slate-400 select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-sky-500 font-medium hover:text-sky-600 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <ShimmerButton type="submit" disabled={isLoading} isLoading={isLoading}>
              {emailValue ? `Sign in as ${emailValue.split("@")[0]}` : "Sign In"}
            </ShimmerButton>

            <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center pt-1">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[9px]">
                Enter
              </kbd>{" "}
              to submit
            </p>
          </form>
        </StaggerItem>
      </StaggerContainer>
    </motion.div>
  );
}
