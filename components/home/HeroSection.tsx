"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedText, AnimatedWordSwitcher, AnimatedShimmerButton } from "@/components/ui/animated";
import { useAuth } from "@/lib/hooks/useAuth";

const TRUSTED_BY = ["Acme Corp", "Globex", "Initech", "Soylent", "Umbrella", "Stark Ind."];

export function HeroSection() {
  const { isAuthenticated, dashboardPath, isLoading } = useAuth();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-primary shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            New Semester 2024
          </motion.div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <AnimatedText text="Learn without" delay={0.2} />{" "}
            <AnimatedWordSwitcher
              words={["limits", "boundaries", "friction", "compromise"]}
              className="bg-linear-to-r from-primary to-rose-400 bg-clip-text text-transparent"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Discover courses from expert instructors. Track your progress,
            take quizzes, earn certificates — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-10 flex items-center gap-4"
          >
            <AnimatedShimmerButton className="rounded-lg shadow-lg shadow-primary/20 bg-primary">
              <Link
                href={isAuthenticated ? dashboardPath : "/register"}
                className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground transition-all"
              >
                {isLoading ? "Loading..." : isAuthenticated ? "Go to Dashboard" : "Get started for free"}
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </AnimatedShimmerButton>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/courses"
                className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/30"
              >
                Browse courses
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Hero Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.4 }}
          className="relative hidden justify-end lg:flex"
        >
          <div className="relative w-full max-w-lg aspect-square bg-linear-to-br from-card to-background rounded-[2.5rem] shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden border border-border/50">
            <Image
              src="/images/hero-illustration.png"
              alt="Online learning platform"
              fill
              className="object-cover rounded-3xl grayscale-15 hover:grayscale-0 transition-all duration-700 p-2"
              priority
            />
            
            {/* Floating Glass Card UI 1 */}
            <div className="absolute top-12 right-0 backdrop-blur-xl bg-background/80 p-4 rounded-2xl shadow-xl border border-border/50 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex shrink-0 items-center justify-center text-emerald-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="pr-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Success Rate</p>
                <p className="text-lg font-extrabold text-foreground tracking-tight">94% Mastery</p>
              </div>
            </div>

            {/* Floating Glass Card UI 2 */}
            <div className="absolute bottom-12 left-0 backdrop-blur-xl bg-background/80 p-4 rounded-2xl shadow-xl border border-border/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </div>
                <span className="text-xs font-bold text-foreground">Live Class: Advanced UX</span>
              </div>
              <div className="h-2 w-48 bg-secondary rounded-full overflow-hidden mt-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "66%" }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                  className="h-full bg-primary rounded-full" 
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Social Proof Trust Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-20 pt-10 border-t border-border/40"
      >
        <p className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-widest">
          Trusted by instructors & teams at
        </p>
        <div className="overflow-hidden flex w-full relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-linear-to-l from-background to-transparent z-10" />
          <div className="flex shrink-0 animate-[scroll-marquee_20s_linear_infinite] gap-16 pr-16 items-center">
            {TRUSTED_BY.map((company, i) => (
              <div key={i} className="text-2xl font-black tracking-tighter text-muted-foreground/30 hover:text-muted-foreground transition-colors duration-300">
                {company}
              </div>
            ))}
            {TRUSTED_BY.map((company, i) => (
              <div key={i + "clone"} className="text-2xl font-black tracking-tighter text-muted-foreground/30 hover:text-muted-foreground transition-colors duration-300">
                {company}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
