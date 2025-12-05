import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Doctor } from '../domain/model/doctor.entity';
import { DoctorResource } from './doctor.resource';
import { DoctorAssembler } from './doctor.assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorApiEndpoint extends BaseApiEndpoint<Doctor, DoctorResource, BaseResponse, DoctorAssembler> {
  private readonly doctorUrl = `${environment.apiBaseUrl}${environment.doctorsEndpointPath}`;
  
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.doctorsEndpointPath}`, new DoctorAssembler());
    console.log('👨‍⚕️ [DoctorAPI] Endpoint initialized:', this.doctorUrl);
  }

  /**
   * Obtener doctores por tenant ID
   * Backend endpoint: GET /doctors/by-tenant/{tenantId}
   */
  getByTenantId(tenantId: number): Observable<Doctor[]> {
    const url = `${this.doctorUrl}/by-tenant/${tenantId}`;
    console.log('🌐 [DoctorAPI] GET by tenant:', url);
    
    return this.http.get<DoctorResource[]>(url).pipe(
      map(resources => resources.map(r => this.assembler.toEntityFromResource(r))),
      tap({
        next: (doctors) => {
          console.log('✅ [DoctorAPI] Doctors by tenant found:', doctors.length);
        },
        error: (error) => {
          console.error('❌ [DoctorAPI] Get by tenant failed:', error);
        }
      })
    );
  }
}
