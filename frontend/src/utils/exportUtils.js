import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from './dateUtils';

/**
 * Export data to an Excel (.xlsx) file
 * @param {Array<Object>} rows - Array of objects representing rows
 * @param {String} fileName - Desired file name without extension
 * @param {String} sheetName - Name of the worksheet tab
 */
export const exportToExcel = (rows, fileName = 'Report', sheetName = 'Data') => {
  if (!rows || rows.length === 0) {
    alert('No data available to export');
    return;
  }

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = rows.reduce(
      (max, r) => Math.max(max, String(r[key] || '').length),
      key.length
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate date stamp
  const dateStr = formatDate(new Date()).replace(/\//g, '-');
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
};

/**
 * Export tabular data to a styled PDF file using jsPDF and jspdf-autotable
 * @param {Object} options
 * @param {String} options.title - Report title
 * @param {String} options.subtitle - Date range or filter subtitle
 * @param {Array<String>} options.headers - Array of header strings
 * @param {Array<Array<any>>} options.rows - Array of row arrays
 * @param {String} options.fileName - Output PDF filename
 * @param {Array<{label: string, value: string}>} [options.summaryCards] - Top-level metrics
 */
export const exportToPDF = ({
  title = 'KK Brothers Statement',
  subtitle = '',
  headers = [],
  rows = [],
  fileName = 'Report',
  summaryCards = [],
}) => {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 65, 'F');

  // Company Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KK BROTHERS', 40, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Hotel Staff Logistics & Catering Workforce Management System', 40, 48);

  // Report Title & Date
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth - 40, 32, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  const generatedText = `Generated: ${formatDateTime(new Date())}`;
  doc.text(generatedText, pageWidth - 40, 48, { align: 'right' });

  let currentY = 85;

  // Subtitle / Filters
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(subtitle, 40, currentY);
    currentY += 15;
  }

  // Summary Metrics Banner
  if (summaryCards && summaryCards.length > 0) {
    const cardWidth = (pageWidth - 80 - (summaryCards.length - 1) * 12) / summaryCards.length;
    summaryCards.forEach((card, index) => {
      const cardX = 40 + index * (cardWidth + 12);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(cardX, currentY, cardWidth, 42, 4, 4, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(card.label.toUpperCase(), cardX + 10, currentY + 16);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(String(card.value), cardX + 10, currentY + 34);
    });
    currentY += 55;
  }

  // Data Table
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'KK Brothers Management System • Confidential & Proprietary',
        40,
        doc.internal.pageSize.getHeight() - 20
      );
      doc.text(pageStr, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileName}_${dateStr}.pdf`);
};
