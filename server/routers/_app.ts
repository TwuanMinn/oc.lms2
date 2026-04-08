import { router } from "@/server/trpc";
import { courseRouter } from "./course.router";
import { lessonRouter } from "./lesson.router";
import { enrollmentRouter } from "./enrollment.router";
import { progressRouter } from "./progress.router";
import { quizRouter } from "./quiz.router";
import { bookmarkRouter } from "./bookmark.router";
import { reviewRouter } from "./review.router";
import { notificationRouter } from "./notification.router";
import { searchRouter } from "./search.router";
import { adminRouter } from "./admin.router";
import { attendanceRouter } from "./attendance.router";
import { scheduleRouter } from "./schedule.router";
import { certificateRouter } from "./certificate.router";
import { announcementRouter } from "./announcement.router";

export const appRouter = router({
  course: courseRouter,
  lesson: lessonRouter,
  enrollment: enrollmentRouter,
  progress: progressRouter,
  quiz: quizRouter,
  bookmark: bookmarkRouter,
  review: reviewRouter,
  notification: notificationRouter,
  search: searchRouter,
  admin: adminRouter,
  attendance: attendanceRouter,
  schedule: scheduleRouter,
  certificate: certificateRouter,
  announcement: announcementRouter,
});

export type AppRouter = typeof appRouter;

