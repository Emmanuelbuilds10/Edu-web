import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Sign in to leave a review.", { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Invalid review data.", { status: 400 });
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) return new NextResponse("Choose a rating from 1 to 5 stars.", { status: 400 });

  const purchase = await db.purchase.findUnique({
    where: { userId_courseId: { userId, courseId: params.courseId } },
    select: { id: true },
  });
  if (!purchase) return new NextResponse("You need to enroll before reviewing this course.", { status: 403 });

  const review = await db.review.upsert({
    where: { userId_courseId: { userId, courseId: params.courseId } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment || null },
    create: {
      userId,
      courseId: params.courseId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    select: { id: true, rating: true, comment: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(review);
}
