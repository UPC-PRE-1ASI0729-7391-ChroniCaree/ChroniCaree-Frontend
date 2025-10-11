import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MessageThreadComponent } from './message-thread.component';
import { MessagesStore } from '../../../application/messages.store';
import { of } from 'rxjs';

class StoreMock {
  currentThread = () => null as any;
  openThread = jasmine.createSpy('openThread');
}

describe('MessageThreadComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageThreadComponent],
      providers: [
        { provide: MessagesStore, useClass: StoreMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'T1']]) } } // mock simple
        }
      ]
    }).compileComponents();
  });

  it('debe llamar openThread con el id de la ruta', () => {
    const fixture = TestBed.createComponent(MessageThreadComponent);
    fixture.detectChanges();
    const store = TestBed.inject(MessagesStore) as unknown as StoreMock;
    expect(store.openThread).toHaveBeenCalledWith('T1');
  });
});
