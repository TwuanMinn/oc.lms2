"use client";

import { trpc } from "@/lib/trpc/client";
import { motion } from "motion/react";
import {
  Loader2,
  Trash2,
  Users,
  CalendarDays,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserMinus,
  Calendar,
  BookOpen,
  Pencil,
  Check,
  Clock,
  BarChart3,
  User,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { SessionRow } from "./page";

// ── Course Group Card ──
// All weeks for one course inside one container

// ── Multi-select dropdown for teachers (checkbox list with search) ──

export function TeacherMultiSelect({
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

export function CourseGroupCard({
  group,
  index,
  onDelete,
  isDeleting,
  teachers,
}: {
  group: { courseTitle: string; courseId: string; courseGroup: string | null; teacherName: string; baseCode: string; scheduleRoom: string | null; scheduleClassType: string | null; scheduleDays: string | null; schedulePeriods: string | null; sessions: SessionRow[] };
  index: number;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
  teachers: Array<{ id: string; name: string; email: string }>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showStudents, setShowStudents] = useState(false);
  const [editing, setEditing] = useState(false);
  const [quickAssignSessionId, setQuickAssignSessionId] = useState<string | null>(null);
  const [quickAssignTeachers, setQuickAssignTeachers] = useState<Set<string>>(new Set());
  const [quickAssignSaving, setQuickAssignSaving] = useState(false);
  const utils = trpc.useUtils();

  // Derive current teacher id from name (best-effort) so the select has a starting value
  const initialTeacherId = useMemo(
    () => teachers.find((t) => t.name === group.teacherName)?.id ?? "",
    [teachers, group.teacherName]
  );

  const [draftTitle, setDraftTitle] = useState(group.courseTitle);
  const [draftPrimaryTeacherId, setDraftPrimaryTeacherId] = useState(initialTeacherId);
  const [draftCourseTeacherIds, setDraftCourseTeacherIds] = useState<Set<string>>(new Set());
  const [draftGroup, setDraftGroup] = useState(group.courseGroup ?? "");

  // Per-session edits keyed by sessionId → { title, scheduledAt, teacherIds }
  const [sessionDrafts, setSessionDrafts] = useState<
    Record<string, { title: string; scheduledAt: string; teacherIds: Set<string> }>
  >({});

  // Fetch teacher assignments when the user enters edit mode or quick-assigns
  const assignmentsQ = trpc.attendance.getTeacherAssignments.useQuery(
    { courseId: group.courseId },
    { enabled: editing || quickAssignSessionId !== null }
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
    // Build course-level teacher set (primary + all unique session teachers)
    const courseTeachers = new Set<string>([assignmentsQ.data.primaryTeacherId]);
    for (const ids of Object.values(assignmentsQ.data.sessionTeachers)) {
      for (const id of ids) courseTeachers.add(id);
    }
    setDraftCourseTeacherIds(courseTeachers);
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

  // When assignments arrive for quick-assign mode, seed that session's teachers
  React.useEffect(() => {
    if (!quickAssignSessionId || !assignmentsQ.data) return;
    const ids = assignmentsQ.data.sessionTeachers[quickAssignSessionId] ?? [];
    setQuickAssignTeachers(new Set(ids));
  }, [quickAssignSessionId, assignmentsQ.data]);

  function enterEdit() {
    setDraftTitle(group.courseTitle);
    setDraftGroup(group.courseGroup ?? "");
    setQuickAssignSessionId(null);
    setEditing(true);
  }

  const invalidate = () => {
    utils.attendance.getSessions.invalidate();
    utils.attendance.getTeacherAssignments.invalidate({ courseId: group.courseId });
  };

  const updateCourse = trpc.attendance.updateCourseMeta.useMutation({ onSuccess: invalidate });
  const updateSession = trpc.attendance.updateSession.useMutation({ onSuccess: invalidate });

  const saving = updateCourse.isPending || updateSession.isPending;

  // Derive primary teacher from the course-level set (first entry)
  React.useEffect(() => {
    if (!editing) return;
    const arr = Array.from(draftCourseTeacherIds);
    if (arr.length > 0 && arr[0] !== draftPrimaryTeacherId) {
      setDraftPrimaryTeacherId(arr[0]);
    }
  }, [draftCourseTeacherIds, editing]);

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

      const courseTeacherArr = Array.from(draftCourseTeacherIds);
      const newPrimary = courseTeacherArr[0] ?? draftPrimaryTeacherId;
      const metaChanged =
        draftTitle !== group.courseTitle ||
        newPrimary !== data.primaryTeacherId ||
        (draftGroup || "") !== (group.courseGroup ?? "");

      if (metaChanged) {
        await updateCourse.mutateAsync({
          courseId: group.courseId,
          title: draftTitle !== group.courseTitle ? draftTitle : undefined,
          teacherId: newPrimary !== data.primaryTeacherId ? newPrimary : undefined,
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

  // Quick-assign: save teachers for a single session without full edit mode
  async function handleQuickAssignSave() {
    if (!quickAssignSessionId) return;
    setQuickAssignSaving(true);
    try {
      await updateSession.mutateAsync({
        sessionId: quickAssignSessionId,
        teacherIds: Array.from(quickAssignTeachers),
      });
      toast.success("Teachers updated ✓");
      setQuickAssignSessionId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update teachers");
    } finally {
      setQuickAssignSaving(false);
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
              <TeacherMultiSelect
                teachers={teachers}
                selected={draftCourseTeacherIds}
                onChange={setDraftCourseTeacherIds}
                placeholder="Assign teachers…"
              />
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
            className="flex items-center gap-5 flex-1 min-w-0 text-left"
          >
            {/* Large Initials Avatar */}
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary font-bold text-2xl tracking-tight shadow-sm border border-primary/10">
              {group.sessions[0]?.classCode.slice(0, 2).toUpperCase() || "CL"}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {/* Title + Code Badge */}
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold truncate">{group.courseTitle}</h3>
                {group.sessions[0]?.classCode && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-1 text-xs font-bold text-primary border border-primary/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    {group.sessions[0].classCode.replace(/-W\d+$/, "")}
                  </span>
                )}
              </div>

              {/* Info Row — labeled items with icons */}
              <div className="flex items-center gap-0 flex-wrap">
                {/* Teacher */}
                <div className="flex items-center gap-2 pr-5">
                  <User className="h-4 w-4 text-primary/60" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Teacher</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">{group.teacherName}</p>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center gap-2 px-5">
                  <BarChart3 className="h-4 w-4 text-primary/60" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Type</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {group.scheduleClassType === "ONLINE_SESSION" ? "Online Session" : 
                       group.scheduleClassType === "LAB" ? "Lab" :
                       group.scheduleClassType === "MAKEUP_CLASS" ? "Make-up" : "Lecture"}
                    </p>
                  </div>
                </div>

                {/* Schedule (Day & Time) */}
                <div className="w-px h-8 bg-border/60 mx-1" />
                <div className="flex items-center gap-2 px-5">
                  <Clock className="h-4 w-4 text-primary/60" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Schedule</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {group.scheduleDays ? `${group.scheduleDays} ${group.schedulePeriods ? `• ${group.schedulePeriods}` : ""}` : "—"}
                    </p>
                  </div>
                </div>

                {/* Sessions (Weeks) */}
                <div className="w-px h-8 bg-border/60 mx-1" />
                <div className="flex items-center gap-2 px-5">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Sessions</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {group.sessions.length} week{group.sessions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Room (conditional) */}
                {group.scheduleRoom && (
                  <>
                    <div className="w-px h-8 bg-border/60 mx-1" />
                    <div className="flex items-center gap-2 px-5">
                      <BookOpen className="h-4 w-4 text-primary/60" />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Room</p>
                        <p className="text-sm font-semibold text-foreground leading-tight">{group.scheduleRoom}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Group (conditional) */}
                {group.courseGroup && (
                  <>
                    <div className="w-px h-8 bg-border/60 mx-1" />
                    <div className="flex items-center gap-2 pl-5">
                      <Users className="h-4 w-4 text-primary/60" />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Group</p>
                        <p className="text-sm font-semibold text-foreground leading-tight">{group.courseGroup}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Expand/Collapse chevron */}
            <div className="flex items-center text-muted-foreground/60 ml-2">
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
                    {/* Inline quick-assign panel */}
                    {quickAssignSessionId === session.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <TeacherMultiSelect
                          teachers={teachers}
                          selected={quickAssignTeachers}
                          onChange={setQuickAssignTeachers}
                          placeholder="Assign teachers…"
                          className="flex-1 min-w-[200px]"
                        />
                        <button
                          type="button"
                          onClick={handleQuickAssignSave}
                          disabled={quickAssignSaving}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {quickAssignSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickAssignSessionId(null)}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!editing && (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {session.studentCount}
                    </span>

                    {/* Quick-assign teacher button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (quickAssignSessionId === session.id) {
                          setQuickAssignSessionId(null);
                        } else {
                          setQuickAssignSessionId(session.id);
                        }
                      }}
                      title="Assign teachers to this week"
                      className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                        quickAssignSessionId === session.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/40 hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(session.id)}
                      disabled={isDeleting}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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

export function StudentManager({ courseId }: { courseId: string }) {
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
