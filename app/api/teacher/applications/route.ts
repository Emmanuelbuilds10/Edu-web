import { auth, clerkClient, currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasTeacherAccess, isTeacherAdmin } from "@/lib/teacher";

const applicationSchema = z.object({ statement: z.string().trim().min(30).max(2000) });

export async function GET() {
  const { userId } = auth();
  if (!isTeacherAdmin(userId)) return NextResponse.json({ error: "Only teacher admins can review applications." }, { status: 403 });

  const applications = await db.teacherApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, fullName: true, email: true, statement: true, createdAt: true },
  });
  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to apply." }, { status: 401 });
  if (await hasTeacherAccess(userId)) return NextResponse.json({ error: "You already have teacher access." }, { status: 409 });

  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please add more detail." }, { status: 400 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) return NextResponse.json({ error: "Add an email address to your account before applying." }, { status: 400 });
  const fullName = user?.fullName || user?.username || email;
  const existing = await db.teacherApplication.findUnique({ where: { userId } });
  if (existing?.status === "APPROVED") return NextResponse.json({ error: "Your application is already approved." }, { status: 409 });

  const application = await db.teacherApplication.upsert({
    where: { userId },
    create: { userId, fullName, email, statement: parsed.data.statement },
    update: { fullName, email, statement: parsed.data.statement, status: "PENDING", reviewedBy: null, reviewedAt: null },
    select: { status: true },
  });
  return NextResponse.json(application, { status: 201 });
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId || !isTeacherAdmin(userId)) return NextResponse.json({ error: "Only teacher admins can review applications." }, { status: 403 });

  const schema = z.object({ applicationId: z.string().min(1), decision: z.enum(["APPROVED", "REJECTED"]) });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid application decision." }, { status: 400 });

  const application = await db.teacherApplication.findUnique({ where: { id: parsed.data.applicationId } });
  if (!application || application.status !== "PENDING") return NextResponse.json({ error: "This application is no longer pending." }, { status: 404 });

  const updated = await db.$transaction(async (transaction) => {
    if (parsed.data.decision === "APPROVED") {
      await transaction.teacherRole.upsert({
        where: { userId: application.userId },
        create: { userId: application.userId, grantedBy: userId },
        update: {},
      });
    }
    return transaction.teacherApplication.update({
      where: { id: application.id },
      data: { status: parsed.data.decision, reviewedBy: userId, reviewedAt: new Date() },
      select: { id: true, status: true },
    });
  });
  return NextResponse.json(updated);
}

export async function PUT(request: Request) {
  const { userId } = auth();
  if (!userId || !isTeacherAdmin(userId)) return NextResponse.json({ error: "Only teacher admins can add teachers." }, { status: 403 });

  const parsed = z.object({ email: z.string().trim().email() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const matches = await clerkClient().users.getUserList({ emailAddress: [parsed.data.email], limit: 1 });
  const target = matches.data[0];
  if (!target) return NextResponse.json({ error: "No account was found for that email." }, { status: 404 });
  if (isTeacherAdmin(target.id)) return NextResponse.json({ error: "This account is already a teacher admin." }, { status: 409 });

  await db.teacherRole.upsert({
    where: { userId: target.id },
    create: { userId: target.id, grantedBy: userId },
    update: {},
  });
  await db.teacherApplication.updateMany({ where: { userId: target.id, status: "PENDING" }, data: { status: "APPROVED", reviewedBy: userId, reviewedAt: new Date() } });
  return NextResponse.json({ name: target.fullName || target.username || parsed.data.email, email: parsed.data.email });
}
