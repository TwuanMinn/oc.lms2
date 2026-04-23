"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useCapsLock } from "../_hooks/useCapsLock";

type IconInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  showToggle?: boolean;
  showCapsWarning?: boolean;
};

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  function IconInput({ icon: Icon, showToggle, showCapsWarning, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const capsLock = useCapsLock();

    const resolvedType = showToggle ? (visible ? "text" : "password") : props.type;

    return (
      <div className="relative group">
        <motion.div
          animate={{ scale: isFocused ? 1.15 : 1, color: isFocused ? "#0ea5e9" : "#94a3b8" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          <Icon className="w-4 h-4" />
        </motion.div>
        <input
          {...props}
          ref={ref}
          type={resolvedType}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className="w-full rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700
                     pl-11 pr-11 py-2.5 text-sm text-slate-700 dark:text-slate-200
                     placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200
                     focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:bg-white dark:focus:bg-slate-600"
        />
        {showCapsWarning && capsLock && isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 left-4 flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white text-[10px] font-medium shadow-md"
          >
            <AlertTriangle className="w-3 h-3" />
            Caps Lock is ON
          </motion.div>
        )}
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(!visible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  }
);
