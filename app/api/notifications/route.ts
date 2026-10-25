import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { recipientId: userId },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { id: true, actorName: true, actorAvatarUrl: true, type: true, message: true, href: true, readAt: true, createdAt: true },
    }),
    db.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

const updateSchema = z.object({ notificationId: z.string().optional(), all: z.boolean().optional() })
  .refine((data) => !!data.notificationId || data.all === true, "Choose a notification to mark as read.");

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification update." }, { status: 400 });
  const readAt = new Date();
  if (parsed.data.all) {
    await db.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt } });
  } else {
    await db.notification.updateMany({ where: { id: parsed.data.notificationId, recipientId: userId, readAt: null }, data: { readAt } });
  }
  return NextResponse.json({ success: true });
}
