import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchAll } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  // La barre de recherche n'existe que pour les utilisateurs internes.
  if (!session || session.user.role === "CLIENT") {
    return NextResponse.json({ q: "", groups: [] }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ q, groups: [] });
  const groups = await searchAll(q, 5);
  return NextResponse.json({ q, groups });
}
