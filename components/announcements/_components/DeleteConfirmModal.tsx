import { Trash2 } from "lucide-react";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="ab-modal w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Delete announcement?</h3>
        <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="ab-btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="ab-btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}
