import { useMemo } from "react";
import {
  Check, ChevronDown, ChevronUp, Clock, Eye, Paperclip, Pencil, Pin, PinOff, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_LABELS, STRIPE_COLORS } from "../_lib/constants";
import type { AnnouncementItem } from "../_lib/types";
import { relativeTime } from "../_lib/utils";

type Props = {
  item: AnnouncementItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  canEdit: boolean;
  canApprove: boolean;
  canPin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPinToggle: () => void;
};

export function AnnouncementCard({
  item, index, isExpanded, onToggleExpand,
  canEdit, canApprove, canPin,
  onEdit, onDelete, onApprove, onReject, onPinToggle,
}: Props) {
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.GENERAL;
  const stripeColor = STRIPE_COLORS[item.category] || STRIPE_COLORS.GENERAL;
  const isUrgent = item.priority === "URGENT";
  const isPending = item.status === "PENDING";
  const isLong = item.message.length > 180;

  const dueBadge = useMemo(() => {
    if (!item.dueDate) return null;
    const now = new Date();
    const due = new Date(item.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    const dateStr = due.toLocaleDateString(undefined, { day: "numeric", month: "short" });

    if (diffDays < 0) {
      return { label: `Overdue · ${dateStr}`, className: "bg-red-50 text-red-600 border-red-200" };
    }
    if (diffDays <= 3) {
      const daysText = diffDays === 0 ? "today" : diffDays === 1 ? "in 1d" : `in ${diffDays}d`;
      return { label: `Due ${daysText} · ${dateStr}`, className: "bg-amber-50 text-amber-600 border-amber-200" };
    }
    return { label: `Due ${dateStr}`, className: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  }, [item.dueDate]);

  const authorInitials = item.authorName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = relativeTime(item.createdAt);
  const roleColor =
    item.authorRole === "ADMIN" ? "from-rose-500 to-rose-600" :
    item.authorRole === "TEACHER" ? "from-blue-500 to-blue-600" :
    "from-emerald-500 to-emerald-600";

  return (
    <div
      className={cn(
        "ab-card overflow-hidden relative group ab-card-enter",
        isPending && "opacity-75 ring-2 ring-amber-300/50",
        isUrgent && "ring-1 ring-red-200"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn("h-1", isUrgent ? "bg-gradient-to-r from-red-400 to-red-500" : stripeColor)} />

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("ab-badge", catColor.bg, catColor.text, catColor.border)}>
            {CATEGORY_LABELS[item.category]}
          </span>
          {item.isPinned && (
            <span className="ab-badge bg-indigo-50 text-indigo-600 border-indigo-200">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {isUrgent && (
            <span className="ab-badge bg-red-50 text-red-600 border-red-200 font-bold">
              Urgent
            </span>
          )}
          {isPending && (
            <span className="ab-badge bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="w-3 h-3" /> Pending
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-400 ml-auto">
            {item.audience === "ALL" ? "All" : item.audience}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canPin && (
              <button
                onClick={onPinToggle}
                title={item.isPinned ? "Unpin" : "Pin to top"}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-100 flex items-center justify-center transition-colors"
              >
                {item.isPinned ? <PinOff className="w-3.5 h-3.5 text-indigo-500" /> : <Pin className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {canApprove && (
          <div className="flex gap-2">
            <button onClick={onApprove} className="ab-btn-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200">
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={onReject} className="ab-btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}

        <h3 className="text-base font-bold text-slate-800 leading-snug">{item.title}</h3>

        <div className="relative">
          <p className={cn(
            "text-sm text-slate-600 leading-relaxed transition-all duration-300",
            !isExpanded && isLong && "line-clamp-3"
          )}>
            {item.message}
          </p>
          {isLong && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 mt-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
            >
              {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {dueBadge && (
            <span className={cn("ab-badge text-[11px] font-bold", dueBadge.className)}>
              {dueBadge.label}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 ml-auto">
            <Eye className="w-3.5 h-3.5" /> {item.viewCount}
          </span>
        </div>

        {item.attachmentLabel && (
          <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="underline decoration-blue-200 underline-offset-2">{item.attachmentLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
          <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow-sm", roleColor)}>
            {authorInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700 truncate">{item.authorName}</p>
            <p className="text-[11px] text-slate-400 capitalize">{item.authorRole.toLowerCase()}</p>
          </div>
          <span className="text-xs font-medium text-slate-400">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
