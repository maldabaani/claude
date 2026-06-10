import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class AdminShell extends ConsumerWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  static const _navItems = [
    _NavItem('/admin', Icons.grid_view_outlined, 'Overview'),
    _NavItem('/admin/tickets', Icons.confirmation_number_outlined, 'Tickets'),
    _NavItem('/admin/users', Icons.group_outlined, 'Users'),
    _NavItem('/admin/departments', Icons.business_outlined, 'Departments'),
    _NavItem('/admin/sla', Icons.timer_outlined, 'SLA Policies'),
    _NavItem('/admin/canned', Icons.chat_bubble_outline_rounded, 'Canned Responses'),
    _NavItem('/admin/analytics', Icons.bar_chart_outlined, 'Analytics'),
    _NavItem('/admin/kb', Icons.menu_book_outlined, 'Knowledge Base'),
    _NavItem('/admin/audit', Icons.history_outlined, 'Audit Log'),
    _NavItem('/admin/custom-fields', Icons.input_outlined, 'Custom Fields'),
    _NavItem('/admin/sla-rules', Icons.rule_outlined, 'SLA Rules'),
    _NavItem('/admin/templates', Icons.description_outlined, 'Templates'),
    _NavItem('/admin/webhooks', Icons.webhook_outlined, 'Webhooks'),
    _NavItem('/admin/api-keys', Icons.key_outlined, 'API Keys'),
    _NavItem('/admin/help-topics', Icons.help_outline_rounded, 'Help Topics'),
    _NavItem('/admin/email-inboxes', Icons.email_outlined, 'Email Inboxes'),
    _NavItem('/admin/organizations', Icons.corporate_fare_outlined, 'Organizations'),
    _NavItem('/admin/issues', Icons.bug_report_outlined, 'Issues'),
    _NavItem('/admin/settings', Icons.settings_outlined, 'Settings'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 16,
        title: Row(children: [
          Container(width: 32, height: 32,
            decoration: BoxDecoration(gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.primary, AppColors.gradientEnd]), borderRadius: BorderRadius.circular(9)),
            child: const Icon(Icons.headset_mic_rounded, color: Colors.white, size: 16)),
          const SizedBox(width: 10),
          const Text('NG HelpDesk', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.3)),
        ]),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined, color: AppColors.textSecondary), onPressed: () => context.push('/notifications')),
          const SizedBox(width: 4),
        ],
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
      ),
      drawer: Drawer(
        backgroundColor: AppColors.sidebar,
        child: SafeArea(child: Column(children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 20, 20, 8), child: Row(children: [
            Container(width: 40, height: 40,
              decoration: BoxDecoration(gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.primary, AppColors.gradientEnd]), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.headset_mic_rounded, color: Colors.white, size: 20)),
            const SizedBox(width: 12),
            const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('NG HelpDesk', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
              Text('Admin Portal', style: TextStyle(fontSize: 11, color: AppColors.textOnDark)),
            ]),
          ])),
          const SizedBox(height: 8),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          const SizedBox(height: 8),
          Expanded(child: ListView.builder(padding: EdgeInsets.zero, itemCount: _navItems.length, itemBuilder: (_, i) {
            final item = _navItems[i];
            final isActive = item.route == '/admin' ? location == '/admin' : location.startsWith(item.route);
            return _DrawerItem(item: item, isActive: isActive, onTap: () { context.go(item.route); Navigator.pop(context); });
          })),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          Padding(padding: const EdgeInsets.all(16), child: Row(children: [
            CircleAvatar(radius: 18, backgroundColor: AppColors.primary,
              child: Text(user?.fullName.isNotEmpty == true ? user!.fullName[0].toUpperCase() : 'A', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user?.fullName ?? 'Admin', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              const Text('Administrator', style: TextStyle(color: AppColors.textOnDark, fontSize: 11)),
            ])),
            IconButton(icon: const Icon(Icons.logout_outlined, color: AppColors.textOnDark, size: 18),
              onPressed: () async { Navigator.pop(context); await ref.read(authProvider.notifier).logout(); }),
          ])),
        ])),
      ),
      body: child,
    );
  }
}

class _NavItem {
  final String route;
  final IconData icon;
  final String label;
  const _NavItem(this.route, this.icon, this.label);
}

class _DrawerItem extends StatelessWidget {
  final _NavItem item;
  final bool isActive;
  final VoidCallback onTap;
  const _DrawerItem({required this.item, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: InkWell(onTap: onTap, child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: isActive ? AppColors.primary.withOpacity(0.2) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: isActive ? Border.all(color: AppColors.primary.withOpacity(0.4)) : null,
      ),
      child: Row(children: [
        Icon(item.icon, size: 18, color: isActive ? Colors.white : AppColors.textOnDark),
        const SizedBox(width: 12),
        Text(item.label, style: TextStyle(fontSize: 13, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? Colors.white : AppColors.textOnDark)),
      ]),
    )),
  );
}
