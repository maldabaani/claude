import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _settings;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.settings);
      if (mounted) setState(() { _settings = resp.data['data']; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('System Settings', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  _SettingsSection(
                    title: 'General',
                    tiles: [
                      _SettingsTile(
                        icon: Icons.business,
                        label: 'Company Name',
                        value: _settings?['companyName'] ?? 'NG HelpDesk',
                        onTap: () {},
                      ),
                      _SettingsTile(
                        icon: Icons.email_outlined,
                        label: 'Support Email',
                        value: _settings?['supportEmail'] ?? '-',
                        onTap: () {},
                      ),
                      _SettingsTile(
                        icon: Icons.language,
                        label: 'Default Language',
                        value: _settings?['defaultLanguage'] ?? 'en',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _SettingsSection(
                    title: 'Tickets',
                    tiles: [
                      _SettingsTile(
                        icon: Icons.timer_outlined,
                        label: 'Auto-Close After (days)',
                        value: _settings?['autoCloseDays']?.toString() ?? '-',
                        onTap: () {},
                      ),
                      _SettingsTile(
                        icon: Icons.star_rate_outlined,
                        label: 'CSAT Survey',
                        value: _settings?['csatEnabled'] == true ? 'Enabled' : 'Disabled',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _SettingsSection(
                    title: 'Security',
                    tiles: [
                      _SettingsTile(
                        icon: Icons.shield_outlined,
                        label: 'Two-Factor Auth',
                        value: _settings?['twoFaRequired'] == true ? 'Required' : 'Optional',
                        onTap: () {},
                      ),
                      _SettingsTile(
                        icon: Icons.lock_clock_outlined,
                        label: 'Session Timeout',
                        value: _settings?['sessionTimeout'] ?? '-',
                        onTap: () {},
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> tiles;
  const _SettingsSection({required this.title, required this.tiles});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.textSecondary)),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: tiles.asMap().entries.map((e) {
              final isLast = e.key == tiles.length - 1;
              return Column(
                children: [
                  e.value,
                  if (!isLast) const Divider(indent: 16, endIndent: 16, height: 1),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, size: 20, color: AppColors.textSecondary),
      title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.textTertiary),
        ],
      ),
      onTap: onTap,
    );
  }
}
