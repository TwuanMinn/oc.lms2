"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCheck, Megaphone, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";

import { AnnouncementCard } from "./_components/AnnouncementCard";
import { AnnouncementFormModal } from "./_components/AnnouncementFormModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { StatPill } from "./_components/StatPill";
import { EMPTY_MESSAGES, MSG_CHAR_LIMIT } from "./_lib/constants";
import { STYLES } from "./_lib/styles";
import {
  EMPTY_FORM,
  type AnnouncementFormData,
  type AnnouncementItem,
  type FilterTab,
  type SortMode,
} from "./_lib/types";
import { useDebounce } from "./_lib/utils";

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
  const [formData, setFormData] = useState<AnnouncementFormData>(EMPTY_FORM);

  const utils = trpc.useUtils();
  const listQ = trpc.announcement.list.useQuery({ search: debouncedSearch || undefined });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const createM = trpc.announcement.create.useMutation({
    onSuccess: () => {
      toast.success(canDirectPost
        ? "Announcement posted ✓"
        : "Submitted for review! Your announcement will appear once approved by a teacher or admin.");
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
    onSuccess: (data) => {
      toast.success(`${data.approved} announcement${data.approved > 1 ? "s" : ""} approved ✓`);
      utils.announcement.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const pinToggleM = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openAdd = () => { setFormData(EMPTY_FORM); setEditingId(null); setShowForm(true); };
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
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (formData.message.length > MSG_CHAR_LIMIT) {
      toast.error(`Message must be under ${MSG_CHAR_LIMIT} characters`);
      return;
    }
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
      updateM.mutate({
        id: editingId,
        ...payload,
        dueDate: payload.dueDate || null,
        attachmentLabel: payload.attachmentLabel || null,
      });
    } else {
      createM.mutate(payload);
    }
  };

  const handlePinToggle = (item: AnnouncementItem) => {
    pinToggleM.mutate({ id: item.id, isPinned: !item.isPinned });
    toast.success(item.isPinned ? "Unpinned" : "Pinned ✓");
  };

  const handleBulkApprove = () => {
    const pendingIds = ((listQ.data || []) as AnnouncementItem[])
      .filter(a => a.status === "PENDING")
      .map(a => a.id);
    if (pendingIds.length === 0) return;
    bulkApproveM.mutate({ ids: pendingIds });
  };

  const items = useMemo(() => {
    let data = (listQ.data || []) as AnnouncementItem[];

    if (filterTab === "URGENT") data = data.filter(a => a.priority === "URGENT");
    else if (filterTab === "PINNED") data = data.filter(a => a.isPinned);
    else if (filterTab === "PENDING") data = data.filter(a => a.status === "PENDING");
    else if (filterTab !== "ALL") data = data.filter(a => a.category === filterTab);

    return [...data].sort((a, b) => {
      if (sortMode === "pinned") {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortMode === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
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
  }, [listQ.data, filterTab, sortMode]);

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

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
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
  const empty = EMPTY_MESSAGES[filterTab] ?? EMPTY_MESSAGES.ALL;

  return (
    <div className="ab-root">
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatPill label="Total" value={stats.total} color="text-slate-700" />
        <StatPill label="Urgent" value={stats.urgent} color="text-red-600" />
        <StatPill label="Pinned" value={stats.pinned} color="text-blue-600" />
        <StatPill label="Overdue" value={stats.overdue} color="text-amber-600" />
      </div>

      {canDirectPost && stats.pending > 0 && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-700 flex-1">
            {stats.pending} announcement{stats.pending > 1 ? "s" : ""} pending approval
          </span>
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

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="ab-input pl-9 w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn("ab-filter-chip", filterTab === tab.key && "ab-filter-chip-active")}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold",
                  filterTab === tab.key ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort by</span>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="ab-select text-sm"
          >
            <option value="pinned">Pinned first</option>
            <option value="newest">Newest first</option>
            <option value="due_date">Due date</option>
            <option value="urgent">Urgent first</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {items.length} announcement{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {showForm && (
        <AnnouncementFormModal
          data={formData}
          onChange={setFormData}
          isEditing={editingId !== null}
          isSaving={isMutating}
          canDirectPost={canDirectPost}
          userName={userName}
          role={role}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {deleteConfirmId && (
        <DeleteConfirmModal
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteM.mutate({ id: deleteConfirmId })}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="ab-card p-5 space-y-3 ab-card-enter"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse" />
              <div className="h-16 w-full bg-slate-50 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="ab-card p-12 flex flex-col items-center gap-3 text-center ab-card-enter">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            {empty.icon}
          </div>
          <p className="text-sm font-semibold text-slate-500">{empty.title}</p>
          <p className="text-xs text-slate-400">{empty.sub}</p>
          {filterTab === "ALL" && (
            <button onClick={openAdd} className="ab-btn-primary text-sm mt-2">
              <Plus className="w-3.5 h-3.5" /> Create one
            </button>
          )}
        </div>
      )}

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
