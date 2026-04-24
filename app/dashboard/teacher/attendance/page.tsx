"use client";

import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/shared/PageHeader";
import { AnimatedPage } from "@/components/ui/animated";
import { formatDate } from "@/lib/utils";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Loader2,
  ClipboardList,
  CalendarDays,
  Users,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Plus,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Trash2,
  X,
  Download,
} from "lucide-react";
import { useState } from "react";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

const statusConfig: Record<
  AttendanceStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  PRESENT: {
    label: "Present",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
  },
  LATE: {
    label: "Late",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
  },
};

export default function TeacherAttendancePage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar role="TEACHER" />
        <main className="flex-1 p-6 lg:p-8 2xl:p-10 overflow-hidden">
          <AnimatedPage>
            {selectedSessionId ? (
              <AttendanceSheet
                sessionId={selectedSessionId}
                onBack={() => setSelectedSessionId(null)}
              />
            ) : (
              <SessionList onSelect={setSelectedSessionId} />
            )}
          </AnimatedPage>
        </main>
      </div>
    </div>
  );
}

// ── Session List ──

function SessionList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: sessions, isLoading } = trpc.attendance.getTeacherSessions.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance" description="Your assigned class sessions" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`${sessions?.length ?? 0} class sessions assigned to you`}
      />

      {!sessions?.length ? (
        <div className="rounded-2xl border border-border/50 bg-card p-16 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No classes assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your admin will assign you to class sessions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session, i) => {
            const isUpcoming = new Date(session.scheduledAt) > new Date();
            const allMarked = session.studentCount > 0 && session.markedCount >= session.studentCount;

            return (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.06)" }}
                onClick={() => onSelect(session.id)}
                className="group relative flex flex-col text-left rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:border-primary/30 transition-all cursor-pointer"
              >
                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  {allMarked ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  ) : isUpcoming ? (
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-500">
                      <Clock className="h-3 w-3" /> Upcoming
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-500">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  )}
                </div>

                {/* Class code */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm mb-4 group-hover:scale-105 transition-transform">
                  {session.classCode.slice(0, 4)}
                </div>

                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                  {session.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{session.courseTitle}</p>

                {/* Footer Stats */}
                <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(session.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {session.markedCount}/{session.studentCount}
                  </span>
                </div>

                {/* Arrow */}
                <ChevronRight className="absolute bottom-6 right-5 h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Attendance Sheet (Mark students + Materials) ──

function AttendanceSheet({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.attendance.getSessionStudents.useQuery({
    sessionId,
  });

  const markMutation = trpc.attendance.markAttendance.useMutation({
    onSuccess: () => {
      utils.attendance.getSessionStudents.invalidate({ sessionId });
    },
    onError: (e) => {
      toast.error(e.message || "Failed to mark attendance");
    },
  });

  function handleMark(studentId: string, status: AttendanceStatus) {
    const attendanceDate = new Date().toISOString().split("T")[0];
    markMutation.mutate({ sessionId, studentId, status, attendanceDate });
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
  const unmarkedCount = data?.students?.filter((s) => !s.status).length ?? 0;

  const handleExportPDF = async () => {
    if (!data?.session || !data?.students) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Attendance Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Class: ${data.session.title} (${data.session.classCode})`, 14, 30);
    doc.text(`Date: ${formatDate(data.session.scheduledAt)}`, 14, 36);
    
    const presentCount = data.students.filter((s) => s.status === "PRESENT").length;
    const lateCount = data.students.filter((s) => s.status === "LATE").length;
    const absentCount = data.students.filter((s) => s.status === "ABSENT").length;
    const unmarkedCount = data.students.filter((s) => !s.status).length;
    
    doc.text(`Summary: ${presentCount} Present, ${lateCount} Late, ${absentCount} Absent, ${unmarkedCount} Unmarked`, 14, 44);

    // Table
    const tableColumn = ["Student Name", "Email", "Status"];
    const tableRows = data.students.map(student => [
      student.studentName,
      student.studentEmail,
      student.status ? statusConfig[student.status as AttendanceStatus].label : "Unmarked"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [63, 63, 70] },
      alternateRowStyles: { fillColor: [244, 244, 245] },
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Attendance_${data.session.classCode}_${dateStr}.pdf`);
  };

  return (
    <div className="space-y-6">
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
              <h1 className="text-2xl font-bold tracking-tight">{data?.session?.title}</h1>
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

      {/* Quick Stats Row */}
      <div className="flex items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> {presentCount} Present
        </span>
        <span className="flex items-center gap-1.5 text-amber-500">
          <Clock className="h-3.5 w-3.5" /> {lateCount} Late
        </span>
        <span className="flex items-center gap-1.5 text-red-500">
          <XCircle className="h-3.5 w-3.5" /> {absentCount} Absent
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {unmarkedCount} Unmarked
        </span>
      </div>

      {/* Materials Section */}
      <MaterialsSection sessionId={sessionId} />

      {/* Student List */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Students ({data?.students?.length ?? 0})
          </h2>
        </div>

        {!data?.students?.length ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {data.students.map((student, i) => {
              const currentStatus =
                (student.status as AttendanceStatus | null) ?? null;

              return (
                <motion.div
                  key={student.studentId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {student.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.studentEmail}
                    </p>
                  </div>

                  {/* Attendance Buttons */}
                  <div className="flex items-center gap-2">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map(
                      (status) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        const isActive = currentStatus === status;

                        return (
                          <motion.button
                            key={status}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handleMark(student.studentId, status)
                            }
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
                      }
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Materials Section ──

const materialIcons = {
  ASSIGNMENT: BookOpen,
  PDF: FileText,
  LINK: LinkIcon,
};

const materialColors = {
  ASSIGNMENT: "text-blue-500 bg-blue-500/10",
  PDF: "text-red-500 bg-red-500/10",
  LINK: "text-emerald-500 bg-emerald-500/10",
};

function MaterialsSection({ sessionId }: { sessionId: string }) {
  const utils = trpc.useUtils();
  const { data: materials, isLoading } = trpc.attendance.getSessionMaterials.useQuery({ sessionId });

  const addMaterial = trpc.attendance.addMaterial.useMutation({
    onSuccess: () => {
      utils.attendance.getSessionMaterials.invalidate({ sessionId });
      setShowAddForm(false);
      resetAddForm();
    },
  });

  const deleteMaterial = trpc.attendance.deleteMaterial.useMutation({
    onSuccess: () => utils.attendance.getSessionMaterials.invalidate({ sessionId }),
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [matType, setMatType] = useState<"ASSIGNMENT" | "PDF" | "LINK">("ASSIGNMENT");
  const [matTitle, setMatTitle] = useState("");
  const [matDescription, setMatDescription] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matDueDate, setMatDueDate] = useState("");

  function resetAddForm() {
    setMatType("ASSIGNMENT");
    setMatTitle("");
    setMatDescription("");
    setMatUrl("");
    setMatDueDate("");
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!matTitle) return;
    addMaterial.mutate({
      sessionId,
      type: matType,
      title: matTitle,
      description: matDescription || undefined,
      url: matUrl || undefined,
      dueDate: matDueDate || undefined,
    });
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Materials ({materials?.length ?? 0})
        </h2>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? "Cancel" : "Add Material"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleAdd}
          className="border-b border-border/50 p-5 space-y-3 bg-muted/10"
        >
          {/* Type Selector */}
          <div className="flex gap-2">
            {(["ASSIGNMENT", "PDF", "LINK"] as const).map((t) => {
              const Icon = materialIcons[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMatType(t)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    matType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t === "PDF" ? "PDF / File" : t === "LINK" ? "Link" : "Assignment"}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={matTitle}
            onChange={(e) => setMatTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          />

          <textarea
            value={matDescription}
            onChange={(e) => setMatDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />

          {(matType === "PDF" || matType === "LINK") && (
            <input
              type="url"
              value={matUrl}
              onChange={(e) => setMatUrl(e.target.value)}
              placeholder={matType === "PDF" ? "PDF link URL" : "External link URL"}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          )}

          {matType === "ASSIGNMENT" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Due Date (optional)
              </label>
              <input
                type="datetime-local"
                value={matDueDate}
                onChange={(e) => setMatDueDate(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addMaterial.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
            >
              {addMaterial.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add
            </button>
          </div>

          {addMaterial.error && (
            <p className="text-xs text-red-500">{addMaterial.error.message}</p>
          )}
        </motion.form>
      )}

      {/* Materials List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !materials?.length ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          No materials added yet. Click &quot;Add Material&quot; to add assignments, PDFs, or links.
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {materials.map((mat, i) => {
            const Icon = materialIcons[mat.type as keyof typeof materialIcons] || FileText;
            const colorClass = materialColors[mat.type as keyof typeof materialColors] || "text-muted-foreground bg-muted";

            return (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors group"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{mat.title}</p>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      {mat.type}
                    </span>
                  </div>
                  {mat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mat.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {mat.url && (
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Open link
                      </a>
                    )}
                    {mat.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {formatDate(mat.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMaterial.mutate({ materialId: mat.id })}
                  disabled={deleteMaterial.isPending}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
