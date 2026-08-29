import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import '../../widgets/status_badge.dart';
import 'booking_details_screen.dart';
import 'services_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  int _selectedFilter = 0; // 0: All, 1: Pending, 2: Confirmed, 3: Completed

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Bookings')),
        body: const Center(child: Text('Please log in to view your bookings.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Seva Bookings'),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                _buildFilterChip(0, 'All Bookings'),
                const SizedBox(width: 8),
                _buildFilterChip(1, 'Pending'),
                const SizedBox(width: 8),
                _buildFilterChip(2, 'Confirmed'),
                const SizedBox(width: 8),
                _buildFilterChip(3, 'Completed'),
              ],
            ),
          ),

          // Bookings List
          Expanded(
            child: StreamBuilder<List<BookingModel>>(
              stream: DatabaseService().getUserBookings(user.id),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  );
                }
                if (snapshot.hasError) {
                  return ErrorStateWidget(
                    message: 'Unable to load your bookings.',
                    onRetry: () => setState(() {}),
                  );
                }
                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return EmptyStateWidget(
                    icon: Icons.receipt_long_outlined,
                    title: 'No Bookings Yet',
                    description: 'You have not booked any temple sevas or darshan slots yet.',
                    actionText: 'Explore Sevas',
                    onAction: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ServicesScreen()),
                      );
                    },
                  );
                }

                var bookings = snapshot.data!;
                if (_selectedFilter == 1) {
                  bookings = bookings.where((b) => b.status.toLowerCase() == 'pending').toList();
                } else if (_selectedFilter == 2) {
                  bookings = bookings.where((b) => b.status.toLowerCase() == 'confirmed').toList();
                } else if (_selectedFilter == 3) {
                  bookings = bookings.where((b) => b.status.toLowerCase() == 'completed').toList();
                }

                if (bookings.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.filter_list_off,
                    title: 'No Bookings Found',
                    description: 'No bookings match the selected status filter.',
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: bookings.length,
                  itemBuilder: (context, index) {
                    final booking = bookings[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 14),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BookingDetailsScreen(booking: booking),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      booking.serviceName,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  StatusBadge(status: booking.status),
                                ],
                              ),
                              const Divider(height: 20),
                              Row(
                                children: [
                                  const Icon(Icons.event, size: 16, color: AppColors.textSecondary),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Darshan Date: ${booking.bookingDate}',
                                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                  const Spacer(),
                                  Text(
                                    booking.formattedTotal,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.people_outline, size: 16, color: AppColors.textSecondary),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${booking.quantity} Devotee(s)',
                                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                  const Spacer(),
                                  Text(
                                    'Ref: ${booking.bookingRef}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textTertiary,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedFilter = index),
      selectedColor: AppColors.primaryLight.withValues(alpha: 0.2),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
      ),
      side: BorderSide(
        color: isSelected ? AppColors.primary : AppColors.cardBorder,
      ),
    );
  }
}
