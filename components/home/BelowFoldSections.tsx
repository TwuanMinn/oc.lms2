"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Zap, Sparkles, Target, Trophy, Flame, Linkedin, MessageCircle, ChevronDown, Shield, Cloud, Layers, Smartphone, BrainCircuit, Award, Users, CheckCircle2, ArrowRight, PlayCircle } from "lucide-react";
import { motion } from "motion/react";
import { TiltCard } from "@/components/ui/tilt-card";
import { ScrollReveal, AnimatedShimmerButton } from "@/components/ui/animated";

const learningPaths = [
  { title: "Foundations", desc: "Master HTML, CSS, JavaScript, and Git. Build real projects with guided, hands-on exercises from day one.", icon: BookOpen, level: "Beginner", modules: 8, hours: 24, progress: 100, iconBg: "bg-blue-500/10", iconRing: "ring-blue-500/30", iconColor: "text-blue-500", gradient: "from-blue-500/10 to-cyan-500/5", progressColor: "from-blue-500 to-cyan-500" },
  { title: "Advanced Systems", desc: "Dive deep into React, Next.js, databases, and API design. Learn architecture patterns from top engineering teams.", icon: Zap, level: "Intermediate", modules: 12, hours: 40, progress: 66, iconBg: "bg-primary/10", iconRing: "ring-primary/30", iconColor: "text-primary", gradient: "from-primary/10 to-rose-500/5", progressColor: "from-primary to-rose-500" },
  { title: "Production Deploy", desc: "Ship real applications with CI/CD, monitoring, security, and scaling. Graduate with a portfolio of deployed projects.", icon: Target, level: "Advanced", modules: 10, hours: 32, progress: 20, iconBg: "bg-emerald-500/10", iconRing: "ring-emerald-500/30", iconColor: "text-emerald-500", gradient: "from-emerald-500/10 to-teal-500/5", progressColor: "from-emerald-500 to-teal-500" },
  { title: "Testing & QA", desc: "Write bulletproof unit, integration, and E2E tests. Master TDD workflows, mocking strategies, and CI test pipelines.", icon: Shield, level: "Intermediate", modules: 8, hours: 28, progress: 45, iconBg: "bg-amber-500/10", iconRing: "ring-amber-500/30", iconColor: "text-amber-500", gradient: "from-amber-500/10 to-yellow-500/5", progressColor: "from-amber-500 to-yellow-500" },
  { title: "Cloud & DevOps", desc: "Deploy to AWS, GCP, and Vercel. Automate with Docker, GitHub Actions, and infrastructure-as-code patterns.", icon: Cloud, level: "Advanced", modules: 9, hours: 36, progress: 10, iconBg: "bg-sky-500/10", iconRing: "ring-sky-500/30", iconColor: "text-sky-500", gradient: "from-sky-500/10 to-blue-500/5", progressColor: "from-sky-500 to-blue-500" },
  { title: "System Design", desc: "Design scalable distributed systems. Master load balancing, caching, message queues, and microservice architecture.", icon: Layers, level: "Expert", modules: 6, hours: 20, progress: 85, iconBg: "bg-rose-500/10", iconRing: "ring-rose-500/30", iconColor: "text-rose-500", gradient: "from-rose-500/10 to-pink-500/5", progressColor: "from-rose-500 to-pink-500" },
  { title: "Mobile Development", desc: "Build cross-platform mobile apps with React Native. Handle navigation, native APIs, animations, and app store deployment.", icon: Smartphone, level: "Intermediate", modules: 11, hours: 34, progress: 33, iconBg: "bg-violet-500/10", iconRing: "ring-violet-500/30", iconColor: "text-violet-500", gradient: "from-violet-500/10 to-purple-500/5", progressColor: "from-violet-500 to-purple-500" },
  { title: "AI & Machine Learning", desc: "Integrate AI APIs, build intelligent features, and understand ML fundamentals. From prompt engineering to model fine-tuning.", icon: BrainCircuit, level: "Expert", modules: 7, hours: 26, progress: 63, iconBg: "bg-teal-500/10", iconRing: "ring-teal-500/30", iconColor: "text-teal-500", gradient: "from-teal-500/10 to-cyan-500/5", progressColor: "from-teal-500 to-cyan-500" },
];

const faqs = [
  { q: "Is the platform actually free?", a: "Yes, 100%. All core curriculum, interactive quizzes, progress tracking, and standard certificates are completely open-access. No credit card required." },
  { q: "Do I need prior experience?", a: "Not at all. Our Foundation path starts from absolute zero. Each module builds on the previous, so you never feel lost or overwhelmed." },
  { q: "How are certificates verified?", a: "Each certificate includes a unique verification ID and public URL. Employers and recruiters can instantly verify your achievement." },
  { q: "Can I learn at my own pace?", a: "Absolutely. All content is self-paced with no deadlines. Pick up right where you left off, anytime." },
];

