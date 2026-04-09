"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RatingStars } from "@/components/course/RatingStars";
import { ReviewSection } from "@/components/course/ReviewSection";
import { formatDuration, formatDate } from "@/lib/utils";
import { Clock, Users, BookOpen, PlayCircle, Lock, Loader2, ChevronDown, Calendar, FileText, ChevronLeft, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { AnimatedPage, ScrollReveal } from "@/components/ui/animated";
import { springBounce, collapseVariants, staggerContainer, fadeInUp } from "@/lib/motion";

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-5 w-24 animate-shimmer rounded" />
              <div className="h-10 w-3/4 animate-shimmer rounded" />
              <div className="h-4 w-full animate-shimmer rounded" />
              <div className="h-4 w-2/3 animate-shimmer rounded" />
              <div className="flex gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 w-20 animate-shimmer rounded" />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center lg:items-end">
              <div className="w-full max-w-xs rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <div className="aspect-video w-full animate-shimmer rounded-lg" />
                <div className="h-8 w-16 animate-shimmer rounded" />
                <div className="h-12 w-full animate-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-6 w-32 animate-shimmer rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3 h-14 w-full animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: course, isLoading } = trpc.course.bySlug.useQuery({
    slug: params.slug,
  });

  const utils = trpc.useUtils();
  const enroll = trpc.enrollment.enroll.useMutation({
    onSuccess: () => {
      utils.course.bySlug.invalidate({ slug: params.slug });
      toast.success("Enrolled successfully!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-20"
        >
          <p className="text-muted-foreground">Course not found</p>
        </motion.div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0
  );

  function handleEnroll() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/courses/${params.slug}`);
      return;
    }
    enroll.mutate({ courseId: course!.id });
  }

  function handleStartLearning() {
    const firstLesson = course!.modules[0]?.lessons[0];
    if (firstLesson) {
      router.push(`/learn/${course!.slug}/${firstLesson.id}`);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <AnimatedPage>
        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Breadcrumbs
              items={[
                { label: "Courses", href: "/courses" },
                { label: course.title },
              ]}
            />
          </div>
        </div>

        {/* ─── Immersive Hero ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative border-b border-border/40 overflow-hidden"
        >
          {/* Background glow derived from category */}
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* Left column — course info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="lg:col-span-2"
              >
                {course.categoryName && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
                  >
                    {course.categoryName}
                  </motion.span>
                )}
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
                    {course.description}
                  </p>
                )}

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                >
                  {[
                    { icon: null, content: <RatingStars rating={course.avgRating} size="sm" /> },
                    { icon: Users, content: `${course.enrollmentCount} students` },
                    { icon: BookOpen, content: `${totalLessons} lessons` },
                    { icon: Clock, content: formatDuration(course.totalDuration) },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      variants={fadeInUp}
                      className="flex items-center gap-1.5"
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {typeof item.content === "string" ? <span>{item.content}</span> : item.content}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Instructor */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex items-center gap-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-xs font-bold overflow-hidden ring-2 ring-border/50">
                    {course.teacherAvatar ? (
                      <Image
                        src={course.teacherAvatar}
                        alt={course.teacherName ?? ""}
                        width={44}
                        height={44}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{course.teacherName?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{course.teacherName}</p>
                    {course.teacherBio && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {course.teacherBio}
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Right column — Sticky enrollment card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
                className="lg:sticky lg:top-28 self-start"
              >
                <motion.div
                  whileHover={{
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
                    borderColor: "rgba(225, 29, 72, 0.25)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg backdrop-blur-sm"
                >
                  {course.thumbnail && (
                    <div className="relative mb-5 aspect-video w-full overflow-hidden rounded-xl">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl">
                          <PlayCircle className="h-8 w-8 text-primary ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                    className="text-3xl font-bold"
                  >
                  </motion.div>

                  {course.isEnrolled ? (
                    <motion.button
                      onClick={handleStartLearning}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springBounce}
                      className="mt-4 w-full cursor-pointer rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                      Continue Learning →
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springBounce}
                      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {enroll.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Enroll
                    </motion.button>
                  )}

                  {/* Course includes */}
                  <div className="mt-5 space-y-2.5 border-t border-border/40 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This course includes</p>
                    {[
                      { icon: BookOpen, text: `${totalLessons} lessons` },
                      { icon: Clock, text: formatDuration(course.totalDuration) },
                      { icon: Users, text: `${course.enrollmentCount} students enrolled` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <item.icon className="h-4 w-4 text-primary/60" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-center text-[10px] text-muted-foreground">
                    Updated {formatDate(course.createdAt)}
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Curriculum */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ScrollReveal>
                <h2 className="text-xl font-bold">Curriculum</h2>
              </ScrollReveal>
              <div className="mt-4 space-y-3">
                {course.modules.map((mod, modIndex) => {
                  const isExpanded = expandedModules.has(mod.id);
                  return (
                    <ScrollReveal key={mod.id} delay={modIndex * 0.05}>
                      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-accent/30"
                        >
                          <h3 className="text-sm font-semibold">{mod.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {mod.lessons.length} lessons
                            </span>
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </motion.span>
                          </div>
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              variants={collapseVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="overflow-hidden"
                            >
                              <div className="divide-y divide-border/30 border-t border-border/30">
                                {mod.lessons.map((lesson, lessonIndex) => (
                                  <motion.div
                                    key={lesson.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: lessonIndex * 0.04,
                                      type: "spring",
                                      stiffness: 260,
                                      damping: 20,
                                    }}
                                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-accent/20"
                                  >
                                    <div className="flex items-center gap-3">
                                      {course.isEnrolled ? (
                                        <PlayCircle className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="text-sm">{lesson.title}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>

              {(course.sessions?.length ?? 0) > 0 && (
                <div className="mt-8">
                  <ScrollReveal delay={0.1}>
                    <h2 className="text-xl font-bold">Live Classes & Materials</h2>
                  </ScrollReveal>
                  <div className="mt-4 space-y-3">
                    {course.sessions?.map((session, sIndex) => {
                      const isExpanded = expandedModules.has(session.id);
                      return (
                        <ScrollReveal key={session.id} delay={sIndex * 0.05}>
                          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                            <button
                              onClick={() => toggleModule(session.id)}
                              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-accent/30"
                            >
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <h3 className="text-sm font-semibold">{session.title}</h3>
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest pl-6">
                                  {new Date(session.scheduledAt).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {session.materials.length} items
                                </span>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </motion.span>
                              </div>
                            </button>
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  variants={collapseVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  className="overflow-hidden"
                                >
                                  <div className="divide-y divide-border/30 border-t border-border/30">
                                    {session.materials.length === 0 ? (
                                      <div className="px-4 py-3 text-xs text-muted-foreground italic">No materials added yet.</div>
                                    ) : (
                                      session.materials.map((mat, mIndex) => (
                                        <motion.div
                                          key={mat.id}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: mIndex * 0.04,
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                          }}
                                          className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-accent/20"
                                        >
                                          <div className="flex items-center gap-3">
                                            {mat.type === "ASSIGNMENT" ? <BookOpen className="h-4 w-4 text-primary" /> : mat.type === "EXAM" ? <FileText className="h-4 w-4 text-violet-500" /> : mat.type === "PDF" ? <FileText className="h-4 w-4 text-red-500" /> : <LinkIcon className="h-4 w-4 text-blue-500" />}
                                            {course.isEnrolled ? (
                                              mat.type === "ASSIGNMENT" ? (
                                                <a href={`/student/courses/${course.slug}/weeks/${session.id}/assignments/${mat.id}`} className="text-sm hover:underline text-foreground flex items-center gap-2">
                                                  {mat.title} <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold uppercase">Assignment</span>
                                                </a>
                                              ) : mat.type === "EXAM" ? (
                                                <a href={`/student/courses/${course.slug}/weeks/${session.id}/exams/${mat.id}`} className="text-sm hover:underline text-foreground flex items-center gap-2">
                                                  {mat.title} <span className="text-[10px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded font-bold uppercase">Exam</span>
                                                </a>
                                              ) : (
                                                <a href={mat.url ?? "#"} target="_blank" rel="noreferrer" className="text-sm hover:underline text-foreground">
                                                  {mat.title}
                                                </a>
                                              )
                                            ) : (
                                              <span className="text-sm text-foreground flex items-center gap-2">
                                                {mat.title}
                                                {mat.type === "ASSIGNMENT" && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase">Assignment</span>}
                                                {mat.type === "EXAM" && <span className="text-[10px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded font-bold uppercase">Exam</span>}
                                              </span>
                                            )}
                                          </div>
                                          {!course.isEnrolled && <Lock className="h-4 w-4 text-muted-foreground" />}
                                        </motion.div>
                                      ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                </div>
              )}

              <ScrollReveal delay={0.2}>
                <div className="mt-12">
                  <h2 className="text-xl font-bold">Reviews</h2>
                  <div className="mt-4">
                    <ReviewSection courseId={course.id} />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </div>
  );
}
