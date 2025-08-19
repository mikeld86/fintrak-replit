import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialRow } from '@shared/schema';
import { formatCurrency } from './utils';

export interface ExportData {
  cashOnHand: number;
  bankAccountRows: FinancialRow[];
  week1IncomeRows: FinancialRow[];
  week1ExpenseRows: FinancialRow[];
  week2IncomeRows: FinancialRow[];
  week2ExpenseRows: FinancialRow[];
  week1Balance: number;
  week2Balance: number;
  totalBankBalance: number;
}

export const exportToExcel = (data: ExportData) => {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Financial Position Summary', ''],
    ['', ''],
    ['Cash on Hand', formatCurrency(data.cashOnHand)],
    ['Total Bank Balance', formatCurrency(data.totalBankBalance)],
    ['Week 1 Balance', formatCurrency(data.week1Balance)],
    ['Week 2 Balance', formatCurrency(data.week2Balance)],
    ['', ''],
    ['Generated on', new Date().toLocaleDateString()],
  ];
  
  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summaryWS['!cols'] = [
    { width: 20 },
    { width: 15 }
  ];
  
  // Style the header
  summaryWS['A1'] = { 
    v: 'Financial Position Summary', 
    s: { 
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    }
  };
  
  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
  
  // Bank Accounts sheet
  if (data.bankAccountRows.length > 0) {
    const bankData = [
      ['Bank Accounts', ''],
      ['Account Name', 'Balance'],
      ...data.bankAccountRows.map(row => [row.label, formatCurrency(row.amount)]),
      ['', ''],
      ['Total Bank Balance', formatCurrency(data.totalBankBalance)]
    ];
    
    const bankWS = XLSX.utils.aoa_to_sheet(bankData);
    bankWS['!cols'] = [{ width: 25 }, { width: 15 }];
    XLSX.utils.book_append_sheet(workbook, bankWS, 'Bank Accounts');
  }
  
  // Week 1 sheet
  const week1Data = [
    ['Week 1 Financial Data', '', ''],
    ['', '', ''],
    ['INCOME', '', ''],
    ['Description', 'Amount', ''],
    ...data.week1IncomeRows.map(row => [row.label, formatCurrency(row.amount), '']),
    ['Total Income', formatCurrency(data.week1IncomeRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['', '', ''],
    ['EXPENSES', '', ''],
    ['Description', 'Amount', ''],
    ...data.week1ExpenseRows.map(row => [row.label, formatCurrency(row.amount), '']),
    ['Total Expenses', formatCurrency(data.week1ExpenseRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['', '', ''],
    ['CALCULATION', '', ''],
    ['Cash on Hand', formatCurrency(data.cashOnHand), ''],
    ['Bank Accounts', formatCurrency(data.totalBankBalance), ''],
    ['Income', formatCurrency(data.week1IncomeRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['Expenses', `-${formatCurrency(data.week1ExpenseRows.reduce((sum, row) => sum + row.amount, 0)).replace('$', '')}`, ''],
    ['Week 1 Balance', formatCurrency(data.week1Balance), '']
  ];
  
  const week1WS = XLSX.utils.aoa_to_sheet(week1Data);
  week1WS['!cols'] = [{ width: 25 }, { width: 15 }, { width: 10 }];
  XLSX.utils.book_append_sheet(workbook, week1WS, 'Week 1');
  
  // Week 2 sheet
  const week2Data = [
    ['Week 2 Financial Data', '', ''],
    ['', '', ''],
    ['INCOME', '', ''],
    ['Description', 'Amount', ''],
    ...data.week2IncomeRows.map(row => [row.label, formatCurrency(row.amount), '']),
    ['Total Income', formatCurrency(data.week2IncomeRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['', '', ''],
    ['EXPENSES', '', ''],
    ['Description', 'Amount', ''],
    ...data.week2ExpenseRows.map(row => [row.label, formatCurrency(row.amount), '']),
    ['Total Expenses', formatCurrency(data.week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['', '', ''],
    ['CALCULATION', '', ''],
    ['Starting Balance (Week 1)', formatCurrency(data.week1Balance), ''],
    ['Income', formatCurrency(data.week2IncomeRows.reduce((sum, row) => sum + row.amount, 0)), ''],
    ['Expenses', `-${formatCurrency(data.week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0)).replace('$', '')}`, ''],
    ['Week 2 Balance', formatCurrency(data.week2Balance), '']
  ];
  
  const week2WS = XLSX.utils.aoa_to_sheet(week2Data);
  week2WS['!cols'] = [{ width: 25 }, { width: 15 }, { width: 10 }];
  XLSX.utils.book_append_sheet(workbook, week2WS, 'Week 2');
  
  // Generate and download the file
  const fileName = `financial-position-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Position Report', pageWidth / 2, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
  
  let yPosition = 50;
  
  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 20, yPosition);
  yPosition += 10;
  
  const summaryData = [
    ['Cash on Hand', formatCurrency(data.cashOnHand)],
    ['Total Bank Balance', formatCurrency(data.totalBankBalance)],
    ['Week 1 Balance', formatCurrency(data.week1Balance)],
    ['Week 2 Balance', formatCurrency(data.week2Balance)]
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Amount']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { left: 20, right: 20 }
  });
  
  yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 60;
  
  // Bank Accounts Section
  if (data.bankAccountRows.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Accounts', 20, yPosition);
    yPosition += 10;
    
    const bankData = data.bankAccountRows.map(row => [row.label, formatCurrency(row.amount)]);
    bankData.push(['Total', formatCurrency(data.totalBankBalance)]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Account', 'Balance']],
      body: bankData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 60;
  }
  
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Week 1 Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Week 1 Details', 20, yPosition);
  yPosition += 10;
  
  // Week 1 Income
  if (data.week1IncomeRows.length > 0) {
    doc.setFontSize(12);
    doc.text('Income', 20, yPosition);
    yPosition += 5;
    
    const week1IncomeData = data.week1IncomeRows.map(row => [row.label, formatCurrency(row.amount)]);
    week1IncomeData.push(['Total Income', formatCurrency(data.week1IncomeRows.reduce((sum, row) => sum + row.amount, 0))]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Amount']],
      body: week1IncomeData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;
  }
  
  // Week 1 Expenses
  if (data.week1ExpenseRows.length > 0) {
    doc.setFontSize(12);
    doc.text('Expenses', 20, yPosition);
    yPosition += 5;
    
    const week1ExpenseData = data.week1ExpenseRows.map(row => [row.label, formatCurrency(row.amount)]);
    week1ExpenseData.push(['Total Expenses', formatCurrency(data.week1ExpenseRows.reduce((sum, row) => sum + row.amount, 0))]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Amount']],
      body: week1ExpenseData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 50;
  }
  
  // Check if we need a new page for Week 2
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Week 2 Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Week 2 Details', 20, yPosition);
  yPosition += 10;
  
  // Week 2 Income
  if (data.week2IncomeRows.length > 0) {
    doc.setFontSize(12);
    doc.text('Income', 20, yPosition);
    yPosition += 5;
    
    const week2IncomeData = data.week2IncomeRows.map(row => [row.label, formatCurrency(row.amount)]);
    week2IncomeData.push(['Total Income', formatCurrency(data.week2IncomeRows.reduce((sum, row) => sum + row.amount, 0))]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Amount']],
      body: week2IncomeData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;
  }
  
  // Week 2 Expenses
  if (data.week2ExpenseRows.length > 0) {
    doc.setFontSize(12);
    doc.text('Expenses', 20, yPosition);
    yPosition += 5;
    
    const week2ExpenseData = data.week2ExpenseRows.map(row => [row.label, formatCurrency(row.amount)]);
    week2ExpenseData.push(['Total Expenses', formatCurrency(data.week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0))]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Amount']],
      body: week2ExpenseData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      margin: { left: 20, right: 20 }
    });
  }
  
  // Generate and download the file
  const fileName = `financial-position-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};