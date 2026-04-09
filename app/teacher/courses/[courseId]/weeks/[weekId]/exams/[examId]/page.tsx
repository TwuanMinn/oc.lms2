"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  ChevronLeft, Clock, Users, CheckCircle2, AlertTriangle,
  BarChart3, Eye, Pencil, Send, Loader2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ──

const MOCK_EXAM = {
  title: "Midterm Exam — Operating Systems",
  description: "Process scheduling, memory management, file systems.",
  duration: 60,
  totalMarks: 20,
  passingScore: 60,
  availableFrom: "Apr 10, 2026 · 9:00 AM",
  availableUntil: "Apr 15, 2026 · 11:59 PM",
  settings: {
    showScoreImmediately: true,
    showCorrectAnswers: true,
  },
};

interface StudentSubmission {
  id: string;
  name: string;
  avatar: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
  autoScore: number;
  totalMarks: number;
  essaysPending: number;
  timeTaken: number; // minutes
  submittedAt: string;
}

const MOCK_SUBMISSIONS: StudentSubmission[] = [
  { id: "s1", name: "Song Xinyi", avatar: "SX", status: "SUBMITTED", autoScore: 8, totalMarks: 20, essaysPending: 1, timeTaken: 42, submittedAt: "Apr 11, 2026 10:32 AM" },
  { id: "s2", name: "Nguyen Van An", avatar: "NA", status: "SUBMITTED", autoScore: 6, totalMarks: 20, essaysPending: 1, timeTaken: 55, submittedAt: "Apr 11, 2026 11:15 AM" },
  { id: "s3", name: "Vo Duc Khoa", avatar: "VK", status: "SUBMITTED", autoScore: 9, totalMarks: 20, essaysPending: 1, timeTaken: 38, submittedAt: "Apr 10, 2026 2:45 PM" },
  { id: "s4", name: "Han Zixuan", avatar: "HZ", status: "IN_PROGRESS", autoScore: 0, totalMarks: 20, essaysPending: 0, timeTaken: 0, submittedAt: "" },
  { id: "s5", name: "Le Hoang Nam", avatar: "LN", status: "NOT_STARTED", autoScore: 0, totalMarks: 20, essaysPending: 0, timeTaken: 0, submittedAt: "" },
  { id: "s6", name: "Bui Thi Hong", avatar: "BH", status: "SUBMITTED", autoScore: 7, totalMarks: 20, essaysPending: 1, timeTaken: 48, submittedAt: "Apr 12, 2026 9:10 AM" },
];

// Mock student answers for grading
const MOCK_STUDENT_ANSWERS = [
  { qId: "q1", type: "MCQ", text: "Which scheduling algorithm gives minimum average waiting time?", marks: 2, studentAnswer: "SJF", correct: true, maxMarks: 2 },
  { qId: "q2", type: "TRUE_FALSE", text: "Virtual memory allows a process to use more memory than physically available.", marks: 1, studentAnswer: "True", correct: true, maxMarks: 1 },
  { qId: "q3", type: "SHORT_ANSWER", text: "What is the name of the OS component that manages process execution?", marks: 2, studentAnswer: "kernel", correct: true, maxMarks: 2 },
  { qId: "q4", type: "ESSAY", text: "Explain the difference between paging and segmentation.", marks: 0, studentAnswer: "Paging divides memory into fixed-size frames while segmentation divides into variable-size segments. Paging eliminates external fragmentation but may cause internal fragmentation. Segmentation provides a more logical view of memory matching program structure but can cause external fragmentation. Paging is preferred for systems needing simple memory management, while segmentation suits programs with distinct logical sections.", correct: false, maxMarks: 10 },
  { qId: "q5", type: "FILL_BLANK", text: "The [blank] algorithm replaces the page that will not be used for the longest time.", marks: 2, studentAnswer: "optimal", correct: true, maxMarks: 2 },
  { qId: "q6", type: "MCQ", text: "Which is NOT a valid page replacement algorithm?", marks: 1, studentAnswer: "LIFO", correct: true, maxMarks: 1 },
  { qId: "q7", type: "TRUE_FALSE", text: "Deadlock can occur if all four Coffman conditions are met.", marks: 0, studentAnswer: "False", correct: false, maxMarks: 1 },
  { qId: "q8", type: "SHORT_ANSWER", text: "What does FIFO stand for?", marks: 1, studentAnswer: "first in first out", correct: true, maxMarks: 1 },
];

