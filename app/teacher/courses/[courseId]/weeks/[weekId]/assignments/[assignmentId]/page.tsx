"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence, animate } from "motion/react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { 
  ChevronLeft, CloudUpload, FileText, Pencil, Trash2, X,
  CheckCircle2, Download, Send, Users, File as FileIcon, AlertCircle
} from "lucide-react";
import Link from "next/link";

type SubStatus = "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
interface Submission {
  studentId: string;
  status: SubStatus;
  lastModified?: Date;
  files: { name: string; url: string }[];
  grade?: number;
  gradeStatus?: "Graded" | "Needs resubmission";
  feedback?: string;
}

function CountUp({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    try {
      const controls = animate(0, value, {
        duration: 0.6,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (nodeRef.current) nodeRef.current.textContent = Math.round(latest).toString();
        }
      });
      return () => {
        if (controls && typeof controls.stop === 'function') {
          controls.stop();
        }
      };
    } catch (err) {
      if (nodeRef.current) nodeRef.current.textContent = value.toString();
    }
  }, [value]);
  return <span ref={nodeRef}>0</span>;
}

export default function AssignmentDetailPage() {
  const params = useParams<{ courseId: string; weekId: string; assignmentId: string }>();
  const router = useRouter();

  // Queries
  const { data: students, isLoading: studentsLoading } = trpc.attendance.getTeacherCourseStudents.useQuery(
    { courseId: params.courseId },
    { enabled: !!params.courseId }
  );

  // State
  const [pdfState, setPdfState] = useState<"NONE" | "UPLOADING" | "UPLOADED">("NONE");
  const [instructions, setInstructions] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [activeFilter, setActiveFilter] = useState<"All" | "Submitted" | "Not submitted" | "Graded" | "Pending">("All");
  
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [gradeStatus, setGradeStatus] = useState<"Graded" | "Needs resubmission">("Graded");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [gradeError, setGradeError] = useState("");

  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "Huang Li", role: "TEACHER", text: "Please review the attached PDF before starting the lab.", time: "2 hours ago" },
    { id: 2, sender: "Jin Woo", role: "STUDENT", text: "Is the simulation software required for this?", time: "1 hour ago" }
  ]);

  const [statsKey, setStatsKey] = useState(0);

  useEffect(() => {
    document.title = "Lab 1 — Curriculum | LMS";
  }, []);

  // Initialize mock submissions
  useEffect(() => {
    if (students && Object.keys(submissions).length === 0) {
      const mock: Record<string, Submission> = {};
      students.forEach((s, i) => {
        const rand = (s.studentName.length + i) % 10;
        let status: SubStatus = "NOT_SUBMITTED";
        let files = [] as { name: string; url: string }[];
        let grade = undefined;
        
        if (rand > 6) {
          status = "GRADED";
          files = [{ name: `${s.studentName.replace(/\s+/g, "_")}_Lab1.pdf`, url: "#" }];
          grade = 80 + (rand * 2);
        } else if (rand > 3) {
          status = "SUBMITTED";
          files = [{ name: `${s.studentName.replace(/\s+/g, "_")}_Lab1.pdf`, url: "#" }];
        }
        
        mock[s.studentId] = {
          studentId: s.studentId,
          status,
          files,
          grade,
          lastModified: new Date(Date.now() - rand * 10000000)
        };
      });
      setSubmissions(mock);
    }
  }, [students, submissions]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = students?.length || 0;
    const subsArray = Object.values(submissions);
    const graded = subsArray.filter(s => s.status === "GRADED").length;
    const submitted = subsArray.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length;
    const notSubmitted = total - submitted;
    return { total, submitted, graded, notSubmitted };
  }, [students, submissions]);

  // Submissions List filter
  const filteredSubmissions = useMemo(() => {
    if (!students) return [];
    let list = students.map(s => ({
      ...s,
      submission: submissions[s.studentId] || { status: "NOT_SUBMITTED", files: [] }
    }));

    if (activeFilter === "Submitted") list = list.filter(s => s.submission.status === "SUBMITTED" || s.submission.status === "GRADED");
    if (activeFilter === "Not submitted") list = list.filter(s => s.submission.status === "NOT_SUBMITTED");
    if (activeFilter === "Graded") list = list.filter(s => s.submission.status === "GRADED");
    if (activeFilter === "Pending") list = list.filter(s => s.submission.status === "SUBMITTED");

    return list.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [students, submissions, activeFilter]);

  // Handlers
  const handleUploadClick = () => {
    setPdfState("UPLOADING");
    setTimeout(() => {
      setPdfState("UPLOADED");
      toast.success("Published! Students can now see Lab 1", {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
    }, 1500);
  };

  const handlePostMessage = () => {
    if (!messageInput.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      sender: "Huang Li",
      role: "TEACHER",
      text: messageInput,
      time: "Just now"
    }]);
    setMessageInput("");
  };

  const openGradeModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    const sub = submissions[studentId];
    setGradeInput(sub?.grade?.toString() || "");
    setGradeStatus(sub?.gradeStatus || "Graded");
    setFeedbackInput(sub?.feedback || "");
    setGradeError("");
    setGradeModalOpen(true);
  };

  const currentGradingStudent = useMemo(() => {
    return students?.find(s => s.studentId === selectedStudentId);
  }, [students, selectedStudentId]);

  const handleSaveGrade = () => {
    const score = parseInt(gradeInput);
    if (isNaN(score) || score < 0 || score > 100) {
      setGradeError("Score must be between 0 and 100");
      return;
    }

    if (selectedStudentId) {
      setSubmissions(prev => ({
        ...prev,
        [selectedStudentId]: {
          ...prev[selectedStudentId],
          status: "GRADED",
          grade: score,
          gradeStatus,
          feedback: feedbackInput
        }
      }));
      setStatsKey(k => k + 1); // Trigger bounce
      toast.success(`Grade saved for ${currentGradingStudent?.studentName}`);
      setGradeModalOpen(false);
    }
  };

  const filters = ["All", "Submitted", "Not submitted", "Graded", "Pending"] as const;

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{__html: `
        @media (prefers-reduced-motion: no-preference) {
          .animate-count-up { animation: countUp 0.6s ease-out forwards; }
          .animate-bounce-stat { animation: bounceStat 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        }
        @keyframes countUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceStat { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
      `}} />
      <Navbar />
      <div className="flex">
        <Sidebar role="TEACHER" />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <nav className="flex text-sm text-muted-foreground items-center gap-2">
              <Link href="/dashboard/teacher/courses" className="hover:text-foreground transition-colors">My Courses</Link>
              <span>›</span>
              <Link href={`/dashboard/teacher/courses/${params.courseId}`} className="hover:text-foreground transition-colors">Course {params.courseId?.slice(0,4)}</Link>
              <span>›</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Curriculum</span>
              <span>›</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Week 01</span>
              <span>›</span>
              <span className="font-medium text-foreground">Lab 1</span>
            </nav>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ════════════════════════════════════════ */}
            {/* LEFT COLUMN - 60% */}
            {/* ════════════════════════════════════════ */}
            <div className="w-full lg:w-[60%] flex flex-col gap-6">
              
              {/* Assignment Header Card */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-card border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-bold text-foreground">Lab 1</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-500 uppercase tracking-wide">Assignment</span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Week 01</span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">MT-477-W01</span>
                    <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">Due: May 15, 2026</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                    Please complete the simulation exercise and upload your final report PDF. Ensure you include all calculated metrics.
                  </p>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm pt-4 border-t">
                    {pdfState === "UPLOADED" ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-600 font-medium">Published to students</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40"></div>
                        <span className="text-muted-foreground font-medium">Draft — not visible to students</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* PDF Upload Card */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
                className={cn(
                  "bg-card rounded-2xl p-6 transition-all duration-300",
                  pdfState !== "UPLOADED" ? "border-2 border-dashed border-border/60" : "border border-border/50 border-t-4 border-t-emerald-500 shadow-sm"
                )}
              >
                {pdfState !== "UPLOADED" ? (
                  <div className="flex flex-col gap-6">
                    <div className="text-center py-6">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                        <CloudUpload className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">Upload assignment material</h3>
                      <p className="text-sm text-muted-foreground">Students will be able to view and download this PDF</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1.5 cursor-pointer">Instructions for students</label>
                        <textarea 
                          className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none"
                          placeholder="What should students do?"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">Due date</label>
                          <input type="datetime-local" className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">Assignment File</label>
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full bg-background border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground mt-1.5 pl-1">Accepted: PDF only · Max 20MB</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleUploadClick}
                      disabled={pdfState === "UPLOADING"}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-70 active:scale-[0.98]"
                    >
                      {pdfState === "UPLOADING" ? (
                        <>
                          <CloudUpload className="h-5 w-5 animate-bounce" />
                          Uploading...
                        </>
                      ) : (
                        "Upload & publish to students"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                          <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">Lab1_Instructions.pdf</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Uploaded by Huang Li · Today, 10:24 AM · 2.4 MB</p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Published
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs font-semibold px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-md transition-colors">Preview PDF</button>
                        <button className="text-xs font-semibold px-3 py-1.5 border hover:bg-muted/30 rounded-md transition-colors">Replace PDF</button>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30 relative group">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instructions</h4>
                      {isEditingInstructions ? (
                        <textarea 
                          autoFocus
                          onBlur={() => setIsEditingInstructions(false)}
                          className="w-full text-sm bg-background border p-2 rounded-md outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{instructions || "No specific instructions provided."}</p>
                      )}
                      {!isEditingInstructions && (
                        <button 
                          onClick={() => setIsEditingInstructions(true)}
                          className="absolute top-4 right-4 p-1.5 bg-background border rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Class Discussion */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
                className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-5 border-b bg-muted/10">
                  <h2 className="font-bold text-lg">Class discussion</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Visible to all students in this class</p>
                </div>
                
                <div className="p-5 flex flex-col gap-6 flex-1 min-h-[300px] overflow-y-auto bg-muted/5">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="flex gap-3 group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {msg.sender.charAt(0)}
                        </div>
                        <div className="flex flex-col gap-1 w-full max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{msg.sender}</span>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                              msg.role === "TEACHER" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
                            )}>{msg.role.toLowerCase()}</span>
                            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                            {msg.role === "TEACHER" && (
                              <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 text-muted-foreground">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className={cn(
                            "text-sm p-3 rounded-2xl rounded-tl-sm w-fit",
                            msg.role === "TEACHER" ? "bg-blue-50 border-l-2 border-l-blue-500 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100" : "bg-card border shadow-sm text-foreground"
                          )}>
                            {msg.text}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-4 border-t bg-background relative flex gap-3 items-end">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mb-1">
                    HL
                  </div>
                  <div className="flex-1 relative">
                    <textarea 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostMessage();
                        }
                      }}
                      placeholder="Write a message to the class..."
                      className="w-full bg-muted/30 border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none h-12"
                    />
                  </div>
                  <button 
                    onClick={handlePostMessage}
                    disabled={!messageInput.trim()}
                    className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>

            </div>

            {/* ════════════════════════════════════════ */}
            {/* RIGHT COLUMN - 40% */}
            {/* ════════════════════════════════════════ */}
            <div className="w-full lg:w-[40%] flex flex-col gap-6">
              
              <motion.div 
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-6 sticky top-24"
              >
                {/* Stats Row */}
                <div key={statsKey} className="grid grid-cols-2 gap-3">
                  <div className="bg-card border shadow-sm rounded-xl p-4 flex flex-col gap-1 items-start animate-bounce-stat">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total students</span>
                    <span className="text-2xl font-bold"><CountUp value={stats.total} /></span>
                  </div>
                  <div className="bg-card border border-l-4 border-l-emerald-500 shadow-sm rounded-xl p-4 flex flex-col gap-1 items-start animate-bounce-stat">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Submitted</span>
                    <span className="text-2xl font-bold"><CountUp value={stats.submitted} /></span>
                  </div>
                  <div className="bg-card border border-l-4 border-l-purple-500 shadow-sm rounded-xl p-4 flex flex-col gap-1 items-start animate-bounce-stat">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Graded</span>
                    <span className="text-2xl font-bold"><CountUp value={stats.graded} /></span>
                  </div>
                  <div className="bg-card border border-l-4 border-l-red-500 shadow-sm rounded-xl p-4 flex flex-col gap-1 items-start animate-bounce-stat">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Not submitted</span>
                    <span className="text-2xl font-bold text-red-500"><CountUp value={stats.notSubmitted} /></span>
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="bg-card border rounded-2xl shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-muted/10">
                    <h2 className="font-bold text-lg">Submissions</h2>
                  </div>
                  
                  {/* Filter Bar */}
                  <div className="p-3 border-b flex items-center gap-2 overflow-x-auto no-scrollbar bg-background">
                    {filters.map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={cn(
                          "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-[0.97]",
                          activeFilter === f 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-background border text-muted-foreground hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className="p-3 flex flex-col gap-3 min-h-[400px] max-h-[600px] overflow-y-auto bg-muted/5">
                    {studentsLoading ? (
                      [1,2,3].map(i => (
                        <div key={i} className="rounded-xl border bg-card p-4 flex gap-4 animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="flex-1 space-y-2 py-1"><div className="h-3 bg-muted rounded w-3/4"></div><div className="h-2 bg-muted rounded w-1/2"></div></div>
                        </div>
                      ))
                    ) : filteredSubmissions.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center">
                        <Users className="h-8 w-8 mb-2 opacity-20" />
                        No students match this filter.
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {filteredSubmissions.map((s, i) => {
                          const sub = s.submission;
                          const isGraded = sub.status === "GRADED";
                          const isSubmitted = sub.status === "SUBMITTED";
                          const isNotSub = sub.status === "NOT_SUBMITTED";

                          return (
                            <motion.div 
                              key={s.studentId}
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, scale: 0.95 }}
                              transition={{ duration: 0.2, delay: i * 0.05 }}
                              className={cn(
                                "bg-card rounded-xl border p-4 flex flex-col gap-3 transition-colors hover:bg-muted/10",
                                isNotSub ? "border-l-4 border-l-muted" :
                                isSubmitted ? "border-l-4 border-l-amber-400" :
                                "border-l-4 border-l-emerald-500"
                              )}
                            >
                              <div className="flex gap-3 items-start justify-between">
                                <div className="flex gap-3 items-center">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {s.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold truncate max-w-[150px]">{s.studentName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                        isNotSub ? "bg-muted text-muted-foreground" :
                                        isSubmitted ? "bg-amber-500/10 text-amber-600" :
                                        "bg-emerald-500/10 text-emerald-600"
                                      )}>
                                        {isNotSub ? "No Submission" : isSubmitted ? "Submitted" : "Graded"}
                                      </span>
                                      {sub.lastModified && (
                                        <span className="text-[10px] text-muted-foreground">{formatDate(sub.lastModified)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!isNotSub && (
                                <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2 border border-border/50">
                                  <div className="flex items-center gap-2">
                                    <FileIcon className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-xs font-medium truncate max-w-[100px]">{sub.files[0]?.name}</span>
                                  </div>
                                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">View</a>
                                </div>
                              )}

                              <div className="flex items-center justify-between border-t pt-3 mt-1">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Grade</span>
                                  <span className={cn("text-sm font-bold", isGraded ? "text-emerald-600" : "text-muted-foreground")}>
                                    {isGraded ? `${sub.grade} / 100` : "—"}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => openGradeModal(s.studentId)}
                                  className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95",
                                    isGraded ? "bg-muted hover:bg-accent text-foreground" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  )}
                                >
                                  {isGraded ? "Edit Grade" : "Grade"}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => toast.warning(`Reminder sent to ${stats.notSubmitted} students`, { icon: <AlertCircle className="h-4 w-4 text-amber-500" /> })}
                    className="w-full flex items-center justify-between bg-card hover:bg-muted/30 border rounded-xl p-3.5 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Send className="h-4 w-4 text-amber-500" />
                      Remind unsubmitted students
                    </div>
                    <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full group-hover:bg-amber-500/20">{stats.notSubmitted}</span>
                  </button>
                  
                  <button 
                    onClick={() => toast.success("Grades exported as CSV", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> })}
                    className="w-full flex items-center justify-between bg-card hover:bg-muted/30 border rounded-xl p-3.5 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Download className="h-4 w-4 text-emerald-500" />
                      Export grades as CSV
                    </div>
                  </button>
                </div>
              </motion.div>

            </div>
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* GRADE MODAL OVERLAY */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence>
        {gradeModalOpen && currentGradingStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setGradeModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-card w-full max-w-[520px] rounded-[16px] shadow-2xl border pointer-events-auto overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/10">
                  <h2 className="text-lg font-bold">Grade — {currentGradingStudent.studentName}</h2>
                  <button onClick={() => setGradeModalOpen(false)} className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Body */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Files section */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Submitted Files</h3>
                    {submissions[selectedStudentId!]?.status === "NOT_SUBMITTED" ? (
                      <p className="text-sm italic text-muted-foreground">No files submitted yet</p>
                    ) : (
                      <div className="flex items-center gap-3 bg-background border rounded-lg p-3">
                        <FileText className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-semibold truncate flex-1">{submissions[selectedStudentId!]?.files[0]?.name}</span>
                        <a href="#" target="_blank" className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">View</a>
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Score</label>
                      <div className="relative">
                        <input 
                          type="number"
                          autoFocus
                          value={gradeInput}
                          onChange={(e) => {
                            setGradeInput(e.target.value);
                            setGradeError("");
                          }}
                          className={cn(
                            "w-full bg-background border rounded-xl px-4 py-3 text-2xl font-bold outline-none transition-shadow",
                            gradeError ? "border-red-500 focus:ring-2 focus:ring-red-500/30" : "focus:ring-[3px] focus:ring-blue-500/30 border-border/60"
                          )}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">/ 100</span>
                      </div>
                      {gradeError && <p className="text-xs text-red-500 font-medium mt-1.5">{gradeError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">Grading status</label>
                      <select 
                        value={gradeStatus}
                        onChange={(e) => setGradeStatus(e.target.value as "Graded" | "Needs resubmission")}
                        className="w-full bg-background border border-border/60 rounded-xl px-4 py-[13px] text-sm font-semibold outline-none focus:ring-[3px] focus:ring-blue-500/30 appearance-none"
                      >
                        <option value="Graded">Graded</option>
                        <option value="Needs resubmission">Needs resubmission</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Feedback for student</label>
                    <textarea 
                      rows={4}
                      placeholder="Write detailed feedback..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-[3px] focus:ring-blue-500/30 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/10 flex justify-between items-center">
                  <button onClick={() => setGradeModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-accent rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveGrade} className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors active:scale-95 shadow-sm">
                    Save grade & feedback
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
