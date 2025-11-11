import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { User } from '../domain/model/user.entity';
import { UserResource } from './user.resource';
import { UserAssembler } from './user.assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiEndpoint extends BaseApiEndpoint<User, UserResource, BaseResponse, UserAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.usersEndpointPath}`, new UserAssembler());
  }
}