/* ─── Learning Path Timeline ─── */
function LearningPathSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute left-1/4 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[150px]" />
      <div className="absolute right-1/4 bottom-0 -z-10 h-[400px] w-[500px] rounded-full bg-rose-500/5 blur-[120px]" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="text-center mb-20">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 text-xs font-bold text-primary uppercase tracking-widest shadow-sm">
            <Sparkles className="h-4 w-4 mr-2" /> Learning Paths
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Your path to{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-rose-400">mastery</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            A structured curriculum designed to take you from fundamentals to production-ready skills.
          </p>
        </ScrollReveal>

        <div className="relative max-w-5xl mx-auto pb-12">
          {/* Vertical connecting line */}
          <div className="absolute left-12 md:left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
            <div className="absolute inset-0 rounded-full bg-linear-to-b from-primary/40 via-rose-400/30 to-emerald-500/20" />
            <motion.div 
              initial={{ height: 0 }} 
              whileInView={{ height: "100%" }} 
              viewport={{ once: true }} 
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full rounded-full bg-linear-to-b from-primary via-rose-400 to-emerald-500 origin-top"
            >
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center">
                <motion.div className="absolute inset-0 rounded-full bg-emerald-500" animate={{ scale: [1, 3], opacity: [0.4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} />
                <motion.div className="absolute inset-0 rounded-full bg-emerald-500" animate={{ scale: [1, 3], opacity: [0.4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.25 }} />
                <div className="relative z-10 w-16 h-16 rounded-full border-8 border-background bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <div className="w-5 h-5 rounded-full bg-background/90" />
                </div>
              </div>
            </motion.div>
          </div>

          {learningPaths.map((step, idx) => (
            <div key={idx} className={`relative flex items-start gap-6 md:gap-40 mb-20 last:mb-0 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
              <div className="absolute left-12 md:left-1/2 -translate-x-1/2 z-20">
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 15, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  className={`w-24 h-24 rounded-3xl ${step.iconBg} ${step.iconColor} ring-4 ${step.iconRing} ring-offset-2 ring-offset-background flex items-center justify-center shadow-lg backdrop-blur-sm`}
                >
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}>
                    <step.icon className="h-10 w-10" />
                  </motion.div>
                </motion.div>
              </div>

              <div className="w-28 shrink-0 md:hidden" />
              <div className="hidden md:block md:w-1/2" />

              <motion.div 
                initial={{ opacity: 0, x: idx % 2 === 0 ? 60 : -60, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: idx * 0.08 + 0.15 }}
                whileHover={{ y: -6, boxShadow: "0 25px 50px -15px rgba(225,29,72,0.12)" }}
                className="grow md:w-1/2 group"
              >
                <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
                  <div className={`h-1.5 w-full bg-linear-to-r ${step.gradient}`} />
                  <div className="absolute -inset-px bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl" />
                  <div className="relative p-7">
                    <div className="flex items-center justify-between mb-4">
                      <motion.span initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 + 0.3 }} className={`text-xs font-bold uppercase tracking-widest ${step.iconColor} ${step.iconBg} px-3 py-1 rounded-full`}>
                        {step.level}
                      </motion.span>
                      <span className="text-xs font-medium text-muted-foreground">{step.modules} modules · {step.hours}h</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{step.desc}</p>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                        <span>Curriculum progress</span>
                        <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + idx * 0.2 }} className="text-foreground font-bold">{step.progress}%</motion.span>
                      </div>
                      <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${step.progress}%` }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.5 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }} className={`h-full rounded-full bg-linear-to-r ${step.progressColor}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Credentials Bento Grid ─── */
function CredentialsSection() {
  return (
    <section className="relative py-24 border-y border-border/40 bg-card/10 overflow-hidden">
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[150px]" />
      <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="mb-16">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 text-xs font-bold text-primary uppercase tracking-widest shadow-sm">
            <Trophy className="h-4 w-4 mr-2" /> Credentials
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-center">
            Prove your{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500">expertise</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-center text-lg">Build a verified portfolio of achievements as you learn and grow.</p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <TiltCard rotationIntensity={12} className="md:col-span-2 h-full">
            <div className="rounded-3xl border border-border/50 bg-card p-10 shadow-lg relative overflow-hidden h-full flex flex-col group transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(225,29,72,0.1)]">
              <div className="absolute -right-16 -top-16 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700"><Award className="w-80 h-80" /></div>
              <div className="absolute bottom-0 right-0 w-80 h-40 bg-linear-to-tl from-primary/5 to-transparent rounded-tl-full" />
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-200 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Trophy className="text-amber-900 w-8 h-8" />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Blockchain Verified</span>
                </div>
              </div>
              <div className="relative z-10 grow flex flex-col justify-end">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Industry Certificates</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">Earn verifiable, shareable certificates upon completing each learning path. Recognized by hiring managers and integrated with LinkedIn profiles.</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Award className="h-4 w-4 text-amber-500" /> 2,400+ issued</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4 text-primary" /> 94% employer approval</span>
                </div>
              </div>
            </div>
          </TiltCard>

          <div className="grid gap-6">
            <TiltCard rotationIntensity={10} className="h-full">
              <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm group hover:border-orange-500/30 hover:shadow-[0_12px_24px_-8px_rgba(249,115,22,0.1)] transition-all h-full relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-[0.04]"><Flame className="w-40 h-40" /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-orange-500 group-hover:animate-pulse" />
                    </div>
                    <div className="text-right ml-auto">
                      <p className="text-2xl font-black text-foreground">12</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Day Streak</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-1">Learning Streaks</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Build consistent habits with daily streak tracking. Unlock badges at 7, 30, and 100-day milestones.</p>
                </div>
              </div>
            </TiltCard>
            <TiltCard rotationIntensity={10} className="h-full">
              <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm group hover:border-[#0077b5]/30 hover:shadow-[0_12px_24px_-8px_rgba(0,119,181,0.1)] transition-all h-full relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-[0.04]"><Linkedin className="w-40 h-40" /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0077b5]/10 flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-[#0077b5]" />
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-1">1-Click Share</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Instantly share certificates to LinkedIn, Twitter/X, or generate a unique public portfolio link.</p>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Community + FAQ + Newsletter CTA ─── */
function CommunitySection() {
  return (
    <>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/4 blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 text-xs font-bold text-primary uppercase tracking-widest shadow-sm">
              <MessageCircle className="h-4 w-4 mr-2" /> Community
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Learn together,{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-rose-400">grow faster</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">Free access doesn&apos;t mean learning alone. Join thousands of active learners.</p>
          </ScrollReveal>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div className="rounded-3xl border border-border/50 bg-card/80 p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
                <div className="absolute -inset-px bg-linear-to-br from-primary/10 via-transparent to-rose-500/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100 rounded-3xl" />
                <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-rose-500/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Official Community</h3>
                      <p className="text-sm font-medium text-emerald-500 flex items-center gap-2 mt-0.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        1,402 currently online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center mb-8">
                    <div className="flex -space-x-3">
                      {["SC", "MJ", "ER", "AL", "JL"].map((initials, i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-card bg-linear-to-br from-primary to-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {initials}
                        </div>
                      ))}
                    </div>
                    <span className="ml-4 text-sm text-muted-foreground font-medium">+2,847 members</span>
                  </div>
                  <AnimatedShimmerButton className="w-full bg-primary rounded-xl shadow-lg shadow-primary/20">
                    <button className="w-full py-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90 flex items-center justify-center gap-2">
                      Join the Community <ArrowRight className="h-4 w-4" />
                    </button>
                  </AnimatedShimmerButton>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-widest mb-6">Frequently Asked</h3>
                {faqs.map((faq, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 4 }}
                    className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <h4 className="font-bold flex items-center justify-between gap-4">
                      <span className="group-hover:text-primary transition-colors">{faq.q}</span>
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all shrink-0 group-hover:rotate-180" />
                    </h4>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative px-4 py-16 sm:px-6 mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="bg-card border border-border/50 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] z-0" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] z-0" />
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-extrabold text-4xl md:text-5xl text-foreground tracking-tight mb-6">
                  Ready to start <br/>
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-rose-400">your journey?</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">
                  Join our newsletter to receive weekly insights, free course previews, and exclusive scholarship offers.
                </p>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input type="email" placeholder="Email address" className="bg-background border border-border/60 text-foreground rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none grow shadow-inner transition-shadow placeholder:text-muted-foreground" />
                  <AnimatedShimmerButton className="rounded-full bg-primary shadow-lg shadow-primary/20 shrink-0">
                    <button type="submit" className="flex h-full w-full items-center justify-center px-8 py-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                      Join Academy
                    </button>
                  </AnimatedShimmerButton>
                </form>
              </div>
              <div className="hidden md:block relative">
                <div className="aspect-video bg-background/50 rounded-3xl border border-border/50 p-3 backdrop-blur-md relative overflow-hidden shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.1)_0%,transparent_70%)] opacity-50" />
                  <div className="w-full h-full bg-secondary/20 rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <Image src="/images/hero-illustration.png" alt="Students learning" fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 grayscale-30 group-hover:grayscale-0 mix-blend-overlay" />
                    <div className="w-16 h-16 bg-background/90 rounded-full flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-border/50">
                      <PlayCircle className="text-primary h-8 w-8 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

export { LearningPathSection, CredentialsSection, CommunitySection };
