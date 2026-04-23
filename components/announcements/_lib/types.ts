export type Category = "EVENT_DEADLINE" | "HOMEWORK" | "SCHOOL_NEWS" | "GENERAL";
export type Priority = "NORMAL" | "URGENT";
export type SortMode = "pinned" | "newest" | "due_date" | "urgent";
export type FilterTab = "ALL" | Category | "URGENT" | "PINNED" | "PENDING";

export interface AnnouncementItem {
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
  dueDate: string | Date | null;
  attachmentLabel: string | null;
  viewCount: number;
  createdAt: string | Date;
}

export interface AnnouncementFormData {
  title: string;
  message: string;
  category: Category;
  priority: Priority;
  audience: string;
  isPinned: boolean;
  dueDate: string;
  attachmentLabel: string;
}

export const EMPTY_FORM: AnnouncementFormData = {
  title: "",
  message: "",
  category: "GENERAL",
  priority: "NORMAL",
  audience: "ALL",
  isPinned: false,
  dueDate: "",
  attachmentLabel: "",
};
