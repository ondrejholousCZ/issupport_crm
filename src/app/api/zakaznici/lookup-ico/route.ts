import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { resolveIcoLookup } from "@/lib/dais/lookupRoute";

export async function POST(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const icoRaw =
    body && typeof body === "object" && "ico" in body ? String((body as { ico?: unknown }).ico ?? "") : "";

  const result = await resolveIcoLookup(icoRaw);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
