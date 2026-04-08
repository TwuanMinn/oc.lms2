"use client";

import React, { useState, useMemo } from "react";
import {
  Users, GraduationCap, Plus, Pencil, Trash2, X, User,
  MapPin, School, Loader2, Clock, BookOpen, Calendar, FlaskConical, Presentation, Video, RefreshCw, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type Day, type ViewRole, type AdminTab,
  DAYS, DAY_SHORT, PERIODS,
  getClassColor, getEventDay, getEventPeriodId, getWeekDates,
  buildEventDates, getInitials,
} from "./timetable-data";

// ── Mapped cell ──
interface Cell {
  eventId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  room: string;
  group: string;
  classType: string;
  day: Day;
  periodId: number;
  color: string;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

export default function ScheduleCalendar({ role }: { role?: string }) {
  const [viewRole, setViewRole] = useState<ViewRole>("admin");
  const [adminTab, setAdminTab] = useState<AdminTab>("timetable");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ courseId: "", day: "Monday" as Day, periodId: 1, room: "", classType: "LECTURE" as "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION" });
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const utils = trpc.useUtils();
  const coursesQ = trpc.schedule.allCourses.useQuery();
  const eventsQ = trpc.schedule.getMySchedules.useQuery();
  const teachersQ = trpc.admin.getUsers.useQuery({ limit: 500, role: "TEACHER" });
  const studentsQ = trpc.admin.getUsers.useQuery({ limit: 500, role: "STUDENT" });

  const createM = trpc.schedule.create.useMutation({
    onSuccess: () => { toast.success("Class scheduled"); utils.schedule.getMySchedules.invalidate(); utils.schedule.allCourses.invalidate(); setFormMode(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateM = trpc.schedule.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.schedule.getMySchedules.invalidate(); utils.schedule.allCourses.invalidate(); setFormMode(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteM = trpc.schedule.delete.useMutation({
    onSuccess: () => { toast.success("Removed"); utils.schedule.getMySchedules.invalidate(); utils.schedule.allCourses.invalidate(); setFormMode(null); },
    onError: (e) => toast.error(e.message),
  });

  // Map events → cells (filtered by active week)
  const cells = useMemo<Cell[]>(() => {
    if (!eventsQ.data) return [];
    
    // Calculate current week bounds
    const dates = getWeekDates(weekOffset);
    const weekStart = new Date(dates.Monday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(dates.Sunday);
    weekEnd.setHours(23, 59, 59, 999);

    return eventsQ.data.filter(ev => {
      const d = new Date(ev.startTime);
      return d >= weekStart && d <= weekEnd;
    }).map(ev => {
      const d = new Date(ev.startTime);
      const day = getEventDay(d);
      const periodId = getEventPeriodId(d);
      if (!day || !periodId) return null;
      const course = coursesQ.data?.find(c => c.id === ev.courseId);
      return {
        eventId: ev.id, courseId: ev.courseId,
        courseCode: course?.courseCode || "",
        courseTitle: course?.title || (ev as any).courseTitle || ev.title,
        teacherName: course?.teacherName || "",
        room: (ev as any).room || "",
        group: (course as any)?.group || "",
        classType: (ev as any).classType || "LECTURE", day, periodId,
        color: getClassColor((ev as any).classType || "LECTURE"),
      };
    }).filter(Boolean) as Cell[];
  }, [eventsQ.data, coursesQ.data, weekOffset]);

  const stats = {
    teachers: teachersQ.data?.total ?? 0,
    students: studentsQ.data?.total ?? 0,
    courses: coursesQ.data?.length ?? 0,
  };

  const openAdd = (day?: Day, periodId?: number) => {
    setFormMode("add"); setEditingEventId(null);
    setFormData({ courseId: selectedCourseId || coursesQ.data?.[0]?.id || "", day: day || "Monday", periodId: periodId || 1, room: "", classType: "LECTURE" });
  };
  const openEdit = (cell: Cell) => {
    setFormMode("edit"); setEditingEventId(cell.eventId);
    setFormData({ courseId: cell.courseId, day: cell.day, periodId: cell.periodId, room: cell.room, classType: (cell.classType as "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION") || "LECTURE" });
  };
  // Auto-prefix "Room " when input is just a number
  const formatRoom = (r: string) => {
    const trimmed = r.trim();
    if (!trimmed) return undefined;
    if (/^\d+$/.test(trimmed)) return `Room ${trimmed}`;
    return trimmed;
  };
  const saveSlot = () => {
    const course = coursesQ.data?.find(c => c.id === formData.courseId);
    if (!course) { toast.error("Select a course"); return; }
    const { start, end } = buildEventDates(formData.day, formData.periodId, weekOffset);
    if (formMode === "add") {
      createM.mutate({ courseId: formData.courseId, title: course.title, room: formatRoom(formData.room), classType: formData.classType, eventType: "LIVE_CLASS", startTime: start.toISOString(), endTime: end.toISOString() });
    } else if (editingEventId) {
      updateM.mutate({ eventId: editingEventId, room: formatRoom(formData.room), classType: formData.classType, startTime: start.toISOString(), endTime: end.toISOString() });
    }
  };
  const deleteSlot = () => { if (editingEventId) deleteM.mutate({ eventId: editingEventId }); };

  const filteredCells = useMemo(() => {
    if (viewRole === "teacher" && selectedTeacherId) {
      const teacher = ((teachersQ.data as any)?.users || []).find((u: any) => u.id === selectedTeacherId);
      if (!teacher) return [];
      const teacherCourseIds = new Set(coursesQ.data?.filter(c => c.teacherName === teacher.name).map(c => c.id) || []);
      return cells.filter(c => teacherCourseIds.has(c.courseId));
    }
    if (selectedCourseId) return cells.filter(c => c.courseId === selectedCourseId);
    return cells;
  }, [cells, viewRole, selectedTeacherId, selectedCourseId, coursesQ.data, teachersQ.data]);

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text(`School Timetable - ${viewRole.toUpperCase()}`, 14, 15);
    
    const dates = getWeekDates(weekOffset);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Week: ${dates.Monday.toLocaleDateString(undefined, {month:'long', day:'numeric'})} to ${dates.Sunday.toLocaleDateString(undefined, {month:'long', day:'numeric'})}`, 14, 22);

    const head = [["Time", ...DAYS.map(d => `${d}\n${dates[d].toLocaleDateString(undefined, {month:'short', day:'numeric'})}`)]];
    const body = PERIODS.map(p => {
      const row = [`${p.start} - ${p.end}`];
      DAYS.forEach(day => {
        const cell = filteredCells.find(c => c.day === day && c.periodId === p.id);
        if (cell) {
          row.push(`${cell.courseTitle}\n[${cell.classType}]\nRoom: ${cell.room}`);
        } else {
          row.push("");
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 28,
      head,
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center' },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 0: { fontStyle: "bold", halign: "center", minCellWidth: 25 } }
    });

    doc.save(`timetable_${viewRole}_${dates.Monday.toISOString().split('T')[0]}.pdf`);
  };

  const isLoading = coursesQ.isLoading || eventsQ.isLoading;

  const renderWeekPicker = () => (
    <div className="flex items-center bg-slate-50/80 border border-slate-200/80 backdrop-blur-md rounded-xl p-1 shadow-sm w-fit transition-all hover:bg-slate-50 hover:shadow">
      <button onClick={() => setWeekOffset(p => p - 1)} className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-blue-600 transition-all shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-200 active:scale-95">
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col items-center justify-center min-w-[160px] px-4 select-none">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-700 tracking-tight">
            {getWeekDates(weekOffset).Monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            <span className="mx-1.5 text-slate-400 font-normal">→</span>
            {getWeekDates(weekOffset).Sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {weekOffset !== 0 ? (
          <button onClick={() => setWeekOffset(0)} className="text-[10px] uppercase tracking-wider font-bold text-blue-600 hover:text-blue-700 transition-colors mt-0.5 relative group flex items-center gap-1">
            <span className="relative z-10">Return to Today</span>
            <div className="absolute inset-x-0 -bottom-0.5 h-px bg-blue-600/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500/90 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            Current Week
          </span>
        )}
      </div>

      <button onClick={() => setWeekOffset(p => p + 1)} className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-blue-600 transition-all shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-200 active:scale-95">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center animate-pulse">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading timetable…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tt-root">
      {/* ── Header ── */}
      <div className="tt-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">School Timetable</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your class schedule</p>
          </div>
        </div>
        <div className="tt-role-switcher">
          {(["admin", "teacher", "student"] as ViewRole[]).map(r => (
            <button key={r} onClick={() => setViewRole(r)}
              className={cn("tt-role-btn", viewRole === r && "tt-role-active")}
            >
              {r === "admin" && <School className="w-3.5 h-3.5" />}
              {r === "teacher" && <BookOpen className="w-3.5 h-3.5" />}
              {r === "student" && <GraduationCap className="w-3.5 h-3.5" />}
              <span className="capitalize">{r}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tt-body">
        {/* ═══ ADMIN ═══ */}
        {viewRole === "admin" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Teachers" value={stats.teachers} color="#3B82F6" gradient="from-blue-500 to-blue-600" />
              <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Students" value={stats.students} color="#10B981" gradient="from-emerald-500 to-emerald-600" />
              <StatCard icon={<BookOpen className="w-5 h-5" />} label="Courses" value={stats.courses} color="#F97316" gradient="from-orange-400 to-orange-500" />
            </div>

            {/* Tabs */}
            <div className="tt-tabs">
              {(["timetable", "teachers", "students"] as AdminTab[]).map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)}
                  className={cn("tt-tab", adminTab === tab && "tt-tab-active")}
                >
                  {tab === "timetable" && <Calendar className="w-3.5 h-3.5" />}
                  {tab === "teachers" && <Users className="w-3.5 h-3.5" />}
                  {tab === "students" && <GraduationCap className="w-3.5 h-3.5" />}
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </div>

            {adminTab === "timetable" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-500">Filter:</span>
                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="tt-select w-64">
                      <option value="">All Courses</option>
                      {coursesQ.data?.map(c => <option key={c.id} value={c.id}>{c.courseCode ? `${c.courseCode} — ${c.title}` : c.title}</option>)}
                    </select>
                    {renderWeekPicker()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={exportPDF} className="tt-btn-secondary h-[42px]">
                      <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={() => openAdd()} className="tt-btn-primary h-[42px]">
                      <Plus className="w-4 h-4" /> Add Slot
                    </button>
                  </div>
                </div>
                <TimetableGrid cells={filteredCells} onCellClick={openEdit} onEmptyClick={(d, p) => openAdd(d, p)} interactive weekOffset={weekOffset} now={now} />
                {formMode && (
                  <SlotForm formData={formData} setFormData={setFormData} courses={coursesQ.data || []}
                    mode={formMode} onSave={saveSlot} onDelete={deleteSlot} onCancel={() => setFormMode(null)}
                    loading={createM.isPending || updateM.isPending || deleteM.isPending} />
                )}
              </div>
            )}
            {adminTab === "teachers" && <TeachersTab teachers={(teachersQ.data as any)?.users || []} courses={coursesQ.data || []} />}
            {adminTab === "students" && <StudentsTab students={(studentsQ.data as any)?.users || []} />}
          </>
        )}

        {/* ═══ TEACHER ═══ */}
        {viewRole === "teacher" && (
          <div className="space-y-5">
            <div className="tt-card p-4 flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-blue-500" /></div>
              <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[300px]">
                <span className="text-sm font-medium text-slate-500">View schedule for:</span>
                <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="tt-select flex-1 max-w-xs">
                  <option value="">Select a teacher</option>
                  {((teachersQ.data as any)?.users || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {renderWeekPicker()}
                <div className="ml-auto">
                  <button onClick={exportPDF} className="tt-btn-secondary h-[42px]">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            </div>
            <TimetableGrid cells={filteredCells} showClass weekOffset={weekOffset} now={now} />
          </div>
        )}

        {/* ═══ STUDENT ═══ */}
        {viewRole === "student" && (
          <div className="space-y-5">
            <div className="tt-card p-4 flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-emerald-500" /></div>
              <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[300px]">
                <span className="text-sm font-medium text-slate-500">Timetable for:</span>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="tt-select flex-1 max-w-xs">
                  <option value="">All Courses</option>
                  {coursesQ.data?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {renderWeekPicker()}
                <div className="ml-auto">
                  <button onClick={exportPDF} className="tt-btn-secondary h-[42px]">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            </div>
            <TimetableGrid cells={filteredCells} showTeacher weekOffset={weekOffset} now={now} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}


// ═══════════════════════════════════════
// TIMETABLE GRID
// ═══════════════════════════════════════

function TimetableGrid({ cells, onCellClick, onEmptyClick, interactive, showClass, showTeacher, weekOffset, now }: {
  cells: Cell[];
  onCellClick?: (c: Cell) => void;
  onEmptyClick?: (d: Day, p: number) => void;
  interactive?: boolean;
  showClass?: boolean;
  showTeacher?: boolean;
  weekOffset?: number;
  now?: Date;
}) {
  const lookup = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const c of cells) m.set(`${c.day}-${c.periodId}`, c);
    return m;
  }, [cells]);

  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
          {/* Header */}
          <div className="grid-corner" />
          {DAYS.map(day => {
            const date = getWeekDates(weekOffset || 0)[day];
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={day} className={cn("grid-day-header flex flex-col items-center justify-center gap-0.5", isToday && "bg-blue-50/50")}>
                <span className={cn("text-xs font-bold uppercase tracking-wider", isToday ? "text-blue-600" : "text-slate-400")}>{DAY_SHORT[day]}</span>
                <span className={cn("text-[10px] font-medium", isToday ? "text-blue-500" : "text-slate-400 opacity-70")}>
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}

          {/* Rows */}
          {PERIODS.map((period, pi) => {
            const currentMins = now ? now.getHours() * 60 + now.getMinutes() : -1;
            const [sh, sm] = period.start.split(":").map(Number);
            const [eh, em] = period.end.split(":").map(Number);
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;
            const isCurrentPeriod = currentMins >= startMins && currentMins < endMins;

            return (
              <React.Fragment key={period.id}>
                <div className={cn("grid-time relative overflow-hidden", pi === 0 && "border-t-0", isCurrentPeriod && "bg-red-50/50")}>
                  {isCurrentPeriod && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />}
                  <span className={cn("text-xs font-semibold relative z-10", isCurrentPeriod ? "text-red-600" : "text-slate-600")}>{period.start}</span>
                  <span className={cn("text-[10px] relative z-10", isCurrentPeriod ? "text-red-400" : "text-slate-300")}>{period.end}</span>
                </div>
                {DAYS.map(day => {
                  const cell = lookup.get(`${day}-${period.id}`);
                  const dateInfo = getWeekDates(weekOffset || 0)[day];
                  const isToday = now ? dateInfo.toDateString() === now.toDateString() : false;
                  const isNowCell = isToday && isCurrentPeriod;
                  
                  const todayStart = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;
                  const isPastDate = dateInfo.getTime() < todayStart;
                  const hasPassed = isPastDate || (isToday && (now ? (now.getHours() * 60 + now.getMinutes()) > endMins : false));

                  const durationMins = endMins - startMins;
                  const durationText = durationMins >= 60 
                    ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ''}` 
                    : `${durationMins}m`;

                  let countdownText = "";
                  if (now && cell) {
                    const eventStartTimestamp = dateInfo.getTime() + startMins * 60000;
                    const eventEndTimestamp = dateInfo.getTime() + endMins * 60000;
                    const nowTimestamp = now.getTime();

                    if (isCurrentPeriod && isToday) {
                      const diffMins = Math.max(0, Math.floor((eventEndTimestamp - nowTimestamp) / 60000));
                      countdownText = `Ends in ${diffMins}m`;
                    } else if (eventStartTimestamp > nowTimestamp) {
                      const diffMins = Math.floor((eventStartTimestamp - nowTimestamp) / 60000);
                      if (isToday) {
                        if (diffMins < 60) countdownText = `Starts in ${diffMins}m`;
                        else countdownText = `Starts in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
                      } else {
                        const dayDiff = Math.round((dateInfo.getTime() - todayStart) / 86400000);
                        if (dayDiff === 1) countdownText = `Tomorrow`;
                        else countdownText = `In ${dayDiff} days`;
                      }
                    }
                  }

                  if (!cell) {
                    return (
                      <div key={day}
                        className={cn(
                          "grid-cell-empty relative transition-colors duration-200", 
                          pi === 0 && "border-t-0", 
                          interactive && "cursor-pointer hover:bg-slate-50 group",
                          isNowCell && "bg-red-50/20 hover:bg-red-50/40 border-l border-red-500/20"
                        )}
                        onClick={() => interactive && onEmptyClick?.(day, period.id)}
                      >
                        {isNowCell && <div className="absolute inset-0 ring-1 ring-inset ring-red-500/30 rounded-lg pointer-events-none z-10" />}
                        {interactive && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center h-full">
                            <Plus className={cn("w-4 h-4", isNowCell ? "text-red-400" : "text-slate-300")} />
                          </div>
                        )}
                      </div>
                    );
                  }

                  const currentWeek = (cell.courseTitle.length % 18) + 1;
                  const totalWeeks = 18;
                  const progressPercent = Math.round((currentWeek / totalWeeks) * 100);

                  return (
                    <div key={`${day}-${pi}-${cell.eventId}`} 
                      className={cn(
                        "grid-cell-filled relative p-[6px]", 
                        pi === 0 && "border-t-0", 
                        interactive && "cursor-pointer",
                        isNowCell && "border-l border-red-500/20 z-10"
                      )}
                      onClick={() => interactive && onCellClick?.(cell)}
                    >
                      {isNowCell && <div className="absolute inset-0 ring-2 ring-inset ring-red-500/60 rounded-xl pointer-events-none z-20 animate-pulse" />}
                      <div className={cn("flex flex-col h-full rounded-[12px] overflow-hidden bg-white border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5", isNowCell && "ring-1 ring-red-500/30")}>
                        {/* Header Section */}
                        <div className="px-3 py-2.5 text-white flex flex-col gap-2 relative" style={{ backgroundColor: cell.color }}>
                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5 opacity-95">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold tracking-wider uppercase">
                                {cell.classType.replace("_", " ")}
                              </span>
                            </div>
                            {cell.courseCode && (
                              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wide backdrop-blur-sm shadow-sm">
                                {cell.courseCode}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-[14px] leading-tight line-clamp-2 pr-1 z-10 drop-shadow-sm">{cell.courseTitle}</h3>
                          
                          {/* Progress bar */}
                          <div className="mt-1 flex flex-col gap-1.5 z-10">
                            <div className="flex items-center justify-between text-[9.5px] font-medium text-white/90">
                              <span>Week {currentWeek} of {totalWeeks}</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1 bg-black/15 rounded-full overflow-hidden">
                              <div className="h-full bg-white/90 rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Body Section */}
                        <div className="p-3 flex-1 flex flex-col gap-3 bg-white">
                          {(showTeacher || (!showClass)) && cell.teacherName && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-slate-500 leading-none">Instructor</p>
                                <p className="text-[13px] font-semibold text-slate-800 leading-none mt-1.5 truncate">{cell.teacherName}</p>
                              </div>
                            </div>
                          )}
                          
                          {(showTeacher || (!showClass)) && cell.teacherName && <div className="h-px w-full bg-slate-100" />}
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-slate-500 leading-none">Room</p>
                                <p className="text-[12px] font-semibold text-slate-800 leading-none mt-1 truncate">{cell.room || "TBA"}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-slate-500 leading-none">Group</p>
                                <p className="text-[12px] font-semibold text-slate-800 leading-none mt-1 truncate">{cell.group ? `Group ${cell.group}` : "Any"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Section */}
                        <div className="px-3 py-3 bg-[#F6F5EE] flex justify-between border-t border-[#EDEDE6] mt-auto shrink-0 relative rounded-b-[12px]">
                          <div className="flex flex-col gap-1 items-start">
                             <div className="flex items-center gap-2 text-slate-700">
                               <Clock className="w-3.5 h-3.5 text-slate-500" />
                               <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap text-[#2C3E5D]">{period.start} – {period.end}</span>
                             </div>
                             <span className="text-[10px] font-bold text-[#8BA0C0] uppercase tracking-wider pl-[22px]">{durationText}</span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {countdownText && (
                               <span className="text-[10px] font-bold text-[#6B8BCE] bg-white px-2.5 py-[3px] rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-[#E2E8F4] capitalize">
                                 {countdownText}
                               </span>
                            )}
                            <span className={cn(
                                "px-3 py-[3px] rounded-full text-[10px] font-bold tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis",
                                isCurrentPeriod ? "bg-[#FFF0F0] text-[#D93036] border border-[#FAD4D4]" :
                                hasPassed ? "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]" :
                                "bg-[#E6F4EA] text-[#1D7C50] border border-[#D5EADF]"
                            )}>
                              {isCurrentPeriod ? "Ongoing" : hasPassed ? "Ended" : "Upcoming"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// SLOT FORM
// ═══════════════════════════════════════

function SlotForm({ formData, setFormData, courses, mode, onSave, onDelete, onCancel, loading }: {
  formData: { courseId: string; day: Day; periodId: number; room: string; classType: "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION" };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  courses: any[];
  mode: "add" | "edit";
  onSave: () => void; onDelete: () => void; onCancel: () => void;
  loading: boolean;
}) {
  const selectedCourse = courses.find(c => c.id === formData.courseId);

  // Build unique course names and group variants by title
  const coursesByName = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of courses) {
      const key = c.title;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [courses]);

  const uniqueNames = useMemo(() => Object.keys(coursesByName).sort(), [coursesByName]);
  const selectedName = selectedCourse?.title || uniqueNames[0] || "";
  const variants = coursesByName[selectedName] || [];
  const hasMultipleVariants = variants.length > 1;

  // When course name changes, auto-select the first variant
  const handleNameChange = (name: string) => {
    const firstVariant = coursesByName[name]?.[0];
    if (firstVariant) {
      setFormData(p => ({ ...p, courseId: firstVariant.id }));
    }
  };

  return (
    <div className="tt-card p-5 space-y-4 border-blue-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
          {mode === "add" ? <Plus className="w-4 h-4 text-blue-500" /> : <Pencil className="w-4 h-4 text-blue-500" />}
        </div>
        <h4 className="text-sm font-bold text-slate-700">{mode === "add" ? "Schedule New Class" : "Edit Class"}</h4>
        {selectedCourse && (selectedCourse.courseCode || selectedCourse.group) && (
          <div className="ml-auto flex items-center gap-2">
            {selectedCourse.courseCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <BookOpen className="w-3 h-3" /> {selectedCourse.courseCode}
              </span>
            )}
            {selectedCourse.group && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Users className="w-3 h-3" /> Group {selectedCourse.group}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
        <div className={hasMultipleVariants ? "" : "sm:col-span-2"}>
          <label className="tt-label">Course</label>
          <select value={selectedName} onChange={e => handleNameChange(e.target.value)} className="tt-select w-full">
            {uniqueNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        {hasMultipleVariants && (
          <div>
            <label className="tt-label">Class ID</label>
            <select value={formData.courseId} onChange={e => setFormData(p => ({ ...p, courseId: e.target.value }))} className="tt-select w-full" style={{ color: '#1e40af', fontWeight: 600 }}>
              {variants.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode || "—"}{c.group ? ` · G${c.group}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="tt-label">Day</label>
          <select value={formData.day} onChange={e => setFormData(p => ({ ...p, day: e.target.value as Day }))} className="tt-select w-full">
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="tt-label">Period</label>
          <select value={formData.periodId} onChange={e => setFormData(p => ({ ...p, periodId: Number(e.target.value) }))} className="tt-select w-full">
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label} ({p.start})</option>)}
          </select>
        </div>
        <div>
          <label className="tt-label">Room</label>
          <input type="text" value={formData.room} onChange={e => setFormData(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 101" className="tt-input" />
        </div>
        <div>
          <label className="tt-label">Type</label>
          <select value={formData.classType} onChange={e => setFormData(p => ({ ...p, classType: e.target.value as "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION" }))} className="tt-select w-full">
            <option value="LECTURE">Lecture</option>
            <option value="LAB">Lab</option>
            <option value="MAKEUP_CLASS">Make-up Class</option>
            <option value="ONLINE_SESSION">Online Session</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={loading} className="tt-btn-primary">{loading ? "Saving…" : "Save"}</button>
        {mode === "edit" && (
          <button onClick={onDelete} disabled={loading} className="tt-btn-danger"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        )}
        <button onClick={onCancel} className="tt-btn-ghost">Cancel</button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// TEACHERS TAB
// ═══════════════════════════════════════

function TeachersTab({ teachers, courses }: { teachers: any[]; courses: any[] }) {
  if (!teachers.length) return <EmptyState icon={<Users className="w-6 h-6" />} text="No teachers found" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teachers.map((t: any) => {
        const tc = courses.filter((c: any) => c.teacherName === t.name);
        return (
          <div key={t.id} className="tt-card p-4 flex flex-col gap-3 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-blue-500/20">
                {getInitials(t.name || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-700 truncate">{t.name}</p>
                <p className="text-xs text-slate-400 truncate">{t.email}</p>
              </div>
            </div>
            {tc.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tc.slice(0, 4).map((c: any) => (
                  <span key={c.id} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                    {c.courseCode ? `${c.courseCode} — ${c.title}` : c.title}
                  </span>
                ))}
                {tc.length > 4 && <span className="px-2 py-1 text-[10px] font-semibold text-slate-400">+{tc.length - 4}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════
// STUDENTS TAB
// ═══════════════════════════════════════

function StudentsTab({ students }: { students: any[] }) {
  if (!students.length) return <EmptyState icon={<GraduationCap className="w-6 h-6" />} text="No students found" />;
  return (
    <div className="tt-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
            <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s: any) => (
            <tr key={s.id} className="border-t border-slate-50 hover:bg-blue-50/30 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {getInitials(s.name || "?")}
                  </div>
                  <span className="font-semibold text-slate-700">{s.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-400 text-xs">{s.email}</td>
              <td className="py-3 px-4">
                <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-lg", s.status === "ACTIVE" || !s.status ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                  {(s.status || "active").toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ═══════════════════════════════════════
// SHARED
// ═══════════════════════════════════════

function StatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: number; color: string; gradient: string }) {
  return (
    <div className="tt-card p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
      <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", gradient)} style={{ boxShadow: `0 8px 16px -4px ${color}30` }}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-slate-800 leading-none">{value}</p>
        <p className="text-xs font-medium text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="tt-card p-12 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">{icon}</div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}


// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.tt-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

/* Header */
.tt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-wrap: wrap;
  gap: 12px;
}

/* Role Switcher */
.tt-role-switcher {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
}
.tt-role-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  color: #94a3b8;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
}
.tt-role-btn:hover {
  color: #475569;
  background: white;
}
.tt-role-active {
  color: white !important;
  background: #1e293b !important;
  box-shadow: 0 4px 12px -2px rgba(30, 41, 59, 0.25);
}

/* Body */
.tt-body {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f8fafc;
}

/* Cards */
.tt-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s ease;
}

/* Tabs */
.tt-tabs {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  width: fit-content;
}
.tt-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.2s ease;
}
.tt-tab:hover { color: #475569; background: white; }
.tt-tab-active {
  color: #1e293b !important;
  background: white !important;
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.08);
}

/* Form Elements */
.tt-select {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
  cursor: pointer;
}
.tt-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.tt-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
}
.tt-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.tt-input::placeholder { color: #cbd5e1; }
.tt-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 6px;
}

/* Buttons */
.tt-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px -2px rgba(59,130,246,0.35);
}
.tt-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -2px rgba(59,130,246,0.4); }
.tt-btn-primary:active { transform: translateY(0); }
.tt-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.tt-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.tt-btn-secondary:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
.tt-btn-secondary:active { transform: translateY(0); background: #f1f5f9; }
.tt-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.2s;
}
.tt-btn-danger:hover { background: #fee2e2; }
.tt-btn-ghost {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}
.tt-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

/* Grid */
.grid-corner {
  background: #fafbfc;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #f1f5f9;
  border-radius: 16px 0 0 0;
}
.grid-day-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  background: #fafbfc;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #f1f5f9;
}
.grid-day-header:last-child {
  border-radius: 0 16px 0 0;
}
.grid-time {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  min-height: 88px;
  background: #fafbfc;
}
.grid-cell-empty {
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  min-height: 88px;
  transition: background 0.2s;
}
.grid-cell-empty:hover {
  background: #f0f9ff;
}
.grid-cell-filled {
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  min-height: 88px;
  padding: 4px;
}

/* Slot Block */
.slot-block {
  position: relative;
  display: flex;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--slot-color) 4%, white);
  border: 1px solid color-mix(in srgb, var(--slot-color) 15%, transparent);
  transition: all 0.2s;
  padding: 10px 12px;
  cursor: pointer;
}
.slot-block:hover {
  background: color-mix(in srgb, var(--slot-color) 6%, white);
  box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--slot-color) 20%, transparent);
  transform: translateY(-2px);
}
.slot-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  width: 100%;
}
.slot-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.slot-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--slot-color) 30%, transparent);
  color: var(--slot-color);
}
.slot-code {
  font-size: 13px;
  font-weight: 800;
  color: var(--slot-color);
  opacity: 0.9;
}
.slot-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--slot-color);
  margin-bottom: 2px;
}
.slot-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 2px;
}
.slot-meta {
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
  margin-bottom: 2px;
}
.slot-room {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
  margin-top: auto;
}
`;
