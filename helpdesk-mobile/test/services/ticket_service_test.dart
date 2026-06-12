import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/api/api_client.dart';
import 'package:helpdesk_mobile/core/services/ticket_service.dart';
import 'package:helpdesk_mobile/core/models/ticket_model.dart';

// ─── Hand-rolled fake ApiClient ─────────────────────────────────────────────
//
// We can't use Mockito's @GenerateMocks with ApiClient because it has a private
// constructor (singleton pattern).  Instead we create a simple fake that records
// calls and returns canned responses.

class _FakeApiClient extends ApiClient {
  // Records the last GET call's arguments for verification
  String? lastGetPath;
  Map<String, dynamic>? lastGetParams;
  String? lastPostPath;
  dynamic lastPostData;

  // Configurable responses
  Map<String, dynamic> Function(String path, Map<String, dynamic>? params)?
      getHandler;
  Map<String, dynamic> Function(String path, dynamic data)? postHandler;

  _FakeApiClient() : super._forTest();

  @override
  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) async {
    lastGetPath = path;
    lastGetParams = queryParams;
    final data = getHandler?.call(path, queryParams) ??
        {'data': {'content': [], 'totalElements': 0, 'totalPages': 1}};
    return Response(
      data: data,
      statusCode: 200,
      requestOptions: RequestOptions(path: path),
    );
  }

  @override
  Future<Response> post(String path, {dynamic data}) async {
    lastPostPath = path;
    lastPostData = data;
    final responseData = postHandler?.call(path, data) ??
        {'data': _defaultTicketJson()};
    return Response(
      data: responseData,
      statusCode: 200,
      requestOptions: RequestOptions(path: path),
    );
  }
}

Map<String, dynamic> _defaultTicketJson({String id = 't1'}) => {
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

void main() {
  late _FakeApiClient fakeApi;
  late TicketService service;

  setUp(() {
    fakeApi = _FakeApiClient();
    service = TicketService.withClient(fakeApi);
  });

  group('TicketService.getTickets', () {
    test('sends GET /tickets with correct page/size params', () async {
      await service.getTickets(page: 0, size: 15);
      expect(fakeApi.lastGetPath, '/tickets');
      expect(fakeApi.lastGetParams!['page'], 0);
      expect(fakeApi.lastGetParams!['size'], 15);
    });

    test('includes status param when status is provided', () async {
      fakeApi.getHandler = (path, params) => {
            'data': {'content': [], 'totalElements': 0, 'totalPages': 1}
          };
      await service.getTickets(page: 0, size: 15, status: 'OPEN');
      expect(fakeApi.lastGetParams!['status'], 'OPEN');
    });

    test('does not include status param when status is null', () async {
      await service.getTickets(page: 0, size: 15);
      expect(fakeApi.lastGetParams!.containsKey('status'), isFalse);
    });

    test('parses response content into List<TicketModel>', () async {
      fakeApi.getHandler = (_, __) => {
            'data': {
              'content': [
                _defaultTicketJson(id: 'a'),
                _defaultTicketJson(id: 'b'),
              ],
              'totalElements': 2,
              'totalPages': 1,
            }
          };

      final result = await service.getTickets();
      final content = result['content'] as List<TicketModel>;
      expect(content.length, 2);
      expect(content[0].id, 'a');
      expect(content[1].id, 'b');
    });

    test('returns totalElements and totalPages from response', () async {
      fakeApi.getHandler = (_, __) => {
            'data': {
              'content': [],
              'totalElements': 42,
              'totalPages': 3,
            }
          };

      final result = await service.getTickets();
      expect(result['totalElements'], 42);
      expect(result['totalPages'], 3);
    });
  });

  group('TicketService.getTicket', () {
    test('calls GET /tickets/:id and returns parsed TicketModel', () async {
      fakeApi.getHandler = (path, _) => {'data': _defaultTicketJson(id: 'abc')};

      final ticket = await service.getTicket('abc');
      expect(fakeApi.lastGetPath, '/tickets/abc');
      expect(ticket.id, 'abc');
    });
  });

  group('TicketService.createTicket', () {
    test('calls POST /tickets with provided data', () async {
      fakeApi.postHandler = (_, __) => {'data': _defaultTicketJson()};
      final payload = {'title': 'New ticket', 'description': 'Desc'};

      final ticket = await service.createTicket(payload);

      expect(fakeApi.lastPostPath, '/tickets');
      expect(fakeApi.lastPostData, payload);
      expect(ticket, isA<TicketModel>());
    });
  });
}
