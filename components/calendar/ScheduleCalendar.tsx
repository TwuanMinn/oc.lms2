"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Users, GraduationCap, Plus, X,
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
import type { Cell } from "./timetable-types";
import { STYLES } from "./timetable-styles";
import { StatCard, TeachersTab, StudentsTab } from "./timetable-panels";
import { SlotForm, type SlotFormData } from "./SlotForm";
import { TimetableGrid } from "./TimetableGrid";

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
  const [formData, setFormData] = useState<SlotFormData>({ courseId: "", day: "Monday" as Day, periodId: 1, room: "", classType: "LECTURE" });
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(new Date());
  const [showMiniCal, setShowMiniCal] = useState(false);
  const miniCalRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close mini calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (miniCalRef.current && !miniCalRef.current.contains(e.target as Node)) setShowMiniCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const utils = trpc.useUtils();
  const coursesQ = trpc.schedule.allCourses.useQuery();
  const eventsQ = trpc.schedule.getMySchedules.useQuery();
  const teachersQ = trpc.admin.getUsers.useQuery({ limit: 500, role: "TEACHER" });
  const studentsQ = trpc.admin.getUsers.useQuery({ limit: 500, role: "STUDENT" });

  const [showConfetti, setShowConfetti] = useState(false);
  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  }, []);

  const createM = trpc.schedule.create.useMutation({
    onSuccess: () => { toast.success("Class scheduled ✓"); triggerConfetti(); utils.schedule.getMySchedules.invalidate(); utils.schedule.allCourses.invalidate(); setFormMode(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateM = trpc.schedule.update.useMutation({
    onSuccess: () => { toast.success("Updated ✓"); triggerConfetti(); utils.schedule.getMySchedules.invalidate(); utils.schedule.allCourses.invalidate(); setFormMode(null); },
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
        classType: (ev as any).classType || "LECTURE",
        courseStartDate: (course as any)?.startDate ? new Date((course as any).startDate).toISOString() : null,
        day, periodId,
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
    setFormData({ courseId: cell.courseId, day: cell.day, periodId: cell.periodId, room: cell.room, classType: (cell.classType as SlotFormData["classType"]) || "LECTURE" });
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

  const jumpToDate = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    const todayDay = today.getDay() || 7;
    const todayMonStart = new Date(today);
    todayMonStart.setDate(today.getDate() - todayDay + 1);
    const targetDay = target.getDay() || 7;
    const targetMonStart = new Date(target);
    targetMonStart.setDate(target.getDate() - targetDay + 1);
    const diffWeeks = Math.round((targetMonStart.getTime() - todayMonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
    setShowMiniCal(false);
  }, []);

  const renderMiniCalendar = () => {
    const currentWeekDates = getWeekDates(weekOffset);
    const viewMonth = new Date(currentWeekDates.Wednesday);
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() || 7) - 1;
    const today = new Date(); today.setHours(0,0,0,0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    
    return (
      <div ref={miniCalRef} className="mini-cal-dropdown">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <button onClick={() => { viewMonth.setMonth(month - 1); jumpToDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 15)); }} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-slate-500" /></button>
          <span className="text-xs font-bold text-slate-700">{viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => { viewMonth.setMonth(month + 1); jumpToDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 15)); }} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><ChevronRight className="w-3.5 h-3.5 text-slate-500" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0 p-2">
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} className="text-[9px] font-bold text-slate-400 text-center py-1">{d}</div>)}
          {days.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} />;
            const isToday = date.toDateString() === today.toDateString();
            const weekStart = currentWeekDates.Monday;
            const weekEnd = currentWeekDates.Sunday;
            const isInCurrentWeek = date >= weekStart && date <= weekEnd;
            return (
              <button key={i} onClick={() => jumpToDate(date)}
                className={cn(
                  "text-[11px] font-medium w-7 h-7 rounded-lg transition-all flex items-center justify-center",
                  isToday && "ring-2 ring-blue-400 font-bold",
                  isInCurrentWeek && !isToday && "bg-blue-50 text-blue-700",
                  !isInCurrentWeek && !isToday && "text-slate-600 hover:bg-slate-100",
                  isToday && isInCurrentWeek && "bg-blue-500 text-white",
                  isToday && !isInCurrentWeek && "bg-blue-100 text-blue-700"
                )}>
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-slate-100">
          <button onClick={() => { setWeekOffset(0); setShowMiniCal(false); }} className="w-full text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider text-center py-1 hover:bg-blue-50 rounded-md transition-colors">Jump to Today</button>
        </div>
      </div>
    );
  };

  const renderWeekPicker = () => (
    <div className="flex items-center bg-slate-50/80 border border-slate-200/80 backdrop-blur-md rounded-xl p-1 shadow-sm w-fit transition-all hover:bg-slate-50 hover:shadow relative">
      <button onClick={() => setWeekOffset(p => p - 1)} className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-blue-600 transition-all shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-200 active:scale-95">
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button onClick={() => setShowMiniCal(v => !v)} className="flex flex-col items-center justify-center min-w-[160px] px-4 select-none hover:bg-slate-100 rounded-lg py-1 transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-700 tracking-tight">
            {getWeekDates(weekOffset).Monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            <span className="mx-1.5 text-slate-400 font-normal">→</span>
            {getWeekDates(weekOffset).Sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {weekOffset !== 0 ? (
          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mt-0.5">Return to Today</span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500/90 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            Current Week
          </span>
        )}
      </button>

      <button onClick={() => setWeekOffset(p => p + 1)} className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-blue-600 transition-all shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-200 active:scale-95">
        <ChevronRight className="w-4 h-4" />
      </button>

      {showMiniCal && renderMiniCalendar()}
    </div>
  );

  if (isLoading) {
    return (
      <div className="tt-root">
        <div className="tt-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 animate-pulse" />
            <div><div className="h-5 w-36 bg-slate-200 rounded-lg animate-pulse" /><div className="h-3 w-48 bg-slate-100 rounded mt-2 animate-pulse" /></div>
          </div>
          <div className="flex gap-1"><div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" /><div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" /><div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" /></div>
        </div>
        <div className="tt-body">
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => <div key={i} className="tt-card p-5 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" /><div><div className="h-7 w-12 bg-slate-200 rounded animate-pulse" /><div className="h-3 w-16 bg-slate-100 rounded mt-2 animate-pulse" /></div></div>)}
          </div>
          <div className="tt-card overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}>
              <div className="h-12 bg-slate-50 border-b-2 border-slate-200" />
              {DAYS.map(d => <div key={d} className="h-12 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-center"><div className="h-3 w-8 bg-slate-200 rounded animate-pulse" /></div>)}
              {PERIODS.slice(0, 4).map(p => (
                <React.Fragment key={p.id}>
                  <div className="h-24 bg-slate-50 border-b border-slate-100 flex items-center justify-center"><div className="h-3 w-10 bg-slate-200 rounded animate-pulse" /></div>
                  {DAYS.map(d => <div key={d} className="h-24 border-b border-r border-slate-100 p-1"><div className="w-full h-full rounded-xl bg-slate-50 animate-pulse" /></div>)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      </div>
    );
  }

  return (
    <div className="tt-root">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'][i % 6],
            }} />
          ))}
        </div>
      )}
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
                  </div>
                </div>
                <TimetableGrid cells={filteredCells} onCellClick={openEdit} onEmptyClick={() => {}} interactive weekOffset={weekOffset} now={now} />
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
