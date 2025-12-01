import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Buffer } from 'buffer';

// // 1.0 TYPE DEFINITIONS
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

// // 2.0 HELPERS
const formatDisplayDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const formatCurrency = (amount?: number | null): string => {
  if (amount === null || typeof amount === 'undefined') return 'R 0.00';
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// // 3.0 THE GENERATOR ENGINE
export const generatePdf = async (data: PdfData): Promise<{ pdfBase64: string; fileName: string }> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- DESIGN TOKENS (TEAL IDENTITY) ---
  const BRAND_COLOR = '#319795'; // QuotePilot Teal
  const TEXT_PRIMARY = '#1A202C'; // Gray.900
  const TEXT_SECONDARY = '#718096'; // Gray.500
  const TEXT_LIGHT = '#FFFFFF';
  const BORDER_COLOR = '#E2E8F0';

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight() };
  
  let yPos = margin.top;

  // --- 1. HEADER SECTOR ---
  // Logo Handling (Left Side)
  if (data.logo) {
    try {
      // NOTE: Using fetch to bypass potential CORS issues
      const response = await fetch(data.logo);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const imageUint8Array = new Uint8Array(imageBuffer);
        
        const imgProps = doc.getImageProperties(imageUint8Array);
        const aspectRatio = imgProps.width / imgProps.height;
        const maxLogoHeight = 18;
        let logoWidth = maxLogoHeight * aspectRatio;
        
        // Cap width if logo is extremely wide
        if (logoWidth > 60) {
            logoWidth = 60;
            // Recalculate height based on max width
            const logoHeight = logoWidth / aspectRatio;
            doc.addImage(imageUint8Array, 'PNG', margin.left, yPos, logoWidth, logoHeight);
        } else {
            doc.addImage(imageUint8Array, 'PNG', margin.left, yPos, logoWidth, maxLogoHeight);
        }
      }
    } catch (e) {
      console.warn("Logo Fetch Warning:", e);
    }
  }

  // Document Title & Meta (Right Side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(BRAND_COLOR);
  doc.text(data.documentType.toUpperCase(), page.width - margin.right, yPos + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_SECONDARY);
  doc.text(`#${data.invoiceNumber || 'DRAFT'}`, page.width - margin.right, yPos + 14, { align: 'right' });
  
  if (data.invoiceDate) {
    doc.text(`Issued: ${formatDisplayDate(data.invoiceDate)}`, page.width - margin.right, yPos + 19, { align: 'right' });
  }
  if (data.dueDate && data.documentType === 'Invoice') {
    doc.text(`Due: ${formatDisplayDate(data.dueDate)}`, page.width - margin.right, yPos + 24, { align: 'right' });
  }

  yPos += 35; // Advance

  // --- 2. ADDRESS SECTOR ---
  // From (Left)
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin.left, yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(TEXT_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.from.name || '', margin.left, yPos + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_SECONDARY);
  const fromAddress = doc.splitTextToSize(data.from.address || '', 80);
  doc.text(fromAddress, margin.left, yPos + 10);
  doc.text(data.from.email || '', margin.left, yPos + 10 + (fromAddress.length * 4));

  // To (Left - Offset)
  const toY = yPos + 25 + (fromAddress.length * 2); // Dynamic spacing based on address length
  
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin.left, toY);

  doc.setFontSize(10);
  doc.setTextColor(TEXT_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.to.name || 'Valued Client', margin.left, toY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_SECONDARY);
  const toAddress = doc.splitTextToSize(data.to.address || '', 80);
  doc.text(toAddress, margin.left, toY + 10);
  doc.text(data.to.email || '', margin.left, toY + 10 + (toAddress.length * 4));

  yPos = Math.max(toY + 25, yPos + 30); 

  // --- 3. THE ITEM TABLE ---
  autoTable(doc, {
    startY: yPos,
    head: [['ITEM DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
    body: (data.lineItems || []).map(item => [
      item.description,
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice)
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: TEXT_PRIMARY,
      lineColor: BORDER_COLOR,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: BRAND_COLOR, // Teal Header
      textColor: TEXT_LIGHT,
      fontStyle: 'bold',
      halign: 'right', // Default right align for numbers
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' }, // Description Left
      1: { halign: 'center' }, // Qty Center
      2: { halign: 'right' }, // Rate Right
      3: { halign: 'right', fontStyle: 'bold' }, // Amount Right & Bold
    },
    margin: { left: margin.left, right: margin.right },
  });

  // --- 4. FINANCIAL SUMMARY ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = page.width - margin.right;

  // Notes (Left side)
  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', margin.left, finalY);
    
    doc.setFontSize(9);
    doc.setTextColor(TEXT_SECONDARY);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, 100);
    doc.text(notesLines, margin.left, finalY + 5);
  }

  // Totals (Right side)
  doc.setFontSize(10);
  doc.setTextColor(TEXT_SECONDARY);
  doc.text('Subtotal:', summaryX - 40, finalY, { align: 'right' });
  doc.text(formatCurrency(data.subtotal), summaryX, finalY, { align: 'right' });

  if (data.vatRate && data.vatRate > 0) {
    doc.text(`VAT (${data.vatRate}%):`, summaryX - 40, finalY + 6, { align: 'right' });
    doc.text(formatCurrency(data.vatAmount), summaryX, finalY + 6, { align: 'right' });
  }

  // Grand Total
  doc.setFontSize(14);
  doc.setTextColor(BRAND_COLOR); // Teal Total
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', summaryX - 40, finalY + 14, { align: 'right' });
  doc.text(formatCurrency(data.total), summaryX, finalY + 14, { align: 'right' });

  // --- 5. BANKING & FOOTER ---
  const footerY = page.height - margin.bottom - 25;
  
  // Banking Line
  doc.setDrawColor(BORDER_COLOR);
  doc.line(margin.left, footerY - 5, page.width - margin.right, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', margin.left, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(TEXT_SECONDARY);
  doc.setFont('helvetica', 'normal');
  
  // Robust Join Logic for Banking
  const bankDetails = [
    data.payment.bankName,
    data.payment.accountHolder,
    data.payment.accNumber ? `Acc: ${data.payment.accNumber}` : null,
    data.payment.branchCode ? `Branch: ${data.payment.branchCode}` : null
  ].filter(Boolean).join('  |  ');
  
  doc.text(bankDetails, margin.left, footerY + 5);

  // --- 6. VIRAL WATERMARK (PRODUCT-LED GROWTH) ---
  const watermarkY = page.height - 10;
  
  doc.setFontSize(8);
  // Using Gray for the watermark text to be professional, not intrusive
  doc.setTextColor(TEXT_SECONDARY); 
  doc.setFont('helvetica', 'normal');
  const watermarkText = "Powered by QuotePilot - Create your own professional invoices for free.";
  const textWidth = doc.getTextWidth(watermarkText);
  const xPos = (page.width - textWidth) / 2;
  
  doc.text(watermarkText, xPos, watermarkY);
  
  // ADD LINK OVERLAY (The Homing Beacon)
  doc.link(xPos, watermarkY - 3, textWidth, 5, { url: 'https://quotepilot.coderon.co.za' });

  // --- OUTPUT ---
  const fileName = `${data.documentType}_${data.invoiceNumber || 'DRAFT'}.pdf`;
  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBase64 = Buffer.from(pdfArrayBuffer).toString('base64');
  
  return { pdfBase64, fileName };
};