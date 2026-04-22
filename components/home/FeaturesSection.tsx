"use client";

import { useState } from "react";
import { BookOpen, GraduationCap, Zap, Star, Check } from "lucide-react";
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/animated";

const instructors = [
  { initials: "AR", name: "Alex Rivera", role: "Ex-Google Engineer", courses: 12, rating: 5.0, gradient: "from-indigo-500 to-rose-500" },
  { initials: "JL", name: "Jordan Lee", role: "Sr. UX Lead @ Stripe", courses: 8, rating: 4.9, gradient: "from-purple-500 to-pink-500" },
  { initials: "SC", name: "Sarah Chen", role: "Data Scientist @ Meta", courses: 15, rating: 4.9, gradient: "from-blue-500 to-indigo-500" },
  { initials: "MV", name: "Michael Vance", role: "Cloud Architect", courses: 9, rating: 4.8, gradient: "from-violet-500 to-fuchsia-500" },
];

export function FeaturesSection() {
  const [demoQuizState, setDemoQuizState] = useState<"idle" | "correct" | "wrong">("idle");

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.06),transparent_50%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 text-xs font-bold text-primary uppercase tracking-widest shadow-sm">
              Why Choose Us
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
                learn faster
              </span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              A modern platform designed with focused, effective learning paths to accelerate your career growth and mastery.
            </p>
          </div>
        </ScrollReveal>

        <StaggerGrid className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: Structured Learning */}
          <StaggerItem scale>
            <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/30 bg-card p-6 sm:p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight">Structured Learning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Courses organized into modules and lessons. Progress tracking shows exactly where you are.</p>
            </div>
          </StaggerItem>

          {/* Feature 2: Micro-Demo Quiz */}
          <StaggerItem scale>
            <div className="group flex h-full flex-col overflow-hidden rounded-3xl border-transparent bg-primary/5 p-6 sm:p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight text-primary">Try a Micro-Quiz</h3>
              <p className="text-sm text-primary/70 leading-relaxed mb-6">What does &quot;DOM&quot; stand for in web development?</p>
              <div className="flex flex-col gap-2 mt-auto">
                <button 
                  onClick={() => setDemoQuizState("wrong")}
                  className={`text-left px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${demoQuizState === "wrong" ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900" : "bg-background border-border/50 hover:border-primary/30"}`}
                >
                  A. Data Object Matrix
                </button>
                <button 
                  onClick={async (e) => {
                    setDemoQuizState("correct");
                    const rect = e.currentTarget.getBoundingClientRect();
                    const { default: confetti } = await import("canvas-confetti");
                    confetti({ 
                      particleCount: 100, spread: 70, 
                      origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
                      colors: ['#e11d48', '#4f46e5', '#10b981']
                    });
                    setTimeout(() => setDemoQuizState("idle"), 3000);
                  }}
                  className={`text-left px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${demoQuizState === "correct" ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900" : "bg-background border-border/50 hover:border-primary/30"}`}
                >
                   {demoQuizState === "correct" ? <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> B. Document Object Model</span> : "B. Document Object Model"}
                </button>
              </div>
            </div>
          </StaggerItem>

          {/* Feature 3: Track Progress */}
          <StaggerItem scale>
            <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/30 bg-card p-6 sm:p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight">Track Progress</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Mark lessons complete, see your progress ring fill up, and get your learning streak going.</p>
            </div>
          </StaggerItem>
        </StaggerGrid>

        {/* Industry Experts */}
        <div className="mt-32">
          <ScrollReveal>
            <div className="mb-10 text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Learn from industry experts</h3>
              <p className="mt-2 text-muted-foreground text-lg">Our instructors are leads and managers at top tech companies.</p>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.map((inst, i) => (
              <StaggerItem key={i} scale>
                <div className="group flex h-full flex-col items-center overflow-hidden rounded-3xl border border-border/30 bg-card p-6 sm:p-8 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className={`w-20 h-20 rounded-full mb-5 bg-linear-to-br ${inst.gradient} flex items-center justify-center text-white text-2xl font-bold tracking-wide shadow-sm transition-transform group-hover:scale-105`}>
                    {inst.initials}
                  </div>
                  <h4 className="text-lg font-bold tracking-tight mb-1">{inst.name}</h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">{inst.role}</p>
                  <div className="w-full flex items-center justify-between text-muted-foreground text-xs font-medium mt-auto pt-4 border-t border-border/40">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {inst.courses}</span>
                    <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {inst.rating}</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </div>
    </section>
  );
}
