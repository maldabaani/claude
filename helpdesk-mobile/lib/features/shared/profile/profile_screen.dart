import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _api = ApiClient();
  final _nameController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _savingProfile = false;
  bool _savingPassword = false;
  String? _profileError;
  String? _profileSuccess;
  String? _passwordError;
  String? _passwordSuccess;

  Map<String, dynamic>? _notifPrefs;
  bool _loadingPrefs = true;
  bool _twoFaEnabled = false;

  static const _eventTypes = [
    'TICKET_CREATED',
    'TICKET_ASSIGNED',
    'STATUS_CHANGED',
    'COMMENT_ADDED',
    'SLA_BREACHED',
  ];

  static const _eventLabels = {
    'TICKET_CREATED': 'Ticket Created',
    'TICKET_ASSIGNED': 'Ticket Assigned',
    'STATUS_CHANGED': 'Status Changed',
    'COMMENT_ADDED': 'Comment Added',
    'SLA_BREACHED': 'SLA Breached',
  };

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController.text = user?.fullName ?? '';
    _loadPreferences();
    _load2FaStatus();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _loadPreferences() async {
    setState(() => _loadingPrefs = true);
    try {
      final resp = await _api.get(ApiEndpoints.notificationPreferences);
      final data = resp.data['data'];
      if (mounted) {
        setState(() {
          _notifPrefs = {};
          if (data is List) {
            for (final item in data) {
              final event = item['eventType'] ?? item['event'];
              if (event != null) _notifPrefs![event] = item;
            }
          } else if (data is Map) {
            _notifPrefs = data.cast<String, dynamic>();
          }
          _loadingPrefs = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingPrefs = false);
    }
  }

  Future<void> _load2FaStatus() async {
    try {
      final resp = await _api.get(ApiEndpoints.twoFaStatus);
      if (mounted) setState(() => _twoFaEnabled = resp.data['data']?['totpEnabled'] ?? false);
    } catch (_) {}
  }

  Future<void> _saveProfile() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    setState(() { _savingProfile = true; _profileError = null; _profileSuccess = null; });
    try {
      await _api.put(ApiEndpoints.me, data: {'fullName': name});
      if (mounted) setState(() { _profileSuccess = 'Profile updated successfully.'; _savingProfile = false; });
    } catch (_) {
      if (mounted) setState(() { _profileError = 'Failed to update profile.'; _savingProfile = false; });
    }
  }

  Future<void> _changePassword() async {
    final current = _currentPasswordController.text;
    final next = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;
    if (current.isEmpty || next.isEmpty || confirm.isEmpty) {
      setState(() => _passwordError = 'All fields required.');
      return;
    }
    if (next != confirm) {
      setState(() => _passwordError = 'Passwords do not match.');
      return;
    }
    if (next.length < 8) {
      setState(() => _passwordError = 'Password must be at least 8 characters.');
      return;
    }
    setState(() { _savingPassword = true; _passwordError = null; _passwordSuccess = null; });
    try {
      // Backend handles password change via PUT /users/me (UpdateProfileRequest).
      await _api.put(ApiEndpoints.me, data: {
        'currentPassword': current,
        'newPassword': next,
      });
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      if (mounted) setState(() { _passwordSuccess = 'Password changed successfully.'; _savingPassword = false; });
    } catch (_) {
      if (mounted) setState(() { _passwordError = 'Failed to change password.'; _savingPassword = false; });
    }
  }

  Future<void> _toggleNotifPref(String eventType, String channel, bool enabled) async {
    final current = _notifPrefs?[eventType] as Map<String, dynamic>? ?? {};
    final updated = Map<String, dynamic>.from(current);
    if (channel == 'email') updated['emailEnabled'] = enabled;
    if (channel == 'inApp') updated['inAppEnabled'] = enabled;

    setState(() {
      _notifPrefs ??= {};
      _notifPrefs![eventType] = updated;
    });

    try {
      await _api.put(ApiEndpoints.notificationPreference(eventType), data: {
        'eventType': eventType,
        'emailEnabled': updated['emailEnabled'] ?? true,
        'inAppEnabled': updated['inAppEnabled'] ?? true,
      });
    } catch (_) {}
  }

  Future<void> _toggle2Fa(bool enable) async {
    try {
      if (enable) {
        await _api.post(ApiEndpoints.twoFaEnable);
      } else {
        await _api.post('${ApiEndpoints.base}/auth/2fa/disable');
      }
      setState(() => _twoFaEnabled = enable);
    } catch (_) {}
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar + name
            Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
                    ),
                    child: Center(
                      child: Text(
                        _initials(user?.fullName ?? '?'),
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.fullName ?? '', style: Theme.of(context).textTheme.titleLarge),
                  Text(user?.email ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(user?.role ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Edit Profile
            _SectionCard(
              title: 'Edit Profile',
              children: [
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
                ),
                const SizedBox(height: 12),
                if (_profileError != null) _MessageBox(message: _profileError!, isError: true),
                if (_profileSuccess != null) _MessageBox(message: _profileSuccess!, isError: false),
                const SizedBox(height: 4),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _savingProfile ? null : _saveProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _savingProfile
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Save Changes'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Change Password
            _SectionCard(
              title: 'Change Password',
              children: [
                _PasswordField(controller: _currentPasswordController, label: 'Current Password'),
                const SizedBox(height: 12),
                _PasswordField(controller: _newPasswordController, label: 'New Password'),
                const SizedBox(height: 12),
                _PasswordField(controller: _confirmPasswordController, label: 'Confirm Password'),
                const SizedBox(height: 12),
                if (_passwordError != null) _MessageBox(message: _passwordError!, isError: true),
                if (_passwordSuccess != null) _MessageBox(message: _passwordSuccess!, isError: false),
                const SizedBox(height: 4),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _savingPassword ? null : _changePassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _savingPassword
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Update Password'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Two-Factor Auth
            _SectionCard(
              title: 'Two-Factor Authentication',
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('2FA Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                        Text(
                          _twoFaEnabled ? 'Enabled — your account is protected' : 'Disabled — add extra security',
                          style: TextStyle(fontSize: 12, color: _twoFaEnabled ? AppColors.success : AppColors.textSecondary),
                        ),
                      ],
                    ),
                    Switch(
                      value: _twoFaEnabled,
                      onChanged: _toggle2Fa,
                      activeColor: AppColors.success,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Notification Preferences
            _SectionCard(
              title: 'Notification Preferences',
              children: _loadingPrefs
                  ? [const Center(child: CircularProgressIndicator())]
                  : [
                      // Header row
                      const Row(
                        children: [
                          Expanded(child: SizedBox()),
                          SizedBox(width: 60, child: Text('Email', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary), textAlign: TextAlign.center)),
                          SizedBox(width: 60, child: Text('In-App', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary), textAlign: TextAlign.center)),
                        ],
                      ),
                      const Divider(height: 8),
                      ..._eventTypes.map((event) {
                        final prefs = _notifPrefs?[event] as Map<String, dynamic>? ?? {};
                        final emailEnabled = prefs['emailEnabled'] ?? true;
                        final inAppEnabled = prefs['inAppEnabled'] ?? true;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(_eventLabels[event] ?? event, style: const TextStyle(fontSize: 13)),
                              ),
                              SizedBox(
                                width: 60,
                                child: Center(
                                  child: Transform.scale(
                                    scale: 0.75,
                                    child: Switch(
                                      value: emailEnabled == true,
                                      onChanged: (v) => _toggleNotifPref(event, 'email', v),
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(
                                width: 60,
                                child: Center(
                                  child: Transform.scale(
                                    scale: 0.75,
                                    child: Switch(
                                      value: inAppEnabled == true,
                                      onChanged: (v) => _toggleNotifPref(event, 'inApp', v),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
            ),
            const SizedBox(height: 24),

            // Sign Out
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _confirmSignOut(context),
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
    if (confirmed == true && mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;

  const _PasswordField({required this.controller, required this.label});

  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      obscureText: _obscure,
      decoration: InputDecoration(
        labelText: widget.label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
          onPressed: () => setState(() => _obscure = !_obscure),
        ),
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  final String message;
  final bool isError;

  const _MessageBox({required this.message, required this.isError});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isError ? AppColors.errorBg : AppColors.successBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message,
        style: TextStyle(fontSize: 13, color: isError ? AppColors.error : AppColors.success),
      ),
    );
  }
}
