import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildVykazFilename, buildVykazWorkbook } from "@/lib/export/vykazPrace";
import { listPrace } from "@/lib/queries/prace";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mesic = request.nextUrl.searchParams.get("mesic");
  if (!mesic || !/^\d{4}-\d{2}$/.test(mesic)) {
    return NextResponse.json({ error: "Neplatný parametr mesic (YYYY-MM)" }, { status: 400 });
  }

  const pracovnikId = request.nextUrl.searchParams.get("pracovnik_id") ?? undefined;
  const zakaznikId = request.nextUrl.searchParams.get("zakaznik_id") ?? undefined;

  const rows = await listPrace({
    mesic,
    pracovnikId,
    zakaznikId,
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Pro zvolené období nejsou žádné záznamy." }, { status: 404 });
  }

  const buffer = await buildVykazWorkbook(rows);
  const filename = buildVykazFilename(rows, mesic);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
