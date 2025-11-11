/**
 * Subscription Assembler
 * Transforma datos del API (Resource) a entidades del dominio (Entity)
 */

import { SubscriptionEntity } from '../domain/model/subscription.entity';
import { SubscriptionPlanEntity, PlanFeatures } from '../domain/model/subscription-plan.entity';
import { SubscriptionResource, SubscriptionPlanResource } from './subscription.resource';

export class SubscriptionAssembler {
  /**
   * Convierte un SubscriptionResource a SubscriptionEntity
   */
  static toEntity(resource: SubscriptionResource): SubscriptionEntity {
    return new SubscriptionEntity(
      resource.id,
      resource.payerType,
      resource.payerId,
      resource.planId,
      resource.status,
      resource.startDate,
      resource.endDate,
      resource.autoRenew,
      resource.paymentMethod,
      resource.billingEmail,
      resource.nextBillingDate,
      resource.lastPaymentDate,
      resource.lastPaymentAmount,
      resource.patientId
    );
  }

  /**
   * Convierte un SubscriptionEntity a SubscriptionResource
   */
  static toResource(entity: SubscriptionEntity): SubscriptionResource {
    return {
      id: entity.id,
      payerType: entity.payerType,
      payerId: entity.payerId,
      patientId: entity.patientId,
      planId: entity.planId,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      autoRenew: entity.autoRenew,
      paymentMethod: entity.paymentMethod,
      billingEmail: entity.billingEmail,
      nextBillingDate: entity.nextBillingDate,
      lastPaymentDate: entity.lastPaymentDate,
      lastPaymentAmount: entity.lastPaymentAmount,
    };
  }

  /**
   * Convierte un array de recursos a entidades
   */
  static toEntityList(resources: SubscriptionResource[]): SubscriptionEntity[] {
    return resources.map((resource) => this.toEntity(resource));
  }

  /**
   * Convierte un SubscriptionPlanResource a SubscriptionPlanEntity
   */
  static planToEntity(resource: SubscriptionPlanResource): SubscriptionPlanEntity {
    return new SubscriptionPlanEntity(
      resource.id,
      resource.type,
      resource.name,
      resource.price,
      resource.currency,
      resource.billingPeriod,
      resource.features as PlanFeatures
    );
  }

  /**
   * Convierte un array de planes a entidades
   */
  static planToEntityList(resources: SubscriptionPlanResource[]): SubscriptionPlanEntity[] {
    return resources.map((resource) => this.planToEntity(resource));
  }
}
