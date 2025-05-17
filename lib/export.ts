import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(columns: string[], data: any[][], filename: string) {
  const doc = new jsPDF();
  doc.autoTable({
    head: [columns],
    body: data,
  });
  doc.save(filename);
}
