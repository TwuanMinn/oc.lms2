"use client";

import { Suspense } from "react";

import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader2, Users as UsersIcon, TrendingUp, Activity, Award, BookOpen } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "motion/react";
import { AnimatedPage } from "@/components/ui/animated";

function AdminAnalyticsContent() {
  const [data] = trpc.admin.getAnalytics.useSuspenseQuery();

  const chartData =
    data?.enrollmentsByDay?.map((d: { date: string; count: number }) => ({
      date: d.date.slice(5),
      enrollments: d.count,
    })) ?? [];

  const completionRate = data?.totalEnrollments && data.totalCourses
    ? Math.round((data.totalCourses / data.totalEnrollments) * 100)
    : 0;

  return (
    <AnimatedPage>
            <PageHeader
              title="Platform Analytics"
              description="Real-time breakdown of growth and engagement"
            />

            {/* BENTO GRID LAYOUT */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Highlight Metric: Total Courses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-1 md:col-span-2 lg:col-span-2 rounded-2xl border-2 border-primary/20 bg-linear-to-br from-card to-card/50 p-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" /> Published Courses
                      </p>
                      <h2 className="text-4xl font-black tracking-tight text-foreground">
                        {data?.totalCourses ?? 0}
                      </h2>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {completionRate}% course-to-enrollment ratio
                  </p>
                </div>
              </motion.div>

              {/* Standard Metric Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg flex flex-col justify-between relative group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-blue-500" /> Total Users
                  </p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mt-4">{data?.totalUsers ?? 0}</h3>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg flex flex-col justify-between relative group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-500" /> Active Enrollments
                  </p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mt-4">{data?.totalEnrollments ?? 0}</h3>
                </div>
              </motion.div>

              {/* Enrollment Bar Chart (Large Span) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="col-span-1 md:grid-cols-2 lg:col-span-3 rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
              >
                <h3 className="mb-6 text-base font-semibold tracking-tight text-foreground">30-Day Enrollment Velocity</h3>
                <div className="h-[280px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                          itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                        />
                        <Bar
                          dataKey="enrollments"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 4, 4]}
                          barSize={32}
                          animationDuration={1500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      No enrollment data available
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Top Courses List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="col-span-1 md:col-span-2 lg:col-span-1 rounded-2xl border border-border/50 bg-card p-6 shadow-lg flex flex-col"
              >
                <h3 className="mb-6 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" /> Leaderboard
                </h3>
                <div className="flex-1 space-y-4">
                  {((data?.topCourses as Array<{ courseId: string; title: string; enrollmentCount: number }>) ?? []).slice(0, 5).map((course, idx: number) => (
                    <div key={course.courseId} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? "bg-amber-500/20 text-amber-500" :
                        idx === 1 ? "bg-slate-300/20 text-slate-400" :
                        idx === 2 ? "bg-amber-700/20 text-amber-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.enrollmentCount} enrollments</p>
                      </div>
                    </div>
                  )) ?? (
                    <p className="text-sm text-center text-muted-foreground py-10">No data yet</p>
                  )}
                </div>
              </motion.div>

            </div>
          </AnimatedPage>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar role="ADMIN" />
        <main className="flex-1 p-6 lg:p-8 2xl:p-10 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <AdminAnalyticsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
