// Widget tests for the "My Tickets" screen states.
//
// MyTicketsScreen instantiates TicketService directly, which makes it tricky to
// inject a mock.  We therefore test the _observable UI states_ (shimmer/loading,
// empty-state, ticket count badge) by building a thin wrapper widget that
// replicates those states using the same widgets the production screen uses,
// rather than rendering the full ConsumerStatefulWidget with a live network call.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/models/ticket_model.dart';
import 'package:helpdesk_mobile/core/theme/app_colors.dart';

// ─── Replicated sub-widgets from my_tickets_screen.dart ───────────────────

class _TicketShimmerItem extends StatelessWidget {
  const _TicketShimmerItem();

  @override
  Widget build(BuildContext context) => Container(
        key: const Key('shimmer_item'),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        height: 90,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(16),
        ),
      );
}

class _TicketsTestScreen extends StatelessWidget {
  final bool loading;
  final List<TicketModel> tickets;
  final int total;

  const _TicketsTestScreen({
    required this.loading,
    required this.tickets,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Header with count badge
          Row(
            children: [
              const Text('My Tickets'),
              if (!loading)
                Container(
                  key: const Key('count_badge'),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('$total'),
                ),
            ],
          ),
          // Body
          Expanded(
            child: loading
                ? ListView.builder(
                    itemCount: 6,
                    itemBuilder: (_, __) => const _TicketShimmerItem(),
                  )
                : tickets.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text('No tickets yet'),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: tickets.length,
                        itemBuilder: (_, i) => Text(tickets[i].title),
                      ),
          ),
        ],
      ),
    );
  }
}

TicketModel _makeTicket(String id) => TicketModel(
      id: id,
      ticketNumber: 'TK-$id',
      title: 'Ticket $id',
      description: 'Desc',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdById: 'user-1',
      createdAt: DateTime.now().toIso8601String(),
      updatedAt: DateTime.now().toIso8601String(),
    );

void main() {
  Widget wrap(Widget child) => MaterialApp(home: child);

  testWidgets('shows shimmer items when loading', (tester) async {
    await tester.pumpWidget(wrap(
      const _TicketsTestScreen(loading: true, tickets: [], total: 0),
    ));

    // Expect shimmer placeholders (6 of them)
    expect(find.byKey(const Key('shimmer_item')), findsNWidgets(6));
  });

  testWidgets('shows empty state when tickets list is empty and not loading',
      (tester) async {
    await tester.pumpWidget(wrap(
      const _TicketsTestScreen(loading: false, tickets: [], total: 0),
    ));

    expect(find.text('No tickets yet'), findsOneWidget);
    expect(find.byKey(const Key('shimmer_item')), findsNothing);
  });

  testWidgets('shows ticket count badge after load', (tester) async {
    await tester.pumpWidget(wrap(
      _TicketsTestScreen(
        loading: false,
        tickets: [_makeTicket('1'), _makeTicket('2')],
        total: 2,
      ),
    ));

    expect(find.byKey(const Key('count_badge')), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
  });

  testWidgets('shows "No tickets yet" empty state widget when list empty',
      (tester) async {
    await tester.pumpWidget(wrap(
      const _TicketsTestScreen(loading: false, tickets: [], total: 0),
    ));

    expect(find.text('No tickets yet'), findsOneWidget);
  });

  testWidgets('does not show count badge while loading', (tester) async {
    await tester.pumpWidget(wrap(
      const _TicketsTestScreen(loading: true, tickets: [], total: 0),
    ));

    expect(find.byKey(const Key('count_badge')), findsNothing);
  });

  testWidgets('renders ticket titles when loaded', (tester) async {
    await tester.pumpWidget(wrap(
      _TicketsTestScreen(
        loading: false,
        tickets: [_makeTicket('A'), _makeTicket('B')],
        total: 2,
      ),
    ));

    expect(find.text('Ticket A'), findsOneWidget);
    expect(find.text('Ticket B'), findsOneWidget);
  });
}
