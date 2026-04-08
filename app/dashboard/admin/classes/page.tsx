"use client";

import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { motion } from "motion/react";
import { AnimatedPage } from "@/components/ui/animated";
import { formatDate } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Trash2,
  Users,
  CalendarDays,
  ClipboardList,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserMinus,
  Search,
} from "lucide-react";
import { useState, useMemo } from "react";

interface SessionRow {
  id: string;
  classCode: string;
  courseId: string;
  title: string;
  courseTitle: string;
  courseGroup: string | null;
  teacherName: string;
  scheduledAt: string | Date;
  createdAt: string | Date;
  studentCount: number;
}

export default function AdminClassesPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.attendance.getSessions.useQuery({
    limit: 200,
    offset: 0,
  });
  const { data: usersData } = trpc.admin.getUsers.useQuery({
    limit: 100,
    offset: 0,
    role: "TEACHER",
  });

  const createSession = trpc.attendance.createSession.useMutation({
    onSuccess: () => {
      utils.attendance.getSessions.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const batchCreate = trpc.attendance.batchCreateSessions.useMutation({
    onSuccess: () => {
      utils.attendance.getSessions.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const deleteSession = trpc.attendance.deleteSession.useMutation({
    onSuccess: () => utils.attendance.getSessions.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [weekCount, setWeekCount] = useState(15);
  const [group, setGroup] = useState("");
  const [createMode, setCreateMode] = useState<"single" | "multi">("multi");
  const [searchQuery, setSearchQuery] = useState("");

  // Group sessions by base class code (e.g. PM-098 from PM-098-W01)
  const groupedSessions = useMemo(() => {
    if (!data?.sessions) return [];

    const grouped: Record<string, { courseTitle: string; courseId: string; courseGroup: string | null; teacherName: string; baseCode: string; sessions: SessionRow[] }> = {};

    for (const s of data.sessions) {
      // Extract base code: "PM-098-W01" → "PM-098", "CS101" → "CS101"
      const baseCode = s.classCode.replace(/-W\d+$/, "");
      if (!grouped[baseCode]) {
        grouped[baseCode] = {
          courseTitle: s.courseTitle,
          courseId: s.courseId,
          courseGroup: s.courseGroup,
          teacherName: s.teacherName,
          baseCode,
          sessions: [],
        };
      }
      grouped[baseCode].sessions.push(s);
    }

    // Sort each group's sessions by scheduledAt
    for (const g of Object.values(grouped)) {
      g.sessions.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }

    return Object.values(grouped);
  }, [data?.sessions]);

  // Filter grouped sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return groupedSessions;
    const q = searchQuery.toLowerCase();
    return groupedSessions.filter(g =>
      g.courseTitle.toLowerCase().includes(q) ||
      g.baseCode.toLowerCase().includes(q) ||
      g.teacherName.toLowerCase().includes(q) ||
      (g.courseGroup || "").toLowerCase().includes(q)
    );
  }, [groupedSessions, searchQuery]);

  function resetForm() {
    setClassCode("");
    setCourseName("");
    setTeacherId("");
    setTitle("");
    setScheduledAt("");
    setWeekCount(15);
    setGroup("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (createMode === "multi") {
      if (!classCode || !courseName || !teacherId || !scheduledAt || weekCount < 1) return;
      batchCreate.mutate({
        classCode,
        courseName,
        teacherId,
        weekCount,
        startDate: scheduledAt,
        group: group || undefined,
      });
    } else {
      if (!classCode || !courseName || !teacherId || !title || !scheduledAt) return;
      createSession.mutate({ classCode, courseName, teacherId, title, scheduledAt, group: group || undefined });
    }
  }

  const isPending = createSession.isPending || batchCreate.isPending;
  const error = createSession.error || batchCreate.error;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Management" description="Create and manage class sessions" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedPage>
        <div className="flex items-center justify-between">
          <PageHeader
            title="Class Management"
            description={`${groupedSessions.length} course${groupedSessions.length !== 1 ? "s" : ""} · ${data?.total ?? 0} sessions`}
          />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-xl border border-border/60 bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancel" : "Create Class"}
            </motion.button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mt-6 rounded-2xl border border-border/50 bg-card p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                New Class
              </h3>

              {/* Mode Toggle */}
              <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCreateMode("multi")}
                  className={`px-3 py-1.5 transition-colors ${
                    createMode === "multi"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Multiple Weeks
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("single")}
                  className={`px-3 py-1.5 transition-colors ${
                    createMode === "single"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Single Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Class Code / ID
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="e.g. CS101"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
                {createMode === "multi" && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Each week: {classCode || "CS101"}-W01, {classCode || "CS101"}-W02, ...
                  </p>
                )}
              </div>

              {createMode === "single" ? (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Week 1 - Introduction"
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Number of Weeks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={weekCount}
                    onChange={(e) => setWeekCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Course Name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Introduction to Programming"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Assign Teacher
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a teacher</option>
                  {usersData?.users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {createMode === "multi" ? "Start Date" : "Scheduled Date & Time"}
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
                {createMode === "multi" && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Each subsequent week adds 7 days
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Group / Section
                </label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="e.g. Group A, Section 1"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Optional — for organizing multiple sections
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {createMode === "multi"
                  ? `Create ${weekCount} Week${weekCount > 1 ? "s" : ""}`
                  : "Create Session"}
              </motion.button>
            </div>

            {error && (
              <p className="text-sm text-red-500 mt-2">{error.message}</p>
            )}
          </motion.form>
        )}

        {/* Grouped Sessions List */}
        <div className="mt-8 space-y-6">
          {!groupedSessions.length ? (
            <div className="rounded-2xl border border-border/50 bg-card p-16 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No classes yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first class above.</p>
            </div>
          ) : !filteredSessions.length ? (
            <div className="rounded-2xl border border-border/50 bg-card p-16 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
            </div>
          ) : (
            filteredSessions.map((group, gi) => (
              <CourseGroupCard
                key={group.baseCode}
                group={group}
                index={gi}
                onDelete={(id) => deleteSession.mutate({ sessionId: id })}
                isDeleting={deleteSession.isPending}
              />
            ))
          )}
        </div>
      </AnimatedPage>
    </div>
  );
}

// ── Course Group Card ──
// All weeks for one course inside one container

function CourseGroupCard({
  group,
  index,
  onDelete,
  isDeleting,
}: {
  group: { courseTitle: string; courseId: string; courseGroup: string | null; teacherName: string; baseCode: string; sessions: SessionRow[] };
  index: number;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showStudents, setShowStudents] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden"
    >
      {/* Course Header */}
      <div className="flex items-center gap-4 px-6 py-5 hover:bg-muted/10 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-4 flex-1 min-w-0 text-left"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
            {group.sessions[0]?.classCode.slice(0, 2).toUpperCase() || "CL"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold truncate">{group.courseTitle}</h3>
              {group.sessions[0]?.classCode && (
                <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  {group.sessions[0].classCode.replace(/-W\d+$/, "")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Teacher: {group.teacherName}{group.courseGroup ? ` · Group ${group.courseGroup}` : ""} · {group.sessions.length} week{group.sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs font-medium hidden sm:block">
              {group.sessions.length} sessions
            </span>
            {expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Manage Students */}
        <button
          type="button"
          onClick={() => setShowStudents(!showStudents)}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
            showStudents
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/50 bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Students
        </button>

        {/* Delete entire class */}
        <button
          type="button"
          onClick={() => {
            for (const s of group.sessions) {
              onDelete(s.id);
            }
          }}
          disabled={isDeleting}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Students Panel */}
      {showStudents && (
        <div className="border-t border-border/40">
          <StudentManager courseId={group.courseId} />
        </div>
      )}

      {/* Weeks List */}
      {expanded && (
        <div className="border-t border-border/40">
          {group.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-border/20 last:border-b-0 hover:bg-muted/5 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-primary">
                  {session.title}
                </h4>
                <p className="text-xs text-primary/70 flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3 w-3" />
                  {session.classCode} ({new Date(session.scheduledAt).toLocaleDateString("en-CA")} {new Date(session.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })})
                </p>
              </div>

              <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {session.studentCount}
              </span>

              <button
                type="button"
                onClick={() => onDelete(session.id)}
                disabled={isDeleting}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Student Manager ──

function StudentManager({ courseId }: { courseId: string }) {
  const utils = trpc.useUtils();
  const { data: students, isLoading } = trpc.attendance.getCourseStudents.useQuery({ courseId });
  const { data: allStudents } = trpc.admin.getUsers.useQuery({ limit: 200, offset: 0, role: "STUDENT" });

  const enrollMut = trpc.attendance.enrollStudent.useMutation({
    onSuccess: () => {
      utils.attendance.getCourseStudents.invalidate({ courseId });
      utils.attendance.getSessions.invalidate();
    },
  });

  const unenrollMut = trpc.attendance.unenrollStudent.useMutation({
    onSuccess: () => {
      utils.attendance.getCourseStudents.invalidate({ courseId });
      utils.attendance.getSessions.invalidate();
    },
  });

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out already-enrolled students
  const enrolledIds = new Set(students?.map((s) => s.studentId) ?? []);
  const available = allStudents?.users?.filter((u) => !enrolledIds.has(u.id)) ?? [];
  const filteredAvailable = available.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-6 py-4 bg-muted/5 space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-primary" />
        Enrolled Students ({students?.length ?? 0})
      </h4>

      {/* Add Multiple Students */}
      {available.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="p-2 border-b border-border/60 bg-muted/20">
            <input
              type="text"
              placeholder="Search available students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border/30">
            {filteredAvailable.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.has(u.id)}
                  onChange={(e) => {
                    const next = new Set(selectedStudents);
                    if (e.target.checked) next.add(u.id);
                    else next.delete(u.id);
                    setSelectedStudents(next);
                  }}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
              </label>
            ))}
            {filteredAvailable.length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No students found matching your search.
              </div>
            )}
          </div>
          <div className="bg-muted/20 p-2.5 flex justify-between items-center border-t border-border/60">
            <span className="text-xs font-medium text-muted-foreground pl-1">
              {selectedStudents.size} selected
            </span>
            <button
              type="button"
              onClick={async () => {
                const ids = Array.from(selectedStudents);
                if (!ids.length) return;
                try {
                  await Promise.all(ids.map(id => enrollMut.mutateAsync({ courseId, studentId: id })));
                  setSelectedStudents(new Set());
                  setSearchTerm("");
                } catch (e) {
                  console.error("Batch enrollment failed:", e);
                }
              }}
              disabled={selectedStudents.size === 0 || enrollMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:bg-primary/90"
            >
              {enrollMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Add Selected
            </button>
          </div>
        </div>
      )}

      {/* Enrolled List */}
      {isLoading ? (
        <div className="py-4 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : !students?.length ? (
        <p className="text-xs text-muted-foreground py-2">No students enrolled yet.</p>
      ) : (
        <div className="space-y-1">
          {students.map((s) => (
            <div
              key={s.enrollmentId}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {s.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{s.studentName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.studentEmail}</p>
              </div>
              <button
                type="button"
                onClick={() => unenrollMut.mutate({ enrollmentId: s.enrollmentId })}
                disabled={unenrollMut.isPending}
                className="shrink-0 rounded p-1 text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {enrollMut.error && (
        <p className="text-xs text-red-500">{enrollMut.error.message}</p>
      )}
    </div>
  );
}
