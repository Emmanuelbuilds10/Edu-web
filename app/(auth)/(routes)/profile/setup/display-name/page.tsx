import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DisplayNameSetup } from "./display-name-setup";

export default async function DisplayNameSetupPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fprofile%2Fsetup%2Fdisplay-name");
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/profile/setup");
  if (profile.displayName) redirect("/dashboard");
  const user = await currentUser();

  return <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"><p className="text-xs font-bold uppercase tracking-widest text-neutral-700">Community profile · Step 2</p><h1 className="mt-2 text-2xl font-black">Choose your display name</h1><p className="mt-2 text-sm leading-6 text-slate-600">Your username is @{profile.username}. Now choose the name and photo people see next to your Plexxes.</p><DisplayNameSetup initialDisplayName={user?.fullName || user?.username || profile.username} initialAvatarUrl={user?.imageUrl || ""} /></div>;
}
