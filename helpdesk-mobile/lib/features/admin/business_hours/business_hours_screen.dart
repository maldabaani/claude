import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

const _dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

class BusinessHoursScreen extends ConsumerStatefulWidget {
  const BusinessHoursScreen({super.key});
  @override
  ConsumerState<BusinessHoursScreen> createState() => _BusinessHoursScreenState();
}

class _BusinessHoursScreenState extends ConsumerState<BusinessHoursScreen> {
  final _api = ApiClient();
  List<Map<String, dynamic>> _schedule = [];
  List<Map<String, dynamic>> _holidays = [];
  bool _loading = true;
  bool _saving = false;
  Map<String, dynamic>? _status;

  final _holidayDateCtrl = TextEditingController();
  final _holidayNameCtrl = TextEditingController();
  DateTime? _selectedHolidayDate;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _holidayDateCtrl.dispose();
    _holidayNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final [schedResp, holResp, statusResp] = await Future.wait([
        _api.get(ApiEndpoints.businessHours),
        _api.get(ApiEndpoints.businessHolidays),
        _api.get('${ApiEndpoints.businessHours}/status'),
      ]);

      final rawSchedule = (schedResp.data['data'] as List?) ?? [];
      final Map<int, Map<String, dynamic>> byDay = {};
      for (final d in rawSchedule) {
        byDay[d['dayOfWeek'] as int] = Map<String, dynamic>.from(d as Map);
      }

      final schedule = List.generate(7, (i) {
        final dow = i + 1;
        return byDay[dow] ?? {
          'dayOfWeek': dow,
          'isOpen': false,
          'openTime': null,
          'closeTime': null,
          'timezone': 'UTC',
        };
      });

      if (mounted) {
        setState(() {
          _schedule = schedule;
          _holidays = List<Map<String, dynamic>>.from((holResp.data['data'] as List?) ?? []);
          _status = statusResp.data['data'] as Map<String, dynamic>?;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveSchedule() async {
    setState(() => _saving = true);
    try {
      await Future.wait(_schedule.map((day) {
        final dow = day['dayOfWeek'] as int;
        final isOpen = day['isOpen'] as bool;
        return _api.put('${ApiEndpoints.businessHours}/$dow', data: {
          'isOpen': isOpen,
          'openTime': isOpen ? day['openTime'] : null,
          'closeTime': isOpen ? day['closeTime'] : null,
          'timezone': day['timezone'] ?? 'UTC',
        });
      }));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Business hours saved'), backgroundColor: AppColors.success));
        await _load();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickTime(int dayIndex, bool isOpen) async {
    final day = _schedule[dayIndex];
    final existing = isOpen ? day['openTime'] : day['closeTime'];
    TimeOfDay initial = const TimeOfDay(hour: isOpen ? 9 : 17, minute: 0);
    if (existing != null) {
      final parts = (existing as String).split(':');
      initial = TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
    }
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null && mounted) {
      final formatted = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        if (isOpen) {
          _schedule[dayIndex] = {...day, 'openTime': formatted};
        } else {
          _schedule[dayIndex] = {...day, 'closeTime': formatted};
        }
      });
    }
  }

  Future<void> _pickHolidayDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null && mounted) {
      setState(() {
        _selectedHolidayDate = picked;
        _holidayDateCtrl.text = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _addHoliday() async {
    if (_selectedHolidayDate == null || _holidayNameCtrl.text.trim().isEmpty) return;
    try {
      final dateStr = _holidayDateCtrl.text;
      await _api.post(ApiEndpoints.businessHolidays, data: {
        'holidayDate': dateStr,
        'name': _holidayNameCtrl.text.trim(),
      });
      _holidayDateCtrl.clear();
      _holidayNameCtrl.clear();
      setState(() => _selectedHolidayDate = null);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Holiday added'), backgroundColor: AppColors.success));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add holiday'), backgroundColor: AppColors.error));
      }
    }
  }

