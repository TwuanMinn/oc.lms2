"use client";

import { motion } from "motion/react";
import {
  GraduationCap,
  Globe,
  ShieldCheck,
  BookOpen,
  MonitorPlay,
  Star,
  FileText,
  Sparkles,
} from "lucide-react";

const SHAPES = [
  { icon: GraduationCap, delay: 0, x: 12, y: 15, size: 56, rotate: 20, drift: 20 },
  { icon: Globe, delay: 2, x: 80, y: 20, size: 72, rotate: -15, drift: -25 },
  { icon: ShieldCheck, delay: 5, x: 15, y: 75, size: 64, rotate: 10, drift: 30 },
  { icon: BookOpen, delay: 1, x: 85, y: 80, size: 80, rotate: -25, drift: -20 },
  { icon: MonitorPlay, delay: 3, x: 50, y: 8, size: 48, rotate: 5, drift: 15 },
  { icon: Star, delay: 4, x: 10, y: 50, size: 40, rotate: -10, drift: 25 },
  { icon: FileText, delay: 2.5, x: 92, y: 50, size: 52, rotate: 15, drift: -15 },
  { icon: Sparkles, delay: 3.5, x: 45, y: 92, size: 48, rotate: -20, drift: 20 },
];

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {SHAPES.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: `0%`, y: `0%`, rotate: s.rotate }}
          animate={{
            opacity: [0, 0.4, 0],
            y: [0, -60, -120],
            x: [0, s.drift, 0],
            rotate: [s.rotate, s.rotate + 25, s.rotate],
          }}
          transition={{ duration: 12 + i * 2, repeat: Infinity, ease: "linear", delay: s.delay }}
          className="absolute text-sky-200/40 dark:text-sky-500/10 mix-blend-overlay drop-shadow-2xl"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <s.icon style={{ width: s.size, height: s.size }} strokeWidth={1} />
        </motion.div>
      ))}

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -100, -200],
            x: [0, i % 2 === 0 ? 40 : -40, 0],
          }}
          transition={{ duration: 15 + i * 3, delay: i * 2, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full bg-white/20 dark:bg-white/5 blur-sm"
          style={{
            width: 8 + i * 4,
            height: 8 + i * 4,
            left: `${15 + i * 15}%`,
            top: `${100 + i * 10}%`,
          }}
        />
      ))}
    </div>
  );
}
