import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTeacherAdmin } from "@/lib/teacher";
import { listAccounts } from "@/lib/accounts";

export async function GET() {
  const { userId } = auth();
  if (!userId || !isTeacherAdmin(userId)) {
    return NextResponse.json({ error: "Only administrators can manage accounts." }, { status: 403 });
  }
  return NextResponse.json(await listAccounts());
}

const updateSchema = z.object({
  userId: z.string().min(1),
  teacher: z.boolean(),
});

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId || !isTeacherAdmin(userId)) {
    return NextResponse.json({ error: "Only administrators can manage accounts." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account update." }, { status: 400 });
  }
  if (parsed.data.userId === userId) {
    return NextResponse.json({ error: "You cannot change your own administrator access." }, { status: 400 });
  }

  if (parsed.data.teacher) {
    await db.teacherRole.upsert({
      where: { userId: parsed.data.userId },
      update: {},
      create: { userId: parsed.data.userId, grantedBy: userId },
    });
  } else {
    await db.teacherRole.deleteMany({ where: { userId: parsed.data.userId } });
  }

  return NextResponse.json({ userId: parsed.data.userId, teacher: parsed.data.teacher });
}
