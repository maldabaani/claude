import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class AgentShell extends ConsumerWidget {
  final Widget child;
  const AgentShell({super.key, required this.child});

  static const _navItems = [
    _NavItem('/agent', Icons.dashboard_outlined, 'Dashboard'),
    _NavItem('/agent/queue', Icons.inbox_outlined, 'Ticket Queue'),
    _NavItem('/notifications', Icons.notifications_outlined, 'Notifications'),
    _NavItem('/profile', Icons.person_outline_rounded, 'Profile'),
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
              Text('Agent Portal', style: TextStyle(fontSize: 11, color: AppColors.textOnDark)),
            ]),
          ])),
          const SizedBox(height: 8),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          const SizedBox(height: 8),
          Expanded(child: ListView.builder(padding: EdgeInsets.zero, itemCount: _navItems.length, itemBuilder: (_, i) {
            final item = _navItems[i];
            final isActive = item.route == '/agent' ? location == '/agent' : location.startsWith(item.route);
            return _DrawerItem(item: item, isActive: isActive, onTap: () { context.go(item.route); Navigator.pop(context); });
          })),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          Padding(padding: const EdgeInsets.all(16), child: Row(children: [
            CircleAvatar(radius: 18, backgroundColor: AppColors.primary,
              child: Text(user?.fullName.isNotEmpty == true ? user!.fullName[0].toUpperCase() : 'A', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user?.fullName ?? 'Agent', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              const Text('Agent', style: TextStyle(color: AppColors.textOnDark, fontSize: 11)),
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
