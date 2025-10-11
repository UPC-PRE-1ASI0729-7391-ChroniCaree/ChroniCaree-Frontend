import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessagesStore } from './messages.store';
import { Message } from '../domain/model/message.entity';

describe('MessagesStore', () => {
  let store: MessagesStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MessagesStore],
    });
    store = TestBed.inject(MessagesStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loadInbox debe setear inbox signal', () => {
    store.loadInbox('PATIENT', 'P1');
    const req = http.expectOne(r =>
      r.url === '/api/messages/inbox' && r.params.get('role') === 'PATIENT' && r.params.get('userId') === 'P1'
    );
    req.flush([{ id: 'T1', patientId: 'P1', doctorId: 'D1', status: 'OPEN' }]);
    expect(store.inbox().length).toBe(1);
    expect(store.inbox()[0].id).toBe('T1');
  });

  it('openThread debe setear currentThread', () => {
    store.openThread('T1');
    const req = http.expectOne('/api/messages/threads/T1');
    req.flush({ id: 'T1', patientId: 'P1', doctorId: 'D1', status: 'OPEN', messages: [] });
    expect(store.currentThread()!.id).toBe('T1');
  });

  it('sendMessage debe subir archivos, enviar, notificar y archivar', async () => {
    // Arrange
    const file = new File(['x'], 'lab.pdf', { type: 'application/pdf' });

    // Act
    const promise = store.sendMessage({
      message: { senderRole: 'PATIENT', senderId: 'P1', receiverId: 'D1', body: 'hola' },
      files: [file]
    });

    // 1) upload
    const up = http.expectOne('/api/uploads');
    expect(up.request.method).toBe('POST');
    up.flush({ url: 'https://cdn/x', fileName: 'lab.pdf', mimeType: 'application/pdf' });

    // 2) send
    const send = http.expectOne('/api/messages');
    expect(send.request.method).toBe('POST');
    expect(send.request.body.attachments[0].url).toBe('https://cdn/x');
    send.flush({ id: 'M1', threadId: 'T1' });

    // 3) notification
    const notif = http.expectOne('/api/notifications');
    expect(notif.request.method).toBe('POST');
    notif.flush({ ok: true });

    // 4) archive
    const arch = http.expectOne('/api/medical-records/archive');
    expect(arch.request.body.kind).toBe('MESSAGE');
    arch.flush({ ok: true });

    const res = await promise;
    expect(res!.id).toBe('M1');
    expect(store.sending()).toBeFalse();
  });
});
