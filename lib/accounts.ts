import { clerkClient, isDemoAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTeacherAdmin } from "@/lib/teacher";

export type AccountSummary = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  hasTeacherAccess: boolean;
};

export async function listAccounts(): Promise<AccountSummary[]> {
  const [teacherRoles, profiles] = await Promise.all([
    db.teacherRole.findMany({ select: { userId: true } }),
    db.userProfile.findMany({ select: { userId: true, username: true, displayName: true, avatarUrl: true } }),
  ]);
  const teacherIds = new Set(teacherRoles.map((role) => role.userId));
  const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

  let accounts: { id: string; name: string; email: string | null }[] = [];
  if (isDemoAuth) {
    const demoUsers = await db.demoUser.findMany({ orderBy: { createdAt: "asc" } });
    accounts = demoUsers.map((user) => ({ id: user.id, name: user.name, email: user.email }));
  } else {
    const list = await clerkClient().users.getUserList({ limit: 100 });
    accounts = list.data.map((user) => ({
      id: user.id,
      name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Account",
      email: user.primaryEmailAddress?.emailAddress ?? null,
    }));
  }

  return accounts.map((account) => {
    const profile = profileByUserId.get(account.id);
    return {
      ...account,
      username: profile?.username ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      isAdmin: isTeacherAdmin(account.id),
      hasTeacherAccess: teacherIds.has(account.id) || isTeacherAdmin(account.id),
    };
  });
}
