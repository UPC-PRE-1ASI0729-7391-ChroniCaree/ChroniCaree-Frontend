import { Alert } from '../domain/model/alert.entity';
import { AlertResource } from './alert.resource';

export class AlertAssembler {
  static toEntity(resource: AlertResource): Alert {
    return new Alert(
      resource.id,
      resource.patientId,
      resource.type,
      resource.severity,
      resource.title,
      resource.message,
      resource.status,
      resource.metadata,
      resource.createdAt,
      resource.acknowledgedAt,
      resource.resolvedAt,
      resource.dismissedAt,
      resource.acknowledgedBy,
      resource.notes
    );
  }

  static toResource(entity: Alert): AlertResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      type: entity.type,
      severity: entity.severity,
      title: entity.title,
      message: entity.message,
      status: entity.status,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      acknowledgedAt: entity.acknowledgedAt,
      resolvedAt: entity.resolvedAt,
      dismissedAt: entity.dismissedAt,
      acknowledgedBy: entity.acknowledgedBy,
      notes: entity.notes
    };
  }

  static toEntityArray(resources: AlertResource[]): Alert[] {
    return resources.map(resource => this.toEntity(resource));
  }

  static toResourceArray(entities: Alert[]): AlertResource[] {
    return entities.map(entity => this.toResource(entity));
  }
}
