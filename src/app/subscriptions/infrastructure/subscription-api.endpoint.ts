/**
 * Subscription API Endpoint
 * Define las rutas del API para suscripciones
 */

import { environment } from '../../../environments/environment';

export class SubscriptionApiEndpoint {
  private static readonly BASE_URL = environment.subscriptionsEndpointPath;
  private static readonly PLANS_URL = environment.plansEndpointPath;

  static getAll(): string {
    return this.BASE_URL;
  }

  static getById(id: number): string {
    return `${this.BASE_URL}/${id}`;
  }

  static getByPayerId(payerType: 'patient' | 'tenant', payerId: number): string {
    return `${this.BASE_URL}?payerType=${payerType}&payerId=${payerId}`;
  }

  static getActiveByPayerId(payerType: 'patient' | 'tenant', payerId: number): string {
    return `${this.BASE_URL}?payerType=${payerType}&payerId=${payerId}&status=active`;
  }

  static create(): string {
    return this.BASE_URL;
  }

  static update(id: number): string {
    return `${this.BASE_URL}/${id}`;
  }

  static cancel(id: number): string {
    return `${this.BASE_URL}/${id}`;
  }

  static getSubscriptionPlans(): string {
    return this.PLANS_URL;
  }

  static getSubscriptionPlanById(planId: string): string {
    return `${this.PLANS_URL}?id=${planId}`;
  }

  static getSubscriptionPlansByType(type: 'patient' | 'tenant'): string {
    return `${this.PLANS_URL}?type=${type}`;
  }
}
