import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/**
 * Serves files written by the local upload fallback (`/api/demo/upload`).
 * `next start` only maps the files that existed in `public/` at build time, so
 * runtime uploads need to be streamed from disk instead of relying on the
 * static handler.
 */
const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pdf: "application/pdf",
  txt: "text/plain",
};

export async function GET(request: Request, { params }: { params: { file: string } }) {
  const fileName = path.basename(params.file);
  if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(fileName)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", fileName);
  let size: number;
  let buffer: Buffer;
  try {
    [buffer, { size }] = await Promise.all([readFile(filePath), stat(filePath)]);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = contentTypes[extension] ?? "application/octet-stream";
  const baseHeaders = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400",
    "Accept-Ranges": "bytes",
  };

  // Video and audio elements request byte ranges so they can seek.
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      const chunk = buffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(chunk.length),
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
