import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageComposeComponent } from './message-compose.component';
import { MessagesStore } from '../../../application/messages.store';

class StoreMock {
  sendMessage = jasmine.createSpy('sendMessage').and.returnValue(Promise.resolve({ id: 'M1', threadId: 'T1' }));
}

describe('MessageComposeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComposeComponent],
      providers: [{ provide: MessagesStore, useClass: StoreMock }, provideAnimations()]
    }).compileComponents();
  });

  it('debe crear y llamar sendMessage con body', async () => {
    const fixture = TestBed.createComponent(MessageComposeComponent);
    const comp = fixture.componentInstance as MessageComposeComponent;
    const store = TestBed.inject(MessagesStore) as unknown as StoreMock;

  comp.subject.set('Asunto x');
  comp.body.set('Contenido');
    await comp.send();

    expect(store.sendMessage).toHaveBeenCalled();
    const arg = (store.sendMessage.calls.mostRecent().args[0]);
    expect(arg.message.senderRole).toBe('PATIENT');
    // en nuestra implementación unifica subject+body en body si subject no existe en dominio:
    expect(arg.message.body).toContain('Contenido');

  // reseteo del formulario
  expect(comp.subject()).toBe('');
  expect(comp.body()).toBe('');
  });
});
