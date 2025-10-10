// src/app/shared/infrastructure/pdf-export.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;  // nombre del archivo
  margin?: number;    // margen en mm
  quality?: number;   // calidad del PNG 0..1
  scale?: number;     // resolucion
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportElementToPdf(element: HTMLElement, opts: PdfExportOptions = {}): Promise<void> {
    const filename = opts.filename ?? 'reporte.pdf';
    const margin = opts.margin ?? 10;   // mm
    const scale = opts.scale ?? 2;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png', opts.quality ?? 1.0);


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

    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH, undefined, 'FAST');
    heightLeft -= pageH;


    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - heightLeft;
      pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH, undefined, 'FAST');
      heightLeft -= pageH;
    }

    pdf.save(filename);
  }
}
