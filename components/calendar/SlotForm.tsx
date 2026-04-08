import React, { useMemo } from "react";
import { Plus, Pencil, Trash2, BookOpen, Users } from "lucide-react";
import { type Day, DAYS, PERIODS } from "./timetable-data";

// ═══════════════════════════════════════
// SLOT FORM
// ═══════════════════════════════════════

export type ClassType = "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION";

export interface SlotFormData {
  courseId: string;
  day: Day;
  periodId: number;
  room: string;
  classType: ClassType;
}

interface SlotFormProps {
  formData: SlotFormData;
  setFormData: React.Dispatch<React.SetStateAction<SlotFormData>>;
  courses: any[];
  mode: "add" | "edit";
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function SlotForm({ formData, setFormData, courses, mode, onSave, onDelete, onCancel, loading }: SlotFormProps) {
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
          <select value={formData.classType} onChange={e => setFormData(p => ({ ...p, classType: e.target.value as ClassType }))} className="tt-select w-full">
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
