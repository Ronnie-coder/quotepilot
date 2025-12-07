import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1.0 TYPE DEFINITIONS
export interface PdfData {
  documentType: 'Invoice' | 'Quote';
  brandColor?: string;
  currency?: string; // <--- NEW: Dynamic Currency Code
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  logo?: string | null;
  from: {
    name?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  to: {
    name?: string | null;
    address?: string | null;
    email?: string | null;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string | null;
  vatRate?: number | null;
  payment?: {
    bankName?: string | null;
    accountHolder?: string | null;
    accNumber?: string | null;
    branchCode?: string | null;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

// 2.0 HELPERS

// Dynamic Currency Formatter
// Falls back to ZAR if undefined, or generic string if code is invalid
const formatCurrency = (amount: number, currencyCode = 'ZAR') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback for weird currency codes
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- DIRECT FETCH TO BASE64 (Anti-CORS / Cache Busting) ---
const getBase64FromUrl = async (url: string): Promise<string | null> => {
  try {
    // Appending timestamp to bypass browser caching issues with updated logos
    const cleanUrl = `${url}?t=${new Date().getTime()}`; 
    const response = await fetch(cleanUrl);
    
    if (!response.ok) throw new Error(`Failed to fetch logo: ${response.statusText}`);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.warn("Reader failed");
        resolve(null);
      }
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Logo PDF Generation Warning:", error);
    return null;
  }
};

// 3.0 THE GENERATOR ENGINE
export const generatePdf = async (data: PdfData): Promise<Blob> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- BRAND IDENTITY ---
  // Uses the passed color, or defaults to QuotePilot Teal
  const COLOR_PRIMARY = data.brandColor || '#319795'; 
  const COLOR_TEXT_MAIN = '#1A202C'; 
  const COLOR_TEXT_MUTED = '#718096'; 
  const CURRENCY = data.currency || 'ZAR'; // Uses dynamic currency
  
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margin;

  // --- 1. HEADER & LOGO ---
  if (data.logo) {
    const base64Img = await getBase64FromUrl(data.logo);
    
    if (base64Img) {
        try {
          const imgProps = doc.getImageProperties(base64Img);
          const pdfWidth = 40; 
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(base64Img, 'PNG', margin, yPos, pdfWidth, pdfHeight);
        } catch (err) {
          console.warn("Error adding image to PDF:", err);
        }
    }
  }

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(data.documentType.toUpperCase(), pageWidth - margin, yPos + 10, { align: 'right' });

  // Meta Data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MUTED);
  
  doc.text(`#${data.invoiceNumber || 'DRAFT'}`, pageWidth - margin, yPos + 18, { align: 'right' });
  doc.text(`Date: ${formatDate(data.invoiceDate)}`, pageWidth - margin, yPos + 23, { align: 'right' });
  
  if (data.documentType === 'Invoice' && data.dueDate) {
    doc.text(`Due: ${formatDate(data.dueDate)}`, pageWidth - margin, yPos + 28, { align: 'right' });
  }

  yPos += 45; 

  // --- 2. ADDRESSES ---
  const colWidth = (pageWidth - (margin * 2)) / 2;

  // FROM
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, yPos);

  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.text(data.from.name || '', margin, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED);
  
  const fromAddress = doc.splitTextToSize(data.from.address || '', colWidth - 5);
  doc.text(fromAddress, margin, yPos + 10);
  doc.text(data.from.email || '', margin, yPos + 10 + (fromAddress.length * 4));

  // TO
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + colWidth, yPos);

  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.text(data.to.name || '', margin + colWidth, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED);
  
  const toAddress = doc.splitTextToSize(data.to.address || '', colWidth - 5);
  doc.text(toAddress, margin + colWidth, yPos + 10);
  doc.text(data.to.email || '', margin + colWidth, yPos + 10 + (toAddress.length * 4));

  yPos = Math.max(yPos + 30, yPos + 15 + (Math.max(fromAddress.length, toAddress.length) * 4));

  // --- 3. ITEMS TABLE ---
  // We use the dynamic formatter for Unit Price and Total columns
  const tableData = data.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, CURRENCY),
    formatCurrency(item.quantity * item.unitPrice, CURRENCY)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: COLOR_TEXT_MAIN },
    headStyles: { fillColor: COLOR_PRIMARY, textColor: '#FFFFFF', fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  // --- 4. TOTALS & NOTES ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const rightColX = pageWidth - margin - 40;

  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / TERMS', margin, finalY);
    
    doc.setFontSize(9);
    doc.setTextColor(COLOR_TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(data.notes, 100);
    doc.text(noteLines, margin, finalY + 5);
  }

  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text('Subtotal:', rightColX, finalY, { align: 'right' });
  doc.text(formatCurrency(data.subtotal, CURRENCY), pageWidth - margin, finalY, { align: 'right' });

  if (data.vatRate && data.vatRate > 0) {
    doc.text(`VAT (${data.vatRate}%):`, rightColX, finalY + 5, { align: 'right' });
    doc.text(formatCurrency(data.vatAmount, CURRENCY), pageWidth - margin, finalY + 5, { align: 'right' });
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_PRIMARY);
  doc.text('Total:', rightColX, finalY + 15, { align: 'right' });
  doc.text(formatCurrency(data.total, CURRENCY), pageWidth - margin, finalY + 15, { align: 'right' });

  // --- 5. FOOTER & WATERMARK ---
  const footerY = pageHeight - margin;

  if (data.payment && (data.payment.bankName || data.payment.accNumber)) {
    doc.setFontSize(8);
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', margin, footerY - 15);
    
    doc.setTextColor(COLOR_TEXT_MAIN);
    doc.setFont('helvetica', 'normal');
    
    const parts = [
        data.payment.bankName,
        data.payment.accountHolder,
        data.payment.accNumber ? `Acc: ${data.payment.accNumber}` : null,
        data.payment.branchCode ? `Branch: ${data.payment.branchCode}` : null
    ].filter(Boolean);
    
    doc.text(parts.join(' | '), margin, footerY - 10);
  }
  
  // Brand Watermark
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_PRIMARY); 
  doc.text('QuotePilot', pageWidth - margin, footerY - 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text("Building Africa's Ambition, One Invoice at a Time.", pageWidth - margin, footerY - 10, { align: 'right' });

  // Add Link
  const textWidth = doc.getTextWidth("Building Africa's Ambition, One Invoice at a Time.");
  doc.link(pageWidth - margin - textWidth, footerY - 20, textWidth, 20, { url: 'https://quotepilot.coderon.co.za' });

  return doc.output('blob');
};