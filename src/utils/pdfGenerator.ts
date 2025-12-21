import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode'; 

// 🟢 CONFIGURATION: Your QuotePilot Logo
const QUOTEPILOT_LOGO_URL = "https://quotepilot.coderon.co.za/logo.png"; 

// 1.0 TYPE DEFINITIONS
export interface PdfData {
  documentType: 'Invoice' | 'Quote';
  brandColor?: string;
  currency?: string; 
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  logo?: string | null;       
  paymentLink?: string | null;
  signature?: string | null;  
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
    branchName?: string | null;
    accountType?: string | null;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

// 2.0 HELPERS
const formatCurrency = (amount: number, currencyCode = 'ZAR') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getBase64FromUrl = async (url: string): Promise<string | null> => {
  try {
    const cleanUrl = `${url}?t=${new Date().getTime()}`; 
    const response = await fetch(cleanUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

const generateQR = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, { margin: 0 });
  } catch (err) {
    return '';
  }
}

// 3.0 THE GENERATOR ENGINE
export const generatePdf = async (data: PdfData): Promise<Blob> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- BRAND IDENTITY ---
  const COLOR_PRIMARY = data.brandColor || '#319795'; 
  const COLOR_TEXT_MAIN = '#1A202C'; 
  const COLOR_TEXT_MUTED = '#718096'; 
  const CURRENCY = data.currency || 'ZAR'; 
  
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margin;

