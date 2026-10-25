import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UsernameSetup } from "./username-setup";

export default async function UsernameSetupPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fprofile%2Fsetup");
  const profile = await db.userProfile.findUnique({ where: { userId }, select: { id: true, displayName: true } });
  if (profile) redirect(profile.displayName ? "/dashboard" : "/profile/setup/display-name");
  const user = await currentUser();
  const suggestedUsername = (user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "")
    .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

  return <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"><p className="text-xs font-bold uppercase tracking-widest text-neutral-700">Join the conversation</p><h1 className="mt-2 text-2xl font-black">Choose your username</h1><p className="mt-2 text-sm leading-6 text-slate-600">Your unique username identifies your Sabiplex account across the community.</p><UsernameSetup suggestedUsername={suggestedUsername} /></div>;
}
