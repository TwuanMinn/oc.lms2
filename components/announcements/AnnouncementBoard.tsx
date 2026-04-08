"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Megaphone, Plus, Pencil, Trash2, Pin, PinOff, Eye, Search,
  Calendar, Paperclip, X, AlertTriangle, Check, Clock,
  ChevronDown, ChevronUp, Users, BookOpen, GraduationCap, Shield,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";

// ── Types ──
type Category = "EVENT_DEADLINE" | "HOMEWORK" | "SCHOOL_NEWS" | "GENERAL";
type Priority = "NORMAL" | "URGENT";
type SortMode = "pinned" | "newest" | "due_date" | "urgent";
type FilterTab = "ALL" | Category | "URGENT" | "PINNED" | "PENDING";

const CATEGORY_LABELS: Record<Category, string> = {
  EVENT_DEADLINE: "Event & deadline",
  HOMEWORK: "Homework",
  SCHOOL_NEWS: "School news",
  GENERAL: "General",
};

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  EVENT_DEADLINE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HOMEWORK: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SCHOOL_NEWS: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  GENERAL: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

const STRIPE_COLORS: Record<Category, string> = {
  EVENT_DEADLINE: "bg-blue-500",
  HOMEWORK: "bg-emerald-500",
  SCHOOL_NEWS: "bg-amber-500",
  GENERAL: "bg-slate-400",
};

const AUDIENCE_OPTIONS = ["ALL", "Teachers", "Students"];
const MSG_CHAR_LIMIT = 500;

interface AnnouncementItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  message: string;
  category: Category;
  priority: Priority;
  status: string;
  audience: string;
  isPinned: boolean;
  dueDate: string | null;
  attachmentLabel: string | null;
  viewCount: number;
  createdAt: string;
}

// ── Helpers ──
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

// ── Empty state messages per filter ──
const EMPTY_MESSAGES: Record<string, { icon: React.ReactNode; title: string; sub: string }> = {
  ALL: { icon: <Megaphone className="w-6 h-6 text-slate-300" />, title: "No announcements yet", sub: "Create one to get started" },
  EVENT_DEADLINE: { icon: <Calendar className="w-6 h-6 text-blue-300" />, title: "No event announcements", sub: "No events or deadlines have been posted" },
  HOMEWORK: { icon: <BookOpen className="w-6 h-6 text-emerald-300" />, title: "No homework announcements", sub: "No assignments have been posted" },
  SCHOOL_NEWS: { icon: <Megaphone className="w-6 h-6 text-amber-300" />, title: "No school news", sub: "No school news has been shared" },
  URGENT: { icon: <AlertTriangle className="w-6 h-6 text-red-300" />, title: "No urgent announcements", sub: "Nothing requires immediate attention" },
  PINNED: { icon: <Pin className="w-6 h-6 text-indigo-300" />, title: "No pinned announcements", sub: "Pin important announcements to keep them at the top" },
  PENDING: { icon: <Clock className="w-6 h-6 text-amber-300" />, title: "No pending submissions", sub: "All student announcements have been reviewed" },
};

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

