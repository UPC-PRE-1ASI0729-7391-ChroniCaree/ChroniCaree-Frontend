import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}/doctors`, new DoctorAssembler());
  }
}
