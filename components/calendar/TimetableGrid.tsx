import React, { useMemo, useState } from "react";
import {
  Plus, User, MapPin, Clock, Calendar, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Day, DAYS, DAY_SHORT, PERIODS, getWeekDates,
} from "./timetable-data";
import type { Cell } from "./timetable-types";

// ═══════════════════════════════════════
// TIMETABLE GRID — Responsive for all devices
// ═══════════════════════════════════════

interface TimetableGridProps {
  cells: Cell[];
  onCellClick?: (c: Cell) => void;
  onEmptyClick?: (d: Day, p: number) => void;
  interactive?: boolean;
  showClass?: boolean;
  showTeacher?: boolean;
  weekOffset?: number;
  now?: Date;
}

// ── Shared Helpers ──
function usePeriodHelpers(now: Date | undefined) {
  return useMemo(() => ({
    getCurrentMins: () => now ? now.getHours() * 60 + now.getMinutes() : -1,
    parseMins: (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; },
    getDurationText: (startMins: number, endMins: number) => {
      const d = endMins - startMins;
      return d >= 60 ? `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}m` : ''}` : `${d}m`;
    },
  }), [now]);
}

function getStatusInfo(now: Date | undefined, isToday: boolean, isCurrentPeriod: boolean, startMins: number, endMins: number, dateInfo: Date) {
  const currentMins = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const todayStart = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;
  const isPastDate = dateInfo.getTime() < todayStart;
  const hasPassed = isPastDate || (isToday && currentMins > endMins);

  let countdownText = "";
  if (now) {
    const eventStartTs = dateInfo.getTime() + startMins * 60000;
    const eventEndTs = dateInfo.getTime() + endMins * 60000;
    const nowTs = now.getTime();
    if (isCurrentPeriod && isToday) {
      const diffMins = Math.max(0, Math.floor((eventEndTs - nowTs) / 60000));
      countdownText = `Ends in ${diffMins}m`;
    } else if (eventStartTs > nowTs) {
      const diffMins = Math.floor((eventStartTs - nowTs) / 60000);
      if (isToday) {
        countdownText = diffMins < 60 ? `Starts in ${diffMins}m` : `Starts in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
      } else {
        const dayDiff = Math.round((dateInfo.getTime() - todayStart) / 86400000);
        countdownText = dayDiff === 1 ? `Tomorrow` : `In ${dayDiff} days`;
      }
    }
  }

  const statusLabel = isCurrentPeriod && isToday ? "Ongoing" : hasPassed ? "Ended" : "Upcoming";
  const statusStyle = isCurrentPeriod && isToday
    ? "bg-[#FFF0F0] text-[#D93036] border-[#F8BDBD]"
    : hasPassed
    ? "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]"
    : "bg-[#E6F4EA] text-[#1D7C50] border-[#AED6BE]";

  return { hasPassed, countdownText, statusLabel, statusStyle };
}

function getProgress(cell: Cell, now: Date | undefined) {
  const totalWeeks = 18;
  let currentWeek = 1;
  if (cell.courseStartDate) {
    const startMs = new Date(cell.courseStartDate).getTime();
    const nowMs = now ? now.getTime() : Date.now();
    currentWeek = Math.max(1, Math.min(Math.floor((nowMs - startMs) / (7 * 24 * 60 * 60 * 1000)) + 1, totalWeeks));
  }
  return { currentWeek, totalWeeks, percent: Math.round((currentWeek / totalWeeks) * 100) };
}

