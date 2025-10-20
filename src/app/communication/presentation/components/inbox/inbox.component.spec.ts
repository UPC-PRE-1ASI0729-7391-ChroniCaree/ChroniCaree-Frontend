import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { InboxComponent } from './inbox.component';
import { MessagesStore } from '../../../application/messages.store';

class StoreMock {
  inbox = jasmine.createSpy('inbox').and.returnValue([{ id: 'T1', patientId: 'P1', doctorId: 'D1', status: 'OPEN' }]);
  loadInbox = jasmine.createSpy('loadInbox');
}

describe('InboxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxComponent, RouterTestingModule],
      providers: [{ provide: MessagesStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('debe cargar inbox en ngOnInit y exponer threads()', () => {
    const fixture = TestBed.createComponent(InboxComponent);
    const comp = fixture.componentInstance as InboxComponent;
    const store = TestBed.inject(MessagesStore) as unknown as StoreMock;

    fixture.detectChanges(); // dispara ngOnInit
    expect(store.loadInbox).toHaveBeenCalledWith('PATIENT', 'PATIENT-123');
    expect(comp.threads.length).toBe(1);
    expect(comp.threads[0].id).toBe('T1');
  });
});
