"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { Footer } from "@/components/layout/Footer";
import {
  StatsSection,
  FeaturesSection,
  TrendingSection,
  TestimonialsSection,
} from "@/components/home";

/* SSR-unsafe components (use auth hooks internally) — skip server render */
const Navbar = dynamic(
  () => import("@/components/layout/Navbar").then((m) => ({ default: m.Navbar })),
  { ssr: false }
);
const HeroSection = dynamic(
  () => import("@/components/home/HeroSection").then((m) => ({ default: m.HeroSection })),
  { ssr: false }
);

/* Heavy below-the-fold sections — lazy loaded */
const LearningPathSection = dynamic(
  () => import("@/components/home/BelowFoldSections").then((m) => ({ default: m.LearningPathSection })),
);
const CredentialsSection = dynamic(
  () => import("@/components/home/BelowFoldSections").then((m) => ({ default: m.CredentialsSection })),
);
const CommunitySection = dynamic(
  () => import("@/components/home/BelowFoldSections").then((m) => ({ default: m.CommunitySection })),
);

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 800], [0, 250]);
  const glowColor1 = useTransform(scrollY, [0, 1500, 3000], ["rgba(225,29,72,0.05)", "rgba(124,58,237,0.08)", "rgba(16,185,129,0.05)"]);
  const glowColor2 = useTransform(scrollY, [0, 1500, 3000], ["rgba(225,29,72,0.03)", "rgba(79,70,229,0.08)", "rgba(14,165,233,0.05)"]);

  return (
    <div className="relative min-h-screen">
      {/* Background ambient glow journey */}
      <motion.div style={{ y: heroBgY }} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ backgroundColor: glowColor1 }}
          className="absolute -top-40 left-1/2 h-[800px] w-[1000px] -translate-x-1/2 rounded-full blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2, delay: 0.5 }}
          style={{ backgroundColor: glowColor2 }}
          className="absolute top-1/4 right-0 h-[600px] w-[800px] rounded-full blur-[120px]"
        />
      </motion.div>

      <Navbar />

      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <TrendingSection />
        <TestimonialsSection />
        <LearningPathSection />
        <CredentialsSection />
        <CommunitySection />
      </main>

      <Footer />
    </div>
  );
}
