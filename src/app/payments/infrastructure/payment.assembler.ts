/**
 * Payment Assembler
 * Payments Bounded Context - Infrastructure Layer
 * 
 * Transforms between PaymentEntity (domain) and PaymentResource (API)
 */
import { PaymentEntity } from '../domain/model/payment.entity';
import { PaymentResource } from './payment.resource';

export class PaymentAssembler {
  /**
   * Converts PaymentResource to PaymentEntity
   */
  static toDomain(resource: PaymentResource): PaymentEntity {
    return {
      id: resource.id,
      subscriptionId: resource.subscriptionId,
      payerType: resource.payerType,
      payerId: resource.payerId,
      amount: resource.amount,
      currency: resource.currency,
      status: resource.status,
      paymentMethod: resource.paymentMethod,
      transactionId: resource.transactionId,
      stripePaymentIntentId: resource.stripePaymentIntentId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt
    };
  }

  /**
   * Converts PaymentEntity to PaymentResource
   */
  static toResource(entity: PaymentEntity): PaymentResource {
    return {
      id: entity.id,
      subscriptionId: entity.subscriptionId,
      payerType: entity.payerType,
      payerId: entity.payerId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      transactionId: entity.transactionId,
      stripePaymentIntentId: entity.stripePaymentIntentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}
