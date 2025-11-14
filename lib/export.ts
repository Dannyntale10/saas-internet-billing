import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

// PDF Export
export function exportToPDF(data: any[], filename: string, columns: string[]) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(16)
  doc.text(filename, 14, 20)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
  
  // Add table
  let y = 40
  const pageHeight = doc.internal.pageSize.height
  const rowHeight = 7
  const margin = 14
  
  // Headers
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  columns.forEach((col, index) => {
    doc.text(col, margin + (index * 40), y)
  })
  
  y += rowHeight
  doc.setLineWidth(0.5)
  doc.line(margin, y, 200, y)
  y += 5
  
  // Data rows
  doc.setFont(undefined, 'normal')
  data.forEach((row, rowIndex) => {
    if (y > pageHeight - 20) {
      doc.addPage()
      y = 20
    }
    
    columns.forEach((col, colIndex) => {
      const value = row[col] || ''
      doc.text(String(value).substring(0, 20), margin + (colIndex * 40), y)
    })
    
    y += rowHeight
  })
  
  doc.save(`${filename}.pdf`)
}

// Excel Export
export function exportToExcel(data: any[], filename: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// CSV Export
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Invoice PDF
export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('INVOICE', 14, 20)
  
  // Invoice details
  doc.setFontSize(10)
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 35)
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 14, 42)
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 49)
  }
  
  // Customer info
  doc.text(`Customer: ${invoice.user?.name || invoice.user?.email}`, 120, 35)
  
  // Items table
  let y = 70
  doc.setFont(undefined, 'bold')
  doc.text('Description', 14, y)
  doc.text('Amount', 160, y)
  
  y += 10
  doc.setFont(undefined, 'normal')
  doc.setLineWidth(0.5)
  doc.line(14, y, 200, y)
  y += 10
  
  doc.text('Internet Service', 14, y)
  doc.text(`${invoice.amount} ${invoice.currency}`, 160, y)
  
  y += 15
  if (invoice.taxAmount > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, 14, y)
    doc.text(`${invoice.taxAmount} ${invoice.currency}`, 160, y)
    y += 10
  }
  
  doc.setLineWidth(0.3)
  doc.line(14, y, 200, y)
  y += 10
  
  doc.setFont(undefined, 'bold')
  doc.text('Total:', 14, y)
  doc.text(`${invoice.total} ${invoice.currency}`, 160, y)
  
  // Footer
  y = 250
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for your business!', 14, y)
  
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}

