import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Enrol the signed-in student in a free course. Paid courses must go through
 * checkout and are rejected here so nobody can bypass payment.
 */
export async function POST(
  _request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: params.courseId, isPublished: true },
      select: { id: true, price: true },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (typeof course.price === "number" && course.price > 0) {
      return new NextResponse("This course requires payment.", { status: 400 });
    }

    const purchase = await db.purchase.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id, amountPaidKobo: 0, currency: "NGN" },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log("[COURSE_ENROLL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
