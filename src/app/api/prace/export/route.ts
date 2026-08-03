import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildVykazFilename, buildVykazWorkbook } from "@/lib/export/vykazPrace";
import { currentMesic, parsePraceFilters } from "@/lib/prace-filters";
import { listPrace } from "@/lib/queries/prace";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const mesic = sp.get("mesic");
  if (mesic && !/^\d{4}-\d{2}$/.test(mesic)) {
    return NextResponse.json({ error: "Neplatný parametr mesic (YYYY-MM)" }, { status: 400 });
  }

  const filters = parsePraceFilters({
    mesic: mesic ?? undefined,
    pracovnik: sp.get("pracovnik") ?? undefined,
    projekt: sp.get("projekt") ?? undefined,
    zakaznik: sp.get("zakaznik") ?? undefined,
    stav: sp.get("stav") ?? undefined,
  });

  const rows = await listPrace({
    mesic: filters.mesic || currentMesic(),
    pracovnikIds: filters.pracovnikIds,
    projektIds: filters.projektIds,
    zakaznikIds: filters.zakaznikIds,
    stavFakturace: filters.stav,
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Pro zvolené filtry nejsou žádné záznamy." }, { status: 404 });
  }

  const buffer = await buildVykazWorkbook(rows);
  const filename = buildVykazFilename(rows, filters.mesic || currentMesic());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
