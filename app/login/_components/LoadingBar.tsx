"use client";

import { motion } from "motion/react";

export function LoadingBar({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] z-30 overflow-hidden rounded-t-[28px]">
      <motion.div
        className="h-full bg-linear-to-r from-sky-400 via-cyan-400 to-sky-400"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: "60%" }}
      />
    </div>
  );
}
