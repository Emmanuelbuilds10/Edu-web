import { SignUp } from "@clerk/nextjs";
import { DemoAuthForm } from "@/components/auth/demo-auth-form";

const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Page({
  searchParams,
}: {
  searchParams?: { redirect_url?: string };
}) {
  if (!isClerkConfigured) {
    return <DemoAuthForm mode="sign-up" redirectUrl={searchParams?.redirect_url} />;
  }
  return <SignUp />;
}