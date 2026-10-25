import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

let clerkHandler: ReturnType<typeof authMiddleware> | null = null;

function getClerkHandler() {
  if (!clerkHandler) {
    clerkHandler = authMiddleware({
      publicRoutes: [
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/search(.*)",
        "/courses(.*)",
        "/teachers(.*)",
        "/api/courses",
        "/api/courses/(.*)",
        "/api/teachers/(.*)",
        "/api/uploadthing(.*)",
        "/api/webhook(.*)",
        "/api/demo/(.*)",
      ],
    });
  }
  return clerkHandler;
}

// Without Clerk keys, sessions are enforced by the page and route handlers.
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured) return NextResponse.next();
  return getClerkHandler()(request, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
