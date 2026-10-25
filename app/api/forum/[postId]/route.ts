import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { postId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const post = await db.forumPost.findUnique({
    where: { id: params.postId },
    include: {
      _count: { select: { likes: true, comments: true } },
      comments: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, authorId: true, authorUsername: true, createdAt: true } },
      likes: { where: { authorId: userId }, select: { id: true }, take: 1 },
    },
  });
  if (!post) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ...post, likedByMe: post.likes.length > 0, likes: undefined });
}

export async function DELETE(_request: Request, { params }: { params: { postId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const post = await db.forumPost.findUnique({ where: { id: params.postId }, select: { authorId: true } });
  if (!post) return new NextResponse("Not found", { status: 404 });
  if (post.authorId !== userId) return new NextResponse("Forbidden", { status: 403 });
  await db.forumPost.delete({ where: { id: params.postId } });
  return new NextResponse(null, { status: 204 });
}
