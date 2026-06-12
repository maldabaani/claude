import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:helpdesk_mobile/core/api/api_client.dart';
import 'package:helpdesk_mobile/core/services/ticket_service.dart';
import 'package:helpdesk_mobile/core/models/ticket_model.dart';

import 'ticket_service_test.mocks.dart';

@GenerateMocks([ApiClient])
void main() {
  late MockApiClient mockApi;
  late TicketService service;

  // Helper to build a fake Response from Dio
  Response<dynamic> fakeResponse(Map<String, dynamic> data) {
    return Response(
      data: data,
      statusCode: 200,
      requestOptions: RequestOptions(path: ''),
    );
  }

  Map<String, dynamic> ticketJson({String id = 't1'}) => {
        'id': id,
        'ticketNumber': 'TK-001',
        'title': 'Test Ticket',
        'description': 'Description',
        'status': 'OPEN',
        'priority': 'MEDIUM',
        'createdById': 'user-1',
        'tags': [],
        'slaBreached': false,
        'createdAt': '2025-01-01T00:00:00Z',
        'updatedAt': '2025-01-01T00:00:00Z',
      };

  setUp(() {
    mockApi = MockApiClient();
    service = TicketService.withClient(mockApi);
  });

  group('TicketService.getTickets', () {
    test('sends GET /tickets with correct page/size params', () async {
      when(mockApi.get(
        '/tickets',
        queryParams: {'page': 0, 'size': 15},
      )).thenAnswer((_) async => fakeResponse({
            'data': {
              'content': [],
              'totalElements': 0,
              'totalPages': 1,
            }
          }));

      await service.getTickets(page: 0, size: 15);

      verify(mockApi.get('/tickets', queryParams: {'page': 0, 'size': 15}))
          .called(1);
    });

    test('includes status param when provided', () async {
      when(mockApi.get(
        '/tickets',
        queryParams: {'page': 0, 'size': 15, 'status': 'OPEN'},
      )).thenAnswer((_) async => fakeResponse({
            'data': {
              'content': [],
              'totalElements': 0,
              'totalPages': 1,
            }
          }));

      await service.getTickets(page: 0, size: 15, status: 'OPEN');

      verify(mockApi.get('/tickets',
              queryParams: {'page': 0, 'size': 15, 'status': 'OPEN'}))
          .called(1);
    });

    test('parses response content into List<TicketModel>', () async {
      when(mockApi.get('/tickets', queryParams: {'page': 0, 'size': 15}))
          .thenAnswer((_) async => fakeResponse({
                'data': {
                  'content': [ticketJson(id: 'a'), ticketJson(id: 'b')],
                  'totalElements': 2,
                  'totalPages': 1,
                }
              }));

      final result = await service.getTickets();
      final content = result['content'] as List<TicketModel>;
      expect(content.length, 2);
      expect(content[0].id, 'a');
      expect(content[1].id, 'b');
    });

    test('returns totalElements and totalPages', () async {
      when(mockApi.get('/tickets', queryParams: {'page': 0, 'size': 15}))
          .thenAnswer((_) async => fakeResponse({
                'data': {
                  'content': [],
                  'totalElements': 42,
                  'totalPages': 3,
                }
              }));

      final result = await service.getTickets();
      expect(result['totalElements'], 42);
      expect(result['totalPages'], 3);
    });
  });

  group('TicketService.getTicket', () {
    test('calls GET /tickets/:id', () async {
      when(mockApi.get('/tickets/abc'))
          .thenAnswer((_) async => fakeResponse({'data': ticketJson(id: 'abc')}));

      final ticket = await service.getTicket('abc');
      expect(ticket.id, 'abc');
      verify(mockApi.get('/tickets/abc')).called(1);
    });
  });

  group('TicketService.createTicket', () {
    test('calls POST /tickets with supplied data', () async {
      final payload = {'title': 'New ticket', 'description': 'Desc'};
      when(mockApi.post('/tickets', data: payload))
          .thenAnswer((_) async => fakeResponse({'data': ticketJson()}));

      final ticket = await service.createTicket(payload);
      expect(ticket, isA<TicketModel>());
      verify(mockApi.post('/tickets', data: payload)).called(1);
    });
  });
}
