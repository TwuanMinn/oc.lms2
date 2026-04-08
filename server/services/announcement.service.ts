import { db } from "@/server/db";
import { announcements, type NewAnnouncement } from "@/server/db/schema/announcements";
import { eq, desc, asc, sql, and, or, ilike } from "drizzle-orm";

export async function listAnnouncements(filters?: {
  status?: string;
  category?: string;
  search?: string;
}) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(announcements.status, filters.status as any));
  }
  if (filters?.category) {
    conditions.push(eq(announcements.category, filters.category as any));
  }
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(announcements.title, term),
        ilike(announcements.message, term),
        ilike(announcements.authorName, term)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(announcements)
    .where(where)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

export async function getAnnouncementById(id: string) {
  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id));
  return announcement;
}

export async function createAnnouncement(data: NewAnnouncement) {
  const [created] = await db.insert(announcements).values(data).returning();
  return created;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<NewAnnouncement, "id" | "authorId" | "createdAt">>
) {
  const [updated] = await db
    .update(announcements)
    .set(data)
    .where(eq(announcements.id, id))
    .returning();
  return updated;
}

export async function deleteAnnouncement(id: string) {
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function incrementViewCount(id: string) {
  await db
    .update(announcements)
    .set({ viewCount: sql`${announcements.viewCount} + 1` })
    .where(eq(announcements.id, id));
}

export async function approveAnnouncement(id: string) {
  return updateAnnouncement(id, { status: "APPROVED" });
}

export async function rejectAnnouncement(id: string) {
  return updateAnnouncement(id, { status: "REJECTED" });
}
