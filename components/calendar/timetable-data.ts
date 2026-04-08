// Timetable constants, types, and helpers (no mock data)

export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type ViewRole = "admin" | "teacher" | "student";
export type AdminTab = "timetable" | "teachers" | "students";

export interface Period {
  id: number;
  label: string;
  start: string;
  end: string;
}

export const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAY_SHORT: Record<Day, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export const PERIODS: Period[] = [
  { id: 1, label: "Period 1", start: "08:00", end: "12:30" },
  { id: 2, label: "Period 2", start: "12:00", end: "13:15" },
  { id: 3, label: "Period 3", start: "13:20", end: "14:35" },
  { id: 4, label: "Period 4", start: "14:40", end: "15:55" },
  { id: 5, label: "Period 5", start: "16:00", end: "17:15" },
  { id: 6, label: "Period 6", start: "17:20", end: "18:35" },
  { id: 7, label: "Period 7", start: "18:40", end: "19:55" },
  { id: 8, label: "Period 8", start: "20:00", end: "21:30" },
];

export function getClassColor(classType: string): string {
  switch (classType) {
    case "LAB": return "#8B5CF6"; // Purple
    case "ONLINE_SESSION": return "#10B981"; // Emerald
    case "MAKEUP_CLASS": return "#F59E0B"; // Amber
    case "LECTURE":
    default:
      return "#3B82F6"; // Blue
  }
}

// ── Map a Date to a Day ──
export function getEventDay(d: Date): Day | null {
  const map: Record<number, Day> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 0: "Sunday" };
  return map[d.getDay()] || null;
}

// ── Map a Date to a Period ID ──
export function getEventPeriodId(d: Date): number | null {
  const mins = d.getHours() * 60 + d.getMinutes();
  for (const p of PERIODS) {
    const [sh, sm] = p.start.split(":").map(Number);
    const [eh, em] = p.end.split(":").map(Number);
    if (mins >= sh * 60 + sm && mins < eh * 60 + em) return p.id;
  }
  // If exact end time
  for (const p of PERIODS) {
    const [sh, sm] = p.start.split(":").map(Number);
    const [eh, em] = p.end.split(":").map(Number);
    if (mins >= sh * 60 + sm - 5 && mins <= eh * 60 + em) return p.id;
  }
  return null;
}

// ── Date Computations for Weekly Grid ──
export function getWeekDates(weekOffset = 0): Record<Day, Date> {
  const result = {} as Record<Day, Date>;
  const date = new Date();
  
  // Find Monday of the current week
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
  const monday = new Date(date.setDate(diff));
  
  DAYS.forEach((d, i) => {
    const dDate = new Date(monday);
    dDate.setDate(monday.getDate() + i);
    result[d] = dDate;
  });
  
  return result;
}

export function buildEventDates(day: Day, periodId: number, weekOffset = 0): { start: Date; end: Date } {
  const period = PERIODS.find(p => p.id === periodId)!;
  const [sh, sm] = period.start.split(":").map(Number);
  const [eh, em] = period.end.split(":").map(Number);

  const dates = getWeekDates(weekOffset);
  const date = dates[day];

  const start = new Date(date);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  return { start, end };
}

export function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
