import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCommunityIdentities } from "@/lib/community-profile";
import { ForumFeed, type ForumPostItem } from "./forum-feed";

export default async function ForumPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { username: true, displayName: true, avatarUrl: true },
  });
  if (!profile) redirect("/profile/setup");

  const posts = await db.forumPost.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, body: true, authorId: true, authorUsername: true, createdAt: true,
      _count: { select: { comments: true, likes: true } },
      comments: { take: 4, orderBy: { createdAt: "asc" }, select: { id: true, body: true, authorId: true, authorUsername: true, createdAt: true } },
      likes: { where: { authorId: userId }, select: { id: true }, take: 1 },
    },
  });
  const authorIds = posts.map((post) => post.authorId);
  const [identities, teacherCourses] = await Promise.all([
    getCommunityIdentities(posts.flatMap((post) => [post.authorId, ...post.comments.map((comment) => comment.authorId)])),
    authorIds.length ? db.course.findMany({ where: { userId: { in: authorIds }, isPublished: true }, select: { userId: true } }) : Promise.resolve([]),
  ]);
  const teacherIds = new Set(teacherCourses.map((course) => course.userId));
  const initialPosts: ForumPostItem[] = posts.map(({ likes, ...post }) => ({
    ...post,
    isTeacher: teacherIds.has(post.authorId),
    authorDisplayName: identities[post.authorId]?.displayName || post.authorUsername,
    authorAvatarUrl: identities[post.authorId]?.avatarUrl || null,
    createdAt: post.createdAt.toISOString(),
    comments: post.comments.map((comment) => ({
      ...comment,
      authorDisplayName: identities[comment.authorId]?.displayName || comment.authorUsername,
      authorAvatarUrl: identities[comment.authorId]?.avatarUrl || null,
      createdAt: comment.createdAt.toISOString(),
    })),
    likedByMe: likes.length > 0,
  }));

  return <main className="page-shell min-h-full px-5 py-8 md:px-8 md:py-12"><div className="w-full"><p className="eyebrow">Sabiplex community</p><h1 className="mt-1 text-3xl font-black tracking-tight">Forum</h1><p className="mt-2 text-slate-600">Share ideas, ask questions, and learn together. You’re posting as <strong>{profile.displayName || profile.username} · @{profile.username}</strong>.</p><div className="mt-7"><ForumFeed initialPosts={initialPosts} username={profile.username} displayName={profile.displayName || profile.username} avatarUrl={profile.avatarUrl || null} userId={userId} /></div></div></main>;
}
