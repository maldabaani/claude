import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar section
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.primaryLight,
                    child: Text(
                      user?.initials ?? '?',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.fullName ?? '', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      user?.role ?? '',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Info section
            _InfoSection(
              title: 'Account Information',
              items: [
                _InfoItem(label: 'Full Name', value: user?.fullName ?? '-'),
                _InfoItem(label: 'Email', value: user?.email ?? '-'),
                _InfoItem(label: 'Role', value: user?.role ?? '-'),
              ],
            ),
            const SizedBox(height: 24),
            // Danger zone
            OutlinedButton.icon(
              onPressed: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Sign Out'),
                    content: const Text('Are you sure you want to sign out?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: TextButton.styleFrom(foregroundColor: AppColors.error),
                        child: const Text('Sign Out'),
                      ),
                    ],
                  ),
                );
                if (confirmed == true && context.mounted) {
                  await ref.read(authProvider.notifier).logout();
                }
              },
              icon: const Icon(Icons.logout, color: AppColors.error),
              label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  final String title;
  final List<Widget> items;
  const _InfoSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: items.asMap().entries.map((e) {
              final isLast = e.key == items.length - 1;
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

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;
  const _InfoItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
          const Spacer(),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
