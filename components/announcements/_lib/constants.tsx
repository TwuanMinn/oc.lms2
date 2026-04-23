import React from "react";
import { AlertTriangle, BookOpen, Calendar, Clock, Megaphone, Pin } from "lucide-react";
import type { Category } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  EVENT_DEADLINE: "Event & deadline",
  HOMEWORK: "Homework",
  SCHOOL_NEWS: "School news",
  GENERAL: "General",
};

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  EVENT_DEADLINE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HOMEWORK: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SCHOOL_NEWS: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  GENERAL: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

export const STRIPE_COLORS: Record<Category, string> = {
  EVENT_DEADLINE: "bg-blue-500",
  HOMEWORK: "bg-emerald-500",
  SCHOOL_NEWS: "bg-amber-500",
  GENERAL: "bg-slate-400",
};

export const AUDIENCE_OPTIONS = ["ALL", "Teachers", "Students"];
export const MSG_CHAR_LIMIT = 500;

export const EMPTY_MESSAGES: Record<string, { icon: React.ReactNode; title: string; sub: string }> = {
  ALL: { icon: <Megaphone className="w-6 h-6 text-slate-300" />, title: "No announcements yet", sub: "Create one to get started" },
  EVENT_DEADLINE: { icon: <Calendar className="w-6 h-6 text-blue-300" />, title: "No event announcements", sub: "No events or deadlines have been posted" },
  HOMEWORK: { icon: <BookOpen className="w-6 h-6 text-emerald-300" />, title: "No homework announcements", sub: "No assignments have been posted" },
  SCHOOL_NEWS: { icon: <Megaphone className="w-6 h-6 text-amber-300" />, title: "No school news", sub: "No school news has been shared" },
  URGENT: { icon: <AlertTriangle className="w-6 h-6 text-red-300" />, title: "No urgent announcements", sub: "Nothing requires immediate attention" },
  PINNED: { icon: <Pin className="w-6 h-6 text-indigo-300" />, title: "No pinned announcements", sub: "Pin important announcements to keep them at the top" },
  PENDING: { icon: <Clock className="w-6 h-6 text-amber-300" />, title: "No pending submissions", sub: "All student announcements have been reviewed" },
};
