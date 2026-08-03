import ExcelJS from "exceljs";
import { druhCinnostiLabels } from "@/lib/labels";
import { toDateIso } from "@/lib/format";
import type { OdvedenaPrace } from "@/lib/types";
import {
  exportCastka,
  toExcelDayFraction,
  workerInitials,
} from "@/lib/work-hours";

function parseDatum(value: string | Date): Date {
  const iso = toDateIso(value);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

const FMT_HODINY = "[h]:mm";
const FMT_CENA = '#,##0.00" Kč"';

export function buildVykazFilename(rows: OdvedenaPrace[], mesic: string): string {
  const periodPart = /^\d{4}$/.test(mesic) ? mesic : mesic.replace("-", "");
  const pracovnici = new Set(rows.map((r) => r.pracovnik_id));
  const zakaznikZkratky = new Set(
    rows.map((r) => r.zakaznik_zkratka).filter((z): z is string => Boolean(z?.trim())),
  );

  let prefix = "Vykaz";
  if (pracovnici.size === 1) {
    const row = rows[0];
    if (row.pracovnik_prijmeni && row.pracovnik_jmeno_krestni) {
      prefix = workerInitials(row.pracovnik_prijmeni, row.pracovnik_jmeno_krestni);
    }
  }

  const suffix =
    zakaznikZkratky.size === 1
      ? [...zakaznikZkratky][0]
      : zakaznikZkratky.size > 1
        ? "mix"
        : "export";

  return `${prefix}_Výkaz_Práce_${periodPart}_${suffix}.xlsx`;
}

export async function buildVykazWorkbook(rows: OdvedenaPrace[]): Promise<ExcelJS.Buffer> {
  const sorted = [...rows].sort((a, b) => {
    const byDate = toDateIso(a.datum).localeCompare(toDateIso(b.datum));
    if (byDate !== 0) return byDate;
    return (a.pracovnik_jmeno ?? "").localeCompare(b.pracovnik_jmeno ?? "");
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Výkaz práce");

  ws.columns = [
    { header: "#", key: "num", width: 4 },
    { header: "Datum", key: "datum", width: 12 },
    { header: "Zakázka", key: "zakazka", width: 14 },
    { header: "Pracovník", key: "pracovnik", width: 22 },
    { header: "Počet hodin", key: "hodiny", width: 14 },
    { header: "Činnost", key: "cinnost", width: 14 },
    { header: "Popis", key: "popis", width: 72 },
    { header: "Fakturační cena", key: "cena", width: 18 },
  ];

  ws.getColumn("hodiny").numFmt = FMT_HODINY;
  ws.getColumn("cena").numFmt = FMT_CENA;

  const header = ws.getRow(1);
  header.font = { bold: true };

  let sumHours = 0;
  let sumCena = 0;

  for (const row of sorted) {
    const hoursFrac = toExcelDayFraction(row.hodiny, row.minuty);
    const cena = exportCastka(
      row.hodiny,
      row.minuty,
      row.projekt_sazba_fak,
      row.castka_fakturace,
      row.projekt_jednotka_sazby ?? "hodina",
    );
    sumHours += hoursFrac;
    sumCena += cena;

    const dataRow = ws.addRow({
      num: "",
      datum: parseDatum(row.datum),
      zakazka: row.projekt_zakazka ?? row.projekt_nazev ?? "",
      pracovnik: row.pracovnik_jmeno ?? "",
      hodiny: hoursFrac,
      cinnost: row.druh_cinnosti ? druhCinnostiLabels[row.druh_cinnosti] : "Práce",
      popis: row.popis ?? "",
      cena,
    });

    dataRow.getCell("datum").numFmt = "d.m.yyyy";
  }

  const emptyRows = 2;
  for (let i = 0; i < emptyRows; i++) ws.addRow([]);

  ws.addRow({
    num: "",
    datum: "",
    zakazka: "",
    pracovnik: "",
    hodiny: sumHours,
    cinnost: "",
    popis: "",
    cena: sumCena,
  });

  return wb.xlsx.writeBuffer();
}
