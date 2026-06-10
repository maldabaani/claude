import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/theme_provider.dart';

class CustomerShell extends ConsumerWidget {
  final Widget child;
  const CustomerShell({super.key, required this.child});

  static const _navItems = [
    _NavItem('/customer', Icons.home_outlined, 'Home'),
    _NavItem('/customer/tickets', Icons.confirmation_number_outlined, 'My Tickets'),
    _NavItem('/customer/submit', Icons.add_circle_outline_rounded, 'Submit Ticket'),
    _NavItem('/customer/kb', Icons.menu_book_outlined, 'Knowledge Base'),
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
          Container(width: 34, height: 34,
            decoration: BoxDecoration(gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.primary, AppColors.gradientEnd]), borderRadius: BorderRadius.circular(9)),
            child: const Icon(Icons.headset_mic_rounded, color: Colors.white, size: 18)),
          const SizedBox(width: 10),
          const Text('NG HelpDesk', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.3)),
        ]),
        actions: [
          IconButton(icon: Stack(clipBehavior: Clip.none, children: [
            const Icon(Icons.notifications_outlined, color: AppColors.textSecondary, size: 24),
            Positioned(top: -2, right: -2, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle))),
          ]), onPressed: () => context.push('/notifications')),
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
              Text('Customer Portal', style: TextStyle(fontSize: 11, color: AppColors.textOnDark)),
            ]),
          ])),
          const SizedBox(height: 8),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          const SizedBox(height: 8),
          Expanded(child: ListView.builder(padding: EdgeInsets.zero, itemCount: _navItems.length, itemBuilder: (_, i) {
            final item = _navItems[i];
            final isActive = item.route == '/customer' ? location == '/customer' : location.startsWith(item.route);
            return _DrawerItem(item: item, isActive: isActive, onTap: () { context.go(item.route); Navigator.pop(context); });
          })),
          const Divider(color: AppColors.sidebarSurface, height: 1),
          Padding(padding: const EdgeInsets.all(16), child: Row(children: [
            CircleAvatar(radius: 18, backgroundColor: AppColors.primary,
              child: Text(user?.fullName.isNotEmpty == true ? user!.fullName[0].toUpperCase() : 'C', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user?.fullName ?? 'Customer', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              Text(user?.email ?? '', style: const TextStyle(color: AppColors.textOnDark, fontSize: 11), overflow: TextOverflow.ellipsis),
            ])),
            IconButton(
              icon: Icon(
                ref.watch(themeModeProvider) == ThemeMode.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: AppColors.textOnDark, size: 18,
              ),
              onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            ),
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
