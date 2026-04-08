import type { Day } from "./timetable-data";

// Mapped timetable cell
export interface Cell {
  eventId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  room: string;
  group: string;
  classType: string;
  courseStartDate: string | null;
  day: Day;
  periodId: number;
  color: string;
}
