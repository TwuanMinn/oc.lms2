import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUDIENCE_OPTIONS, CATEGORY_LABELS, MSG_CHAR_LIMIT } from "../_lib/constants";
import type { AnnouncementFormData, Category, Priority } from "../_lib/types";

type Props = {
  data: AnnouncementFormData;
  onChange: (next: AnnouncementFormData) => void;
  isEditing: boolean;
  isSaving: boolean;
  canDirectPost: boolean;
  userName: string;
  role: string;
  onClose: () => void;
  onSubmit: () => void;
};

export function AnnouncementFormModal({
  data, onChange, isEditing, isSaving, canDirectPost, userName, role, onClose, onSubmit,
}: Props) {
  const charCount = data.message.length;
  const charOver = charCount > MSG_CHAR_LIMIT;
  const update = <K extends keyof AnnouncementFormData>(k: K, v: AnnouncementFormData[K]) =>
    onChange({ ...data, [k]: v });

  const submitLabel = isSaving
    ? "Saving…"
    : isEditing
      ? "Save changes"
      : !canDirectPost
        ? "Submit for review"
        : "Post announcement";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="ab-modal w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-800">
            {isEditing ? "Edit announcement" : "Post an announcement"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ab-label">Your name</label>
              <div className="ab-input w-full bg-slate-50 text-slate-700 font-semibold cursor-default">{userName || "—"}</div>
            </div>
            <div>
              <label className="ab-label">Role</label>
              <div className="ab-input w-full bg-slate-50 text-slate-700 font-semibold capitalize cursor-default">{role.toLowerCase()}</div>
            </div>
          </div>

          <div>
            <label className="ab-label">Title</label>
            <input
              type="text"
              value={data.title}
              onChange={e => update("title", e.target.value)}
              placeholder="Announcement title"
              className="ab-input w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="ab-label" style={{ marginBottom: 0 }}>Message</label>
              <span className={cn(
                "text-[11px] font-bold",
                charOver ? "text-red-500" : charCount > MSG_CHAR_LIMIT * 0.8 ? "text-amber-500" : "text-slate-400"
              )}>
                {charCount}/{MSG_CHAR_LIMIT}
              </span>
            </div>
            <textarea
              value={data.message}
              onChange={e => update("message", e.target.value)}
              rows={4}
              placeholder="Describe what students or teachers need to know…"
              className={cn("ab-input w-full resize-y", charOver && "border-red-300 focus:border-red-400")}
            />
            {charOver && (
              <p className="text-[11px] text-red-500 mt-1 font-semibold">
                Message exceeds {MSG_CHAR_LIMIT} character limit
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ab-label">Category</label>
              <select
                value={data.category}
                onChange={e => update("category", e.target.value as Category)}
                className="ab-select w-full"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="ab-label">Audience</label>
              <select
                value={data.audience}
                onChange={e => update("audience", e.target.value)}
                className="ab-select w-full"
              >
                {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a === "ALL" ? "Everyone" : a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ab-label">Due / event date</label>
              <input
                type="date"
                value={data.dueDate}
                onChange={e => update("dueDate", e.target.value)}
                className="ab-input w-full"
              />
            </div>
            <div>
              <label className="ab-label">Priority</label>
              <select
                value={data.priority}
                onChange={e => update("priority", e.target.value as Priority)}
                className="ab-select w-full"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ab-label">Pin to top?</label>
              <select
                value={data.isPinned ? "yes" : "no"}
                onChange={e => update("isPinned", e.target.value === "yes")}
                className="ab-select w-full"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="ab-label">Attachment label (optional)</label>
              <input
                type="text"
                value={data.attachmentLabel}
                onChange={e => update("attachmentLabel", e.target.value)}
                placeholder="e.g. exam_schedule.pdf"
                className="ab-input w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="ab-btn-ghost">Cancel</button>
          <button onClick={onSubmit} disabled={isSaving || charOver} className="ab-btn-primary">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
