import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  PageOrientation,
} from 'docx';
import { CUSTOMERS, JUSTIFICATION_LABEL } from '../data/mockData';
import { fmt, fmtDate, fmtDateTime, nowISO, todayISO } from './format';
import {
  remitterNotes,
  requestActivity,
  justificationDefinition,
  paidLabel,
  refundMethodLabel,
  refundExtentLabel,
  deliveryLabel,
  enoteTitle,
} from './selectors';
import { STATUS_META } from '../theme';

// In production these documents would be generated server-side so the OCFO
// record and the download are the same artifact. Client-side generation is a
// POC stand-in.

const saveBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const HEADERS = [
  'Request ID',
  'Customer',
  'Customer ID',
  'Requested by',
  'Date submitted',
  'Status',
  'Status date',
  'Amount',
];
const AMOUNT_COL = HEADERS.indexOf('Amount');

const rowArrays = (rows) =>
  rows.map((r) => [
    r.id,
    CUSTOMERS[r.customer].name,
    r.customer,
    r.requestedBy,
    fmtDate(r.submittedAt),
    STATUS_META[r.status].label,
    fmtDate(r.statusDate),
    fmt(r.total),
  ]);

export function downloadHistoryCsv(rows) {
  const quote = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    '﻿' + [HEADERS, ...rowArrays(rows)].map((cols) => cols.map(quote).join(',')).join('\r\n');
  saveBlob(`fee-refund-requests-${todayISO()}.csv`, new Blob([csv], { type: 'text/csv' }));
}

export function downloadHistoryPdf(rows) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Fee Refund Requests', 40, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Exported ${fmtDateTime(nowISO())} · ${rows.length} request${rows.length === 1 ? '' : 's'}`, 40, 62);
  doc.setTextColor(0);
  autoTable(doc, {
    head: [HEADERS],
    body: rowArrays(rows),
    startY: 78,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [0, 113, 187], textColor: 255 },
    columnStyles: { [AMOUNT_COL]: { halign: 'right' } },
  });
  saveBlob(
    `fee-refund-requests-${todayISO()}.pdf`,
    new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  );
}

export async function downloadHistoryDocx(rows) {
  const cell = (text, opts = {}) =>
    new TableCell({
      children: [
        new Paragraph({
          alignment: opts.right ? AlignmentType.RIGHT : undefined,
          children: [new TextRun({ text: String(text), bold: Boolean(opts.bold), size: 20 })],
        }),
      ],
    });
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: HEADERS.map((t) => cell(t, { bold: true })) }),
      ...rowArrays(rows).map(
        (r) => new TableRow({ children: r.map((v, i) => cell(v, { right: i === AMOUNT_COL })) })
      ),
    ],
  });
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: 'Fee Refund Requests', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            text: `Exported ${fmtDateTime(nowISO())} · ${rows.length} request${rows.length === 1 ? '' : 's'}`,
          }),
          new Paragraph({ text: '' }),
          table,
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveBlob(`fee-refund-requests-${todayISO()}.docx`, blob);
}

