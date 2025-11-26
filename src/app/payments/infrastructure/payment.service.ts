import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaymentEntity } from '../domain/model/payment.entity';
import { PaymentResource } from './payment.resource';
import { PaymentAssembler } from './payment.assembler';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly paymentsUrl = `${environment.apiBaseUrl}${environment.paymentsEndpointPath}`;

  /**
   * Crea un nuevo pago
   */
  createPayment(payment: Omit<PaymentEntity, 'id' | 'createdAt'>): Observable<PaymentEntity> {
    const resource: Omit<PaymentResource, 'id' | 'createdAt'> = {
      subscriptionId: payment.subscriptionId,
      payerType: payment.payerType,
      payerId: payment.payerId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status || 'pending',
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      updatedAt: new Date().toISOString()
    };

    return this.getNextId('payments').pipe(
      switchMap(nextId => {
        return this.http.post<PaymentResource>(this.paymentsUrl, {
          ...resource,
          id: nextId,
          createdAt: new Date().toISOString()
        }).pipe(
          map(res => PaymentAssembler.toDomain(res)),
          catchError(error => {
            console.error('❌ Error creating payment:', error);
            throw error;
          })
        );
      })
    );
  }

  /**
   * Obtiene un pago por ID
   */
  getPaymentById(id: number): Observable<PaymentEntity | null> {
    return this.http.get<PaymentResource>(`${this.paymentsUrl}/${id}`).pipe(
      map(res => PaymentAssembler.toDomain(res)),
      catchError(error => {
        console.error(`❌ Error fetching payment ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene todos los pagos de una suscripción
   */
  getPaymentsBySubscription(subscriptionId: number): Observable<PaymentEntity[]> {
    return this.http.get<PaymentResource[]>(`${this.paymentsUrl}?subscriptionId=${subscriptionId}`).pipe(
      map(resources => resources.map(r => PaymentAssembler.toDomain(r))),
      catchError(error => {
        console.error(`❌ Error fetching payments for subscription ${subscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualiza el estado de un pago
   */
  updatePaymentStatus(id: number, status: PaymentEntity['status'], stripePaymentIntentId?: string): Observable<PaymentEntity> {
    const updates: Partial<PaymentResource> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }

    return this.http.patch<PaymentResource>(`${this.paymentsUrl}/${id}`, updates).pipe(
      map(res => PaymentAssembler.toDomain(res)),
      catchError(error => {
        console.error(`❌ Error updating payment ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el siguiente ID secuencial para una colección
   */
  private getNextId(collection: string): Observable<number> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/${collection}?_sort=id&_order=desc&_limit=1`).pipe(
      map(items => {
        if (items && items.length > 0) {
          const maxId = Number(items[0].id);
          return Number.isNaN(maxId) ? 1 : maxId + 1;
        }
        return 1;
      }),
      catchError(() => of(1))
    );
  }
}
