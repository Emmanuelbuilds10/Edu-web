import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  if (!(await hasTeacherAccess(userId))) return new NextResponse("Forbidden", { status: 403 });
  const profile = await db.teacherProfile.findUnique({ where: { userId } });
  return NextResponse.json(profile);
}

const profileSchema = z.object({
  headline: z.string().trim().max(120).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
  expertise: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
  websiteUrl: z.string().trim().max(300).optional().default(""),
  linkedinUrl: z.string().trim().max(300).optional().default(""),
}).superRefine((profile, context) => {
  for (const field of ["websiteUrl", "linkedinUrl"] as const) {
    const value = profile[field];
    if (!value) continue;
    try {
      if (new URL(value).protocol !== "https:") throw new Error("https required");
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Enter a valid https URL" });
    }
  }
});

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  if (!(await hasTeacherAccess(userId))) return new NextResponse("Forbidden", { status: 403 });

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 });

  const expertise = parsed.data.expertise.filter((item, index, items) => items.indexOf(item) === index);
  const profile = await db.teacherProfile.upsert({
    where: { userId },
    create: { userId, ...parsed.data, expertise },
    update: { ...parsed.data, expertise },
  });
  return NextResponse.json(profile);
}
