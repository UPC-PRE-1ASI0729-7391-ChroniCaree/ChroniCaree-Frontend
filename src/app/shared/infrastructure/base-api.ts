import { environment } from '../../../environments/environment';

/**
 * Abstract base class for API endpoints.
 * Provides centralized API base URL configuration from environment.
 * All endpoint classes should extend this to inherit the base URL.
 */
export abstract class BaseApi {
  /**
   * Base URL for all API calls.
   * Configured from environment file (e.g., 'http://localhost:3000/api/v1')
   */
  protected readonly baseUrl: string = environment.apiBaseUrl;
}
