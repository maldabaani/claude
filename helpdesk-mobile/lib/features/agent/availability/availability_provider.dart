import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

enum AvailabilityStatus { online, busy, away, offline }

extension AvailabilityStatusX on AvailabilityStatus {
  String get apiValue {
    switch (this) {
      case AvailabilityStatus.online:
        return 'ONLINE';
      case AvailabilityStatus.busy:
        return 'BUSY';
      case AvailabilityStatus.away:
        return 'AWAY';
      case AvailabilityStatus.offline:
        return 'OFFLINE';
    }
  }

  String get label {
    switch (this) {
      case AvailabilityStatus.online:
        return 'Online';
      case AvailabilityStatus.busy:
        return 'Busy';
      case AvailabilityStatus.away:
        return 'Away';
      case AvailabilityStatus.offline:
        return 'Offline';
    }
  }
}

AvailabilityStatus availabilityFromApi(String value) {
  switch (value.toUpperCase()) {
    case 'ONLINE':
      return AvailabilityStatus.online;
    case 'BUSY':
      return AvailabilityStatus.busy;
    case 'AWAY':
      return AvailabilityStatus.away;
    default:
      return AvailabilityStatus.offline;
  }
}

class AvailabilityState {
  final AvailabilityStatus status;
  final bool loading;

  const AvailabilityState({
    this.status = AvailabilityStatus.offline,
    this.loading = false,
  });

  AvailabilityState copyWith({AvailabilityStatus? status, bool? loading}) {
    return AvailabilityState(
      status: status ?? this.status,
      loading: loading ?? this.loading,
    );
  }
}

class AvailabilityNotifier extends StateNotifier<AvailabilityState> {
  AvailabilityNotifier() : super(const AvailabilityState()) {
    _loadStatus();
  }

  final _api = ApiClient();

  Future<void> _loadStatus() async {
    try {
      final resp = await _api.get(ApiEndpoints.agentAvailabilityMe);
      final data = resp.data['data'];
      final status = availabilityFromApi(data['availabilityStatus'] as String);
      state = state.copyWith(status: status);
    } catch (_) {}
  }

  Future<void> updateStatus(AvailabilityStatus status) async {
    state = state.copyWith(loading: true);
    try {
      await _api.put(ApiEndpoints.agentAvailability, data: {'status': status.apiValue});
      state = state.copyWith(status: status, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false);
    }
  }
}

final availabilityProvider =
    StateNotifierProvider<AvailabilityNotifier, AvailabilityState>((ref) {
  return AvailabilityNotifier();
});
