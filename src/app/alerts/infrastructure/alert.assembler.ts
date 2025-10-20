import { Alert } from '../domain/model/alert.entity';
import { AlertResource } from './alert.resource';

/**
 * AlertAssembler - Convierte entre entidades Alert y recursos AlertResource
 */
export class AlertAssembler {
  
  /**
   * Convierte un recurso AlertResource en una entidad Alert
   */
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

  /**
   * Convierte una entidad Alert en un recurso AlertResource
   */
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

  /**
   * Convierte un arreglo de recursos AlertResource en un arreglo de entidades Alert
   */
  static toEntityArray(resources: AlertResource[]): Alert[] {
    return resources.map(resource => this.toEntity(resource));
  }

  /**
   * Convierte un arreglo de entidades Alert en un arreglo de recursos AlertResource
   */
  static toResourceArray(entities: Alert[]): AlertResource[] {
    return entities.map(entity => this.toResource(entity));
  }
}
