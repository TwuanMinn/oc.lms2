import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Track call order for select to return different data per call
let selectCallCount = 0;
const courseResult = [{ status: "PUBLISHED", deletedAt: null }];
const enrollmentExists = [{ id: "existing-enrollment" }];
const enrollmentEmpty: Array<{ id: string }> = [];

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          selectCallCount++;
          // 1st select = course validation, 2nd select = enrollment check
          if (selectCallCount % 2 === 1) return courseResult;
          return enrollmentExists;
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "enr-1", enrolledAt: new Date() }]),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    execute: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/server/services/billing.service", () => ({
  hasActiveSubscription: vi.fn().mockResolvedValue(false),
}));

describe("enrollment.service", () => {
  beforeEach(() => {
    selectCallCount = 0;
  });

  describe("enroll", () => {
    it("should throw CONFLICT when already enrolled", async () => {
      // Course check returns PUBLISHED, enrollment check returns existing
      const { enroll } = await import("@/server/services/enrollment.service");
      await expect(enroll("user-1", "course-1")).rejects.toThrow(
        "Already enrolled in this course"
      );
    });

    it("should throw BAD_REQUEST for unpublished course", async () => {
      // Override course result to return DRAFT
      courseResult[0] = { status: "DRAFT", deletedAt: null };

      const { enroll } = await import("@/server/services/enrollment.service");
      await expect(enroll("user-1", "course-1")).rejects.toThrow(
        "Course is not available for enrollment"
      );

      // Reset
      courseResult[0] = { status: "PUBLISHED", deletedAt: null };
    });
  });

  describe("unenroll", () => {
    it("should throw NOT_FOUND when not enrolled", async () => {
      // For unenroll: select returns empty array
      const mockDb = (await import("@/server/db")).db;
      vi.mocked(mockDb.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => enrollmentEmpty as any),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const { unenroll } = await import("@/server/services/enrollment.service");
      await expect(unenroll("user-1", "course-1")).rejects.toThrow(
        "Not enrolled"
      );
    });
  });
});
