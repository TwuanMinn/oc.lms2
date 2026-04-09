"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence, animate } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, CloudUpload, FileText, Trash2, X,
  CheckCircle2, AlertCircle, Activity, Download, Send
} from "lucide-react";
import Link from "next/link";

function CountUp({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    try {
      const controls = animate(0, value, {
        duration: 0.8,
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

export default function StudentAssignmentPage() {
  const params = useParams<{ courseId: string; weekId: string; assignmentId: string }>();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // MOCK DATA TO DRIVE THE UI
  const dueDate = new Date("2026-04-12T23:59:59Z"); // Fixed deterministic mock date
  const isOverdue = isMounted ? (dueDate < new Date()) : false;
  const diffDays = isMounted ? Math.ceil((dueDate.getTime() - new Date().getTime()) / 86400000) : 3;
  
  const [subState, setSubState] = useState<"IDLE" | "READY" | "LOADING" | "SUCCESS" | "RESUBMIT">("IDLE");
  const [files, setFiles] = useState<{name: string, size: string}[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [comment, setComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gradeAvailable, setGradeAvailable] = useState(true); // Toggle to test Grade Card
  const score = 87;
  
  const [messages, setMessages] = useState([
    { id: 1, sender: "Huang Li", role: "TEACHER", text: "Please make sure to review chapter 4 before starting.", time: "2 hours ago" }
  ]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const [lastModified, setLastModified] = useState<Date | null>(null);

  useEffect(() => {
    document.title = "Lab 1 — Curriculum | LMS";
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    if (isOverdue) return;
    const valid = [];
    for (const f of newFiles) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`File exceeds 20MB limit`, { icon: <AlertCircle className="h-4 w-4 text-red-500" />});
      } else {
        valid.push({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + " MB" });
      }
    }
    if (valid.length > 0) {
      setFiles(p => [...p, ...valid]);
      setSubState(subState === "RESUBMIT" ? "RESUBMIT" : "READY");
      setLastModified(new Date());
    }
  };

  const removeFile = (idx: number) => {
    setFiles(p => {
      const nw = [...p];
      nw.splice(idx, 1);
      if (nw.length === 0) setSubState("IDLE");
      return nw;
    });
    setLastModified(new Date());
  };

  const handleSubmit = () => {
    if (subState === "IDLE" || subState === "LOADING" || isOverdue) return;
    setSubState("LOADING");
    setTimeout(() => {
      setSubState("SUCCESS");
      setLastModified(new Date());
      if (diffDays < 0) {
        toast.warning("Submitted late — your teacher has been notified", { icon: <AlertCircle className="h-4 w-4 text-amber-500"/> });
      } else {
        toast.success("Assignment submitted successfully!", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      }
      setTimeout(() => {
        setSubState("RESUBMIT");
      }, 2000);
    }, 1200);
  };

  const handleSendMsg = () => {
    if (!msgInput.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "You", role: "STUDENT", text: msgInput, time: "Just now" }]);
    setMsgInput("");
    setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleDownloadTeacherFile = () => {
    toast.success("Downloading Lab1_Instructions.pdf...");
  };

  // Dynamic Badges
  const dueColor = diffDays > 3 ? "bg-green-500/10 text-green-600 border-green-200" :
                   diffDays >= 0 ? "bg-amber-500/10 text-amber-600 border-amber-200" : 
                   "bg-red-500/10 text-red-600 border-red-200";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar role="STUDENT" />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-4 mb-6"
          >
            <button 
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <nav className="flex flex-wrap text-sm text-muted-foreground items-center gap-2">
              <Link href="/dashboard/student/courses" className="hover:text-foreground transition-colors">My Courses</Link>
              <span>›</span>
              <span className="hover:text-foreground transition-colors cursor-pointer capitalize">{params.courseId?.replace(/-/g,' ')}</span>
              <span>›</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Curriculum</span>
              <span>›</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Week 01</span>
              <span>›</span>
              <span className="font-medium text-foreground">Lab 1</span>
            </nav>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ════════════════════════════════════════ */}
            {/* LEFT COLUMN - 60% */}
            {/* ════════════════════════════════════════ */}
            <div className="w-full lg:w-[60%] flex flex-col gap-6">
              
              {/* Header Card */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="bg-card border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-bold text-foreground">Lab 1</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-500 uppercase tracking-wide">Assignment</span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Week 01</span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">MT-477-W01</span>
                    <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", dueColor)}>
                      Due: {dueDate.toLocaleDateString("en-US", {month:'short', day:'numeric', year:'numeric'})}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                    This is compulsory and must be completed in 3 days. Ensure you include all calculated metrics.
                  </p>
                  
                  <div className="mt-2 flex items-center gap-3 pt-4 border-t">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">HL</div>
                    <span className="text-xs text-muted-foreground font-medium">Posted by Huang Li · Apr 10, 2026</span>
                  </div>
                </div>
              </motion.div>

              {/* Material Card */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                className="bg-card border border-t-4 border-t-blue-500 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Lab1_Instructions.pdf</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Uploaded by Huang Li · Apr 10 · 2.4 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs font-semibold px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all active:scale-95">View PDF</button>
                    <button onClick={handleDownloadTeacherFile} className="text-xs font-semibold px-4 py-2 border hover:bg-muted/30 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"><Download className="h-3.5 w-3.5"/> Download</button>
                  </div>
                </div>
                
                <div className="mt-5 bg-muted/40 rounded-xl p-4 border border-border/30">
                  <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Instructions</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">Please complete the simulation exercise using the provided datasets. Export your final graphs and combine them into a single PDF report before submitting.</p>
                </div>
              </motion.div>

              {/* Submit Form Card */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.24 }}
                className="bg-card border rounded-2xl p-6 shadow-sm"
              >
                <h2 className="font-bold text-lg mb-5">Your submission</h2>

                <div className="space-y-6">
                  {/* Dropzone */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-semibold">Attach your work</label>
                      <span className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX · Max 20MB each</span>
                    </div>
                    
                    <div 
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      onClick={() => !isOverdue && fileInputRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-8 rounded-xl border-[1.5px] border-dashed transition-all duration-150 text-center",
                        isOverdue ? "border-red-300 bg-red-50/50 cursor-not-allowed" :
                        dragActive ? "border-blue-500 bg-blue-50 scale-[1.01] cursor-copy" : "border-border bg-muted/20 cursor-pointer hover:bg-muted/40"
                      )}
                    >
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={e => handleFiles(Array.from(e.target.files || []))} />
                      <CloudUpload className={cn("h-10 w-10 mb-3", dragActive ? "text-blue-500" : isOverdue ? "text-red-300" : "text-blue-400 opacity-60")} />
                      <p className="font-semibold text-sm">
                        {isOverdue ? "Submission closed" : dragActive ? "Drop your files here" : "Drag & drop your files here"}
                      </p>
                      {!isOverdue && !dragActive && <p className="text-xs text-muted-foreground mt-1">or click to browse</p>}
                      {isOverdue && <p className="text-xs text-red-500 font-medium mt-1">Due date has passed</p>}
                    </div>

                    <AnimatePresence>
                      {files.map((f, i) => (
                        <motion.div 
                          key={`${f.name}-${i}`}
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.2 }}
                          className="mt-3"
                        >
                          <div className="flex flex-col space-y-2 pt-2">
                            <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2.5 px-3 border border-border/50">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><FileText className="h-4 w-4"/></div>
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-bold">{f.name}</span>
                                  <span className="text-[11px] text-muted-foreground">{f.size}</span>
                                </div>
                              </div>
                              <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors text-muted-foreground">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Add a note to your teacher (optional)</label>
                    <textarea 
                      value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="e.g. I had trouble with question 4, or any context you want to share..."
                      className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                      rows={3}
                    />
                  </div>

                  <button 
                    disabled={subState === "IDLE" || subState === "LOADING" || isOverdue}
                    onClick={handleSubmit}
                    title={subState === "RESUBMIT" ? "You can update your submission before the due date" : ""}
                    className={cn(
                      "w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 outline-none flex items-center justify-center gap-2",
                      isOverdue ? "bg-red-500/50 cursor-not-allowed" :
                      subState === "IDLE" ? "bg-blue-600 opacity-40 cursor-not-allowed" :
                      subState === "LOADING" ? "bg-blue-600 opacity-80 cursor-wait" :
                      subState === "SUCCESS" ? "bg-emerald-600 scale-[1.02]" :
                      subState === "RESUBMIT" ? "bg-amber-500 active:scale-95 hover:brightness-105" :
                      "bg-blue-600 active:scale-95 hover:brightness-105 hover:scale-[1.01]"
                    )}
                  >
                    {subState === "LOADING" ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</> :
                     subState === "SUCCESS" ? "Submitted ✓" :
                     subState === "RESUBMIT" ? "Resubmit" :
                     subState === "IDLE" ? "Attach files to submit" :
                     isOverdue ? "Due date has passed" :
                     "Submit assignment"}
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
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-6"
              >
                {/* Status Card */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                  <h2 className="font-bold text-lg mb-4">Submission status</h2>
                  
                  <div className="grid grid-cols-2 gap-3" key={lastModified?.getTime() || 0}>
                    <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-muted/30 border rounded-xl p-3">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Status</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {subState === "SUCCESS" || subState === "RESUBMIT" ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold text-emerald-600">Submitted</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                            <span className="text-sm font-bold text-muted-foreground">Not submitted</span>
                          </>
                        )}
                      </div>
                    </motion.div>

                    <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-muted/30 border rounded-xl p-3">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Grading</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {gradeAvailable ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-sm font-bold text-purple-600">Graded</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">Not graded</span>
                        )}
                      </div>
                    </motion.div>

                    <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-muted/30 border rounded-xl p-3">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Last modified</p>
                      <p className="text-xs font-semibold text-foreground pt-0.5">
                        {lastModified ? lastModified.toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : "—"}
                      </p>
                    </motion.div>

                    <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-muted/30 border rounded-xl p-3">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Files</p>
                      <p className="text-sm font-bold text-foreground pt-0.5">{files.length} file{files.length === 1 ? '' : 's'}</p>
                    </motion.div>
                  </div>
                </div>

                {/* Grade Card */}
                <AnimatePresence>
                  {gradeAvailable && (
                    <motion.div 
                      key="gradecard"
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "bg-card border rounded-2xl p-5 shadow-sm border-t-4",
                        score >= 80 ? "border-t-emerald-500" : score >= 60 ? "border-t-blue-500" : "border-t-amber-500"
                      )}
                    >
                      <h2 className="font-bold text-lg mb-4">Your grade</h2>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-[48px] font-bold leading-none"><CountUp value={score} /></span>
                        <span className="text-[20px] text-muted-foreground font-medium">/ 100</span>
                      </div>
                      
                      <p className={cn("text-sm font-bold mt-1", score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : "text-amber-600")}>
                        {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs improvement"}
                      </p>

                      <div className="mt-5 h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: "0%" }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
                          className={cn("h-full rounded-full", score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500")}
                        />
                      </div>

                      <div className="mt-6 pt-5 border-t border-border/50">
                        <p className="text-[13px] font-bold uppercase text-muted-foreground mb-3">Teacher feedback</p>
                        <div className="border-l-4 border-l-blue-500 bg-muted/20 p-4 rounded-r-xl">
                          <p className="text-sm italic text-foreground/90">&quot;Great work on the data visualizations. Next time, try to expand a bit more on the theoretical implications in the final paragraph.&quot;</p>
                          <p className="text-xs font-semibold text-muted-foreground mt-3">— Huang Li · Apr 11, 8:43 AM</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comments Thread */}
                <div className="bg-card border rounded-2xl flex flex-col shadow-sm overflow-hidden h-[500px]">
                  <div className="p-4 border-b bg-muted/10 shrink-0">
                    <h2 className="font-bold text-lg">Comments & feedback</h2>
                    <p className="text-xs text-muted-foreground">Between you and your teacher</p>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto space-y-5 bg-muted/5">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center px-4 text-sm text-muted-foreground font-medium">
                        No messages yet. Ask your teacher a question!
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {messages.map(msg => (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={cn("flex gap-3", msg.role === "STUDENT" ? "flex-row-reverse" : "")}
                          >
                            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", 
                              msg.role === "STUDENT" ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {msg.sender.split(" ").map(n=>n[0]).join("")}
                            </div>
                            <div className={cn("flex flex-col gap-1 w-full max-w-[85%]", msg.role === "STUDENT" ? "items-end" : "items-start")}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{msg.sender}</span>
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                  msg.role === "STUDENT" ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-600"
                                )}>{msg.role}</span>
                                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                              </div>
                              <div className={cn("text-sm p-3 rounded-2xl shadow-sm", 
                                msg.role === "STUDENT" ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-sm" : "bg-card border-l-[3px] border-l-blue-500 border border-t-border border-r-border border-b-border rounded-tl-sm text-foreground"
                              )}>
                                {msg.text}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                    <div ref={msgsEndRef} />
                  </div>

                  <div className="p-3 border-t bg-background shrink-0 flex flex-col gap-2">
                    <textarea 
                      value={msgInput} onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMsg(); }
                      }}
                      placeholder="Ask a question or leave a comment..."
                      className="w-full bg-muted/30 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handleSendMsg} disabled={!msgInput.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-1.5 text-xs font-bold transition-colors shadow-sm active:scale-95 flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
