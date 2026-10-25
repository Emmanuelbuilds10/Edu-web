import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const attachmentSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Choose a file first.")
    .max(2000, "That file link is too long.")
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
      message: "Attachments must be an uploaded file or an https link.",
    }),
});

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("UnAuthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("UnAuthorized", { status: 401 });
    }

    const parsed = attachmentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message ?? "Check the attachment and try again.",
        { status: 400 }
      );
    }

    const rawName = decodeURIComponent(parsed.data.url.split("?")[0].split("/").pop() || "");
    const name = (rawName || "attachment").slice(0, 120);

    const attachment = await db.attachment.create({
      data: {
        url: parsed.data.url,
        name,
        courseId: params.courseId,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENTS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}