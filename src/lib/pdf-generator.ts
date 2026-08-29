import PDFDocument from 'pdfkit';
import { Quote, QuoteLine } from '@/types';
import Decimal from 'decimal.js';

interface QuoteData {
  quote: Quote;
  client: any;
  company: {
    name: string;
    abn: string;
    licence: string;
    location: string;
  };
}

/**
 * Generate PDF quote document
 */
export function generateQuotePDF(data: QuoteData): PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
  });

  const { quote, client, company } = data;

  // Header
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text(company.name, { align: 'left' });

  doc.fontSize(10).font('Helvetica').text(`ABN: ${company.abn}`, { align: 'left' });
  doc.text(`Licence: ${company.licence}`, { align: 'left' });
  doc.text(company.location, { align: 'left' });

  doc.moveDown(0.5);

  // Quote info
  doc.fontSize(14).font('Helvetica-Bold').text('QUOTATION', { align: 'center' });
  doc.moveDown(0.3);

  doc.fontSize(10).font('Helvetica');
  doc.text(`Quote #: ${quote.quote_number}`, { align: 'center' });
  doc.text(`Date: ${formatDate(quote.quote_date)}`, { align: 'center' });
  doc.text(`Valid until: ${formatDate(quote.expiry_date)}`, { align: 'center' });

  doc.moveDown(1);

  // Client details
  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
  doc.fontSize(10).font('Helvetica');
  doc.text(client.name);
  if (client.address) doc.text(client.address);
  if (client.phone) doc.text(`Phone: ${client.phone}`);
  if (client.email) doc.text(`Email: ${client.email}`);

  doc.moveDown(1);

  // Job details
  if (quote.scope_description) {
    doc.fontSize(11).font('Helvetica-Bold').text('Scope of Work:');
    doc.fontSize(10).font('Helvetica').text(quote.scope_description, { align: 'left' });
    doc.moveDown(0.5);
  }

  // Line items table
  drawLineItemsTable(doc, quote.lines);

  doc.moveDown(0.5);

  // Totals
  const totalXStart = 400;
  const valueXStart = 480;

  doc.fontSize(10).font('Helvetica');
  doc.text('Subtotal (ex GST):', totalXStart, doc.y, { width: 70, align: 'right' });
  doc.text(formatCurrency(quote.quote_ex_gst), valueXStart, doc.y - 10, {
    width: 70,
    align: 'right',
  });

  doc.moveDown(0.3);
  doc.text('GST (10%):', totalXStart, doc.y, { width: 70, align: 'right' });
  doc.text(formatCurrency(quote.gst_total), valueXStart, doc.y - 10, { width: 70, align: 'right' });

  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Total (inc GST):', totalXStart, doc.y, { width: 70, align: 'right' });
  doc.text(formatCurrency(quote.client_total), valueXStart, doc.y - 12, {
    width: 70,
    align: 'right',
  });

  doc.moveDown(1.5);

  // Conditions and notes (customer-facing)
  if (quote.customer_notes) {
    doc.fontSize(10).font('Helvetica-Bold').text('Notes:');
    doc.fontSize(9).font('Helvetica').text(quote.customer_notes);
    doc.moveDown(0.5);
  }

  if (quote.exclusions) {
    doc.fontSize(10).font('Helvetica-Bold').text('Exclusions:');
    doc.fontSize(9).font('Helvetica').text(quote.exclusions);
    doc.moveDown(0.5);
  }

  if (quote.conditions) {
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:');
    doc.fontSize(9).font('Helvetica').text(quote.conditions);
  }

  // Signature area
  doc.moveDown(2);
  doc.fontSize(10).text('Client Name: _____________________________', { indent: 40 });
  doc.moveDown(0.5);
  doc.text('Signature: _____________________________', { indent: 40 });
  doc.moveDown(0.3);
  doc.text('Date: _____________________________', { indent: 40 });

  return doc;
}

function drawLineItemsTable(doc: PDFDocument, lines: QuoteLine[]) {
  const xPosDescription = 50;
  const xPosQty = 320;
  const xPosUnit = 370;
  const xPosPrice = 420;
  const xPosTotal = 500;
  const lineHeight = 15;
  const tableTopY = doc.y;

  // Table header
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .rect(40, tableTopY, 520, lineHeight)
    .stroke();

  doc.text('Description', xPosDescription, tableTopY + 3, { width: 270 });
  doc.text('Qty', xPosQty, tableTopY + 3, { width: 40, align: 'right' });
  doc.text('Unit', xPosUnit, tableTopY + 3, { width: 40, align: 'left' });
  doc.text('Price ex GST', xPosPrice, tableTopY + 3, { width: 70, align: 'right' });
  doc.text('Total ex GST', xPosTotal, tableTopY + 3, { width: 60, align: 'right' });

  // Table rows
  let currentY = tableTopY + lineHeight;
  doc.fontSize(9).font('Helvetica');

  lines.forEach((line) => {
    // Skip optional lines from PDF display (or mark them differently)
    const opacity = line.optional ? 0.6 : 1;

    doc.text(line.description, xPosDescription, currentY, {
      width: 270,
      align: 'left',
    });
    doc.text(line.quantity, xPosQty, currentY, { width: 40, align: 'right' });
    doc.text(line.unit, xPosUnit, currentY, { width: 40, align: 'left' });
    doc.text(formatCurrency(line.selling_price_ex_gst), xPosPrice, currentY, {
      width: 70,
      align: 'right',
    });
    doc.text(formatCurrency(line.selling_price_ex_gst), xPosTotal, currentY, {
      width: 60,
      align: 'right',
    });

    currentY += lineHeight;
  });

  // Bottom border
  doc.moveTo(40, currentY).lineTo(560, currentY).stroke();

  doc.y = currentY + 10;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
