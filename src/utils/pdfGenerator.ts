// /src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceFormData } from '../types/invoice'; // Ensure this path is correct

// Define a more complete type for the PDF data, extending the form data
interface PdfData extends InvoiceFormData {
  subtotal: number;
  vatAmount: number;
  total: number;
}

// Helper function to format dates nicely for a South African audience
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // Using en-ZA locale ensures DD/MM/YYYY format which is common
  return date.toLocaleDateString('en-ZA', { timeZone: 'UTC' }); 
};

export const generatePdf = (data: PdfData) => {
  const doc = new jsPDF();
  const docWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const brandColor = '#007acc'; // Your "Coderon Blue"

  // --- 1. HEADER SECTION ---
  doc.setFillColor(brandColor);
  doc.rect(0, 0, docWidth, 25, 'F'); // Blue header bar
  
  if (data.logo) {
    try {
      const imgProps = doc.getImageProperties(data.logo);
      const logoWidth = 35;
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
      doc.addImage(data.logo, 'PNG', margin, 12.5 - (logoHeight / 2), logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  }

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF'); // White text on blue bar
  doc.text(data.documentType.toUpperCase(), docWidth - margin, 17, { align: 'right' });

  // --- 2. FROM & TO SECTION ---
  let yPos = 40;
  doc.setFontSize(9);
  doc.setTextColor('#888888'); // Light grey for labels
  doc.text('FROM', margin, yPos);
  doc.text('TO', docWidth / 2, yPos);

  doc.setDrawColor('#DDDDDD'); // Light line separator
  doc.line(margin, yPos + 3, docWidth - margin, yPos + 3);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text(data.from.name, margin, yPos);
  doc.text(data.to.name, docWidth / 2, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(data.from.address, margin, yPos);
  doc.text(data.to.address, docWidth / 2, yPos);
  yPos += 5;
  doc.text(data.from.email || '', margin, yPos);
  doc.text(data.to.email || '', docWidth / 2, yPos);

  // --- 3. DOCUMENT DETAILS SECTION ---
  yPos += 15;
  doc.setFillColor('#F5F5F5'); // Light grey background for this box
  
  // Smart differentiation: Only show Due Date for Invoices
  const detailsHeight = data.documentType === 'Invoice' ? 20 : 13;
  doc.roundedRect(docWidth - margin - 60, yPos - 5, 60, detailsHeight, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor('#555555');
  doc.text(`${data.documentType} #:`, docWidth - margin - 55, yPos);
  doc.text('Date:', docWidth - margin - 55, yPos + 7);
  if (data.documentType === 'Invoice') {
    doc.text('Due Date:', docWidth - margin - 55, yPos + 14);
  }

  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text(data.invoiceNumber, docWidth - margin, yPos, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatDisplayDate(data.invoiceDate), docWidth - margin, yPos + 7, { align: 'right' });
  if (data.documentType === 'Invoice') {
    doc.text(formatDisplayDate(data.dueDate), docWidth - margin, yPos + 14, { align: 'right' });
  }

  // --- 4. LINE ITEMS TABLE ---
  const tableColumns = ["Description", "Qty", "Unit Price", "Total"];
  const tableRows = data.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    `R ${item.unitPrice.toFixed(2)}`,
    `R ${(item.quantity * item.unitPrice).toFixed(2)}`
  ]);

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: yPos + 25,
    theme: 'striped',
    headStyles: { fillColor: brandColor, textColor: '#FFFFFF', fontStyle: 'bold' },
    styles: { cellPadding: 3, fontSize: 10 },
    margin: { left: margin, right: margin },
  });

  // --- 5. TOTALS & NOTES SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const totalsX = docWidth - margin - 70;
  let notesY = finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor('#000000');

  // Display notes on the left side
  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, notesY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, docWidth / 2 - margin * 2);
    doc.text(splitNotes, margin, notesY + 5);
  }

  // Display totals on the right side
  doc.text('Subtotal:', totalsX, finalY + 10);
  doc.text(`R ${data.subtotal.toFixed(2)}`, docWidth - margin, finalY + 10, { align: 'right' });

  doc.text(`VAT (${data.vatRate}%):`, totalsX, finalY + 17);
  doc.text(`R ${data.vatAmount.toFixed(2)}`, docWidth - margin, finalY + 17, { align: 'right' });

  doc.setDrawColor('#333333');
  doc.line(totalsX - 5, finalY + 22, docWidth - margin, finalY + 22);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, finalY + 28);
  doc.text(`R ${data.total.toFixed(2)}`, docWidth - margin, finalY + 28, { align: 'right' });


  // --- 6. FOOTER / BANK DETAILS ---
  const footerY = pageHeight - 35;
  doc.setDrawColor('#DDDDDD');
  doc.line(margin, footerY, docWidth - margin, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details:', margin, footerY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Bank: ${data.payment.bankName || 'N/A'} | ` +
    `Account Holder: ${data.payment.accountHolder || 'N/A'} | ` +
    `Account Number: ${data.payment.accNumber || 'N/A'}`,
    margin, footerY + 14
  );

  doc.setFontSize(8);
  doc.setTextColor('#888888');
  doc.text('Thank you for your business!', docWidth / 2, pageHeight - 10, { align: 'center' });

  // --- Save the PDF ---
  const fileName = `${data.documentType}-${data.invoiceNumber}.pdf`;
  doc.save(fileName);
};