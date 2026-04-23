"use client";

import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { CourseGroupCard, TeacherMultiSelect } from "./CourseComponents";
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
  Clock,
  BarChart3,
  User,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { type Day, DAYS, PERIODS, buildEventDates } from "@/components/calendar/timetable-data";
import { toast } from "sonner";

const ScheduleCalendar = dynamic(
  () => import("@/components/calendar/ScheduleCalendar"),
  { ssr: false }
);

export interface SessionRow {
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
  scheduleRoom: string | null;
  scheduleClassType: string | null;
  scheduleDays: string | null;
  schedulePeriods: string | null;
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
    const trimmedRoom = formRoom.trim();
    const room = trimmedRoom ? (/^\d+$/.test(trimmedRoom) ? `Room ${trimmedRoom}` : trimmedRoom) : undefined;
    // Create one schedule event per day+period combination
    for (const day of formDays) {
      for (const periodId of formPeriodIds) {
        const { start, end } = buildEventDates(day, periodId);
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
    }
  }

  const createSession = trpc.attendance.createSession.useMutation({
    onSuccess: async (data) => {
      utils.attendance.getSessions.invalidate();
      if (data?.courseId) {
        scheduleOnTimetable(data.courseId, courseName);
      }
      toast.success("Class session created ✓");
      setShowForm(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const batchCreate = trpc.attendance.batchCreateSessions.useMutation({
    onSuccess: (data) => {
      utils.attendance.getSessions.invalidate();
      if (data?.course?.id) {
        scheduleOnTimetable(data.course.id, data.course.title);
      }
      toast.success(`Class created with ${data?.sessions?.length ?? 0} weeks ✓`);
      setShowForm(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSession = trpc.attendance.deleteSession.useMutation({
    onSuccess: () => utils.attendance.getSessions.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [weekCount, setWeekCount] = useState(15);
  const [group, setGroup] = useState("");
  const [createMode, setCreateMode] = useState<"single" | "multi">("multi");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Schedule fields (incorporated into create form) ──
  const [formDays, setFormDays] = useState<Set<Day>>(new Set(["Monday"]));
  const [formPeriodIds, setFormPeriodIds] = useState<Set<number>>(new Set([1]));
  const [formRoom, setFormRoom] = useState("");
  const [formClassType, setFormClassType] = useState<"LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION">("LECTURE");

  const coursesQ = trpc.schedule.allCourses.useQuery();

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success("Scheduled on timetable ✓");
      utils.schedule.getMySchedules.invalidate();
      utils.schedule.allCourses.invalidate();
      utils.attendance.getSessions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Group sessions by base class code
  const groupedSessions = useMemo(() => {
    if (!data?.sessions) return [];

    const grouped: Record<string, {
      courseTitle: string;
      courseId: string;
      courseGroup: string | null;
      teacherName: string;
      baseCode: string;
      scheduleRoom: string | null;
      scheduleClassType: string | null;
      scheduleDays: string | null;
      schedulePeriods: string | null;
      sessions: SessionRow[];
    }> = {};

    for (const s of data.sessions) {
      const baseCode = s.classCode.replace(/-W\d+$/, "");
      if (!grouped[baseCode]) {
        grouped[baseCode] = {
          courseTitle: s.courseTitle,
          courseId: s.courseId,
          courseGroup: s.courseGroup,
          teacherName: s.teacherName,
          baseCode,
          scheduleRoom: s.scheduleRoom,
          scheduleClassType: s.scheduleClassType,
          scheduleDays: s.scheduleDays,
          schedulePeriods: s.schedulePeriods,
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
    setSelectedTeacherIds(new Set());
    setTitle("");
    setScheduledAt("");
    setWeekCount(15);
    setGroup("");
    setFormDays(new Set(["Monday"]));
    setFormPeriodIds(new Set([1]));
    setFormRoom("");
    setFormClassType("LECTURE");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const teacherArr = Array.from(selectedTeacherIds);
    const primaryTeacherId = teacherArr[0];
    const coTeacherIds = teacherArr.slice(1);

    if (createMode === "multi") {
      if (!classCode || !courseName || !primaryTeacherId || !scheduledAt || weekCount < 1) return;
      batchCreate.mutate({
        classCode,
        courseName,
        teacherId: primaryTeacherId,
        coTeacherIds: coTeacherIds.length > 0 ? coTeacherIds : undefined,
        weekCount,
        startDate: scheduledAt,
        group: group || undefined,
      });
    } else {
      if (!classCode || !courseName || !primaryTeacherId || !title || !scheduledAt) return;
      createSession.mutate({
        classCode,
        courseName,
        teacherId: primaryTeacherId,
        coTeacherIds: coTeacherIds.length > 0 ? coTeacherIds : undefined,
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Assign Teachers</label>
                <TeacherMultiSelect
                  teachers={usersData?.users ?? []}
                  selected={selectedTeacherIds}
                  onChange={setSelectedTeacherIds}
                  placeholder="Select teachers"
                  className="[&_button]:rounded-xl [&_button]:py-3 [&_button]:px-4"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {selectedTeacherIds.size === 0
                    ? "Select at least one teacher (first = primary)"
                    : `${selectedTeacherIds.size} teacher${selectedTeacherIds.size > 1 ? "s" : ""} · first selected = primary`}
                </p>
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
              {/* Day Multi-Select */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Day(s)</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => {
                    const selected = formDays.has(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const next = new Set(formDays);
                          if (selected) { next.delete(d); } else { next.add(d); }
                          if (next.size > 0) setFormDays(next);
                        }}
                        className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Period Multi-Select */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Period(s)</label>
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map(p => {
                    const selected = formPeriodIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const next = new Set(formPeriodIds);
                          if (selected) { next.delete(p.id); } else { next.add(p.id); }
                          if (next.size > 0) setFormPeriodIds(next);
                        }}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {p.label} ({p.start})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room + Type */}
              <div className="grid grid-cols-2 gap-4">
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

