// @ts-nocheck
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TicketExportData {
  ticketNumber: string;
  activityName: string;
  assignmentLetterNumber: string;
  startDate: string;
  isLs: boolean;
  currentStep: number;
  status: string;
  currentPIC?: string;
  currentRole?: string;
}

export const exportToExcel = (data: TicketExportData[], filename: string) => {
  // Prepare data for Excel
  const excelData = data.map((ticket) => ({
    'No. Tiket': ticket.ticketNumber,
    'Kegiatan': ticket.activityName,
    'No. Surat Tugas': ticket.assignmentLetterNumber,
    'Tanggal Penerimaan Berkas': new Date(ticket.startDate).toLocaleDateString('id-ID'),
    'Jenis': ticket.isLs ? 'LS' : 'Non-LS',
    'Step Saat Ini': ticket.currentStep,
    'Role PIC': ticket.currentRole || '-',
    'Nama PIC': ticket.currentPIC || '-',
    'Status': ticket.status === 'ACTIVE' ? 'Aktif' : ticket.status === 'COMPLETED' ? 'Selesai' : ticket.status,
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Style header row (row 1)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "475569" } }, // slate-600
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // No. Tiket
    { wch: 40 }, // Kegiatan
    { wch: 25 }, // No. Surat Tugas
    { wch: 20 }, // Tanggal
    { wch: 10 }, // Jenis
    { wch: 12 }, // Step
    { wch: 25 }, // Role PIC
    { wch: 25 }, // Nama PIC
    { wch: 12 }, // Status
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data PD');

  // Generate Excel file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data: TicketExportData[], filename: string, title: string) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4 size

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  // Prepare table data
  const tableData = data.map((ticket) => [
    ticket.ticketNumber,
    ticket.activityName.length > 40 ? ticket.activityName.substring(0, 37) + '...' : ticket.activityName,
    ticket.assignmentLetterNumber,
    new Date(ticket.startDate).toLocaleDateString('id-ID'),
    ticket.isLs ? 'LS' : 'Non-LS',
    ticket.currentStep.toString(),
    ticket.currentRole || '-',
    ticket.currentPIC || '-',
    ticket.status === 'ACTIVE' ? 'Aktif' : ticket.status === 'COMPLETED' ? 'Selesai' : ticket.status,
  ]);

  // Generate table
  autoTable(doc, {
    head: [[
      'No. Tiket',
      'Kegiatan',
      'No. Surat Tugas',
      'Tgl. Penerimaan',
      'Jenis',
      'Step',
      'Role PIC',
      'Nama PIC',
      'Status',
    ]],
    body: tableData,
    startY: 28,
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [71, 85, 105], // slate-600
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [226, 232, 240] // slate-200 - lebih gelap untuk kontras yang jelas
    },
    rowStyles: {
      fillColor: [255, 255, 255] // putih untuk baris ganjil
    },
    columnStyles: {
      0: { cellWidth: 25 }, // No. Tiket
      1: { cellWidth: 60 }, // Kegiatan
      2: { cellWidth: 35 }, // No. Surat Tugas
      3: { cellWidth: 25 }, // Tanggal
      4: { cellWidth: 15 }, // Jenis
      5: { cellWidth: 12 }, // Step
      6: { cellWidth: 35 }, // Role PIC
      7: { cellWidth: 35 }, // Nama PIC
      8: { cellWidth: 18 }, // Status
    },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};

// Export functions for Archive (without PIC columns)
export const exportArchiveToExcel = (data: TicketExportData[], filename: string) => {
  // Prepare data for Excel (without PIC columns)
  const excelData = data.map((ticket) => ({
    'No. Tiket': ticket.ticketNumber,
    'Kegiatan': ticket.activityName,
    'No. Surat Tugas': ticket.assignmentLetterNumber,
    'Tanggal Penerimaan Berkas': new Date(ticket.startDate).toLocaleDateString('id-ID'),
    'Jenis': ticket.isLs ? 'LS' : 'Non-LS',
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Style header row (row 1)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "475569" } }, // slate-600
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // No. Tiket
    { wch: 50 }, // Kegiatan
    { wch: 30 }, // No. Surat Tugas
    { wch: 25 }, // Tanggal
    { wch: 12 }, // Jenis
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Arsip PD');

  // Generate Excel file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportArchiveToPDF = (data: TicketExportData[], filename: string, title: string) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4 size

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  // Prepare table data (without PIC columns)
  const tableData = data.map((ticket) => [
    ticket.ticketNumber,
    ticket.activityName.length > 50 ? ticket.activityName.substring(0, 47) + '...' : ticket.activityName,
    ticket.assignmentLetterNumber,
    new Date(ticket.startDate).toLocaleDateString('id-ID'),
    ticket.isLs ? 'LS' : 'Non-LS',
  ]);

  // Generate table
  autoTable(doc, {
    head: [[
      'No. Tiket',
      'Kegiatan',
      'No. Surat Tugas',
      'Tanggal Penerimaan Berkas',
      'Jenis',
    ]],
    body: tableData,
    startY: 28,
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [71, 85, 105], // slate-600
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [226, 232, 240] // slate-200 - lebih gelap untuk kontras yang jelas
    },
    rowStyles: {
      fillColor: [255, 255, 255] // putih untuk baris ganjil
    },
    columnStyles: {
      0: { cellWidth: 30 }, // No. Tiket
      1: { cellWidth: 110 }, // Kegiatan
      2: { cellWidth: 50 }, // No. Surat Tugas
      3: { cellWidth: 40 }, // Tanggal
      4: { cellWidth: 20 }, // Jenis
    },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};