// Mirrors the request modal: a snapshot of the submitted request, then Activity. All wording
// comes from the same selectors the modal uses, so the record and its download never disagree.
export function downloadRequestPdf(request) {
  const c = CUSTOMERS[request.customer];
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const M = 40;
  const inner = width - M * 2;
  // The modal's palette: dark text, the one secondary gray, subtle rules, the inset surface.
  const DARK = [33, 37, 41];
  const GRAY = [79, 89, 102];
  const RULE = [222, 226, 230];
  const INSET = [238, 241, 244];
  const base = { fontSize: 9.5, cellPadding: { top: 4, right: 6, bottom: 4, left: 0 }, textColor: DARK };
  const labelStyle = { textColor: GRAY, fontStyle: 'bold' };
  const gray = (content) => ({ content, styles: { textColor: GRAY } });
  const after = (gap = 18) => doc.lastAutoTable.finalY + gap;
  const room = (y, need) => (y + need > height - 50 ? (doc.addPage(), 50) : y);

  const setText = (size, style = 'normal', color = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // Title and current state.
  setText(18, 'bold');
  doc.text(`Fee Refund Request ${request.id}`, M, 50);
  setText(10, 'normal', GRAY);
  doc.text(`Status: ${STATUS_META[request.status].label}, as of ${fmtDate(request.statusDate)}`, M, 68);
  let y = 84;
  const latest = request.timeline[request.timeline.length - 1];
  if (latest.note) {
    doc.text(
      `${STATUS_META[latest.status].label} on ${fmtDateTime(latest.at)}. The OCFO's note is under Activity.`,
      M,
      y
    );
    y += 16;
  }

  // Submitted request: header strip, parties, justification, fees, notes, certification.
  y += 6;
  doc.setFillColor(...INSET);
  doc.setDrawColor(...RULE);
  doc.rect(M, y, inner, 26, 'FD');
  setText(12, 'bold');
  doc.text('Submitted request', M + 10, y + 17);
  y += 34;

  autoTable(doc, {
    startY: y,
    margin: { left: M + 10, right: M + 10 },
    theme: 'plain',
    styles: base,
    headStyles: labelStyle,
    head: [['Customer', 'Requested by']],
    body: [
      [
        `${c.name}\nCustomer ID ${c.id}\n${c.team}, ${c.position}`,
        `${request.submittedBy.name}\n${request.submittedBy.email}`,
      ],
    ],
  });

  // Requester Remark leads, then the justification, matching the record.
  const j = request.justification;
  const label = (content) => [
    { content, styles: { ...labelStyle, cellPadding: { top: 10, right: 6, bottom: 2, left: 0 } } },
  ];
  autoTable(doc, {
    startY: after(10),
    margin: { left: M + 10, right: M + 10 },
    theme: 'plain',
    styles: base,
    headStyles: labelStyle,
    head: [['Requester Remark']],
    body: [
      [request.remark],
      label('Justification'),
      [JUSTIFICATION_LABEL[j.code]],
      [gray(`Definition at the time of submission: ${justificationDefinition(j)}`)],
    ],
  });

  const ruled = (bottom) => ({ lineColor: RULE, lineWidth: { bottom } });
  autoTable(doc, {
    startY: after(14),
    margin: { left: M + 10, right: M + 10 },
    theme: 'plain',
    styles: base,
    headStyles: { ...labelStyle, ...ruled(0.75) },
    bodyStyles: ruled(0.5),
    footStyles: { fontStyle: 'bold', textColor: DARK },
    head: [['Fee', 'Paid', 'Refund to', { content: 'Refund', styles: { halign: 'right' } }]],
    body: request.fees.map((f) => [
      `${f.desc}\nFee ID ${f.id}${f.items ? `\nLump sum of ${f.items.length} items` : ''}`,
      `${fmtDate(f.date)}\n${paidLabel(f)}`,
      `${f.remitter.name}\n${f.remitter.address}\n${refundMethodLabel(f)}${
        f.remitterSource === 'manual'
          ? '\nEntered manually'
          : f.remitterSource === 'customized'
            ? '\nChanged from payment record'
            : ''
      }`,
      { content: `${fmt(f.refund)}\n${refundExtentLabel(f)}`, styles: { halign: 'right' } },
    ]),
    foot: [
      [
        { content: 'Total refund requested', colSpan: 3, styles: { halign: 'right' } },
        { content: fmt(request.total), styles: { halign: 'right' } },
      ],
    ],
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 120 }, 3: { cellWidth: 80 } },
  });

  const notes = remitterNotes(
    request.fees,
    (f) => f.remitterSource,
    (f) => f.recordRemitter
  );
  if (notes.length)
    autoTable(doc, {
      startY: after(10),
      margin: { left: M + 10, right: M + 10 },
      theme: 'plain',
      styles: base,
      headStyles: labelStyle,
      head: [['Remitter notes']],
      body: notes.map((n) => [`${n.feeId}: ${n.text}`]),
    });

  // Certification closes the record, like a signature line.
  setText(9.5);
  const certLines = doc.splitTextToSize(
    `Certified and submitted by ${request.submittedBy.name} on ${fmtDateTime(request.certifiedAt)}. Routed to the Office of the Chief Financial Officer (OCFO), Refund Review.`,
    inner - 20
  );
  const certHeight = 30 + certLines.length * 12;
  y = room(after(12), certHeight);
  doc.setFillColor(...INSET);
  doc.setDrawColor(...RULE);
  doc.rect(M, y, inner, certHeight, 'FD');
  setText(9.5, 'bold', GRAY);
  doc.text('Certification', M + 10, y + 16);
  setText(9.5);
  doc.text(certLines, M + 10, y + 30);
  y += certHeight + 26;

  // Activity: everything after submission, oldest first, matching the modal's timeline.
  y = room(y, 60);
  setText(12, 'bold');
  doc.text('Activity', M, y);
  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    theme: 'plain',
    styles: base,
    columnStyles: { 0: { cellWidth: 130, textColor: GRAY } },
    body: requestActivity(request).flatMap((e) => {
      // Extra space above each event's first row separates events from one another.
      const lead = { cellPadding: { top: 10, right: 6, bottom: 2, left: 0 } };
      const rows = [
        [
          { content: fmtDateTime(e.at), styles: lead },
          {
            content: e.kind === 'enote' ? enoteTitle(e) : STATUS_META[e.status].label,
            styles: { ...lead, fontStyle: 'bold' },
          },
        ],
      ];
      if (e.kind === 'enote')
        e.notified.forEach((n) => rows.push(['', `${n.role}: ${n.name}\n${deliveryLabel(n)}`]));
      if (e.note) {
        rows.push(['', { content: 'Note from the OCFO', styles: labelStyle }]);
        rows.push(['', e.note]);
      }
      return rows;
    }),
  });

  // Footer on every page: when this copy was generated.
  const generated = `Generated ${fmtDateTime(nowISO())}`;
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setText(8, 'normal', GRAY);
    doc.text(`${generated}. ${request.id}, page ${i} of ${pages}.`, M, height - 24);
  }

  saveBlob(`${request.id}.pdf`, new Blob([doc.output('arraybuffer')], { type: 'application/pdf' }));
}
