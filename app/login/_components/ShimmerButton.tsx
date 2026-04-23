"use client";

import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading: boolean };

export function ShimmerButton({ children, isLoading, ...props }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      {...(props as React.ComponentProps<typeof motion.button>)}
      className="relative w-full mt-2 rounded-full bg-linear-to-r from-[#29b6f6] to-[#0288d1] py-2.5 text-sm font-bold tracking-widest text-white
                 shadow-lg shadow-sky-400/30 hover:shadow-sky-400/50 transition-all duration-300
                 disabled:opacity-50 cursor-pointer uppercase overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
      />
      <span className="relative z-10">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : children}
      </span>
    </motion.button>
  );
}
