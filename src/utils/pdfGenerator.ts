// FILE: src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Buffer } from 'buffer';

// Define the structure of your data
interface PdfData {
  documentType: 'Invoice' | 'Quote';
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  logo?: string | null;
  from: { name?: string | null; address?: string | null; email?: string | null };
  to: { name?: string | null; address?: string | null; email?: string | null };
  lineItems: { description: string; quantity: number; unitPrice: number }[];
  notes?: string | null;
  vatRate?: number | null;
  payment: {
    bankName?: string | null;
    accountHolder?: string | null;
    accNumber?: string | null;
    accountType?: string | null;
    branchCode?: string | null;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

// Helper functions for formatting
const formatDisplayDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
};

const formatCurrency = (amount?: number | null): string => {
  if (amount === null || typeof amount === 'undefined') return 'ZAR 0.00';
  return `ZAR ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generatePdf = async (data: PdfData): Promise<{ pdfBase64: string; fileName: string }> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- DOCUMENT STYLING CONSTANTS ---
  const page = { height: doc.internal.pageSize.getHeight(), width: doc.internal.pageSize.getWidth() };
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const FONT_REGULAR = 'helvetica';
  const FONT_BOLD = 'helvetica';
  const PRIMARY_COLOR = '#1A202C'; // Dark Gray/Black
  const SECONDARY_COLOR = '#4A5568'; // Medium Gray
  const BORDER_COLOR = '#E2E8F0'; // Light Gray

  // --- 1. HEADER SECTION ---
  let yPos = margin.top;

  // Aspect-Ratio-Aware Logo Handling
  if (data.logo) {
    try {
      const response = await fetch(data.logo);
      if (!response.ok) throw new Error('Logo fetch failed');
      const imageBuffer = await response.arrayBuffer();
      const imageUint8Array = new Uint8Array(imageBuffer);
      
      const imgProps = doc.getImageProperties(imageUint8Array);
      const aspectRatio = imgProps.width / imgProps.height;
      const maxLogoHeight = 20;
      let logoWidth = maxLogoHeight * aspectRatio;
      let logoHeight = maxLogoHeight;
      if (logoWidth > 50) {
        logoWidth = 50;
        logoHeight = logoWidth / aspectRatio;
      }
      doc.addImage(imageUint8Array, 'PNG', margin.left, yPos, logoWidth, logoHeight);
    } catch (e) {
      console.error("PDF Generator: Could not add logo.", e);
    }
  }

  // Document Title (Right-aligned)
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text(data.documentType.toUpperCase(), page.width - margin.right, yPos + 8, { align: 'right' });

  doc.setFont(FONT_REGULAR, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_COLOR);
  doc.text(`#${data.invoiceNumber || 'N/A'}`, page.width - margin.right, yPos + 14, { align: 'right' });
  doc.text(`Date: ${formatDisplayDate(data.invoiceDate)}`, page.width - margin.right, yPos + 19, { align: 'right' });

  yPos += 35; // Advance cursor past header

  // --- 2. FROM / TO SECTION ---
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text(data.from.name || 'Your Company', margin.left, yPos);
  
  doc.setFont(FONT_REGULAR, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_COLOR);
  const fromAddress = doc.splitTextToSize(data.from.address || 'Your Address', 80);
  doc.text(fromAddress, margin.left, yPos + 5);

  const billToY = yPos;
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text('BILL TO', margin.left, billToY + 20);

  doc.setFont(FONT_REGULAR, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_COLOR);
  doc.text(data.to.name || 'Client Name', margin.left, billToY + 25);
  const toAddress = doc.splitTextToSize(data.to.address || 'Client Address', 80);
  doc.text(toAddress, margin.left, billToY + 30);
  
  yPos += 45; // Advance cursor

  // --- 3. LINE ITEMS TABLE ---
  autoTable(doc, {
    startY: yPos,
    head: [['ITEM', 'QTY', 'RATE', 'AMOUNT']],
    body: (data.lineItems || []).map(item => [
      item.description || '', item.quantity, formatCurrency(item.unitPrice), formatCurrency(item.quantity * item.unitPrice)
    ]),
    theme: 'striped',
    styles: {
      font: FONT_REGULAR,
      fontSize: 10,
      textColor: PRIMARY_COLOR,
      cellPadding: 3,
      lineColor: BORDER_COLOR,
    },
    headStyles: {
      fillColor: '#F7FAFC', // Very light gray
      textColor: SECONDARY_COLOR,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: margin.left, right: margin.right },
  });

  // --- 4. TOTALS, NOTES, AND PAYMENT ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Notes Section (Left-aligned)
  if (data.notes) {
    doc.setFont(FONT_REGULAR, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(SECONDARY_COLOR);
    const notesLines = doc.splitTextToSize(data.notes, (page.width / 2) - margin.left - 10);
    doc.text(notesLines, margin.left, finalY);
  }

  // Totals Section (Right-aligned)
  const totalsX = page.width - margin.right;
  doc.setFont(FONT_REGULAR, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_COLOR);
  doc.text('Subtotal:', totalsX - 40, finalY, { align: 'right' });
  doc.text(formatCurrency(data.subtotal), totalsX, finalY, { align: 'right' });

  doc.text(`Tax (${data.vatRate || 0}%):`, totalsX - 40, finalY + 7, { align: 'right' });
  doc.text(formatCurrency(data.vatAmount), totalsX, finalY + 7, { align: 'right' });

  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text('Total:', totalsX - 40, finalY + 15, { align: 'right' });
  doc.text(formatCurrency(data.total), totalsX, finalY + 15, { align: 'right' });


  // --- 5. FOOTER / PAYMENT DETAILS ---
  const footerY = page.height - margin.bottom - 25;
  doc.setDrawColor(BORDER_COLOR);
  doc.line(margin.left, footerY, page.width - margin.right, footerY);
  
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text('PAYMENT DETAILS', margin.left, footerY + 8);
  
  doc.setFont(FONT_REGULAR, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(SECONDARY_COLOR);
  const paymentInfo = [
    `Bank: ${data.payment.bankName || 'N/A'}`,
    `Account Name: ${data.payment.accountHolder || 'N/A'}`,
    `Account Number: ${data.payment.accNumber || 'N/A'}`,
    `Account Type: ${data.payment.accountType || 'N/A'}`,
    `Branch Code: ${data.payment.branchCode || 'N/A'}`,
  ].join('\n');
  doc.text(paymentInfo, margin.left, footerY + 13);
  
  // --- FINALIZATION ---
  const fileName = `${data.documentType}_${data.invoiceNumber || 'DRAFT'}.pdf`;
  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBase64 = Buffer.from(pdfArrayBuffer).toString('base64');
  
  return { pdfBase64, fileName };
};