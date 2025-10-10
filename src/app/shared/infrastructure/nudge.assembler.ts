import { BaseAssembler } from './base-assembler';
import { BaseResponse } from './base-response';
import { Nudge, NudgeType, NudgePriority } from '../domain/model/nudge.entity';
import { NudgeResource } from './nudge.resource';

/**
 * Nudge Assembler - Convierte entre entidades de dominio y recursos de API
 */
export class NudgeAssembler implements BaseAssembler<Nudge, NudgeResource, BaseResponse> {
  /**
   * Convierte un recurso de API a entidad de dominio
   */
  toEntityFromResource(resource: NudgeResource): Nudge {
    return {
      id: resource.id,
      patientId: resource.patientId,
      type: resource.type as NudgeType,
      priority: resource.priority as NudgePriority,
      title: resource.title,
      message: resource.message,
      actionLabel: resource.actionLabel,
      actionRoute: resource.actionRoute,
      icon: resource.icon,
      isDismissed: resource.isDismissed,
      isSnoozed: resource.isSnoozed,
      snoozeUntil: resource.snoozeUntil,
      createdAt: resource.createdAt,
      dismissedAt: resource.dismissedAt
    };
  }

  /**
   * Convierte una entidad de dominio a recurso de API
   */
  toResourceFromEntity(entity: Nudge): NudgeResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      type: entity.type,
      priority: entity.priority,
      title: entity.title,
      message: entity.message,
      actionLabel: entity.actionLabel,
      actionRoute: entity.actionRoute,
      icon: entity.icon,
      isDismissed: entity.isDismissed,
      isSnoozed: entity.isSnoozed,
      snoozeUntil: entity.snoozeUntil,
      createdAt: entity.createdAt,
      dismissedAt: entity.dismissedAt
    };
  }

  /**
   * Convierte una respuesta de API a array de entidades
   */
  toEntitiesFromResponse(response: BaseResponse): Nudge[] {
    return (response as unknown as NudgeResource[]).map(resource => this.toEntityFromResource(resource));
  }
}
