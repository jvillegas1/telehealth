import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { formatMoney } from "./format-money";

export type SettlementReceiptLine = {
  dateLabel: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
};

export async function buildSettlementReceiptPdf(params: {
  batchId: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  lines: SettlementReceiptLine[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const draw = (text: string, size = 11, useBold = false) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.2, 0.25, 0.2),
    });
    y -= size + 8;
  };

  draw("Comprobante de liquidación", 16, true);
  draw(`Lote: ${params.batchId}`);
  draw(`Período: ${params.periodStart} — ${params.periodEnd}`);
  y -= 8;
  for (const line of params.lines.slice(0, 30)) {
    draw(
      `${line.dateLabel} | Bruto ${formatMoney(line.grossCents, params.currency)} | Comisión ${formatMoney(line.commissionCents, params.currency)} | Neto ${formatMoney(line.netCents, params.currency)}`,
      9,
    );
  }
  if (params.lines.length > 30) {
    draw(`… y ${params.lines.length - 30} sesiones más`, 9);
  }
  y -= 8;
  draw(`Total bruto: ${formatMoney(params.grossCents, params.currency)}`, 12, true);
  draw(`Total comisión: ${formatMoney(params.commissionCents, params.currency)}`, 12, true);
  draw(`Total neto: ${formatMoney(params.netCents, params.currency)}`, 12, true);

  return doc.save();
}
