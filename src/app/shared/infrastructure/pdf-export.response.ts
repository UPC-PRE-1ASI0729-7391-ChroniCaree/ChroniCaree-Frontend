/**
 * PDF Export Response
 * 
 * Utility class for exporting HTML elements to PDF documents.
 * Uses jsPDF and html2canvas libraries.
 * 
 * This is a Response class (not a Service) following DDD architecture.
 * It provides a static utility method for PDF generation as a presentation concern.
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;  // PDF filename
  margin?: number;    // Margin in mm
  quality?: number;   // PNG quality 0..1
  scale?: number;     // Resolution scale
}

/**
 * PDF Export Response
 * 
 * Provides static utility for converting HTML elements to PDF documents.
 * This is presentation-layer logic, not domain business logic.
 */
export class PdfExportResponse {
  /**
   * Export an HTML element to PDF
   * 
   * @param element - HTML element to export
   * @param opts - Export options (filename, margin, quality, scale)
   * @returns Promise that resolves when PDF is downloaded
   */
  static async exportElementToPdf(element: HTMLElement, opts: PdfExportOptions = {}): Promise<void> {
    const filename = opts.filename ?? 'reporte.pdf';
    const margin = opts.margin ?? 10;   // mm
    const scale = opts.scale ?? 2;

    // Convert HTML element to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png', opts.quality ?? 1.0);

    // Create PDF document
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait'
    });

    const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageH = pdf.internal.pageSize.getHeight() - margin * 2;

    const imgW = pageW;
    const imgH = (canvas.height / canvas.width) * imgW;

    let heightLeft = imgH;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH, undefined, 'FAST');
    heightLeft -= pageH;

    // Add additional pages if content is larger than one page
    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - heightLeft;
      pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH, undefined, 'FAST');
      heightLeft -= pageH;
    }

    // Download PDF
    pdf.save(filename);
  }
}
