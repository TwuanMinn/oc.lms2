"use client";

import { motion } from "motion/react";

export function SocialIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 dark:border-slate-600
                   text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50
                   dark:hover:bg-sky-900/30 transition-all duration-200 cursor-pointer"
      >
        {children}
      </motion.button>
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-800 text-white text-[10px]
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
