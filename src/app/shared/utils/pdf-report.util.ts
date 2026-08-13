import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfReportMeta {
  label: string;
  value: string;
}

export interface PdfReportTable {
  title?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  meta?: PdfReportMeta[];
  tables: PdfReportTable[];
  fileName: string;
}

const MARGIN_X = 40;
const PAGE_WIDTH = 595.28;

export function downloadPdfReport(options: PdfReportOptions): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let cursorY = 50;

  doc.setFontSize(18);
  doc.setTextColor(15, 15, 15);
  doc.text(options.title, MARGIN_X, cursorY);
  cursorY += 18;

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text('CheckMate', MARGIN_X, cursorY);
  cursorY += 16;

  if (options.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(options.subtitle, MARGIN_X, cursorY);
    cursorY += 16;
  }

  const generatedAt = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el ${generatedAt}`, MARGIN_X, cursorY);
  cursorY += 20;

  if (options.meta?.length) {
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    options.meta.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, MARGIN_X, cursorY);
      cursorY += 14;
    });
    cursorY += 8;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X, cursorY);
  cursorY += 20;

  options.tables.forEach((table) => {
    if (table.title) {
      doc.setFontSize(12);
      doc.setTextColor(15, 15, 15);
      doc.text(table.title, MARGIN_X, cursorY);
      cursorY += 12;
    }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X },
      head: [table.columns],
      body: table.rows,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 247] },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  });

  doc.save(options.fileName);
}
