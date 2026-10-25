"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { DemoSessionContext, isClerkConfigured } from "@/lib/auth-client";

export function AppAuthProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  if (isClerkConfigured) return <ClerkProvider>{children}</ClerkProvider>;
  return <DemoSessionContext.Provider value={{ userId, userName: null }}>{children}</DemoSessionContext.Provider>;
}
