import React from "react";
import { cn } from "@/lib/utils";
import { Users, GraduationCap, BookOpen } from "lucide-react";
import { getInitials } from "./timetable-data";

// ═══════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════

export function StatCard({ icon, label, value, color, gradient }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  gradient: string;
}) {
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

// ═══════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════

export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="tt-card p-12 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">{icon}</div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════
// TEACHERS TAB
// ═══════════════════════════════════════

export function TeachersTab({ teachers, courses }: { teachers: any[]; courses: any[] }) {
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

export function StudentsTab({ students }: { students: any[] }) {
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