export function TimetableGrid({ cells, onCellClick, onEmptyClick, interactive, showClass, showTeacher, weekOffset, now }: TimetableGridProps) {
  const lookup = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const c of cells) m.set(`${c.day}-${c.periodId}`, c);
    return m;
  }, [cells]);

  const helpers = usePeriodHelpers(now);

  return (
    <>
    {/* ═══════════════════════════════════════ */}
    {/* DESKTOP GRID — xl and above (≥1280px)  */}
    {/* ═══════════════════════════════════════ */}
    <div className="tt-card overflow-hidden hidden xl:block">
      <div className="overflow-x-auto">
        <div className="grid min-w-[960px]" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
          {/* Header */}
          <div className="grid-corner" />
          {DAYS.map(day => {
            const date = getWeekDates(weekOffset || 0)[day];
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={day} className={cn("grid-day-header flex flex-col items-center justify-center gap-0.5", isToday && "today-col-header")}>
                <span className={cn("text-xs font-bold uppercase tracking-wider", isToday ? "text-blue-600" : "text-slate-400")}>{DAY_SHORT[day]}</span>
                <span className={cn("text-[10px] font-medium", isToday ? "text-blue-500" : "text-slate-400 opacity-70")}>
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}

          {/* Rows */}
          {PERIODS.map((period, pi) => {
            const currentMins = helpers.getCurrentMins();
            const startMins = helpers.parseMins(period.start);
            const endMins = helpers.parseMins(period.end);
            const isCurrentPeriod = currentMins >= startMins && currentMins < endMins;
            const durationText = helpers.getDurationText(startMins, endMins);

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

                  if (!cell) {
                    return (
                      <div key={day}
                        className={cn(
                          "grid-cell-empty relative transition-colors duration-200",
                          pi === 0 && "border-t-0",
                          interactive && "cursor-pointer hover:bg-slate-50 group",
                          isToday && !isNowCell && "today-col-cell",
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

                  const progress = getProgress(cell, now);
                  const status = getStatusInfo(now, isToday, isCurrentPeriod, startMins, endMins, dateInfo);

                  return (
                    <div key={`${day}-${pi}-${cell.eventId}`}
                      className={cn(
                        "grid-cell-filled relative p-[6px]",
                        pi === 0 && "border-t-0",
                        interactive && "cursor-pointer",
                        isToday && !isNowCell && "today-col-cell",
                        isNowCell && "border-l border-red-500/20 z-10"
                      )}
                      onClick={() => interactive && onCellClick?.(cell)}
                    >
                      {isNowCell && <div className="absolute inset-0 ring-2 ring-inset ring-red-500/60 rounded-xl pointer-events-none z-20 animate-pulse" />}
                      <div className={cn("flex flex-col h-full rounded-[14px] overflow-hidden bg-white border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5", isNowCell && "ring-1 ring-red-500/30")}>
                        {/* Header */}
                        <div className="px-4 py-3.5 text-white flex flex-col gap-2.5 relative" style={{ backgroundColor: cell.color }}>
                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-2 opacity-95">
                              <Calendar className="w-5 h-5" />
                              <span className="text-[14px] font-bold tracking-wider uppercase">
                                {cell.classType.replace("_", " ")}
                              </span>
                            </div>
                            {cell.courseCode && (
                              <span className="px-2.5 py-1 rounded-full bg-white/20 text-[12px] font-semibold tracking-wide backdrop-blur-sm shadow-sm">
                                {cell.courseCode}
                              </span>
                            )}
                          </div>
                          <div className="z-10 flex flex-col gap-1.5">
                            <h3 className="font-extrabold text-[22px] leading-snug line-clamp-2 pr-1 drop-shadow-sm">{cell.courseTitle}</h3>
                            {status.countdownText && (
                              <span className="w-fit text-[12px] font-bold text-white bg-black/10 px-2.5 py-1 rounded-[5px] shadow-sm capitalize mb-0.5">
                                {status.countdownText}
                              </span>
                            )}
                          </div>
                          {/* Progress */}
                          <div className="mt-1.5 flex flex-col gap-2 z-10">
                            <div className="flex items-center justify-between text-[13px] font-semibold text-white/90">
                              <span>Week {progress.currentWeek} of {progress.totalWeeks}</span>
                              <span>{progress.percent}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/15 rounded-full overflow-hidden">
                              <div className="h-full bg-white/90 rounded-full" style={{ width: `${progress.percent}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex-1 flex flex-col gap-4 bg-white">
                          {(showTeacher || (!showClass)) && cell.teacherName && (
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-slate-500 leading-none">Instructor</p>
                                <p className="text-[15px] font-semibold text-slate-800 leading-none mt-1.5 truncate">{cell.teacherName}</p>
                              </div>
                            </div>
                          )}

                          {(showTeacher || (!showClass)) && cell.teacherName && <div className="h-px w-full bg-slate-100" />}

                          {/* Room & Group — stacked vertically to prevent truncation */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-slate-500 leading-none">Room</p>
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight mt-1 break-words">{cell.room || "TBA"}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-slate-500 leading-none">Group</p>
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight mt-1 break-words">{cell.group ? `Group ${cell.group}` : "Any"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 flex justify-between items-end border-t border-[#EDEDE6] mt-auto shrink-0 relative rounded-b-[14px] bg-[#F6F5EE]">
                          <div className="flex flex-col gap-0.5 items-start">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                              <span className="text-[13px] font-bold tracking-tight whitespace-nowrap text-[#2C3E5D]">{period.start} – {period.end}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#8BA0C0] uppercase tracking-widest pl-[28px]">{durationText}</span>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0 border-[1.5px]",
                            status.statusStyle
                          )}>
                            {status.statusLabel}
                          </span>
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

    {/* ═══════════════════════════════════════════════ */}
    {/* TABLET/LAPTOP GRID — md to xl (768px–1279px)   */}
    {/* Compact cards that don't truncate              */}
    {/* ═══════════════════════════════════════════════ */}
    <div className="tt-card overflow-hidden hidden md:block xl:hidden">
      <div className="overflow-x-auto">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
          {/* Header */}
          <div className="grid-corner" />
          {DAYS.map(day => {
            const date = getWeekDates(weekOffset || 0)[day];
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={day} className={cn("grid-day-header flex flex-col items-center justify-center gap-0.5", isToday && "today-col-header")}>
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", isToday ? "text-blue-600" : "text-slate-400")}>{DAY_SHORT[day]}</span>
                <span className={cn("text-[9px] font-medium", isToday ? "text-blue-500" : "text-slate-400 opacity-70")}>
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}

          {/* Rows */}
          {PERIODS.map((period, pi) => {
            const currentMins = helpers.getCurrentMins();
            const startMins = helpers.parseMins(period.start);
            const endMins = helpers.parseMins(period.end);
            const isCurrentPeriod = currentMins >= startMins && currentMins < endMins;

            return (
              <React.Fragment key={period.id}>
                <div className={cn("grid-time relative overflow-hidden", pi === 0 && "border-t-0", isCurrentPeriod && "bg-red-50/50")}>
                  {isCurrentPeriod && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />}
                  <span className={cn("text-[10px] font-semibold relative z-10", isCurrentPeriod ? "text-red-600" : "text-slate-600")}>{period.start}</span>
                  <span className={cn("text-[9px] relative z-10", isCurrentPeriod ? "text-red-400" : "text-slate-300")}>{period.end}</span>
                </div>
                {DAYS.map(day => {
                  const cell = lookup.get(`${day}-${period.id}`);
                  const dateInfo = getWeekDates(weekOffset || 0)[day];
                  const isToday = now ? dateInfo.toDateString() === now.toDateString() : false;
                  const isNowCell = isToday && isCurrentPeriod;

                  if (!cell) {
                    return (
                      <div key={day}
                        className={cn(
                          "grid-cell-empty relative transition-colors duration-200",
                          pi === 0 && "border-t-0",
                          interactive && "cursor-pointer hover:bg-slate-50 group",
                          isToday && !isNowCell && "today-col-cell",
                          isNowCell && "bg-red-50/20"
                        )}
                        onClick={() => interactive && onEmptyClick?.(day, period.id)}
                      >
                        {interactive && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center h-full">
                            <Plus className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  }

                  const progress = getProgress(cell, now);
                  const status = getStatusInfo(now, isToday, isCurrentPeriod, startMins, endMins, dateInfo);

                  return (
                    <div key={`${day}-${pi}-${cell.eventId}`}
                      className={cn(
                        "grid-cell-filled relative p-1",
                        pi === 0 && "border-t-0",
                        interactive && "cursor-pointer",
                        isToday && !isNowCell && "today-col-cell",
                        isNowCell && "border-l border-red-500/20"
                      )}
                      onClick={() => interactive && onCellClick?.(cell)}
                    >
                      {isNowCell && <div className="absolute inset-0 ring-2 ring-inset ring-red-500/40 rounded-lg pointer-events-none z-20" />}
                      <div className={cn(
                        "flex flex-col h-full rounded-xl overflow-hidden border shadow-sm transition-all hover:shadow-md",
                        isNowCell ? "border-red-300" : "border-slate-200/80"
                      )}>
                        {/* Colored header — compact */}
                        <div className="px-2.5 py-2 text-white relative" style={{ backgroundColor: cell.color }}>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-bold tracking-wider uppercase opacity-90">
                              {cell.classType.replace("_", " ")}
                            </span>
                            {cell.courseCode && (
                              <span className="text-[8px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
                                {cell.courseCode}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-[12px] leading-tight line-clamp-2">{cell.courseTitle}</h3>
                          {/* Mini progress */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-black/15 rounded-full overflow-hidden">
                              <div className="h-full bg-white/80 rounded-full" style={{ width: `${progress.percent}%` }} />
                            </div>
                            <span className="text-[8px] font-semibold text-white/80">W{progress.currentWeek}</span>
                          </div>
                        </div>

                        {/* Info — compact, no truncation */}
                        <div className="p-2 flex flex-col gap-1.5 bg-white flex-1 text-[10px]">
                          {(showTeacher || (!showClass)) && cell.teacherName && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="font-medium text-slate-700 break-words leading-tight">{cell.teacherName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-600 break-words leading-tight">{cell.room || "TBA"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-600 break-words leading-tight">{cell.group ? `Group ${cell.group}` : "Any"}</span>
                          </div>
                        </div>

                        {/* Footer — status badge */}
                        <div className="px-2 py-1.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-500">
                            {period.start}–{period.end}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border",
                            status.statusStyle
                          )}>
                            {status.statusLabel}
                          </span>
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

    {/* ═══════════════════════════════════════ */}
    {/* MOBILE DAY VIEW — below md (<768px)    */}
    {/* Rich cards with full info visible      */}
    {/* ═══════════════════════════════════════ */}
    <MobileDayView
      cells={cells}
      weekOffset={weekOffset}
      now={now}
      interactive={interactive}
      showClass={showClass}
      showTeacher={showTeacher}
      onCellClick={onCellClick}
    />
    </>
  );
}


// ═══════════════════════════════════════
// MOBILE DAY VIEW (extracted component)
// ═══════════════════════════════════════

function MobileDayView({
  cells, weekOffset, now, interactive, showClass, showTeacher, onCellClick,
}: {
  cells: Cell[];
  weekOffset?: number;
  now?: Date;
  interactive?: boolean;
  showClass?: boolean;
  showTeacher?: boolean;
  onCellClick?: (c: Cell) => void;
}) {
  const [expandedDay, setExpandedDay] = useState<Day | null>(() => {
    // Default: expand today
    const todayIdx = (new Date().getDay() || 7) - 1;
    return DAYS[todayIdx] || "Monday";
  });

  return (
    <div className="block md:hidden space-y-2">
      {DAYS.map(day => {
        const date = getWeekDates(weekOffset || 0)[day];
        const isToday = date.toDateString() === new Date().toDateString();
        const dayCells = cells.filter(c => c.day === day);
        const isExpanded = expandedDay === day;

        return (
          <div key={day} className={cn("tt-card overflow-hidden transition-all", isToday && "ring-2 ring-blue-400/40")}>
            {/* Day header — tap to expand/collapse */}
            <button
              onClick={() => setExpandedDay(isExpanded ? null : day)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between border-b transition-colors",
                isToday ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", isToday ? "text-blue-700" : "text-slate-700")}>{day}</span>
                <span className={cn("text-xs font-medium", isToday ? "text-blue-500" : "text-slate-400")}>
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {dayCells.length > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isToday ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                  )}>
                    {dayCells.length} {dayCells.length === 1 ? 'class' : 'classes'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isToday && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Today</span>}
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-slate-400" />
                  : <ChevronRight className="w-4 h-4 text-slate-400" />
                }
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {dayCells.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">
                    No classes scheduled
                  </div>
                ) : (
                  dayCells.map(cell => {
                    const period = PERIODS.find(p => p.id === cell.periodId);
                    if (!period) return null;

                    const startMins = (() => { const [h, m] = period.start.split(":").map(Number); return h * 60 + m; })();
                    const endMins = (() => { const [h, m] = period.end.split(":").map(Number); return h * 60 + m; })();
                    const currentMins = now ? now.getHours() * 60 + now.getMinutes() : -1;
                    const isCurrentPeriod = currentMins >= startMins && currentMins < endMins;
                    const status = getStatusInfo(now, isToday, isCurrentPeriod, startMins, endMins, date);
                    const progress = getProgress(cell, now);
                    const durationMins = endMins - startMins;
                    const durationText = durationMins >= 60
                      ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ''}`
                      : `${durationMins}m`;

                    return (
                      <div
                        key={cell.eventId}
                        className={cn(
                          "p-3 transition-colors",
                          interactive && "cursor-pointer active:bg-slate-50",
                          isCurrentPeriod && isToday && "bg-red-50/30"
                        )}
                        onClick={() => interactive && onCellClick?.(cell)}
                      >
                        {/* Card */}
                        <div className={cn(
                          "rounded-2xl overflow-hidden border shadow-sm",
                          isCurrentPeriod && isToday ? "border-red-200 ring-1 ring-red-500/20" : "border-slate-200"
                        )}>
                          {/* Colored top */}
                          <div className="px-4 py-3 text-white" style={{ backgroundColor: cell.color }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 opacity-80" />
                                <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                                  {cell.classType.replace("_", " ")}
                                </span>
                              </div>
                              {cell.courseCode && (
                                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                  {cell.courseCode}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-lg leading-snug">{cell.courseTitle}</h3>
                            {status.countdownText && (
                              <span className="inline-block mt-1.5 text-[11px] font-bold bg-black/10 px-2 py-0.5 rounded">
                                {status.countdownText}
                              </span>
                            )}
                            {/* Progress */}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-white/80">Week {progress.currentWeek}/{progress.totalWeeks}</span>
                              <div className="flex-1 h-1.5 bg-black/15 rounded-full overflow-hidden">
                                <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
                              </div>
                              <span className="text-[10px] font-semibold text-white/80">{progress.percent}%</span>
                            </div>
                          </div>

                          {/* Info rows — full width, no truncation */}
                          <div className="bg-white px-4 py-3 space-y-2.5">
                            {(showTeacher || (!showClass)) && cell.teacherName && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-slate-400">Instructor</p>
                                  <p className="text-[13px] font-semibold text-slate-800">{cell.teacherName}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-medium text-slate-400">Room</p>
                                  <p className="text-[13px] font-semibold text-slate-800 break-words">{cell.room || "TBA"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-medium text-slate-400">Group</p>
                                  <p className="text-[13px] font-semibold text-slate-800 break-words">{cell.group ? `Group ${cell.group}` : "Any"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="px-4 py-2.5 bg-[#F6F5EE] border-t border-[#EDEDE6] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="text-[12px] font-bold text-[#2C3E5D]">{period.start} – {period.end}</span>
                              <span className="text-[9px] font-bold text-[#8BA0C0] uppercase">{durationText}</span>
                            </div>
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border-[1.5px]",
                              status.statusStyle
                            )}>
                              {status.statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
