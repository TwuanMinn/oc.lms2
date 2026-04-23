"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

const CONFETTI_COLORS = ["#29b6f6", "#ffd54f", "#ff80ab", "#b2ff59", "#4dd0e1", "#ff8a65"];

const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  x: ((i * 37 + 13) % 300) - 150,
  y: ((i * 53 + 7) % 300) - 150,
  delay: 0.3 + i * 0.02,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

export function SuccessAnimation({ message, onComplete }: { message: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/80"
    >
      {CONFETTI.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [1, 1, 0], scale: [0, 1, 0.5], x: c.x, y: c.y }}
          transition={{ duration: 1.2, delay: c.delay, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: c.color }}
        />
      ))}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200"
      >
        <motion.svg
          className="w-12 h-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute mt-40 text-lg font-semibold text-slate-700 dark:text-white"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
