import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await db.userProfile.findUnique({ where: { userId }, select: { username: true, displayName: true, avatarUrl: true } });
  return NextResponse.json(profile);
}

const isAllowedAvatarUrl = (value: string) => {
  if (value.startsWith("/uploads/")) return true; // local upload fallback
  if (value.startsWith("data:image/")) return true; // generated demo avatar
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  avatarUrl: z.string().trim().max(1000).optional().default(""),
}).superRefine((values, context) => {
  if (values.avatarUrl && !isAllowedAvatarUrl(values.avatarUrl)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["avatarUrl"],
      message: "Upload a profile photo or use an https image link.",
    });
  }
});

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile." }, { status: 400 });
  const profile = await db.userProfile.updateMany({
    where: { userId },
    data: { displayName: parsed.data.displayName, avatarUrl: parsed.data.avatarUrl || null },
  });
  if (profile.count === 0) return NextResponse.json({ error: "Set up your username first." }, { status: 404 });
  return NextResponse.json({ displayName: parsed.data.displayName, avatarUrl: parsed.data.avatarUrl || null });
}
