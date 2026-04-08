import React, { useMemo } from "react";
import {
  Plus, User, MapPin, Clock, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Day, DAYS, DAY_SHORT, PERIODS, getWeekDates,
} from "./timetable-data";
import type { Cell } from "./timetable-types";

// ═══════════════════════════════════════
// TIMETABLE GRID
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

export function TimetableGrid({ cells, onCellClick, onEmptyClick, interactive, showClass, showTeacher, weekOffset, now }: TimetableGridProps) {
  const lookup = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const c of cells) m.set(`${c.day}-${c.periodId}`, c);
    return m;
  }, [cells]);

  return (
    <>
    {/* Desktop Grid */}
    <div className="tt-card overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
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

                  const totalWeeks = 18;
                  let currentWeek = 1;
                  if (cell.courseStartDate) {
                    const startMs = new Date(cell.courseStartDate).getTime();
                    const nowMs = now ? now.getTime() : Date.now();
                    const elapsedWeeks = Math.floor((nowMs - startMs) / (7 * 24 * 60 * 60 * 1000)) + 1;
                    currentWeek = Math.max(1, Math.min(elapsedWeeks, totalWeeks));
                  }
                  const progressPercent = Math.round((currentWeek / totalWeeks) * 100);

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
                        {/* Header Section */}
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
                            {countdownText && (
                              <span className="w-fit text-[12px] font-bold text-white bg-black/10 px-2.5 py-1 rounded-[5px] shadow-sm capitalize mb-0.5">
                                {countdownText}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mt-1.5 flex flex-col gap-2 z-10">
                            <div className="flex items-center justify-between text-[13px] font-semibold text-white/90">
                              <span>Week {currentWeek} of {totalWeeks}</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/15 rounded-full overflow-hidden">
                              <div className="h-full bg-white/90 rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Body Section */}
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
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-slate-500 leading-none">Room</p>
                                <p className="text-[14px] font-semibold text-slate-800 leading-none mt-1.5 truncate">{cell.room || "TBA"}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#F6F5EE] text-slate-600 shrink-0">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-slate-500 leading-none">Group</p>
                                <p className="text-[14px] font-semibold text-slate-800 leading-none mt-1.5 truncate">{cell.group ? `Group ${cell.group}` : "Any"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Section */}
                        <div className="px-4 py-3 flex justify-between items-end border-t border-[#EDEDE6] mt-auto shrink-0 relative rounded-b-[14px] bg-[#F6F5EE]">
                          <div className="flex flex-col gap-0.5 items-start">
                             <div className="flex items-center gap-2 text-slate-700">
                               <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                               <span className="text-[13px] font-bold tracking-tight whitespace-nowrap text-[#2C3E5D]">{period.start} – {period.end}</span>
                             </div>
                             <span className="text-[10px] font-bold text-[#8BA0C0] uppercase tracking-widest pl-[28px]">{durationText}</span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis shrink-0 border-[1.5px]",
                                isCurrentPeriod ? "bg-[#FFF0F0] text-[#D93036] border-[#F8BDBD]" :
                                hasPassed ? "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]" :
                                "bg-[#E6F4EA] text-[#1D7C50] border-[#AED6BE]"
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

    {/* Mobile Day View */}
    <div className="block md:hidden space-y-3">
      {DAYS.map(day => {
        const date = getWeekDates(weekOffset || 0)[day];
        const isToday = date.toDateString() === new Date().toDateString();
        const dayCells = cells.filter(c => c.day === day);
        return (
          <div key={day} className={cn("tt-card overflow-hidden", isToday && "ring-2 ring-blue-400/40")}>
            <div className={cn("px-4 py-3 flex items-center justify-between border-b", isToday ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100")}>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", isToday ? "text-blue-700" : "text-slate-700")}>{day}</span>
                <span className={cn("text-xs font-medium", isToday ? "text-blue-500" : "text-slate-400")}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              {isToday && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Today</span>}
            </div>
            {dayCells.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">No classes</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dayCells.map(cell => {
                  const period = PERIODS.find(p => p.id === cell.periodId);
                  return (
                    <div key={cell.eventId} className="px-4 py-3 flex items-center gap-3" onClick={() => interactive && onCellClick?.(cell)}>
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: cell.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{cell.courseTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{period?.start} – {period?.end} · {cell.room || 'TBA'}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${cell.color}15`, color: cell.color }}>
                        {cell.classType.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
    </>
  );
}
