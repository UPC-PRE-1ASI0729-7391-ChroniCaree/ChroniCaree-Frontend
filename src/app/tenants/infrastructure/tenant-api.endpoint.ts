import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantResource } from './tenant.resource';
import { TenantAssembler } from './tenant.assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantApiEndpoint extends BaseApiEndpoint<Tenant, TenantResource, BaseResponse, TenantAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}/tenants`, new TenantAssembler());
  }
}
