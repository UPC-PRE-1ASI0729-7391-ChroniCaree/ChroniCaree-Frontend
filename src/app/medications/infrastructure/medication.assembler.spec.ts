import { MedicationAssembler } from './medication.assembler';
import { MedicationResource } from './medication.resource';
import { Medication } from '../domain/model/medication.entity';

describe('MedicationAssembler', () => {
  it('should default sideEffects and contraindications to empty arrays in toCreateResource', () => {
    const med = new Medication({
      id: 0,
      patientId: 1,
      name: 'Test',
      dosage: '10mg'
    });

    // Ensure med has no explicit sideEffects/contraindications
    med.sideEffects = undefined as any;
    med.contraindications = undefined as any;

    const resource = MedicationAssembler.toCreateResource(med);
    expect(resource.sideEffects).toEqual([]);
    expect(resource.contraindications).toEqual([]);
  });

  it('should default missing sideEffects and contraindications from resource to empty arrays in toDomain', () => {
    const resource: Partial<MedicationResource> = {
      id: 1,
      patientId: 1,
      name: 'Test',
      type: 'PILL' as any,
      dosage: '10 mg',
      schedule: { frequency: 'ONCE_DAILY' as any, times: ['09:00'], startDate: new Date().toISOString() },
      prescribedBy: 'Doctor',
      prescribedDate: new Date().toISOString(),
      status: 'ACTIVE' as any,
      logs: undefined as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as MedicationResource;

    const medDomain = MedicationAssembler.toDomain(resource);
    expect(medDomain.sideEffects).toEqual([]);
    expect(medDomain.contraindications).toEqual([]);
    expect(medDomain.logs.length).toBe(0);
  });
});
