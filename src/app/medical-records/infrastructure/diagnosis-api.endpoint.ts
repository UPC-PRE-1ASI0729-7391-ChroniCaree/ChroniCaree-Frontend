import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Diagnosis } from '../domain/model/diagnosis.entity';
import { DiagnosisResource } from './diagnosis.resource';
import { DiagnosisAssembler } from './diagnosis.assembler';
import { environment } from '../../../environments/environment';

/**
 * Diagnosis API Endpoint - Servicio para comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosisApiEndpoint extends BaseApiEndpoint<Diagnosis, DiagnosisResource, BaseResponse, DiagnosisAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}/diagnoses`, new DiagnosisAssembler());
  }
}
