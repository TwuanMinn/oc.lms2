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
  Calendar,
  BookOpen,
  Pencil,
  Check,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { type Day, DAYS, PERIODS, buildEventDates } from "@/components/calendar/timetable-data";
import { toast } from "sonner";

const ScheduleCalendar = dynamic(
  () => import("@/components/calendar/ScheduleCalendar"),
  { ssr: false }
);

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

type ClassTab = "manage" | "schedule";

export default function AdminClassesPage() {
  const [activeTab, setActiveTab] = useState<ClassTab>("manage");
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

  // Helper: fire schedule creation with a known courseId
  function scheduleOnTimetable(courseId: string, courseTitle: string) {
    const { start, end } = buildEventDates(formDay, formPeriodId);
    const trimmedRoom = formRoom.trim();
    const room = trimmedRoom ? (/^\d+$/.test(trimmedRoom) ? `Room ${trimmedRoom}` : trimmedRoom) : undefined;
    createSchedule.mutate({
      courseId,
      title: courseTitle,
      room,
      classType: formClassType,
      eventType: "LIVE_CLASS",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  }

  const createSession = trpc.attendance.createSession.useMutation({
    onSuccess: async (data) => {
      utils.attendance.getSessions.invalidate();
      // Schedule on timetable using the courseId from the created session
      if (data?.courseId) {
        scheduleOnTimetable(data.courseId, courseName);
      }
      setShowForm(false);
      resetForm();
    },
  });

  const batchCreate = trpc.attendance.batchCreateSessions.useMutation({
    onSuccess: (data) => {
      utils.attendance.getSessions.invalidate();
      // Schedule on timetable using the courseId returned from batch create
      if (data?.course?.id) {
        scheduleOnTimetable(data.course.id, data.course.title);
      }
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

  // ── Schedule fields (incorporated into create form) ──
  const [formDay, setFormDay] = useState<Day>("Monday");
  const [formPeriodId, setFormPeriodId] = useState(1);
  const [formRoom, setFormRoom] = useState("");
  const [formClassType, setFormClassType] = useState<"LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION">("LECTURE");

  const coursesQ = trpc.schedule.allCourses.useQuery();

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success("Scheduled on timetable ✓");
      utils.schedule.getMySchedules.invalidate();
      utils.schedule.allCourses.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Group sessions by base class code
  const groupedSessions = useMemo(() => {
    if (!data?.sessions) return [];

    const grouped: Record<string, { courseTitle: string; courseId: string; courseGroup: string | null; teacherName: string; baseCode: string; sessions: SessionRow[] }> = {};

    for (const s of data.sessions) {
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

    for (const g of Object.values(grouped)) {
      g.sessions.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }

    return Object.values(grouped);
  }, [data?.sessions]);

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
    setFormDay("Monday");
    setFormPeriodId(1);
    setFormRoom("");
    setFormClassType("LECTURE");
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
      createSession.mutate({
        classCode,
        courseName,
        teacherId,
        title,
        scheduledAt,
        group: group || undefined,
      });
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
        </div>

        {/* ── Tab Switcher ── */}
        <div className="mt-4 flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("manage")}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "manage"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Manage Class
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "schedule"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
        </div>

        {/* ── Schedule Tab ── */}
        {activeTab === "schedule" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 -mx-6 -mb-6"
          >
            <ScheduleCalendar role="ADMIN" />
          </motion.div>
        )}

        {/* ── Manage Class Tab ── */}
        {activeTab === "manage" && (
        <div className="mt-4">
        <div className="flex items-center justify-end gap-3">
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

        {/* ── Create Class Form ── */}
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
              <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs font-semibold">
                <button type="button" onClick={() => setCreateMode("multi")}
                  className={`px-3 py-1.5 transition-colors ${createMode === "multi" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"}`}>
                  Multiple Weeks
                </button>
                <button type="button" onClick={() => setCreateMode("single")}
                  className={`px-3 py-1.5 transition-colors ${createMode === "single" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"}`}>
                  Single Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Class Code / ID</label>
                <input type="text" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="e.g. CS101"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
                {createMode === "multi" && (
                  <p className="text-[10px] text-muted-foreground mt-1">Each week: {classCode || "CS101"}-W01, {classCode || "CS101"}-W02, ...</p>
                )}
              </div>

              {createMode === "single" ? (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Session Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 - Introduction"
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Number of Weeks</label>
                  <input type="number" min={1} max={52} value={weekCount} onChange={(e) => setWeekCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Course Name</label>
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Introduction to Programming"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Primary Teacher</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required>
                  <option value="">Select a teacher</option>
                  {usersData?.users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Add more teachers per-week after creating</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {createMode === "multi" ? "Start Date" : "Scheduled Date & Time"}
                </label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
                {createMode === "multi" && (
                  <p className="text-[10px] text-muted-foreground mt-1">Each subsequent week adds 7 days</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Group / Section</label>
                <input type="text" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Group A, Section 1"
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                <p className="text-[10px] text-muted-foreground mt-1">Optional — for organizing multiple sections</p>
              </div>
            </div>

            {/* ── Schedule Info (DAY, PERIOD, ROOM, TYPE) ── */}
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Schedule Info</h4>
                <span className="text-[10px] text-muted-foreground ml-1">(optional — adds to timetable)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Day</label>
                  <select value={formDay} onChange={(e) => setFormDay(e.target.value as Day)}
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Period</label>
                  <select value={formPeriodId} onChange={(e) => setFormPeriodId(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label} ({p.start})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Room</label>
                  <input type="text" value={formRoom} onChange={(e) => setFormRoom(e.target.value)} placeholder="e.g. Room 101"
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={formClassType} onChange={(e) => setFormClassType(e.target.value as typeof formClassType)}
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    <option value="LECTURE">Lecture</option>
                    <option value="LAB">Lab</option>
                    <option value="MAKEUP_CLASS">Make-up Class</option>
                    <option value="ONLINE_SESSION">Online Session</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {createMode === "multi" ? `Create ${weekCount} Week${weekCount > 1 ? "s" : ""}` : "Create Session"}
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
                teachers={usersData?.users ?? []}
              />
            ))
          )}
        </div>
        </div>
        )}
      </AnimatedPage>
    </div>
  );
}

// ── Course Group Card ──
// All weeks for one course inside one container

// ── Multi-select dropdown for teachers (checkbox list with search) ──

function TeacherMultiSelect({
  teachers,
  selected,
  onChange,
  placeholder = "Select teachers",
  disabledIds,
  className,
}: {
  teachers: Array<{ id: string; name: string; email: string }>;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  placeholder?: string;
  disabledIds?: Set<string>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = teachers.filter((t) => {
    if (!term.trim()) return true;
    const q = term.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });

  // Disabled (locked-in) teachers don't count toward the label — the user hasn't
  // picked them, they're just there because they can't be deselected
  const selectedNames = teachers
    .filter((t) => selected.has(t.id) && !disabledIds?.has(t.id))
    .map((t) => t.name);
  const label =
    selectedNames.length === 0
      ? placeholder
      : selectedNames.length <= 2
        ? selectedNames.join(", ")
        : `${selectedNames.length} teachers selected`;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-left"
      >
        <span className={`truncate ${selectedNames.length ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[240px] rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border/60 bg-muted/20">
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search teachers..."
              className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">No teachers found</div>
            ) : (
              filtered.map((t) => {
                const checked = selected.has(t.id);
                const isDisabled = disabledIds?.has(t.id) ?? false;
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2 text-xs ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(t.id);
                        else next.delete(t.id);
                        onChange(next);
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.email}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseGroupCard({
  group,
  index,
  onDelete,
  isDeleting,
  teachers,
}: {
  group: { courseTitle: string; courseId: string; courseGroup: string | null; teacherName: string; baseCode: string; sessions: SessionRow[] };
  index: number;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
  teachers: Array<{ id: string; name: string; email: string }>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showStudents, setShowStudents] = useState(false);
  const [editing, setEditing] = useState(false);
  const utils = trpc.useUtils();

  // Derive current teacher id from name (best-effort) so the select has a starting value
  const initialTeacherId = useMemo(
    () => teachers.find((t) => t.name === group.teacherName)?.id ?? "",
    [teachers, group.teacherName]
  );

  const [draftTitle, setDraftTitle] = useState(group.courseTitle);
  const [draftPrimaryTeacherId, setDraftPrimaryTeacherId] = useState(initialTeacherId);
  const [draftGroup, setDraftGroup] = useState(group.courseGroup ?? "");

  // Per-session edits keyed by sessionId → { title, scheduledAt, teacherIds }
  const [sessionDrafts, setSessionDrafts] = useState<
    Record<string, { title: string; scheduledAt: string; teacherIds: Set<string> }>
  >({});

  // Only fetch teacher assignments when the user enters edit mode
  const assignmentsQ = trpc.attendance.getTeacherAssignments.useQuery(
    { courseId: group.courseId },
    { enabled: editing }
  );

  function toLocalDatetimeInput(d: string | Date) {
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // When assignments arrive, seed the per-session teacher drafts
  React.useEffect(() => {
    if (!editing || !assignmentsQ.data) return;
    setDraftPrimaryTeacherId(assignmentsQ.data.primaryTeacherId);
    const map: Record<string, { title: string; scheduledAt: string; teacherIds: Set<string> }> = {};
    for (const s of group.sessions) {
      map[s.id] = {
        title: s.title,
        scheduledAt: toLocalDatetimeInput(s.scheduledAt),
        teacherIds: new Set(assignmentsQ.data.sessionTeachers[s.id] ?? []),
      };
    }
    setSessionDrafts(map);
  }, [editing, assignmentsQ.data, group.sessions]);

  function enterEdit() {
    setDraftTitle(group.courseTitle);
    setDraftGroup(group.courseGroup ?? "");
    setEditing(true);
  }

  const invalidate = () => {
    utils.attendance.getSessions.invalidate();
    utils.attendance.getTeacherAssignments.invalidate({ courseId: group.courseId });
  };

  const updateCourse = trpc.attendance.updateCourseMeta.useMutation({ onSuccess: invalidate });
  const updateSession = trpc.attendance.updateSession.useMutation({ onSuccess: invalidate });

  const saving = updateCourse.isPending || updateSession.isPending;

  // When primary teacher changes, auto-add them to every session's teacher set
  // (they can't be deselected from teaching)
  React.useEffect(() => {
    if (!editing || !draftPrimaryTeacherId) return;
    setSessionDrafts((prev) => {
      let changed = false;
      const next: typeof prev = {};
      for (const [sid, d] of Object.entries(prev)) {
        if (d.teacherIds.has(draftPrimaryTeacherId)) {
          next[sid] = d;
        } else {
          changed = true;
          const t = new Set(d.teacherIds);
          t.add(draftPrimaryTeacherId);
          next[sid] = { ...d, teacherIds: t };
        }
      }
      return changed ? next : prev;
    });
  }, [draftPrimaryTeacherId, editing]);

  async function handleSave() {
    try {
      const data = assignmentsQ.data;
      if (!data) {
        toast.error("Still loading — try again in a moment");
        return;
      }

      const metaChanged =
        draftTitle !== group.courseTitle ||
        draftPrimaryTeacherId !== data.primaryTeacherId ||
        (draftGroup || "") !== (group.courseGroup ?? "");

      if (metaChanged) {
        await updateCourse.mutateAsync({
          courseId: group.courseId,
          title: draftTitle !== group.courseTitle ? draftTitle : undefined,
          teacherId: draftPrimaryTeacherId !== data.primaryTeacherId ? draftPrimaryTeacherId : undefined,
          group: draftGroup !== (group.courseGroup ?? "")
            ? (draftGroup.trim() ? draftGroup.trim() : null)
            : undefined,
        });
      }

      for (const s of group.sessions) {
        const draft = sessionDrafts[s.id];
        if (!draft) continue;
        const origAt = toLocalDatetimeInput(s.scheduledAt);
        const origTeacherSet = new Set(data.sessionTeachers[s.id] ?? []);

        const teacherSetChanged =
          draft.teacherIds.size !== origTeacherSet.size ||
          Array.from(draft.teacherIds).some((id) => !origTeacherSet.has(id));

        const titleChanged = draft.title !== s.title;
        const timeChanged = draft.scheduledAt !== origAt;

        if (!titleChanged && !timeChanged && !teacherSetChanged) continue;

        await updateSession.mutateAsync({
          sessionId: s.id,
          title: titleChanged ? draft.title : undefined,
          scheduledAt: timeChanged ? new Date(draft.scheduledAt).toISOString() : undefined,
          teacherIds: teacherSetChanged ? Array.from(draft.teacherIds) : undefined,
        });
      }

      toast.success("Saved ✓");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden"
    >
      {/* Course Header */}
      <div className="flex items-center gap-4 px-6 py-5 hover:bg-muted/10 transition-colors">
        {editing ? (
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
              {group.sessions[0]?.classCode.slice(0, 2).toUpperCase() || "CL"}
            </div>
            <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Course title"
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <select
                value={draftPrimaryTeacherId}
                onChange={(e) => setDraftPrimaryTeacherId(e.target.value)}
                title="Primary teacher"
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Primary teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={draftGroup}
                onChange={(e) => setDraftGroup(e.target.value)}
                placeholder="Group (optional)"
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        ) : (
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
        )}

        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={enterEdit}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>

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
          </>
        )}
      </div>

      {/* Students Panel */}
      {showStudents && !editing && (
        <div className="border-t border-border/40">
          <StudentManager courseId={group.courseId} />
        </div>
      )}

      {/* Weeks List */}
      {(expanded || editing) && (
        <div className="border-t border-border/40">
          {group.sessions.map((session) => {
            const draft = sessionDrafts[session.id];
            return (
              <div
                key={session.id}
                className="flex items-center gap-4 px-6 py-4 border-b border-border/20 last:border-b-0 hover:bg-muted/5 transition-colors group"
              >
                {editing && draft ? (
                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) =>
                        setSessionDrafts((prev) => ({
                          ...prev,
                          [session.id]: { ...prev[session.id], title: e.target.value },
                        }))
                      }
                      placeholder="Session title"
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                    <input
                      type="datetime-local"
                      value={draft.scheduledAt}
                      onChange={(e) =>
                        setSessionDrafts((prev) => ({
                          ...prev,
                          [session.id]: { ...prev[session.id], scheduledAt: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                    <TeacherMultiSelect
                      teachers={teachers}
                      selected={draft.teacherIds}
                      onChange={(next) =>
                        setSessionDrafts((prev) => ({
                          ...prev,
                          [session.id]: { ...prev[session.id], teacherIds: next },
                        }))
                      }
                      placeholder="Who teaches this week?"
                      disabledIds={draftPrimaryTeacherId ? new Set([draftPrimaryTeacherId]) : undefined}
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-primary">
                      {session.title}
                    </h4>
                    <p className="text-xs text-primary/70 flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="h-3 w-3" />
                      {session.classCode} ({new Date(session.scheduledAt).toLocaleDateString("en-CA")} {new Date(session.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })})
                    </p>
                  </div>
                )}

                {!editing && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {session.studentCount}
                  </span>
                )}

                {!editing && (
                  <button
                    type="button"
                    onClick={() => onDelete(session.id)}
                    disabled={isDeleting}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
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

  const batchEnrollMut = trpc.attendance.batchEnrollStudents.useMutation({
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

  const enrolling = batchEnrollMut.isPending;

  const handleBatchEnroll = async () => {
    const ids = Array.from(selectedStudents);
    if (!ids.length) return;
    try {
      const result = await batchEnrollMut.mutateAsync({ courseId, studentIds: ids });
      setSelectedStudents(new Set());
      setSearchTerm("");
      if (result.enrolled > 0) {
        toast.success(`Enrolled ${result.enrolled} student${result.enrolled > 1 ? "s" : ""} ✓`);
      }
      const skipped = ids.length - result.enrolled;
      if (skipped > 0) {
        toast.message(`${skipped} already enrolled`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enroll students");
    }
  };

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
                  disabled={enrolling}
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
              onClick={handleBatchEnroll}
              disabled={selectedStudents.size === 0 || enrolling}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:bg-primary/90"
            >
              {enrolling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {enrolling ? "Enrolling..." : "Add Selected"}
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

      {batchEnrollMut.error && (
        <p className="text-xs text-red-500">{batchEnrollMut.error.message}</p>
      )}
    </div>
  );
}
