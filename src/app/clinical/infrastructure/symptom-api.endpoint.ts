import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Symptom } from '../domain/model/symptom.entity';
import { SymptomResource } from './symptom.resource';
import { SymptomAssembler } from './symptom.assembler';
import { environment } from '../../../environments/environment';

/**
 * Symptom API Endpoint - Servicio para comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class SymptomApiEndpoint extends BaseApiEndpoint<Symptom, SymptomResource, BaseResponse, SymptomAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.symptomsEndpointPath}`, new SymptomAssembler());
  }
}