  Future<void> _deleteHoliday(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Holiday'),
        content: const Text('Remove this holiday?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _api.delete('${ApiEndpoints.businessHolidays}/$id');
      if (mounted) {
        setState(() => _holidays.removeWhere((h) => h['id'] == id));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Holiday removed'), backgroundColor: AppColors.success));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Business Hours'),
        actions: [
          if (_status != null)
            Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: (_status!['isOpen'] as bool? ?? false) ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                (_status!['isOpen'] as bool? ?? false) ? 'OPEN' : 'CLOSED',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: (_status!['isOpen'] as bool? ?? false) ? AppColors.success : AppColors.error,
                ),
              ),
            ),
          TextButton.icon(
            icon: _saving ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save_outlined, size: 16),
            label: const Text('Save'),
            onPressed: _saving ? null : _saveSchedule,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Status card
                  if (_status != null && !(_status!['isOpen'] as bool? ?? false) && _status!['nextOpenAt'] != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(children: [
                        Icon(Icons.schedule, size: 16, color: Colors.orange.shade600),
                        const SizedBox(width: 8),
                        Expanded(child: Text(
                          'Next open: ${_status!['nextOpenAt']}',
                          style: TextStyle(fontSize: 12, color: Colors.orange.shade700),
                        )),
                      ]),
                    ),

                  // Weekly schedule
                  _SectionHeader(title: 'Weekly Schedule', icon: Icons.calendar_today_outlined),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: List.generate(_schedule.length, (i) {
                        final day = _schedule[i];
                        final isOpen = day['isOpen'] as bool? ?? false;
                        final dow = day['dayOfWeek'] as int;
                        return Column(children: [
                          if (i > 0) const Divider(height: 1, color: AppColors.border),
                          SwitchListTile(
                            title: Text(_dayNames[dow], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                            subtitle: isOpen
                                ? _TimeRow(
                                    openTime: day['openTime'] as String?,
                                    closeTime: day['closeTime'] as String?,
                                    onPickOpen: () => _pickTime(i, true),
                                    onPickClose: () => _pickTime(i, false),
                                  )
                                : const Text('Closed', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            value: isOpen,
                            activeColor: AppColors.primary,
                            onChanged: (val) => setState(() {
                              _schedule[i] = {...day, 'isOpen': val};
                            }),
                          ),
                        ]);
                      }),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Holidays
                  _SectionHeader(title: 'Holidays', icon: Icons.beach_access_outlined),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      // Add holiday form
                      Row(children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: _pickHolidayDate,
                            child: AbsorbPointer(
                              child: TextField(
                                controller: _holidayDateCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Date',
                                  hintText: 'Pick date',
                                  prefixIcon: Icon(Icons.calendar_month_outlined, size: 18),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _holidayNameCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Name',
                              hintText: 'e.g. Christmas Day',
                              border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _addHoliday,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Icon(Icons.add, color: Colors.white, size: 20),
                        ),
                      ]),
                      if (_holidays.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        ..._holidays.map((h) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)),
                            child: Icon(Icons.event_outlined, size: 18, color: Colors.orange.shade600),
                          ),
                          title: Text(h['name'] as String? ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          subtitle: Text(h['holidayDate'] as String? ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error),
                            onPressed: () => _deleteHoliday(h['id'].toString()),
                          ),
                        )),
                      ] else ...[
                        const SizedBox(height: 16),
                        const Center(child: Text('No holidays configured', style: TextStyle(fontSize: 13, color: AppColors.textSecondary))),
                      ],
                    ]),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 16, color: AppColors.textSecondary),
      const SizedBox(width: 6),
      Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
    ]);
  }
}

class _TimeRow extends StatelessWidget {
  final String? openTime;
  final String? closeTime;
  final VoidCallback onPickOpen;
  final VoidCallback onPickClose;
  const _TimeRow({this.openTime, this.closeTime, required this.onPickOpen, required this.onPickClose});
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      GestureDetector(
        onTap: onPickOpen,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
          child: Text(openTime ?? '09:00', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
        ),
      ),
      const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('–', style: TextStyle(fontSize: 11, color: AppColors.textSecondary))),
      GestureDetector(
        onTap: onPickClose,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
          child: Text(closeTime ?? '17:00', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
        ),
      ),
    ]);
  }
}
