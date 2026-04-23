"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [index, text]);

  return (
    <span className={className}>
      {displayed}
      {index < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-white/80 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}
