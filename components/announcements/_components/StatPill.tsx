import { cn } from "@/lib/utils";

export function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="ab-card px-5 py-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-3xl font-black leading-none", color)}>{value}</p>
    </div>
  );
}
