"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal, InfiniteMarquee } from "@/components/ui/animated";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Frontend Developer",
    avatar: "/images/avatar-sarah.png",
    quote: "This platform transformed how I learn. The structured modules and quizzes kept me engaged and accountable.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Data Analyst",
    avatar: "/images/avatar-marcus.png",
    quote: "I earned my certificates in half the time compared to other platforms. The progress tracking is addictive!",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    avatar: "/images/avatar-emily.png",
    quote: "Clean interface, great content, and the learning streaks keep me coming back every day. Highly recommend.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Loved by learners
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
            Hear from students who transformed their careers.
          </p>
        </ScrollReveal>

        <div className="mt-16 w-full max-w-[100vw] overflow-hidden -mx-4 sm:-mx-6 px-4 sm:px-6 hide-scrollbar">
          <InfiniteMarquee speed={40} className="gap-6 pb-4">
            {testimonials.map((t, idx) => (
              <motion.div
                key={`${t.name}-${idx}`}
                whileHover={{
                  y: -4,
                  boxShadow: "0 8px 30px rgba(225, 29, 72, 0.06)",
                  borderColor: "rgba(225, 29, 72, 0.25)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative w-[480px] shrink-0 rounded-3xl border border-border/50 bg-card p-8 shadow-sm mr-8 flex flex-col justify-between"
              >
                <div>
                  <Quote className="absolute right-6 top-6 h-10 w-10 text-primary/5" />
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-6 text-lg sm:text-xl font-medium leading-relaxed text-foreground/90">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 border-t border-border/40 pt-6 relative z-10">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover shadow-sm bg-accent/50"
                  />
                  <div>
                    <p className="text-lg font-bold">{t.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </InfiniteMarquee>
        </div>
      </div>
    </section>
  );
}
