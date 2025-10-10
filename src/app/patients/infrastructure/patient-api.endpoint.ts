import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Patient } from '../domain/model/patient.entity';
import { PatientResource } from './patient.resource';
import { PatientAssembler } from './patient.assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientApiEndpoint extends BaseApiEndpoint<Patient, PatientResource, BaseResponse, PatientAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}/patients`, new PatientAssembler());
  }
}