  // --- 1. HEADER & USER LOGO ---
  if (data.logo) {
    const userLogo = await getBase64FromUrl(data.logo);
    if (userLogo) {
        try {
          const imgProps = doc.getImageProperties(userLogo);
          const pdfWidth = 40; 
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(userLogo, 'PNG', margin, yPos, pdfWidth, pdfHeight);
        } catch (err) {}
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

  // --- 4. ADVANCED FOOTER LAYOUT ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const leftColX = margin;
  const rightColX = pageWidth - margin; 
  
  // -- LEFT COLUMN: Notes, Bank, SIGNATURE --
  let leftY = finalY;

  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(COLOR_TEXT_MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / TERMS:', leftColX, leftY);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(data.notes, colWidth - 5);
    doc.text(noteLines, leftColX, leftY + 5);
    leftY += 10 + (noteLines.length * 4);
  }

  if (data.payment && (data.payment.bankName || data.payment.accNumber)) {
    leftY += 5;
    doc.setFontSize(8);
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', leftColX, leftY);
    doc.setTextColor(COLOR_TEXT_MAIN);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let bankY = leftY + 5;
    const bankLabels = [
        { label: 'Bank:', value: data.payment.bankName },
        { label: 'Holder:', value: data.payment.accountHolder },
        { label: 'Account:', value: data.payment.accNumber },
        { label: 'Branch:', value: data.payment.branchCode },
        { label: 'Type:', value: data.payment.accountType },
    ];
    bankLabels.forEach(item => {
        if(item.value) {
            doc.setTextColor(COLOR_TEXT_MUTED);
            doc.text(item.label, leftColX, bankY);
            doc.setTextColor(COLOR_TEXT_MAIN);
            doc.text(item.value, leftColX + 20, bankY);
            bankY += 5;
        }
    });
    leftY = bankY + 10;
  }

  // SIGNATURE
  if (data.signature) {
    const sigBase64 = await getBase64FromUrl(data.signature);
    if(sigBase64) {
        doc.setFontSize(8);
        doc.setTextColor(COLOR_TEXT_MUTED);
        doc.text('AUTHORIZED SIGNATURE:', leftColX, leftY + 5);
        try {
            const imgProps = doc.getImageProperties(sigBase64);
            const sigWidth = 35;
            const sigHeight = (imgProps.height * sigWidth) / imgProps.width;
            doc.addImage(sigBase64, 'PNG', leftColX, leftY + 7, sigWidth, sigHeight);
        } catch(e) {}
    }
  }

  // -- RIGHT COLUMN: Financials (DYNAMIC SPACING FIX) --
  let rightY = finalY;

  // 1. Subtotal
  const subtotalStr = formatCurrency(data.subtotal, CURRENCY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.setTextColor(COLOR_TEXT_MAIN);
  const subWidth = doc.getTextWidth(subtotalStr);
  doc.text(subtotalStr, rightColX, rightY, { align: 'right' });
  
  doc.setTextColor(COLOR_TEXT_MUTED);
  // Position Label: X = RightEdge - ValueWidth - 5mm Padding
  doc.text('Subtotal:', rightColX - subWidth - 5, rightY, { align: 'right' });

  // 2. VAT
  if (data.vatRate && data.vatRate > 0) {
    rightY += 6;
    const vatStr = formatCurrency(data.vatAmount, CURRENCY);
    doc.setTextColor(COLOR_TEXT_MAIN);
    const vatWidth = doc.getTextWidth(vatStr);
    doc.text(vatStr, rightColX, rightY, { align: 'right' });
    
    doc.setTextColor(COLOR_TEXT_MUTED);
    doc.text(`VAT (${data.vatRate}%):`, rightColX - vatWidth - 5, rightY, { align: 'right' });
  }

  // 3. Total (DYNAMIC FIX)
  rightY += 10;
  const totalStr = formatCurrency(data.total, CURRENCY);
  
  // Set font for Value to calculate width accurately
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const totalWidth = doc.getTextWidth(totalStr);
  
  // Render Value
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(totalStr, rightColX, rightY, { align: 'right' });

  // Render Label (Relative to Value Width)
  doc.setFontSize(12);
  doc.setTextColor(COLOR_TEXT_MAIN);
  // Push label left based on value width + 6mm padding
  doc.text('Total:', rightColX - totalWidth - 6, rightY, { align: 'right' });

  if(data.dueDate) {
     rightY += 6;
     doc.setFontSize(9);
     doc.setTextColor(COLOR_TEXT_MUTED);
     doc.setFont('helvetica', 'normal');
     doc.text(`Due by ${formatDate(data.dueDate)}`, rightColX, rightY, { align: 'right' });
  }

  // QR CODE (15mm size, clean alignment)
  if (data.paymentLink) {
    const btnY = rightY + 10;
    const btnWidth = 40;
    const btnHeight = 12;
    const btnX = rightColX - btnWidth;

    const qrData = await generateQR(data.paymentLink);
    if(qrData) {
        const qrSize = 15; 
        const qrX = btnX - qrSize - 5; 
        
        doc.addImage(qrData, 'PNG', qrX, btnY - 2, qrSize, qrSize);
        doc.setFontSize(6);
        doc.setTextColor(COLOR_TEXT_MUTED);
        doc.text("SCAN TO PAY", qrX + (qrSize/2), btnY - 3, { align: 'center' });
    }

    // BUTTON
    doc.setFillColor(COLOR_PRIMARY);
    doc.roundedRect(btnX, btnY, btnWidth, btnHeight, 1, 1, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAY NOW', btnX + (btnWidth / 2), btnY + 7.5, { align: 'center' });
    doc.link(btnX, btnY, btnWidth, btnHeight, { url: data.paymentLink });
  }

  // --- 5. FOOTER BRANDING (Perfected Alignment & Dynamic Color) ---
  const footerY = pageHeight - margin;
  
  if (QUOTEPILOT_LOGO_URL) {
      const qpLogo = await getBase64FromUrl(QUOTEPILOT_LOGO_URL);
      if (qpLogo) {
          const logoSize = 8;
          // Calculate precise alignment relative to text baseline
          const textWidth = doc.getTextWidth("QuotePilot");
          const spacing = 2;
          
          const textX = pageWidth - margin - textWidth;
          const logoX = textX - logoSize - spacing;
          
          // Align middle of logo with middle of text cap-height
          const baseY = footerY - 5; 
          doc.addImage(qpLogo, 'PNG', logoX, baseY - logoSize + 2.5, logoSize, logoSize);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(COLOR_PRIMARY); // 🟢 Dynamic User Color
          doc.text('QuotePilot', pageWidth - margin, baseY, { align: 'right' });
      }
  } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLOR_PRIMARY);
      doc.text('QuotePilot', pageWidth - margin, footerY - 5, { align: 'right' });
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text("Building Africa's Ambition.", pageWidth - margin, footerY, { align: 'right' });

  return doc.output('blob');
};