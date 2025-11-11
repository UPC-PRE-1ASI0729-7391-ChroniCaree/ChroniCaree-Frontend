import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CardDetails, PaymentIntent } from '../domain/model/payment.entity';

declare const Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private readonly http = inject(HttpClient);
  private stripe: any;
  private elements: any;
  private cardElement: any;

  constructor() {
    this.initializeStripe();
  }

  initializeStripe(): void {
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe(environment.stripePublishableKey);
    } else {
      console.error('❌ Stripe.js no está cargado');
    }
  }

  /**
   * Crea un elemento de tarjeta de Stripe
   */
  createCardElement(mountElement: HTMLElement): void {
    if (!this.stripe) {
      console.error('❌ Stripe no está inicializado');
      return;
    }

    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#e63946',
          iconColor: '#e63946'
        }
      }
    });

    this.cardElement.mount(mountElement);
  }

  /**
   * Valida y crea un token de pago con Stripe
   */
  createPaymentToken(cardholderName: string): Observable<string> {
    if (!this.stripe || !this.cardElement) {
      return throwError(() => new Error('Stripe no está inicializado correctamente'));
    }

    return from(
      this.stripe.createToken(this.cardElement, {
        name: cardholderName
      })
    ).pipe(
      map((result: any) => {
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.token.id;
      }),
      catchError(error => {
        console.error('❌ Error creando token de pago:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirma un pago con Stripe Payment Intent
   */
  confirmPayment(clientSecret: string, cardholderName: string): Observable<any> {
    if (!this.stripe || !this.cardElement) {
      return throwError(() => new Error('Stripe no está inicializado correctamente'));
    }

    return from(
      this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: cardholderName
          }
        }
      })
    ).pipe(
      map((result: any) => {
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.paymentIntent;
      }),
      catchError(error => {
        console.error('❌ Error confirmando pago:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Destruye el elemento de tarjeta
   */
  destroyCardElement(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  /**
   * Obtiene el elemento de tarjeta actual
   */
  getCardElement(): any {
    return this.cardElement;
  }
}
