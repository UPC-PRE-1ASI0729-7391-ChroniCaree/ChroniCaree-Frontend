import {BaseEntity} from './base-entity';
import {BaseResource, BaseResponse} from './base-response';
import {BaseAssembler} from './base-assembler';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
import { environment } from '../../../environments/environment';

export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>> {

  constructor(
    protected http: HttpClient,
    protected endpointUrl: string,
    protected assembler: TAssembler
  ) {
  }

  /**
   * Retrieves all entities from the API
   * @returns An Observable for an array of entities
   */
  getAll(): Observable<TEntity[]> {
    return this.http.get<TResponse | TResource[]>(this.endpointUrl).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(resource => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response as TResponse);
      }),
      catchError(this.handleError('Failed to fetch entities'))
    );
  }

  /**
   * Retrieves a single entity by ID
   * @param id The ID of the entity
   * @returns An Observable of the entity
   */
  getById(id: number): Observable<TEntity>{
    return  this.http.get<TResource>(`${this.endpointUrl}/${id}`).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch entities'))
    );
  }

  /**
   * Create a new entity
   * @param entity - The entity to create
   * @returns An Observable of the created entity
   */
  create(entity: TEntity):Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return  this.http.post<TResource>(this.endpointUrl, resource).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity'))
    );
  }

  /**
   * Updates an existing entity
   * @param entity - The entity to update
   * @param id - The ID of the entity
   * @returns An observable of the updated entity
   */
  update(entity: TEntity, id: number): Observable<TEntity>{
    const resource = this.assembler.toResourceFromEntity(entity);
    const resourceUrl = `${this.endpointUrl}/${id}`;
    return this.putWithFallback<TResource>(resourceUrl, resource).pipe(
      map(updated => this.assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to updated entity'))
    )
  }

  /**
   * Deletes an entity by ID
   * @param id - The ID  of the entity to delete
   * @returns An Observable of void
   */
  delete( id: number): Observable<void>{
    return  this.http.delete<void>(`${this.endpointUrl}/${id}`).pipe(
      catchError(this.handleError('Failed to delete entity'))
    )
  }

  protected handleError(operation: string){
    return (error: HttpErrorResponse) : Observable<never> => {
      let errorMessage = `${operation}`;

      // If server returned a body with message, prefer that
      try {
        if (error?.error) {
          if (typeof error.error === 'string') {
            // sometimes backend returns plain text
            errorMessage = `${operation}: ${error.error}`;
          } else if (typeof error.error === 'object' && error.error.message) {
            errorMessage = `${operation}: ${error.error.message}`;
          }
        }
      } catch (e) {
        // ignore parse errors
      }

      if (!errorMessage || errorMessage === `${operation}`) {
        if (error.status === 404) {
          errorMessage = `${operation}: Resource not found (404).`;
        } else if (error.error instanceof ErrorEvent) {
          errorMessage = `${operation}: ${error.error.message}.`;
        } else {
          const statusText = error.statusText || 'Unexpected error';
          errorMessage = `${operation}: ${error.status} ${statusText}`;
        }
      }

      console.error(`🔴 [BaseApiEndpoint] ${operation} failed:`, {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        body: error.error,
      });

      return throwError(() => new Error(errorMessage));
    };
  }

  /**
   * PUT helper that tries an alternate base URL when the primary fails (network errors or 5xx).
   * This mirrors the fallback behavior used elsewhere for GET/POST in the codebase.
   */
  private putWithFallback<T>(resourceUrl: string, body: any, options?: any): Observable<T> {
    const primaryCall = this.http.put<T>(resourceUrl, body, options as any) as Observable<T>;
    return primaryCall.pipe(
      catchError(err => {
        const fallbackBaseUrl = (environment as any).apiBaseUrlFallback;
        // If network-level error or 5xx and fallback is configured, attempt once
        if ((!err?.status || err.status === 0 || (err?.status && err.status >= 500)) && fallbackBaseUrl) {
          try {
            let fallbackUrl = resourceUrl;
            if (resourceUrl.startsWith(environment.apiBaseUrl)) {
              fallbackUrl = resourceUrl.replace(environment.apiBaseUrl, fallbackBaseUrl);
            } else if (!resourceUrl.startsWith('http')) {
              // relative path, prefix with fallback
              fallbackUrl = `${fallbackBaseUrl}${resourceUrl.startsWith('/') ? '' : '/'}${resourceUrl}`;
            } else {
              // resourceUrl is absolute but not matching primary base; attempt prefixing
              fallbackUrl = `${fallbackBaseUrl}${resourceUrl}`;
            }
            console.warn('⚠️ [BaseApiEndpoint] Primary PUT failed, attempting fallback PUT:', fallbackUrl);
            return this.http.put<T>(fallbackUrl, body, options as any) as Observable<T>;
          } catch (e) {
            // fall through to rethrow original error
          }
        }
        return throwError(() => err);
      })
    );
  }

}
