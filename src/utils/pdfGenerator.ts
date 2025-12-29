import { InvoicePdfPayload } from '@/types/invoice';

// 🟢 CONFIGURATION: Your QuotePilot Logo
const QUOTEPILOT_LOGO_URL = "https://mjcyhwryzgpaqqdyydgl.supabase.co/storage/v1/object/public/logos/f4f5147c-7548-4159-9456-271b0c8f9366/logo-1763033850740.png"; 

// 1.0 HELPERS

// 🟢 NEW: Lightweight Phone Validation
// Prevents rendering invalid "Tel:" lines (e.g., empty strings, or just "N/A")
const validatePhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const clean = phone.trim();
  // Must have at least 6 digits to be considered a printable phone number
  const digitCount = clean.replace(/\D/g, '').length;
  if (digitCount < 6) return null; 
  return clean;
};

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

// 🟢 FIXED: Handles both Server (Email) and Client (Browser) environments
const getBase64FromUrl = async (url: string): Promise<string | null> => {
  try {
    const cleanUrl = `${url}?t=${new Date().getTime()}`; 
    const response = await fetch(cleanUrl);
    if (!response.ok) return null;

    // CHECK: Are we on the server?
    if (typeof window === 'undefined') {
      // 🟢 SERVER SIDE (Node.js) - Use Buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/png";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } else {
      // 🟢 CLIENT SIDE (Browser) - Use FileReader
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error("Error generating Base64 for PDF:", error);
    return null;
  }
};

const generateQR = async (text: string): Promise<string> => {
  try {
    const QRCode = (await import('qrcode')).default || await import('qrcode');
    // @ts-ignore
    return await QRCode.toDataURL(text, { margin: 0 });
  } catch (err) {
    return '';
  }
}

// 2.0 THE GENERATOR ENGINE
// Uses strict InvoicePdfPayload to ensure data consistency
export const generatePdf = async (data: InvoicePdfPayload): Promise<Blob> => {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- BRAND IDENTITY ---
  // Fallback to Teal if brandColor is missing/empty
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

  // --- 2. ADDRESSES (REWRITTEN FOR PERFECT ALIGNMENT) ---
  const colWidth = (pageWidth - (margin * 2)) / 2;
  const startAddressY = yPos;

  // Helper to render an address block dynamically
  const renderAddressBlock = (
      title: string, 
      details: { name?: string | null, address?: string | null, email?: string | null, phone?: string | null }, 
      x: number, 
      y: number
  ) => {
      let currentY = y;
      
      // LABEL (FROM / BILL TO)
      doc.setFontSize(8);
      doc.setTextColor(COLOR_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x, currentY);
      currentY += 5;

      // NAME
      doc.setFontSize(10);
      doc.setTextColor(COLOR_TEXT_MAIN);
      doc.text(details.name || '', x, currentY);
      currentY += 5;

      // ADDRESS (Multi-line)
      if (details.address) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(COLOR_TEXT_MUTED);
          const addressLines = doc.splitTextToSize(details.address, colWidth - 5);
          doc.text(addressLines, x, currentY);
          currentY += (addressLines.length * 4.5);
      } else {
        currentY += 2; // small gap if no address
      }

      // CONTACT INFO (Phone/Email) with Icons/Labels
      const contactStart = currentY + 1;
      
      if (details.email) {
          doc.setFontSize(9);
          doc.setTextColor(COLOR_TEXT_MUTED);
          doc.text(`Email: ${details.email}`, x, contactStart);
          currentY = contactStart + 5;
      }
      
      // 🟢 VALIDATION: Check phone before rendering
      const validPhone = validatePhone(details.phone);
      if (validPhone) {
          const phoneY = details.email ? currentY : contactStart;
          doc.setFontSize(9);
          doc.setTextColor(COLOR_TEXT_MUTED);
          doc.text(`Tel: ${validPhone}`, x, phoneY);
          currentY = phoneY + 5;
      }

      return currentY;
  };

  // Render FROM
  const fromBottomY = renderAddressBlock('FROM', data.from, margin, startAddressY);

  // Render TO
  const toBottomY = renderAddressBlock('BILL TO', data.to, margin + colWidth, startAddressY);

  // Set yPos to the lowest point of either column + padding
  yPos = Math.max(fromBottomY, toBottomY) + 10;

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

  // -- RIGHT COLUMN: Financials --
  let rightY = finalY;

  // 1. Subtotal
  const subtotalStr = formatCurrency(data.subtotal, CURRENCY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.setTextColor(COLOR_TEXT_MAIN);
  const subWidth = doc.getTextWidth(subtotalStr);
  doc.text(subtotalStr, rightColX, rightY, { align: 'right' });
  
  doc.setTextColor(COLOR_TEXT_MUTED);
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

  // 3. Total
  rightY += 10;
  const totalStr = formatCurrency(data.total, CURRENCY);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const totalWidth = doc.getTextWidth(totalStr);
  
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(totalStr, rightColX, rightY, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.text('Total:', rightColX - totalWidth - 6, rightY, { align: 'right' });

  if(data.dueDate) {
     rightY += 6;
     doc.setFontSize(9);
     doc.setTextColor(COLOR_TEXT_MUTED);
     doc.setFont('helvetica', 'normal');
     doc.text(`Due by ${formatDate(data.dueDate)}`, rightColX, rightY, { align: 'right' });
  }

  // QR CODE
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

    doc.setFillColor(COLOR_PRIMARY);
    doc.roundedRect(btnX, btnY, btnWidth, btnHeight, 1, 1, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAY NOW', btnX + (btnWidth / 2), btnY + 7.5, { align: 'center' });
    doc.link(btnX, btnY, btnWidth, btnHeight, { url: data.paymentLink });
  }

  // --- 5. FOOTER BRANDING ---
  const footerY = pageHeight - margin;
  
  const platformLogo = await getBase64FromUrl(QUOTEPILOT_LOGO_URL);
  if (platformLogo) {
      try {
          const h = 7; 
          const props = doc.getImageProperties(platformLogo);
          const w = (props.width * h) / props.height;
          doc.addImage(platformLogo, 'PNG', margin, footerY - h, w, h);
      } catch(e) {}
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text("Sent with QuotePilot — Get paid faster", pageWidth - margin, footerY, { align: 'right' });

  return doc.output('blob');
};