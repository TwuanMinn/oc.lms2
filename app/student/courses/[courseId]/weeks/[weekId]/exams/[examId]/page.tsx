"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle,
  CheckCircle2, XCircle, Send, BookOpen, Award, Target,
  RotateCcw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data — drives the entire UI until backend integration ──

const MOCK_EXAM = {
  title: "Midterm Exam — Operating Systems",
  description: "This exam covers process scheduling, memory management, and file systems. Read each question carefully.",
  duration: 60,
  totalMarks: 20,
  passingScore: 60,
  attemptsAllowed: 1,
  attemptsUsed: 0,
  availableFrom: new Date("2026-04-10T09:00:00Z"),
  availableUntil: new Date("2026-04-15T23:59:59Z"),
  showScoreImmediately: true,
  showCorrectAnswers: true,
  questions: [
    {
      id: "q1", type: "MCQ" as const, text: "Which scheduling algorithm gives minimum average waiting time?",
      marks: 2,
      choices: [
        { id: "a", text: "FCFS" }, { id: "b", text: "SJF" },
        { id: "c", text: "Round Robin" }, { id: "d", text: "Priority" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "q2", type: "TRUE_FALSE" as const,
      text: "Virtual memory allows a process to use more memory than physically available.",
      marks: 1, correctBoolean: true,
    },
    {
      id: "q3", type: "SHORT_ANSWER" as const,
      text: "What is the name of the OS component that manages process execution?",
      marks: 2, acceptedAnswers: [["kernel", "the kernel"]],
    },
    {
      id: "q4", type: "ESSAY" as const,
      text: "Explain the difference between paging and segmentation. Provide examples of when each is preferred.",
      marks: 10, wordLimit: 500,
    },
    {
      id: "q5", type: "FILL_BLANK" as const,
      text: "The [blank] algorithm replaces the page that will not be used for the longest time in the future.",
      marks: 2, acceptedAnswers: [["optimal", "OPT"]],
    },
    {
      id: "q6", type: "MCQ" as const,
      text: "Which of the following is NOT a valid page replacement algorithm?",
      marks: 1,
      choices: [
        { id: "a", text: "FIFO" }, { id: "b", text: "LRU" },
        { id: "c", text: "LIFO" }, { id: "d", text: "Optimal" },
      ],
      correctChoiceId: "c",
    },
    {
      id: "q7", type: "TRUE_FALSE" as const,
      text: "Deadlock can occur if all four Coffman conditions are met simultaneously.",
      marks: 1, correctBoolean: true,
    },
    {
      id: "q8", type: "SHORT_ANSWER" as const,
      text: "What does FIFO stand for?",
      marks: 1, acceptedAnswers: [["first in first out"]],
    },
  ],
};

type ExamPhase = "PRE" | "IN_PROGRESS" | "SUBMITTED" | "RESULTS";

export default function StudentExamPage() {
  const params = useParams<{ courseId: string; weekId: string; examId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<ExamPhase>("PRE");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(MOCK_EXAM.duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const exam = MOCK_EXAM;
  const questions = exam.questions;
  const totalQuestions = questions.length;

  // Timer
  useEffect(() => {
    if (phase !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-save indicator
  useEffect(() => {
    if (phase !== "IN_PROGRESS") return;
    autoSaveRef.current = setInterval(() => {
      // Mock auto-save
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [phase]);

  function startExam() { setPhase("IN_PROGRESS"); }

  function setAnswer(qId: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }

  function toggleFlag(qId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  }

  function handleAutoSubmit() {
    setPhase("SUBMITTED");
    setTimeout(() => setPhase("RESULTS"), 1500);
  }

  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowSubmitModal(false);
      setPhase("SUBMITTED");
      setTimeout(() => setPhase("RESULTS"), 1500);
    }, 1200);
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flagged.size;

  // Format timer
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft > 600 ? "text-emerald-500" : timeLeft > 300 ? "text-amber-500" : "text-red-500";

  // Score calculation (mock)
  const calculateScore = useCallback(() => {
    let score = 0;
    for (const q of questions) {
      const ans = answers[q.id]?.trim().toLowerCase() || "";
      if (q.type === "MCQ" && ans === q.correctChoiceId) score += q.marks;
      if (q.type === "TRUE_FALSE" && ans === String(q.correctBoolean)) score += q.marks;
      if (q.type === "SHORT_ANSWER") {
        const accepted = (q.acceptedAnswers?.[0] || []).map((a: string) => a.toLowerCase());
        if (accepted.includes(ans)) score += q.marks;
      }
      if (q.type === "FILL_BLANK") {
        const accepted = (q.acceptedAnswers?.[0] || []).map((a: string) => a.toLowerCase());
        if (accepted.includes(ans)) score += q.marks;
      }
      // ESSAY not auto-graded
    }
    return score;
  }, [answers, questions]);

  // ═══════════════════════════════
  // PRE-EXAM
  // ═══════════════════════════════
  if (phase === "PRE") {
    const now = new Date();
    const notYet = now < exam.availableFrom;
    const expired = now > exam.availableUntil;
    const canStart = !notYet && !expired && exam.attemptsUsed < exam.attemptsAllowed;

    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex">
          <Sidebar role="STUDENT" />
          <main className="flex-1 p-6">
            <div className="mb-4 flex items-center gap-4">
              <button onClick={() => router.back()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Breadcrumbs items={[{ label: "Curriculum", href: `/courses/${params.courseId}` }, { label: exam.title }]} />
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">{exam.title}</h1>
                <p className="text-sm text-muted-foreground">{exam.description}</p>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: Clock, label: "Duration", value: `${exam.duration} min` },
                  { icon: BookOpen, label: "Questions", value: `${totalQuestions}` },
                  { icon: Target, label: "Total", value: `${exam.totalMarks} pts` },
                  { icon: Award, label: "Pass", value: `${exam.passingScore}%` },
                  { icon: RotateCcw, label: "Attempts", value: `${exam.attemptsAllowed - exam.attemptsUsed} of ${exam.attemptsAllowed}` },
                ].map((info) => (
                  <div key={info.label} className="rounded-xl border border-border/50 bg-card p-3 text-center">
                    <info.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="text-sm font-bold">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
                Available {exam.availableFrom.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {" · "}
                {exam.availableFrom.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {exam.availableUntil.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {" · "}
                {exam.availableUntil.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>

              {notYet && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-4 text-center">
                  <Clock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-600">Exam not yet available</p>
                </div>
              )}
              {expired && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-4 text-center">
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-red-600">Exam closed</p>
                </div>
              )}

              {canStart && (
                <div className="text-center space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startExam}
                    className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                  >
                    Start exam
                  </motion.button>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Once you start, the timer cannot be paused. Make sure you are ready before clicking Start.
                  </p>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  // SUBMITTED (loading)
  // ═══════════════════════════════
  if (phase === "SUBMITTED") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-lg font-semibold">Submitting your exam...</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════
  // RESULTS
  // ═══════════════════════════════
  if (phase === "RESULTS") {
    const autoScore = calculateScore();
    const hasEssay = questions.some((q) => q.type === "ESSAY");
    const pct = Math.round((autoScore / exam.totalMarks) * 100);
    const passed = pct >= exam.passingScore;
    const timeTaken = exam.duration * 60 - timeLeft;
    const timeTakenMin = Math.floor(timeTaken / 60);

    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex">
          <Sidebar role="STUDENT" />
          <main className="flex-1 p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-2xl space-y-8">
              {/* Score */}
              <div className="text-center space-y-4 py-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-32 w-32" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                    <motion.circle cx="60" cy="60" r="52" fill="none" stroke="currentColor"
                      className={passed ? "text-emerald-500" : "text-red-500"}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - pct / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-black">{autoScore}</p>
                    <p className="text-xs text-muted-foreground">/ {exam.totalMarks}</p>
                  </div>
                </div>

                <p className="text-3xl font-bold">{pct}%</p>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold",
                  passed ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}>
                  {passed ? <><CheckCircle2 className="h-4 w-4" /> PASSED</> : <><XCircle className="h-4 w-4" /> FAILED</>}
                </span>
                <p className="text-xs text-muted-foreground">Completed in {timeTakenMin} minutes</p>
                {hasEssay && (
                  <p className="text-xs text-amber-500 font-medium">
                    Note: Essay questions are pending teacher review. Final score may change.
                  </p>
                )}
              </div>

              {/* Question review */}
              {exam.showCorrectAnswers && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Question Review</h3>
                  {questions.map((q, i) => {
                    const ans = answers[q.id] || "";
                    let isCorrect = false;
                    if (q.type === "MCQ") isCorrect = ans === q.correctChoiceId;
                    if (q.type === "TRUE_FALSE") isCorrect = ans === String(q.correctBoolean);
                    if (q.type === "SHORT_ANSWER" || q.type === "FILL_BLANK") {
                      isCorrect = (q.acceptedAnswers?.[0] || []).some((a: string) => a.toLowerCase() === ans.toLowerCase());
                    }
                    const isEssay = q.type === "ESSAY";

                    return (
                      <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "rounded-xl border p-4 space-y-2",
                          isEssay ? "border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10"
                            : isCorrect ? "border-emerald-300/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                            : "border-red-300/50 bg-red-50/30 dark:bg-red-950/10"
                        )}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                          {isEssay ? (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Awaiting grade</span>
                          ) : isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {isEssay ? "—" : isCorrect ? q.marks : 0} / {q.marks} pts
                          </span>
                        </div>
                        <p className="text-sm font-medium">{q.text}</p>
                        {!isEssay && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Your answer: </span>
                            <span className={isCorrect ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                              {ans || "(no answer)"}
                            </span>
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div className="text-center">
                <button onClick={() => router.back()}
                  className="rounded-xl bg-muted px-6 py-2.5 text-sm font-semibold hover:bg-muted/80 transition-colors">
                  Back to course
                </button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  // IN-PROGRESS
  // ═══════════════════════════════
  const q = questions[currentQ];
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-sm font-bold truncate max-w-[200px]">{exam.title}</p>
          <div className={cn("text-lg font-mono font-bold tabular-nums", timerColor, timeLeft < 300 && "animate-pulse")}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Q {currentQ + 1} of {totalQuestions}</span>
            <button onClick={() => setShowSubmitModal(true)}
              className="rounded-lg border-2 border-red-500/50 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors">
              <Send className="h-3.5 w-3.5 inline mr-1" /> Submit exam
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div className="h-full bg-primary" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 p-6">
        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
          className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">Q{currentQ + 1}</span>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold",
              q.type === "MCQ" ? "bg-blue-500/10 text-blue-600" :
              q.type === "TRUE_FALSE" ? "bg-teal-500/10 text-teal-600" :
              q.type === "SHORT_ANSWER" ? "bg-amber-500/10 text-amber-600" :
              q.type === "ESSAY" ? "bg-rose-500/10 text-rose-600" :
              "bg-violet-500/10 text-violet-600"
            )}>{q.type.replace("_", " ")}</span>
            <span className="ml-auto text-xs text-muted-foreground">{q.marks} pts</span>
          </div>

          <p className="text-lg font-semibold leading-relaxed">{q.text}</p>

          {/* MCQ */}
          {q.type === "MCQ" && q.choices && (
            <div className="space-y-2">
              {q.choices.map((c) => {
                const selected = answers[q.id] === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setAnswer(q.id, c.id)}
                    className={cn(
                      "w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                      selected ? "border-primary bg-primary/5" : "border-border/40 hover:bg-muted/20"
                    )}>
                    {c.text}
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {q.type === "TRUE_FALSE" && (
            <div className="flex gap-4">
              {["true", "false"].map((val) => {
                const selected = answers[q.id] === val;
                return (
                  <button key={val} type="button" onClick={() => setAnswer(q.id, val)}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-4 text-sm font-bold capitalize transition-all",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border/40 hover:bg-muted/20"
                    )}>
                    {val}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer */}
          {q.type === "SHORT_ANSWER" && (
            <input type="text" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          )}

          {/* Essay */}
          {q.type === "ESSAY" && (
            <div className="space-y-2">
              <textarea value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Write your essay..."
                rows={8}
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-y" />
              <p className="text-xs text-muted-foreground">
                {(answers[q.id] || "").split(/\s+/).filter(Boolean).length} {q.wordLimit ? `/ ${q.wordLimit}` : ""} words
              </p>
            </div>
          )}

          {/* Fill in Blank */}
          {q.type === "FILL_BLANK" && (
            <div className="space-y-3">
              <div className="text-sm">
                {q.text.split(/\[blank\]/gi).map((part, pi, arr) => (
                  <span key={pi}>
                    {part}
                    {pi < arr.length - 1 && (
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        className="inline-block w-32 mx-1 border-b-2 border-primary bg-transparent text-center text-sm font-semibold outline-none focus:border-primary"
                        placeholder="..."
                      />
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flag */}
          <button type="button" onClick={() => toggleFlag(q.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              flagged.has(q.id) ? "bg-amber-500/10 text-amber-600" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}>
            <Flag className="h-3.5 w-3.5" /> {flagged.has(q.id) ? "Flagged" : "Flag question"}
          </button>
        </motion.div>
      </div>

      {/* Navigation bar */}
      <div className="sticky bottom-0 z-20 border-t border-border/40 bg-background/95 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <button onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {questions.map((qq, i) => {
              const answered = !!answers[qq.id]?.trim();
              const isFlagged = flagged.has(qq.id);
              return (
                <button key={qq.id} onClick={() => setCurrentQ(i)}
                  className={cn(
                    "h-7 w-7 rounded-full text-[10px] font-bold transition-all",
                    currentQ === i ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
                    isFlagged ? "bg-amber-500 text-white" :
                    answered ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => setCurrentQ((p) => Math.min(totalQuestions - 1, p + 1))} disabled={currentQ === totalQuestions - 1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Submit confirmation modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowSubmitModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="rounded-2xl border border-border bg-card shadow-2xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold">Submit exam?</h3>
              <div className="space-y-2 text-sm">
                <p>You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.</p>
                {unansweredCount > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-500 font-medium">
                    <AlertTriangle className="h-4 w-4" /> {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} unanswered
                  </p>
                )}
                {flaggedCount > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-500 font-medium">
                    <Flag className="h-4 w-4" /> {flaggedCount} question{flaggedCount !== 1 ? "s" : ""} flagged for review
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-xl border border-border/60 py-2.5 text-xs font-semibold hover:bg-muted/30 transition-colors">
                  Go back and review
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit now"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
