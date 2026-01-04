import jsPDF from 'jspdf';

export interface InvoicePDFData {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
}

export const generateInvoicePDF = (data: InvoicePDFData): void => {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Company Name', 105, 28, { align: 'center' });
  doc.text('Address Line 1, City, UAE', 105, 33, { align: 'center' });
  doc.text('TRN: XXXXXXXXXXXXX', 105, 38, { align: 'center' });

  // Invoice Details (Right Side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice #:', 140, 50);
  doc.text('Date:', 140, 56);
  if (data.due_date) {
    doc.text('Due Date:', 140, 62);
  }
  doc.text('Status:', 140, 68);

  doc.setFont('helvetica', 'normal');
  doc.text(data.invoice_number, 165, 50);
  doc.text(new Date(data.invoice_date).toLocaleDateString('en-GB'), 165, 56);
  if (data.due_date) {
    doc.text(new Date(data.due_date).toLocaleDateString('en-GB'), 165, 62);
  }
  doc.text(data.status.toUpperCase(), 165, 68);

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, 20, 56);
  if (data.customer_address) {
    doc.text(data.customer_address, 20, 62);
  }
  if (data.customer_email) {
    doc.text(data.customer_email, 20, 68);
  }

  // Line Items Table
  let yPos = 85;

  // Table Header
  doc.setFillColor(59, 130, 246); // Primary color
  doc.rect(20, yPos, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', 22, yPos + 5.5);
  doc.text('Qty', 130, yPos + 5.5);
  doc.text('Price', 150, yPos + 5.5);
  doc.text('Total', 175, yPos + 5.5);

  // Table Body
  yPos += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  data.items.forEach((item, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, yPos, 170, 7, 'F');
    }

    doc.text(item.description, 22, yPos + 5);
    doc.text(item.quantity.toString(), 130, yPos + 5);
    doc.text(`AED ${item.unit_price.toFixed(2)}`, 150, yPos + 5);
    doc.text(`AED ${item.line_total.toFixed(2)}`, 175, yPos + 5);

    yPos += 7;
  });

  // Totals Section
  yPos += 5;
  const totalsX = 140;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`AED ${data.subtotal.toFixed(2)}`, 175, yPos);

  yPos += 6;
  doc.text(`VAT (${data.items[0]?.tax_rate || 5}%):`, totalsX, yPos);
  doc.text(`AED ${data.tax_amount.toFixed(2)}`, 175, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`AED ${data.total_amount.toFixed(2)}`, 175, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, 270, { align: 'center' });
  doc.text('Payment Terms: Net 30 days', 105, 275, { align: 'center' });

  // Save PDF
  doc.save(`${data.invoice_number}.pdf`);
};
