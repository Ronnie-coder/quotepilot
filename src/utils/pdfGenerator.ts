import { InvoicePdfPayload } from '@/types/invoice';

// 🟢 CONFIGURATION: Your QuotePilot Logo
const QUOTEPILOT_LOGO_URL = "https://mjcyhwryzgpaqqdyydgl.supabase.co/storage/v1/object/public/logos/f4f5147c-7548-4159-9456-271b0c8f9366/logo-1763033850740.png"; 

// 1.0 HELPERS

// Lightweight Phone Validation
const validatePhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const clean = phone.trim();
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

const getBase64FromUrl = async (url: string): Promise<string | null> => {
  try {
    const cleanUrl = `${url}?t=${new Date().getTime()}`; 
    const response = await fetch(cleanUrl);
    if (!response.ok) return null;

    if (typeof window === 'undefined') {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/png";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } else {
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
export const generatePdf = async (data: InvoicePdfPayload): Promise<Blob> => {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // --- BRAND IDENTITY ---
  const COLOR_PRIMARY = data.brandColor || '#319795'; 
  const COLOR_TEXT_MAIN = '#1A202C'; 
  const COLOR_TEXT_MUTED = '#718096'; 
  const CURRENCY = data.currency || 'ZAR'; 
  
  const isQuote = (data.documentType || 'invoice').toLowerCase() === 'quote';
  
  // Dynamic Labels
  const documentTitle = isQuote ? "PROPOSAL" : "INVOICE";
  const termsLabel = isQuote ? "TERMS & CONDITIONS:" : "PAYMENT TERMS / NOTES:";
  const dueLabel = isQuote ? "Valid Until:" : "Due Date:";
  const totalLabel = isQuote ? "Estimated Total:" : "Total Due:";

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margin;

  // --- 1. HEADER LOGIC (LAYOUT FLIPPED) ---
  
  // A: DOCUMENT TITLE & META (NOW TOP LEFT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(isQuote ? '#805AD5' : COLOR_PRIMARY); 
  doc.text(documentTitle, margin, yPos + 10, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text(`#${data.invoiceNumber || 'DRAFT'}`, margin, yPos + 18, { align: 'left' });
  doc.text(`Date: ${formatDate(data.invoiceDate)}`, margin, yPos + 23, { align: 'left' });
  
  if (data.dueDate) {
    doc.text(`${dueLabel} ${formatDate(data.dueDate)}`, margin, yPos + 28, { align: 'left' });
  }

  // B: LOGO & COMPANY INFO (NOW TOP RIGHT)
  let logoBottomY = yPos;
  
  if (data.logo) {
    const userLogo = await getBase64FromUrl(data.logo);
    if (userLogo) {
        try {
          const imgProps = doc.getImageProperties(userLogo);
          const pdfWidth = 40; 
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // 🟢 Draw Logo Aligned Right
          doc.addImage(userLogo, 'PNG', pageWidth - margin - pdfWidth, yPos, pdfWidth, pdfHeight);
          logoBottomY = yPos + pdfHeight + 5;
        } catch (err) {}
    }
  }

  // Company Details (Under Logo, Aligned Right)
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.setFont('helvetica', 'bold');
  
  let infoY = logoBottomY > (yPos + 35) ? logoBottomY : (yPos + 10); 
  if(!data.logo) infoY = yPos + 10; // Fallback if no logo

  doc.text(data.from.name || '', pageWidth - margin, infoY, { align: 'right' });
  infoY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.setFontSize(9);
  
  if (data.from.address) {
     const addressLines = doc.splitTextToSize(data.from.address, 60);
     doc.text(addressLines, pageWidth - margin, infoY, { align: 'right' });
     infoY += (addressLines.length * 4);
  }

  if (data.from.email) {
      doc.text(data.from.email, pageWidth - margin, infoY, { align: 'right' });
      infoY += 4;
  }
  const senderPhone = validatePhone(data.from.phone);
  if (senderPhone) {
      doc.text(senderPhone, pageWidth - margin, infoY, { align: 'right' });
      infoY += 4;
  }

  yPos = Math.max(infoY, yPos + 45) + 10; 

  // --- 2. ADDRESSES (CLIENT "BILL TO") ---
  const startAddressY = yPos;
  
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text(isQuote ? 'PREPARED FOR' : 'BILL TO', margin, startAddressY);
  
  let clientY = startAddressY + 5;
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.text(data.to.name || '', margin, clientY);
  clientY += 5;

  if (data.to.address) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLOR_TEXT_MUTED);
      const addressLines = doc.splitTextToSize(data.to.address, 80);
      doc.text(addressLines, margin, clientY);
      clientY += (addressLines.length * 4.5);
  } else {
    clientY += 2; 
  }

  if (data.to.email) {
      doc.setFontSize(9);
      doc.setTextColor(COLOR_TEXT_MUTED);
      doc.text(`Email: ${data.to.email}`, margin, clientY);
      clientY += 5;
  }
  
  yPos = clientY + 10;

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
    headStyles: { fillColor: isQuote ? '#805AD5' : COLOR_PRIMARY, textColor: '#FFFFFF', fontStyle: 'bold' },
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
  
  let leftY = finalY;

  // NOTES / TERMS
  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(COLOR_TEXT_MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text(termsLabel, leftColX, leftY);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(data.notes, 90); 
    doc.text(noteLines, leftColX, leftY + 5);
    leftY += 10 + (noteLines.length * 4);
  }

  // BANK DETAILS
  if (!isQuote && data.payment && (data.payment.bankName || data.payment.accNumber)) {
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

  // Subtotal
  const subtotalStr = formatCurrency(data.subtotal, CURRENCY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MAIN);
  const subWidth = doc.getTextWidth(subtotalStr);
  doc.text(subtotalStr, rightColX, rightY, { align: 'right' });
  doc.setTextColor(COLOR_TEXT_MUTED);
  doc.text('Subtotal:', rightColX - subWidth - 5, rightY, { align: 'right' });

  // VAT
  if (data.vatRate && data.vatRate > 0) {
    rightY += 6;
    const vatStr = formatCurrency(data.vatAmount, CURRENCY);
    doc.setTextColor(COLOR_TEXT_MAIN);
    const vatWidth = doc.getTextWidth(vatStr);
    doc.text(vatStr, rightColX, rightY, { align: 'right' });
    doc.setTextColor(COLOR_TEXT_MUTED);
    doc.text(`VAT (${data.vatRate}%):`, rightColX - vatWidth - 5, rightY, { align: 'right' });
  }

  // Total
  rightY += 10;
  const totalStr = formatCurrency(data.total, CURRENCY);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const totalWidth = doc.getTextWidth(totalStr);
  doc.setTextColor(isQuote ? '#805AD5' : COLOR_PRIMARY);
  doc.text(totalStr, rightColX, rightY, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(COLOR_TEXT_MAIN);
  doc.text(totalLabel, rightColX - totalWidth - 6, rightY, { align: 'right' });

  if(data.dueDate) {
     rightY += 6;
     doc.setFontSize(9);
     doc.setTextColor(COLOR_TEXT_MUTED);
     doc.setFont('helvetica', 'normal');
     doc.text(`${dueLabel} ${formatDate(data.dueDate)}`, rightColX, rightY, { align: 'right' });
  }

  // QR CODE & PAYMENT LINK
  if (!isQuote && data.paymentLink) {
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

  // 🟢 NEW FOOTER TEXT WITH ONLINE PAYMENT MENTION
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED);
  
  // Left side info
  if(!isQuote) {
     // 🟢 COPY UPDATE: PDF Footer
     doc.text("Secure online payment available via digital invoice link.", margin + 25, footerY, { align: 'left' });
  }

  // Right side branding
  doc.text("Sent with QuotePilot", pageWidth - margin, footerY, { align: 'right' });

  return doc.output('blob');
};