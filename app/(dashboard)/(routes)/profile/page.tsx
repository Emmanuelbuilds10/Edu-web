import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SocialProfileForm } from "./social-profile-form";

export default async function SocialProfilePage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const [profile, user] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    currentUser(),
  ]);
  if (!profile) redirect("/profile/setup");

  return (
    <main className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <header>
          <p className="eyebrow text-teal-700">Your account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Community profile</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Choose the name and photo people see next to your Plexxes and replies.
          </p>
        </header>
        <SocialProfileForm
          username={profile.username}
          lastUsernameChangeAt={(profile.usernameChangedAt || profile.createdAt).toISOString()}
          initialDisplayName={profile.displayName || user?.fullName || profile.username}
          initialAvatarUrl={profile.avatarUrl || user?.imageUrl || ""}
        />
      </div>
    </main>
  );
}
