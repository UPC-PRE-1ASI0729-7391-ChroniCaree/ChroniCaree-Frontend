import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessagesApi } from './messages-api';
import { Message } from '../domain/model/message.entity';
import { Thread } from '../domain/model/thread.entity';

describe('MessagesApi', () => {
  let api: MessagesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MessagesApi]
    });
    api = TestBed.inject(MessagesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sendMessage debe POSTear y devolver ids', () => {
    const dummy: Message = {
      senderRole: 'PATIENT',
      senderId: 'P1',
      receiverId: 'D1',
      body: 'hola'
    };

    let res: any;
    api.sendMessage(dummy).subscribe(r => (res = r));
    const req = http.expectOne('/api/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.body).toBe('hola');

    req.flush({ id: 'M123', threadId: 'T999' });
    expect(res.id).toBe('M123');
    expect(res.threadId).toBe('T999');
  });

  it('getThread debe GET y devolver thread con mensajes', () => {
    let res!: Thread & { messages: Message[] };
    api.getThread('T1').subscribe(r => (res = r));
    const req = http.expectOne('/api/messages/threads/T1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'T1', patientId: 'P1', doctorId: 'D1', status: 'OPEN', messages: [] });
    expect(res.id).toBe('T1');
    expect(res.messages.length).toBe(0);
  });

  it('listInbox debe GET con params de rol y userId', () => {
    let res!: Thread[];
    api.listInbox('PATIENT', 'P1').subscribe(r => (res = r));
    const req = http.expectOne(r =>
      r.url === '/api/messages/inbox' && r.params.get('role') === 'PATIENT' && r.params.get('userId') === 'P1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'T1', patientId: 'P1', doctorId: 'D1', status: 'OPEN' }]);
    expect(res[0].id).toBe('T1');
  });
});
