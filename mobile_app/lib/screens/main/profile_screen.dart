import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: user == null 
        ? const Center(child: Text('Not logged in'))
        : ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const CircleAvatar(
                radius: 50,
                backgroundColor: Colors.deepOrange,
                child: Icon(Icons.person, size: 50, color: Colors.white),
              ),
              const SizedBox(height: 24),
              _buildProfileItem(Icons.person_outline, 'Name', user.name),
              const Divider(),
              _buildProfileItem(Icons.phone_outlined, 'Phone', user.phone),
              const Divider(),
              _buildProfileItem(Icons.email_outlined, 'Email', user.email ?? 'Not provided'),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                onPressed: () {
                  context.read<AuthProvider>().logout();
                },
                icon: const Icon(Icons.logout),
                label: const Text('LOGOUT'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.grey[200],
                  foregroundColor: Colors.red,
                  elevation: 0,
                ),
              )
            ],
          ),
    );
  }

  Widget _buildProfileItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
