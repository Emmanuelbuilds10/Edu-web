import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

async function setLike(postId: string, liked: boolean) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to react." }, { status: 401 });
  if (!(await db.userProfile.findUnique({ where: { userId }, select: { id: true } }))) return NextResponse.json({ error: "Choose a username to join the forum." }, { status: 428 });
  const post = await db.forumPost.findUnique({ where: { id: postId }, select: { id: true, title: true, authorId: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (liked) {
    const existingLike = await db.forumLike.findUnique({ where: { postId_authorId: { postId, authorId: userId } }, select: { id: true } });
    await db.forumLike.upsert({ where: { postId_authorId: { postId, authorId: userId } }, create: { postId, authorId: userId }, update: {} });
    if (!existingLike) await notifyUser({ recipientId: post.authorId, actorId: userId, type: "FORUM_LIKE", message: `liked your Plexx “${post.title}”`, href: `/forum#${post.id}` });
  } else await db.forumLike.deleteMany({ where: { postId, authorId: userId } });
  const likes = await db.forumLike.count({ where: { postId } });
  return NextResponse.json({ liked, likes });
}

export async function PUT(_request: Request, { params }: { params: { postId: string } }) { return setLike(params.postId, true); }
export async function DELETE(_request: Request, { params }: { params: { postId: string } }) { return setLike(params.postId, false); }
