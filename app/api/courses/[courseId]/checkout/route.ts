import { currentUser, isDemoAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import axios from 'axios';

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (purchase) {
      return new NextResponse('Already purchased', { status: 400 });
    }

    if (!course) {
      return new NextResponse('Not found', { status: 404 });
    }

    if (typeof course.price !== 'number' || !Number.isFinite(course.price) || course.price <= 0) {
      return new NextResponse('This course does not have a valid price yet.', { status: 400 });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      // Local demo mode: no payment provider is configured, so record the
      // enrolment directly and send the student back to the course. Real
      // deployments (Clerk configured) still require Paystack.
      if (!isDemoAuth) {
        return new NextResponse('Paystack is not configured on the server.', { status: 500 });
      }
      await db.purchase.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: { amountPaidKobo: Math.round(course.price * 100), currency: 'NGN' },
        create: {
          userId: user.id,
          courseId: course.id,
          amountPaidKobo: Math.round(course.price * 100),
          currency: 'NGN',
        },
      });
      return NextResponse.json({ url: `/courses/${course.id}?demo_payment=1`, demo: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !URL.canParse(appUrl)) {
      return new NextResponse('The app callback URL is not configured correctly.', { status: 500 });
    }

    const paystackPayload = {
      email: user.emailAddresses[0].emailAddress,
      amount: String(Math.round(course.price * 100)), // Paystack expects the amount in the currency's smallest unit.
      callback_url: `${appUrl.replace(/\/$/, '')}/courses/${course.id}?success=1`,
      metadata: {
        userId: user.id,
        courseId: course.id,
      },
    };

    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (paystackResponse.status !== 200 || !paystackResponse.data?.status) {
      return new NextResponse(paystackResponse.data?.message || 'Failed to initialize payment.', { status: 502 });
    }

    const { authorization_url } = paystackResponse.data.data;

    if (!authorization_url) {
      return new NextResponse('Paystack did not return a checkout URL.', { status: 502 });
    }

    return NextResponse.json({ url: authorization_url });
  } catch (error) {
    console.error('[COURSE_ID_CHECKOUT]', error);
    if (axios.isAxiosError(error)) {
      const paystackMessage = error.response?.data?.message;
      return new NextResponse(
        typeof paystackMessage === 'string' ? paystackMessage : 'Paystack could not initialize this payment.',
        { status: 502 }
      );
    }
    return new NextResponse('Could not start checkout. Please try again.', { status: 500 });
  }
}
