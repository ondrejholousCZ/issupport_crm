import { NextResponse } from "next/server";
import { markOverdueInvoices } from "@/lib/queries/faktura";
import { syncAllIdokladPayments } from "@/lib/queries/faktura-from-vykaz";
import { listSluzbyDueSoon } from "@/lib/queries/sluzba";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdue = await markOverdueInvoices();
  const dueSoon = await listSluzbyDueSoon(30);
  let idokladPaid = 0;
  try {
    idokladPaid = await syncAllIdokladPayments();
  } catch {
    idokladPaid = 0;
  }

  return NextResponse.json({
    ok: true,
    overdue_invoices_updated: overdue,
    services_due_within_30_days: dueSoon.length,
    idoklad_payments_synced: idokladPaid,
  });
}
