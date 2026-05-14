import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(
  req: Request,
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
  const key = `${id}/${filename}`;
  const driver = storage();

  // Si S3 : on redirige vers une URL signée (pas de bande passante sur Next.js)
  if (process.env.STORAGE_DRIVER === "s3") {
    const signed = await driver.presignGet(key, 300);
    return NextResponse.redirect(signed);
  }

  // Sinon : on stream depuis le driver local
  const obj = await driver.get(key);
  if (!obj) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(obj.body as unknown as BodyInit, {
    headers: {
      "Content-Type": obj.mime ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
