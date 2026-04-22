"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Users, BookOpen, TrendingUp, Award, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const stats: { value: number; suffix: string; label: string; icon: LucideIcon }[] = [
  { value: 10000, suffix: "+", label: "Students learning", icon: Users },
  { value: 500, suffix: "+", label: "Expert courses", icon: BookOpen },
  { value: 98, suffix: "%", label: "Completion rate", icon: TrendingUp },
  { value: 50, suffix: "+", label: "Certificates issued", icon: Award },
];

export function StatsSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section className="relative border-y border-border/40 bg-card/10 py-20 overflow-hidden">
      <div className="absolute left-1/2 top-0 -z-10 h-px w-3/4 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_20px_rgba(225,29,72,0.6)]" />
      
      <div ref={statsRef} className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="group relative flex flex-col items-center justify-center rounded-3xl border border-border/30 bg-background/50 p-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(225,29,72,0.06)]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <stat.icon className="h-7 w-7" />
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-3 text-sm sm:text-base font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
