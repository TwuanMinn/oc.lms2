"use client";

import { motion } from "motion/react";
import {
  BookOpen,
  Globe,
  MonitorPlay,
  Star,
  ShieldCheck,
  GraduationCap,
  Code,
  Award,
  Compass,
  Cpu,
  Target,
  Rocket,
} from "lucide-react";

const ICONS = [BookOpen, Globe, MonitorPlay, Star, ShieldCheck, GraduationCap, Code, Award, Compass, Cpu, Target, Rocket];

const ICON_POSITIONS = [
  { left: "8%", top: "12%" },
  { left: "82%", top: "16%" },
  { left: "72%", top: "82%" },
  { left: "12%", top: "78%" },
  { left: "42%", top: "8%" },
  { left: "52%", top: "85%" },
  { left: "88%", top: "45%" },
  { left: "6%", top: "48%" },
  { left: "25%", top: "25%" },
  { left: "65%", top: "30%" },
  { left: "30%", top: "65%" },
  { left: "60%", top: "60%" },
];

export function AnimatedBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: isDark
            ? `radial-gradient(circle at top right, #0f172a 0%, #020617 100%)`
            : `radial-gradient(circle at top left, #f0f9ff 0%, #e0f2fe 100%)`,
        }}
      />

      <div className="absolute inset-0 overflow-hidden opacity-[0.05] dark:opacity-[0.03]">
        <motion.div
          animate={{ y: [0, 64] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-full h-[200%]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: "4rem 4rem",
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "top center",
          }}
        />
      </div>

      <motion.div
        animate={{ x: [0, 60, -60, 0], y: [0, -40, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
        className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -50, 50, 0], y: [0, 50, -50, 0], scale: [1, 1.5, 1] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-teal-400/20 dark:bg-teal-500/10 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -100, 0], scale: [1, 0.8, 1] }}
        transition={{ duration: 25, ease: "easeInOut", repeat: Infinity }}
        className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/15 dark:bg-indigo-500/10 blur-[100px]"
      />

      <div className="absolute inset-0 opacity-80 dark:opacity-60 mix-blend-multiply dark:mix-blend-screen overflow-hidden">
        {ICONS.map((Icon, idx) => {
          const pos = ICON_POSITIONS[idx];
          return (
            <motion.div
              key={`page-icon-${idx}`}
              initial={{ opacity: 0, rotate: idx * 30 }}
              animate={{
                opacity: [0.1, 0.7, 0.1],
                y: [0, -50, -100],
                x: [0, idx % 2 === 0 ? 40 : -40, 0],
                rotate: [idx * 30, idx * 30 + 120, idx * 30 + 240],
              }}
              transition={{ duration: 20 + idx * 3, repeat: Infinity, ease: "linear", delay: idx * 1.5 }}
              className="absolute text-sky-500 dark:text-sky-300 drop-shadow-2xl"
              style={{ left: pos.left, top: pos.top }}
            >
              <Icon size={100 + idx * 8} strokeWidth={0.75} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
