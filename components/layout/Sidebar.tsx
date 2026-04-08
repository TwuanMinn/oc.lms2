"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "@/lib/auth-client";
import { useAuth } from "@/lib/hooks/useAuth";
import { sidebarNavItem, staggerContainer, springBounce } from "@/lib/motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  GraduationCap,
  Bookmark,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LogOut,
  Award,
  CalendarDays,
  Bell,
  ChevronRight,
  Receipt,
  ClipboardList,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const studentSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
      { label: "My Courses", href: "/dashboard/student/courses", icon: BookOpen },
      { label: "Bookmarks", href: "/dashboard/student/bookmarks", icon: Bookmark },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "Certificates", href: "/dashboard/student/certificates", icon: Award },
      { label: "Attendance", href: "/dashboard/student/attendance", icon: ClipboardList },
      { label: "Schedule", href: "/dashboard/student/calendar", icon: CalendarDays },
      { label: "Announcements", href: "/dashboard/student/announcements", icon: Megaphone },
      { label: "Notifications", href: "/dashboard/student/notifications", icon: Bell, badge: 3 },
      { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
    ],
  },
];

const teacherSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
      { label: "My Courses", href: "/dashboard/teacher/courses", icon: BookOpen },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Attendance", href: "/dashboard/teacher/attendance", icon: ClipboardList },
      { label: "Schedule", href: "/dashboard/teacher/calendar", icon: CalendarDays },
      { label: "Announcements", href: "/dashboard/teacher/announcements", icon: Megaphone },
      { label: "Notifications", href: "/dashboard/teacher/notifications", icon: Bell, badge: 5 },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Users", href: "/dashboard/admin/users", icon: Users },
      { label: "Classes", href: "/dashboard/admin/classes", icon: ClipboardList },
      { label: "Attendance", href: "/dashboard/admin/attendance", icon: BarChart3 },
      { label: "Schedule", href: "/dashboard/admin/schedule", icon: CalendarDays },
      { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Transactions", href: "/dashboard/admin/transactions", icon: Receipt },
      { label: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  role: string;
}

function UserAvatar({ name, image, collapsed }: { name: string; image?: string | null; collapsed: boolean }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={springBounce}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20",
          collapsed ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"
        )}
      >
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </motion.div>
      {/* Online indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, ...springBounce }}
        className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-background bg-emerald-500",
          collapsed ? "h-2.5 w-2.5" : "h-3 w-3"
        )}
      />
    </div>
  );
}

function NavBadge({ value, collapsed }: { value: number | string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary"
      />
    );
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={springBounce}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary"
    >
      {value}
    </motion.span>
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const sections =
    role === "ADMIN"
      ? adminSections
      : role === "TEACHER"
        ? teacherSections
        : studentSections;

  const roleLabel = role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : "Student";
  const displayName = user?.name ?? roleLabel;
  const displayEmail = user?.email ?? "";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 272 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="hidden shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-xl lg:flex lg:flex-col"
    >
      <nav className="flex flex-1 flex-col p-3">
        {/* ── Collapse toggle ── */}
        <div className="mb-1 flex items-center justify-end px-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        {/* ── User Profile Section ── */}
        <motion.div
          layout
          className={cn(
            "mb-4 rounded-xl border border-border/40 bg-card/50 p-3 transition-colors hover:border-border/70",
            collapsed && "flex items-center justify-center p-2"
          )}
        >
          <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-0")}>
            <UserAvatar name={displayName} image={user?.image} collapsed={collapsed} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                  {displayEmail && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{displayEmail}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {roleLabel}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Navigation Sections ── */}
        <div className="flex flex-1 flex-col gap-4">
          {sections.map((section) => (
            <div key={section.title}>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.p
                    key={`section-${section.title}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-border/50" />}

              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col gap-0.5"
              >
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div key={item.href + item.label} variants={sidebarNavItem}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          collapsed && "justify-center px-0",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-linear-to-r from-primary/15 to-transparent"
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-bar"
                            className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          />
                        )}
                        <motion.span
                          whileHover={{ scale: 1.15, rotate: -6 }}
                          transition={springBounce}
                          className="relative z-10"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.badge && collapsed && (
                            <NavBadge value={item.badge} collapsed={collapsed} />
                          )}
                        </motion.span>
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              key="label"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15 }}
                              className="relative z-10 flex flex-1 items-center overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                              {item.badge && <NavBadge value={item.badge} collapsed={false} />}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {!collapsed && isActive && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative z-10 text-primary/50"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </motion.span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>

        {/* ── Bottom Section ── */}
        <div className="mt-auto border-t border-border/50 pt-3 flex flex-col gap-0.5">
          {role !== "ADMIN" && (
            <Link
              href="/dashboard/settings"
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <motion.span whileHover={{ rotate: 90 }} transition={springBounce}>
                <Settings className="h-4 w-4" />
              </motion.span>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-rose-500 hover:bg-rose-500/10",
              collapsed && "justify-center px-0"
            )}
          >
            <motion.span whileHover={{ scale: 1.1, x: 2 }} transition={springBounce}>
              <LogOut className="h-4 w-4" />
            </motion.span>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap"
                >
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>
    </motion.aside>
  );
}