export default function TeacherExamPage() {
  const params = useParams<{ courseId: string; weekId: string; examId: string }>();
  const router = useRouter();
  const [gradingStudent, setGradingStudent] = useState<StudentSubmission | null>(null);
  const [essayMarks, setEssayMarks] = useState<Record<string, number>>({});
  const [essayFeedback, setEssayFeedback] = useState<Record<string, string>>({});
  const [releasedStudents, setReleasedStudents] = useState<Set<string>>(new Set());

  const exam = MOCK_EXAM;
  const submissions = MOCK_SUBMISSIONS;

  const submitted = submissions.filter((s) => s.status === "SUBMITTED");
  const started = submissions.filter((s) => s.status !== "NOT_STARTED");
  const needsGrading = submitted.filter((s) => s.essaysPending > 0);
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, sub) => s + sub.autoScore, 0) / submitted.length)
    : 0;

  const stats = [
    { icon: Users, label: "Started", value: started.length, color: "text-blue-500 bg-blue-500/10" },
    { icon: CheckCircle2, label: "Submitted", value: submitted.length, color: "text-emerald-500 bg-emerald-500/10" },
    { icon: BarChart3, label: "Auto-graded", value: submitted.length - needsGrading.length, color: "text-teal-500 bg-teal-500/10" },
    { icon: AlertTriangle, label: "Needs grading", value: needsGrading.length, color: "text-amber-500 bg-amber-500/10" },
    { icon: BarChart3, label: "Avg score", value: `${avgScore} / ${exam.totalMarks}`, color: "text-primary bg-primary/10" },
  ];

  const statusConfig = {
    NOT_STARTED: { label: "Not started", color: "bg-muted text-muted-foreground" },
    IN_PROGRESS: { label: "In progress", color: "bg-amber-500/10 text-amber-600" },
    SUBMITTED: { label: "Submitted", color: "bg-emerald-500/10 text-emerald-600" },
  };

  // ── Grading view ──
  if (gradingStudent) {
    const answers = MOCK_STUDENT_ANSWERS;
    const autoTotal = answers.filter((a) => a.type !== "ESSAY").reduce((s, a) => s + a.marks, 0);
    const essayScore = Object.values(essayMarks).reduce((s, v) => s + v, 0);
    const totalScore = autoTotal + essayScore;
    const isReleased = releasedStudents.has(gradingStudent.id);

    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex">
          <Sidebar role="TEACHER" />
          <main className="flex-1 p-6">
            <div className="mb-4 flex items-center gap-4">
              <button onClick={() => setGradingStudent(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold">{gradingStudent.name} — Review & Grade</h2>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl space-y-4">

              <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Score: <span className="text-lg font-black text-primary">{totalScore}</span> / {exam.totalMarks}</p>
                  <p className="text-xs text-muted-foreground">Auto-graded: {autoTotal} pts · Essay: {essayScore} pts</p>
                </div>
                <p className="text-xs text-muted-foreground">Time: {gradingStudent.timeTaken} min</p>
              </div>

              {answers.map((a, i) => (
                <motion.div key={a.qId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      a.type === "MCQ" ? "bg-blue-500/10 text-blue-600" :
                      a.type === "TRUE_FALSE" ? "bg-teal-500/10 text-teal-600" :
                      a.type === "SHORT_ANSWER" ? "bg-amber-500/10 text-amber-600" :
                      a.type === "ESSAY" ? "bg-rose-500/10 text-rose-600" :
                      "bg-violet-500/10 text-violet-600"
                    )}>{a.type.replace("_", " ")}</span>
                    {a.type !== "ESSAY" && (
                      a.correct
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {a.type === "ESSAY" ? (essayMarks[a.qId] ?? "—") : a.marks} / {a.maxMarks} pts
                    </span>
                  </div>

                  <p className="text-sm font-medium">{a.text}</p>

                  <div className={cn("rounded-lg px-4 py-2.5 text-sm",
                    a.type === "ESSAY" ? "bg-muted/20 border border-border/30"
                      : a.correct ? "bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-300/30"
                      : "bg-red-50/50 dark:bg-red-950/10 border border-red-300/30"
                  )}>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">Student answer</p>
                    <p className="whitespace-pre-wrap">{a.studentAnswer}</p>
                  </div>

                  {/* Essay grading controls */}
                  {a.type === "ESSAY" && (
                    <div className="space-y-2 border-t border-border/30 pt-3">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-muted-foreground">Marks:</label>
                        <input type="number" min={0} max={a.maxMarks}
                          value={essayMarks[a.qId] ?? ""}
                          onChange={(e) => setEssayMarks((p) => ({ ...p, [a.qId]: Math.min(a.maxMarks, Math.max(0, +e.target.value)) }))}
                          className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1 text-sm text-center font-semibold focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-xs text-muted-foreground"> / {a.maxMarks} pts</span>
                      </div>
                      <textarea
                        value={essayFeedback[a.qId] || ""}
                        onChange={(e) => setEssayFeedback((p) => ({ ...p, [a.qId]: e.target.value }))}
                        placeholder="Feedback for this question..."
                        rows={2}
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Release button */}
              <div className="sticky bottom-4 z-10 flex justify-end">
                <button
                  onClick={() => {
                    setReleasedStudents((p) => new Set(p).add(gradingStudent.id));
                    setGradingStudent(null);
                  }}
                  disabled={isReleased}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isReleased ? "Results released ✓" : "Release results to student"}
                </button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  // ── Main overview ──
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar role="TEACHER" />
        <main className="flex-1 p-6">
          <div className="mb-4 flex items-center gap-4">
            <button onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Breadcrumbs items={[{ label: "Curriculum", href: `/dashboard/teacher/courses/${params.courseId}` }, { label: exam.title }]} />
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{exam.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {exam.duration} min
                  </span>
                  <span className="text-xs text-muted-foreground">{exam.availableFrom} — {exam.availableUntil}</span>
                </div>
              </div>
              <button className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit settings
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.map((st) => (
                <motion.div key={st.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-border/50 bg-card p-4 text-center">
                  <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg mb-2", st.color)}>
                    <st.icon className="h-4 w-4" />
                  </div>
                  <p className="text-lg font-bold">{st.value}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{st.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Submissions table */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 bg-muted/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submissions</h3>
              </div>

              <div className="divide-y divide-border/30">
                {/* Header row */}
                <div className="grid grid-cols-7 gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-2">Student</span>
                  <span>Status</span>
                  <span>Score</span>
                  <span>Essays</span>
                  <span>Time</span>
                  <span>Action</span>
                </div>

                {submissions.map((sub, i) => (
                  <motion.div key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-7 gap-4 px-5 py-3 items-center hover:bg-muted/10 transition-colors">
                    {/* Student */}
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {sub.avatar}
                      </div>
                      <span className="text-sm font-medium truncate">{sub.name}</span>
                    </div>

                    {/* Status */}
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold w-fit", statusConfig[sub.status].color)}>
                      {statusConfig[sub.status].label}
                    </span>

                    {/* Score */}
                    <span className="text-sm font-semibold">
                      {sub.status === "SUBMITTED" ? `${sub.autoScore} / ${sub.totalMarks}` : "—"}
                    </span>

                    {/* Essays */}
                    {sub.essaysPending > 0 ? (
                      <span className="inline-flex rounded-md bg-amber-500/10 text-amber-600 px-2 py-0.5 text-[10px] font-bold w-fit">
                        {sub.essaysPending} pending
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}

                    {/* Time */}
                    <span className="text-xs text-muted-foreground">
                      {sub.status === "SUBMITTED" ? `${sub.timeTaken} min` : "—"}
                    </span>

                    {/* Action */}
                    {sub.status === "SUBMITTED" ? (
                      <button onClick={() => setGradingStudent(sub)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold hover:bg-primary/20 transition-colors w-fit">
                        <Eye className="h-3 w-3" /> View & grade
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
