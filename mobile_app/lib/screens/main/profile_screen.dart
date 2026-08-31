import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import 'events_screen.dart';
import 'news_screen.dart';
import 'temple_info_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: AppColors.statusCancelled),
            SizedBox(width: 8),
            Text('Logout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Are you sure you want to log out from your devotee account?',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusCancelled,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthProvider>().logout();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Not logged in')),
      );
    }

    final initial = user.name.isNotEmpty ? user.name.substring(0, 1).toUpperCase() : 'D';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Devotee Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Profile Header
          Center(
            child: Column(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      initial,
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  user.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user.email ?? 'Devotee Account',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Account Information
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Contact Information',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Divider(height: 24),
                  _buildProfileRow(Icons.person_outline, 'Full Name', user.name),
                  const SizedBox(height: 14),
                  _buildProfileRow(Icons.phone_outlined, 'Phone Number', user.phone),
                  if (user.email != null && user.email!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _buildProfileRow(Icons.email_outlined, 'Email Address', user.email!),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Quick Navigation Links
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.temple_hindu_rounded, color: AppColors.primary),
                  title: const Text('About Temple & Timings', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.menu_book_rounded, color: AppColors.primary),
                  title: const Text('News & Announcements', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NewsScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.celebration_rounded, color: AppColors.primary),
                  title: const Text('Temple Festivals & Events', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const EventsScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Logout Button
          OutlinedButton.icon(
            onPressed: () => _showLogoutDialog(context),
            icon: const Icon(Icons.logout, color: AppColors.statusCancelled, size: 18),
            label: const Text(
              'LOGOUT',
              style: TextStyle(
                color: AppColors.statusCancelled,
                fontWeight: FontWeight.w700,
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.statusCancelled, width: 1.2),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 20),

          // App Footer
          const Center(
            child: Text(
              'Sri Kedareshwara Ashramam • Version 1.0.0',
              style: TextStyle(fontSize: 12, color: AppColors.textTertiary),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              Text(
                value,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