export default function AnnouncementBoard({ userRole }: { userRole?: string }) {
  const { user } = useAuth();
  const role = userRole || user?.role || "ADMIN";
  const userName = user?.name || "";
  const canDirectPost = role === "ADMIN" || role === "TEACHER";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("pinned");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "GENERAL" as Category,
    priority: "NORMAL" as Priority,
    audience: "ALL",
    isPinned: false,
    dueDate: "",
    attachmentLabel: "",
  });

  const utils = trpc.useUtils();
  const listQ = trpc.announcement.list.useQuery({ search: debouncedSearch || undefined });
  const createM = trpc.announcement.create.useMutation({
    onSuccess: () => {
      const msg = canDirectPost ? "Announcement posted ✓" : "Submitted for review! Your announcement will appear once approved by a teacher or admin.";
      toast.success(msg);
      utils.announcement.list.invalidate();
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateM = trpc.announcement.update.useMutation({
    onSuccess: () => { toast.success("Updated ✓"); utils.announcement.list.invalidate(); closeForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteM = trpc.announcement.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.announcement.list.invalidate(); setDeleteConfirmId(null); },
    onError: (e) => toast.error(e.message),
  });
  const approveM = trpc.announcement.approve.useMutation({
    onSuccess: () => { toast.success("Approved ✓"); utils.announcement.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectM = trpc.announcement.reject.useMutation({
    onSuccess: () => { toast.success("Rejected"); utils.announcement.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const bulkApproveM = trpc.announcement.bulkApprove.useMutation({
    onSuccess: (data) => { toast.success(`${data.approved} announcement${data.approved > 1 ? "s" : ""} approved ✓`); utils.announcement.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  // Pin toggle uses update mutation
  const pinToggleM = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm(); };
  const resetForm = () => setFormData({ title: "", message: "", category: "GENERAL", priority: "NORMAL", audience: "ALL", isPinned: false, dueDate: "", attachmentLabel: "" });

  const openAdd = () => { resetForm(); setEditingId(null); setShowForm(true); };
  const openEdit = (a: AnnouncementItem) => {
    setFormData({
      title: a.title,
      message: a.message,
      category: a.category,
      priority: a.priority,
      audience: a.audience,
      isPinned: a.isPinned,
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().split("T")[0] : "",
      attachmentLabel: a.attachmentLabel || "",
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) { toast.error("Title and message are required"); return; }
    if (formData.message.length > MSG_CHAR_LIMIT) { toast.error(`Message must be under ${MSG_CHAR_LIMIT} characters`); return; }
    const payload = {
      title: formData.title,
      message: formData.message,
      category: formData.category,
      priority: formData.priority,
      audience: formData.audience,
      isPinned: formData.isPinned,
      dueDate: formData.dueDate || undefined,
      attachmentLabel: formData.attachmentLabel || undefined,
    };
    if (editingId) {
      updateM.mutate({ id: editingId, ...payload, dueDate: payload.dueDate || null, attachmentLabel: payload.attachmentLabel || null });
    } else {
      createM.mutate(payload);
    }
  };

  const handlePinToggle = (item: AnnouncementItem) => {
    pinToggleM.mutate({ id: item.id, isPinned: !item.isPinned });
    toast.success(item.isPinned ? "Unpinned" : "Pinned ✓");
  };

  const handleBulkApprove = () => {
    const pendingIds = ((listQ.data || []) as AnnouncementItem[]).filter(a => a.status === "PENDING").map(a => a.id);
    if (pendingIds.length === 0) return;
    bulkApproveM.mutate({ ids: pendingIds });
  };

  // Filter + sort
  const items = useMemo(() => {
    let data = (listQ.data || []) as AnnouncementItem[];

    // Filter tab
    if (filterTab === "URGENT") data = data.filter(a => a.priority === "URGENT");
    else if (filterTab === "PINNED") data = data.filter(a => a.isPinned);
    else if (filterTab === "PENDING") data = data.filter(a => a.status === "PENDING");
    else if (filterTab !== "ALL") data = data.filter(a => a.category === filterTab);

    // Sort
    data = [...data].sort((a, b) => {
      if (sortMode === "pinned") {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortMode === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortMode === "due_date") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortMode === "urgent") {
        if (a.priority !== b.priority) return a.priority === "URGENT" ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return data;
  }, [listQ.data, filterTab, sortMode]);

  // Stats
  const stats = useMemo(() => {
    const all = (listQ.data || []) as AnnouncementItem[];
    const now = new Date();
    return {
      total: all.length,
      urgent: all.filter(a => a.priority === "URGENT").length,
      pinned: all.filter(a => a.isPinned).length,
      overdue: all.filter(a => a.dueDate && new Date(a.dueDate) < now).length,
      pending: all.filter(a => a.status === "PENDING").length,
    };
  }, [listQ.data]);

  const FILTER_TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "ALL", label: "All" },
    { key: "EVENT_DEADLINE", label: "Events" },
    { key: "HOMEWORK", label: "Homework" },
    { key: "SCHOOL_NEWS", label: "School news" },
    { key: "URGENT", label: "Urgent" },
    { key: "PINNED", label: "Pinned" },
    ...(canDirectPost ? [{ key: "PENDING" as FilterTab, label: "Pending", count: stats.pending }] : []),
  ];

  const isLoading = listQ.isLoading;
  const isMutating = createM.isPending || updateM.isPending;
  const charCount = formData.message.length;
  const charOver = charCount > MSG_CHAR_LIMIT;

  return (
    <div className="ab-root">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Announcement board</h1>
            <p className="text-xs text-slate-400 mt-0.5">Post notices for students, teachers, and staff</p>
          </div>
        </div>
        <button onClick={openAdd} className="ab-btn-primary">
          <Plus className="w-4 h-4" /> New announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatPill label="Total" value={stats.total} color="text-slate-700" />
        <StatPill label="Urgent" value={stats.urgent} color="text-red-600" />
        <StatPill label="Pinned" value={stats.pinned} color="text-blue-600" />
        <StatPill label="Overdue" value={stats.overdue} color="text-amber-600" />
      </div>

      {/* Pending approvals banner with bulk approve */}
      {canDirectPost && stats.pending > 0 && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-700 flex-1">{stats.pending} announcement{stats.pending > 1 ? "s" : ""} pending approval</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkApproveM.isPending}
            className="ab-btn-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {bulkApproveM.isPending ? "Approving…" : `Approve all (${stats.pending})`}
          </button>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements…"
            className="ab-input pl-9 w-full" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={cn("ab-filter-chip", filterTab === tab.key && "ab-filter-chip-active")}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold",
                  filterTab === tab.key ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                )}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort by</span>
          <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} className="ab-select text-sm">
            <option value="pinned">Pinned first</option>
            <option value="newest">Newest first</option>
            <option value="due_date">Due date</option>
            <option value="urgent">Urgent first</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-slate-400">{items.length} announcement{items.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Form modal overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeForm}>
          <div className="ab-modal w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-800">{editingId ? "Edit announcement" : "Post an announcement"}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
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
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" className="ab-input w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="ab-label" style={{ marginBottom: 0 }}>Message</label>
                  <span className={cn("text-[11px] font-bold", charOver ? "text-red-500" : charCount > MSG_CHAR_LIMIT * 0.8 ? "text-amber-500" : "text-slate-400")}>
                    {charCount}/{MSG_CHAR_LIMIT}
                  </span>
                </div>
                <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Describe what students or teachers need to know…"
                  className={cn("ab-input w-full resize-y", charOver && "border-red-300 focus:border-red-400")} />
                {charOver && <p className="text-[11px] text-red-500 mt-1 font-semibold">Message exceeds {MSG_CHAR_LIMIT} character limit</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ab-label">Category</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value as Category }))} className="ab-select w-full">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ab-label">Audience</label>
                  <select value={formData.audience} onChange={e => setFormData(p => ({ ...p, audience: e.target.value }))} className="ab-select w-full">
                    {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a === "ALL" ? "Everyone" : a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ab-label">Due / event date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} className="ab-input w-full" />
                </div>
                <div>
                  <label className="ab-label">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value as Priority }))} className="ab-select w-full">
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ab-label">Pin to top?</label>
                  <select value={formData.isPinned ? "yes" : "no"} onChange={e => setFormData(p => ({ ...p, isPinned: e.target.value === "yes" }))} className="ab-select w-full">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="ab-label">Attachment label (optional)</label>
                  <input type="text" value={formData.attachmentLabel} onChange={e => setFormData(p => ({ ...p, attachmentLabel: e.target.value }))} placeholder="e.g. exam_schedule.pdf" className="ab-input w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeForm} className="ab-btn-ghost">Cancel</button>
              <button onClick={handleSubmit} disabled={isMutating || charOver} className="ab-btn-primary">
                {isMutating ? "Saving…" : editingId ? "Save changes" : !canDirectPost ? "Submit for review" : "Post announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="ab-modal w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete announcement?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="ab-btn-ghost">Cancel</button>
              <button onClick={() => deleteM.mutate({ id: deleteConfirmId })} className="ab-btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="ab-card p-5 space-y-3 ab-card-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse" />
              <div className="h-16 w-full bg-slate-50 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state — contextual per filter */}
      {!isLoading && items.length === 0 && (
        <div className="ab-card p-12 flex flex-col items-center gap-3 text-center ab-card-enter">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            {EMPTY_MESSAGES[filterTab]?.icon || EMPTY_MESSAGES.ALL.icon}
          </div>
          <p className="text-sm font-semibold text-slate-500">{EMPTY_MESSAGES[filterTab]?.title || EMPTY_MESSAGES.ALL.title}</p>
          <p className="text-xs text-slate-400">{EMPTY_MESSAGES[filterTab]?.sub || EMPTY_MESSAGES.ALL.sub}</p>
          {filterTab === "ALL" && (
            <button onClick={openAdd} className="ab-btn-primary text-sm mt-2"><Plus className="w-3.5 h-3.5" /> Create one</button>
          )}
        </div>
      )}

      {/* Cards grid with staggered entrance */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, idx) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              index={idx}
              isExpanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              canEdit={canDirectPost || item.authorId === user?.id}
              canApprove={canDirectPost && item.status === "PENDING"}
              canPin={canDirectPost}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteConfirmId(item.id)}
              onApprove={() => approveM.mutate({ id: item.id })}
              onReject={() => rejectM.mutate({ id: item.id })}
              onPinToggle={() => handlePinToggle(item)}
            />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}


// ═══════════════════════════════════════
// CARD
// ═══════════════════════════════════════

function AnnouncementCard({ item, index, isExpanded, onToggleExpand, canEdit, canApprove, canPin, onEdit, onDelete, onApprove, onReject, onPinToggle }: {
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
}) {
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.GENERAL;
  const stripeColor = STRIPE_COLORS[item.category] || STRIPE_COLORS.GENERAL;
  const isUrgent = item.priority === "URGENT";
  const isPending = item.status === "PENDING";
  const isLong = item.message.length > 180;

  // Smart due date badge
  const dueBadge = useMemo(() => {
    if (!item.dueDate) return null;
    const now = new Date();
    const due = new Date(item.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    const label = `Due ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

    if (diffDays < 0) return { label: `Overdue · ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, className: "bg-red-50 text-red-600 border-red-200" };
    if (diffDays <= 3) {
      const daysText = diffDays === 0 ? "today" : diffDays === 1 ? "in 1d" : `in ${diffDays}d`;
      return { label: `Due ${daysText} · ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, className: "bg-amber-50 text-amber-600 border-amber-200" };
    }
    return { label, className: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  }, [item.dueDate]);

  const authorInitials = item.authorName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = relativeTime(item.createdAt);
  const roleColor = item.authorRole === "ADMIN" ? "from-rose-500 to-rose-600" : item.authorRole === "TEACHER" ? "from-blue-500 to-blue-600" : "from-emerald-500 to-emerald-600";

  return (
    <div
      className={cn(
        "ab-card overflow-hidden relative group ab-card-enter",
        isPending && "opacity-75 ring-2 ring-amber-300/50",
        isUrgent && "ring-1 ring-red-200"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top stripe */}
      <div className={cn("h-1", isUrgent ? "bg-gradient-to-r from-red-400 to-red-500" : stripeColor)} />

      <div className="p-5 space-y-3">
        {/* Tags row */}
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
          <span className="text-[11px] font-medium text-slate-400 ml-auto">{item.audience === "ALL" ? "All" : item.audience}</span>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canPin && (
              <button onClick={onPinToggle} title={item.isPinned ? "Unpin" : "Pin to top"} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-100 flex items-center justify-center transition-colors">
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

        {/* Approve/Reject buttons for pending */}
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

        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 leading-snug">{item.title}</h3>

        {/* Message — expandable */}
        <div className="relative">
          <p className={cn(
            "text-sm text-slate-600 leading-relaxed transition-all duration-300",
            !isExpanded && isLong && "line-clamp-3"
          )}>
            {item.message}
          </p>
          {isLong && (
            <button onClick={onToggleExpand} className="flex items-center gap-1 mt-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
              {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
        </div>

        {/* Due badge + views */}
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

        {/* Attachment */}
        {item.attachmentLabel && (
          <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="underline decoration-blue-200 underline-offset-2">{item.attachmentLabel}</span>
          </div>
        )}

        {/* Author footer */}
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

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="ab-card px-5 py-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-3xl font-black leading-none", color)}>{value}</p>
    </div>
  );
}


// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.ab-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.ab-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s ease;
}
.ab-card:hover {
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);
}

/* Staggered entrance animation */
.ab-card-enter {
  animation: abCardIn 0.4s ease-out both;
}
@keyframes abCardIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.ab-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
}

.ab-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px -2px rgba(30,41,59,0.25);
}
.ab-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -2px rgba(30,41,59,0.35); }
.ab-btn-primary:active { transform: translateY(0); }
.ab-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.ab-btn-ghost {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}
.ab-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

.ab-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.2s;
}
.ab-btn-danger:hover { background: #fee2e2; }

.ab-btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}

.ab-input {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
}
.ab-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.ab-input::placeholder { color: #94a3b8; }

.ab-select {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
  cursor: pointer;
  appearance: auto;
}
.ab-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.ab-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
}

.ab-filter-chip {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
}
.ab-filter-chip:hover { background: #f8fafc; border-color: #cbd5e1; color: #334155; }
.ab-filter-chip-active {
  background: #1e293b !important;
  color: white !important;
  border-color: #1e293b !important;
  box-shadow: 0 2px 8px -2px rgba(30,41,59,0.3);
}

.ab-modal {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 25px 60px -12px rgba(0,0,0,0.25);
  animation: abModalIn 0.25s ease-out;
}
@keyframes abModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;
