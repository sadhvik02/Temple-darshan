import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import 'auth/login_screen.dart';
import 'main/home_screen.dart';
import 'main/my_bookings_screen.dart';
import 'main/profile_screen.dart';
import 'main/services_screen.dart';

class RootWrapper extends StatelessWidget {
  const RootWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.temple_hindu,
                      size: 40,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                ],
              ),
            ),
          );
        }

        // If user is authenticated, show Main Navigation; otherwise Login
        if (auth.userModel != null) {
          return const MainNavigator();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}

class MainNavigator extends StatefulWidget {
  const MainNavigator({super.key});

  @override
  State<MainNavigator> createState() => _MainNavigatorState();
}

class _MainNavigatorState extends State<MainNavigator> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    ServicesScreen(),
    MyBookingsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: ImageIcon(AssetImage('assets/icons/darshan_selected.png'), size: 24, color: AppColors.primary),
            selectedIcon: ImageIcon(AssetImage('assets/icons/darshan_selected.png'), size: 24, color: AppColors.primary),
            label: 'Darshan',
          ),
          NavigationDestination(
            icon: Icon(Icons.spa_outlined, color: AppColors.primary),
            selectedIcon: Icon(Icons.spa_rounded, color: AppColors.primary),
            label: 'Arjitha Sevas',
          ),
          NavigationDestination(
            icon: Icon(Icons.confirmation_number_outlined, color: AppColors.primary),
            selectedIcon: Icon(Icons.confirmation_number_rounded, color: AppColors.primary),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_pin_circle_outlined, color: AppColors.primary),
            selectedIcon: Icon(Icons.person_pin_circle_rounded, color: AppColors.primary),
            label: 'Devotee',
          ),
        ],
      ),
    );
  }
}

