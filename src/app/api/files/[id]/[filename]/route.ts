import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ACL : portail client ne peut télécharger que ses propres docs
  if (session.user.role === "CLIENT") {
    const dossier = await prisma.dossier.findFirst({
      where: { id, clientId: session.user.clientId ?? "" },
      select: { id: true },
    });
    if (!dossier) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // pas de path traversal
  if (filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "Bad" }, { status: 400 });
  }
  const fullPath = path.join(UPLOAD_DIR, id, filename);
  try {
    const buf = await readFile(fullPath);
    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
