import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from './base-api-endpoint';
import { BaseResponse } from './base-response';
import { Nudge } from '../domain/model/nudge.entity';
import { NudgeResource } from './nudge.resource';
import { NudgeAssembler } from './nudge.assembler';
import { environment } from '../../../environments/environment';

/**
 * Nudge API Endpoint - Servicio para comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class NudgeApiEndpoint extends BaseApiEndpoint<Nudge, NudgeResource, BaseResponse, NudgeAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}/nudges`, new NudgeAssembler());
  }
}
