"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { FloatingShapes } from "./FloatingShapes";
import { TypewriterText } from "./TypewriterText";

const VARIANTS = {
  forgot: {
    image: "/images/auth-signup.png",
    alt: "Forgot password?",
    heading: "Forgot Password?",
    subtitle: "No worries! Reset your password in seconds …",
    cta: "Reset",
    floatDuration: 4,
  },
  signin: {
    image: "/images/auth-login.png",
    alt: "Welcome back",
    heading: "Welcome Back!",
    subtitle: "Remember your password? Sign in here",
    cta: "Sign In",
    floatDuration: 4.5,
  },
} as const;

const GRADIENT_TEXT_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(90deg, #ffffff, #ffd54f, #4dd0e1, #ff80ab, #b2ff59, #ffffff)",
  backgroundSize: "400% 100%",
};

export function OverlayPanel({ isSignUp, onToggle }: { isSignUp: boolean; onToggle: () => void }) {
  const variant = isSignUp ? VARIANTS.signin : VARIANTS.forgot;
  const motionKey = isSignUp ? "go-signin" : "go-forgot";

  return (
    <motion.div
      initial={false}
      animate={{ x: isSignUp ? "-100%" : "0%" }}
      transition={{ type: "spring", stiffness: 200, damping: 28 }}
      className="absolute top-0 right-0 w-1/2 h-full z-20"
    >
      <div className="relative w-full h-full overflow-hidden rounded-l-[22px]">
        <div className="absolute inset-0 bg-linear-to-br from-[#29b6f6] via-[#0288d1] to-[#0277bd]" />
        <FloatingShapes />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-10 text-center text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={motionKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: variant.floatDuration, ease: "easeInOut", repeat: Infinity }}
                className="mb-4"
              >
                <Image
                  src={variant.image}
                  alt={variant.alt}
                  width={220}
                  height={220}
                  className="w-[200px] h-[200px] object-cover rounded-full drop-shadow-2xl"
                  priority
                />
              </motion.div>

              <h2
                className="text-3xl font-bold leading-tight mb-3 bg-clip-text text-transparent animate-[colorShift_3s_ease-in-out_infinite]"
                style={GRADIENT_TEXT_STYLE}
              >
                <TypewriterText text={variant.heading} />
              </h2>
              <p className="text-sm text-white/80 mb-6 max-w-[200px]">{variant.subtitle}</p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                className="px-8 py-2.5 rounded-full border-2 border-white/60 text-sm font-bold tracking-widest text-white
                           transition-all duration-300 cursor-pointer backdrop-blur-sm uppercase"
              >
                {variant.cta}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
