"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
const ScheduleCalendar = dynamic(() => import("@/components/calendar/ScheduleCalendar"), { ssr: false });
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatDate } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Users,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Trash2,
  X,
  ClipboardList,
  Clock,
  GraduationCap,
  Mail,
  CheckCircle2,
  XCircle,
  CalendarOff,
  MessageSquare,
  ArrowLeft,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ExamBuilder from "@/components/exam/ExamBuilder";
import type { ExamData } from "@/components/exam/ExamBuilder";

type Tab = "settings" | "curriculum" | "students" | "attendance" | "schedule";
type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

export default function CourseEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar role="TEACHER" />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/teacher/courses")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to courses
            </button>
          </div>

          <div className="mb-6 flex items-center gap-1 border-b border-border">
            {(["settings", "curriculum", "students", "attendance", "schedule"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "settings" && <SettingsTab courseId={params.id} />}
          {activeTab === "curriculum" && <CurriculumTab courseId={params.id} />}
          {activeTab === "students" && <StudentsTab courseId={params.id} />}
          {activeTab === "attendance" && <AttendanceTab courseId={params.id} />}
          {activeTab === "schedule" && (
            <div className="max-w-full">
              <ScheduleCalendar role="TEACHER" courseId={params.id} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Settings Tab
// ══════════════════════════════════════════════════

function SettingsTab({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const utils = trpc.useUtils();

  const updateCourse = trpc.course.update.useMutation({
    onSuccess: () => {
      toast.success("Course updated");
      utils.course.myCoursesAsTeacher.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const publishCourse = trpc.course.publish.useMutation({
    onSuccess: () => {
      toast.success("Course published!");
      utils.course.myCoursesAsTeacher.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          placeholder="Course title" />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
      </div>
      <div>
        <label className="text-sm font-medium">Thumbnail URL</label>
        <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateCourse.mutate({ id: courseId, title: title || undefined, description: description || undefined, thumbnail: thumbnail || undefined })}
          disabled={updateCourse.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {updateCourse.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
        <button
          onClick={() => publishCourse.mutate({ id: courseId })}
          disabled={publishCourse.isPending}
          className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20 disabled:opacity-50">
          {publishCourse.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Curriculum Tab (Weekly Sessions + Materials)
// ══════════════════════════════════════════════════

function CurriculumTab({ courseId }: { courseId: string }) {
  const { data: sessions, isLoading } = trpc.attendance.getTeacherCourseSessions.useQuery({ courseId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-16 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No weeks assigned yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">
            Your admin needs to create weekly sessions for this course from the admin dashboard.
            Once weeks are created, you can add PDFs, links, and assignments to each week here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {sessions.length} week{sessions.length !== 1 ? "s" : ""} • Click a week to manage materials
        </p>
      </div>

      {sessions.map((session, i) => (
        <WeekCard key={session.id} session={session} index={i} courseId={courseId} />
      ))}
    </div>
  );
}

// ── Week Card (Expandable) ──

interface SessionData {
  id: string;
  classCode: string;
  title: string;
  scheduledAt: Date;
  materialCount: number;
}

const materialIcons = {
  ASSIGNMENT: BookOpen,
  PDF: FileText,
  LINK: LinkIcon,
  EXAM: ClipboardCheck,
};

const materialColors = {
  ASSIGNMENT: "text-blue-500 bg-blue-500/10",
  PDF: "text-red-500 bg-red-500/10",
  LINK: "text-emerald-500 bg-emerald-500/10",
  EXAM: "text-violet-500 bg-violet-500/10",
};

function WeekCard({ session, index, courseId }: { session: SessionData; index: number; courseId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const utils = trpc.useUtils();

  const { data: materials, isLoading: materialsLoading } = trpc.attendance.getSessionMaterials.useQuery(
    { sessionId: session.id },
    { enabled: expanded }
  );

  const addMaterial = trpc.attendance.addMaterial.useMutation({
    onSuccess: () => {
      utils.attendance.getSessionMaterials.invalidate({ sessionId: session.id });
      utils.attendance.getTeacherCourseSessions.invalidate();
      setShowAddForm(false);
      resetForm();
      toast.success("Material added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMaterial = trpc.attendance.deleteMaterial.useMutation({
    onSuccess: () => {
      utils.attendance.getSessionMaterials.invalidate({ sessionId: session.id });
      utils.attendance.getTeacherCourseSessions.invalidate();
      toast.success("Material removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const [matType, setMatType] = useState<"ASSIGNMENT" | "EXAM" | "LINK">("ASSIGNMENT");
  const [matTitle, setMatTitle] = useState("");
  const [matDescription, setMatDescription] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matDueDate, setMatDueDate] = useState("");
  const [matFile, setMatFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function resetForm() {
    setMatType("ASSIGNMENT");
    setExamData(null);
    setMatTitle("");
    setMatDescription("");
    setMatUrl("");
    setMatDueDate("");
    setMatFile(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!matTitle) return;

    let finalUrl = matUrl;

    if (matFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", matFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          finalUrl = data.url;
        } else {
          toast.error(data.error || "Upload failed");
          setIsUploading(false);
          return;
        }
      } catch (err) {
        toast.error("File upload failed");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    addMaterial.mutate({
      sessionId: session.id,
      type: matType,
      title: matTitle,
      description: matDescription || undefined,
      url: finalUrl || undefined,
      dueDate: matDueDate || undefined,
    });
  }

  const [examData, setExamData] = useState<ExamData | null>(null);

  function handleExamSave(data: ExamData, asDraft: boolean) {
    setExamData(data);
    addMaterial.mutate({
      sessionId: session.id,
      type: "EXAM",
      title: data.settings.title,
      description: data.settings.description || (asDraft ? "[DRAFT]" : undefined),
      url: undefined,
      dueDate: data.settings.endDate || undefined,
    });
  }

  const isUpcoming = new Date(session.scheduledAt) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden"
    >
      {/* Header (clickable) */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{session.title}</h3>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {session.classCode}
            </span>
            {isUpcoming && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">Upcoming</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(session.scheduledAt)}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <ClipboardList className="h-3.5 w-3.5" />
          {session.materialCount} material{session.materialCount !== 1 ? "s" : ""}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border/40">
          <div className="px-5 py-3 flex items-center justify-between border-b border-border/30 bg-muted/5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Materials</h4>
            <button type="button" onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors">
              {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showAddForm ? "Cancel" : "Add Material"}
            </button>
          </div>

          {/* Add Material Form */}
          {showAddForm && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAdd}
              className="border-b border-border/30 p-5 space-y-3 bg-muted/5">
              <div className="flex gap-2">
                {(["ASSIGNMENT", "EXAM", "LINK"] as const).map((t) => {
                  const Icon = materialIcons[t];
                  return (
                    <button key={t} type="button" onClick={() => setMatType(t)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        matType === t ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-background text-muted-foreground hover:bg-accent"
                      }`}>
                      <Icon className="h-3.5 w-3.5" />
                      {t === "EXAM" ? "Exam" : t === "LINK" ? "Link" : "Assignment"}
                    </button>
                  );
                })}
              </div>

              {/* ── Exam tab shows full ExamBuilder instead of simple form ── */}
              {matType === "EXAM" ? (
                <ExamBuilder onSave={handleExamSave} isPending={addMaterial.isPending} />
              ) : (
                <>
                  <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="Title" required
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />

                  <textarea value={matDescription} onChange={(e) => setMatDescription(e.target.value)} placeholder="Description (optional)" rows={2}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none" />

                  {matType === "LINK" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-muted-foreground">External Link URL</label>
                      <input type="url" value={matUrl} onChange={(e) => setMatUrl(e.target.value)}
                        placeholder="External link URL"
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                    </div>
                  )}

                  {matType === "ASSIGNMENT" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Due Date (optional)</label>
                        <input type="datetime-local" value={matDueDate} onChange={(e) => setMatDueDate(e.target.value)}
                          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Instruction File (optional)</label>
                        <input 
                          type="file" 
                          onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button type="submit" disabled={addMaterial.isPending || isUploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50">
                      {addMaterial.isPending || isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {isUploading ? "Uploading..." : "Add"}
                    </button>
                  </div>
                  {addMaterial.error && <p className="text-xs text-red-500">{addMaterial.error.message}</p>}
                </>
              )}
            </motion.form>
          )}

          {/* Materials List */}
          {materialsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !materials?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No materials added yet. Click &quot;Add Material&quot; to upload PDFs, links, or assignments.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {materials.map((mat, i) => {
                const Icon = materialIcons[mat.type as keyof typeof materialIcons] || FileText;
                const colorClass = materialColors[mat.type as keyof typeof materialColors] || "text-muted-foreground bg-muted";
                return (
                  <motion.div key={mat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors group">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{mat.title}</p>
                        <span className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          mat.type === "EXAM" ? "bg-violet-500/10 text-violet-600" : "bg-muted text-muted-foreground"
                        )}>{mat.type}</span>
                      </div>
                      {mat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mat.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {mat.type === "ASSIGNMENT" ? (
                          <a href={`/teacher/courses/${courseId}/weeks/${session.id}/assignments/${mat.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />Open link
                          </a>
                        ) : mat.type === "EXAM" ? (
                          <a href={`/teacher/courses/${courseId}/weeks/${session.id}/exams/${mat.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />Open link
                          </a>
                        ) : mat.url ? (
                          <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />Open link
                          </a>
                        ) : null}
                        {mat.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />Due: {formatDate(mat.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => deleteMaterial.mutate({ materialId: mat.id })} disabled={deleteMaterial.isPending}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════
// ── Students Tab
// ══════════════════════════════════════════════════

function StudentsTab({ courseId }: { courseId: string }) {
  const { data: students, isLoading } = trpc.attendance.getTeacherCourseStudents.useQuery({ courseId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!students?.length) {
    return (
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-16 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No students enrolled yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">
            Students will appear here once they are enrolled in this course by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Enrolled Students ({students.length})
          </h2>
        </div>

        <div className="divide-y divide-border/30">
          {students.map((student, i) => (
            <motion.div key={student.studentId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {student.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{student.studentName}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3" />{student.studentEmail}
                </p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Enrolled {formatDate(student.enrolledAt)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Attendance Tab (Calendar + Check Attendance)
// ══════════════════════════════════════════════════

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; color: string; bg: string }> = {
  PRESENT: { label: "Present", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" },
  LATE: { label: "Late", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" },
  ABSENT: { label: "Absent", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
  LEAVE: { label: "Leave", icon: CalendarOff, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20" },
};

function AttendanceTab({ courseId }: { courseId: string }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: sessions, isLoading } = trpc.attendance.getTeacherCourseSessions.useQuery({ courseId });
  const reportQuery = trpc.attendance.getTeacherCourseAttendanceReport.useQuery({ courseId }, { enabled: false });

  const handleExportAllPDF = async () => {
    setIsExporting(true);
    try {
      const { data } = await reportQuery.refetch();
      if (!data) return;

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`Comprehensive Attendance - ${data.courseTitle}`, 14, 22);

      let currentY = 32;

      for (const session of data.sessions) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(50);
        doc.text(`Session: ${session.title} (${session.classCode})`, 14, currentY);
        currentY += 6;

        const tableColumn = ["Student Name", "Date", "Status", "Note"];
        const tableRows: any[] = [];

        for (const student of data.students) {
          const studentRecords = data.attendance.filter(
            (a: any) => a.sessionId === session.id && a.studentId === student.studentId
          );

          if (studentRecords.length === 0) {
            tableRows.push([student.studentName, "N/A", "Unmarked", ""]);
          } else {
            studentRecords.forEach((rec: any) => {
              const statusLabel = statusConfig[rec.status as AttendanceStatus]?.label || "Unknown";
              tableRows.push([student.studentName, rec.attendanceDate, statusLabel, rec.comments || ""]);
            });
          }
        }

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [63, 63, 70] },
          alternateRowStyles: { fillColor: [244, 244, 245] },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      doc.save(`Complete_Attendance_${data.courseTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-16 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No class sessions yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">
            Your admin needs to create weekly sessions for this course first.
            You can then check attendance for each session.
          </p>
        </div>
      </div>
    );
  }

  if (selectedSessionId) {
    return (
      <AttendanceSheet
        sessionId={selectedSessionId}
        onBack={() => setSelectedSessionId(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          All Sessions ({sessions.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportAllPDF}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export All Weeks PDF
        </motion.button>
      </div>

      {sessions.map((session, i) => {
        const isUpcoming = new Date(session.scheduledAt) > new Date();
        return (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.04)" }}
            onClick={() => setSelectedSessionId(session.id)}
            className="flex w-full items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-4 text-left shadow-sm hover:border-primary/30 transition-all"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
              {session.classCode.slice(-3)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{session.title}</p>
                {isUpcoming ? (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">Upcoming</span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Completed</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(session.scheduledAt)}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Attendance Row (Individual Student) ──
function AttendanceRow({ 
  student, 
  sessionId, 
  selectedDateStr, 
  markMutation 
}: { 
  student: any;
  sessionId: string;
  selectedDateStr: string;
  markMutation: any;
}) {
  const currentStatus = (student.status as AttendanceStatus | null) ?? null;
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState(student.comments || "");

  function handleMark(status: AttendanceStatus, customComment?: string) {
    if (!selectedDateStr) return;
    markMutation.mutate({ 
      sessionId, 
      studentId: student.studentId, 
      attendanceDate: selectedDateStr, 
      status, 
      comments: customComment !== undefined ? customComment : (student.comments || undefined)
    });
  }

  function handleSaveComment() {
    if (!currentStatus) {
      toast.error("Please select an attendance status first");
      return;
    }
    handleMark(currentStatus, commentText);
    setIsEditingComment(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-3 px-5 py-4 hover:bg-muted/20 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {student.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate flex items-center gap-2">
            {student.studentName}
            {student.comments && !isEditingComment && (
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setIsEditingComment(true)}>
                <MessageSquare className="h-3 w-3" /> Note attached
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">{student.studentEmail}</p>
        </div>

        {/* Attendance Buttons */}
        <div className="flex items-center gap-2">
          {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isActive = currentStatus === status;

            return (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMark(status)}
                disabled={markMutation.isPending}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? `${config.bg} ${config.color} border-current shadow-sm`
                    : "border-border/50 bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
              </motion.button>
            );
          })}
          
          <button
            onClick={() => setIsEditingComment(!isEditingComment)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-2"
            title="Add a note"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditingComment && (
        <div className="flex items-center gap-2 mt-2 ml-14">
          <input
            type="text"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Add a reason for leave or late arrival..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveComment();
              if (e.key === "Escape") setIsEditingComment(false);
            }}
          />
          <button
            onClick={handleSaveComment}
            className="h-9 px-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90"
          >
            Save Note
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Attendance Sheet (Mark Students) ──

function AttendanceSheet({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  // Use today as fallback initial date
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.attendance.getSessionStudents.useQuery({ 
    sessionId, 
    attendanceDate: selectedDateStr 
  });

  // When session data loads, if it's the first load, we could snap to the session start date 
  // but keeping it on today or the explicitly selected date is fine.
  
  const markMutation = trpc.attendance.markAttendance.useMutation({
    onSuccess: () => {
      utils.attendance.getSessionStudents.invalidate({ sessionId });
      toast.success("Attendance updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleMark(studentId: string, status: AttendanceStatus) {
    if (!selectedDateStr) return;
    markMutation.mutate({ sessionId, studentId, attendanceDate: selectedDateStr, status });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const presentCount = data?.students?.filter((s) => s.status === "PRESENT").length ?? 0;
  const lateCount = data?.students?.filter((s) => s.status === "LATE").length ?? 0;
  const absentCount = data?.students?.filter((s) => s.status === "ABSENT").length ?? 0;
  const leaveCount = data?.students?.filter((s) => s.status === "LEAVE").length ?? 0;
  const unmarkedCount = data?.students?.filter((s) => !s.status).length ?? 0;

  const handleExportPDF = async () => {
    if (!data?.session || !data?.students) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Daily Attendance Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Class: ${data.session.title} (${data.session.classCode})`, 14, 30);
    doc.text(`Date: ${selectedDateStr}`, 14, 36);
    
    doc.text(`Summary: ${presentCount} Present, ${lateCount} Late, ${absentCount} Absent, ${leaveCount} Leave, ${unmarkedCount} Unmarked`, 14, 44);

    // Table
    const tableColumn = ["Student Name", "Email", "Status", "Note"];
    const tableRows = data.students.map((student: any) => [
      student.studentName,
      student.studentEmail,
      student.status ? statusConfig[student.status as AttendanceStatus].label : "Unmarked",
      student.comments || ""
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [63, 63, 70] },
      alternateRowStyles: { fillColor: [244, 244, 245] },
    });

    doc.save(`Attendance_${data.session.classCode}_${selectedDateStr}.pdf`);
  };

  // Generate 7 days for the session's week
  const sessionStartDate = data?.session?.scheduledAt ? new Date(data.session.scheduledAt) : new Date();
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sessionStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">{data?.session?.title}</h2>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {data?.session?.classCode}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.session?.scheduledAt && formatDate(data.session.scheduledAt)}
          </p>
        </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPDF}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> {presentCount} Present
        </span>
        <span className="flex items-center gap-1.5 text-amber-500">
          <Clock className="h-3.5 w-3.5" /> {lateCount} Late
        </span>
        <span className="flex items-center gap-1.5 text-red-500">
          <XCircle className="h-3.5 w-3.5" /> {absentCount} Absent
        </span>
        <span className="flex items-center gap-1.5 text-indigo-500">
          <CalendarOff className="h-3.5 w-3.5" /> {leaveCount} Leave
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {unmarkedCount} Unmarked
        </span>
      </div>

      {/* Day Picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const isSelected = dateStr === selectedDateStr;
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = date.getDate();

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDateStr(dateStr)}
              className={cn(
                "flex flex-col items-center justify-center min-w-12 px-3 py-2 rounded-xl border transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                  : "bg-card border-border/50 text-muted-foreground hover:border-primary/40 hover:bg-muted"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{dayName}</span>
              <span className="text-sm font-black">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Student List */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Students ({data?.students?.length ?? 0})
          </h3>
        </div>

        {!data?.students?.length ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {data.students.map((student, i) => (
              <AttendanceRow 
                key={student.studentId}
                student={student}
                sessionId={sessionId}
                selectedDateStr={selectedDateStr}
                markMutation={markMutation as any}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
