import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadApi {
  upload(file: File): Observable<{ id: string; url: string; name: string; type: string }> {
    // Simulación de subida de archivo
    return of({
      id: 'mock-id',
      url: 'https://mock.url/' + file.name,
      name: file.name,
      type: file.type
    });
  }
}

