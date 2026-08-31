import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import '../../widgets/status_badge.dart';
import 'booking_details_screen.dart';
import 'services_screen.dart';
import 'donations_screen.dart';

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
        appBar: AppBar(title: const Text('My History')),
        body: const Center(child: Text('Please log in to view your history.')),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My History'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Bookings'),
              Tab(text: 'Donations'),
            ],
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
          ),
        ),
        body: TabBarView(
          children: [
            _buildBookingsTab(user),
            _buildDonationsTab(user),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingsTab(UserModel user) {
    return Column(
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
                  icon: Icons.confirmation_number_outlined,
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
                                const Icon(Icons.event_available_rounded, size: 16, color: AppColors.primary),
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
                                const Icon(Icons.groups_2_rounded, size: 16, color: AppColors.textSecondary),
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
    );
  }

  Widget _buildDonationsTab(UserModel user) {
    return StreamBuilder<List<DonationModel>>(
      stream: DatabaseService().getUserDonations(user.id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        if (snapshot.hasError) {
          return ErrorStateWidget(
            message: 'Unable to load your donations.',
            onRetry: () => setState(() {}),
          );
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return EmptyStateWidget(
            icon: Icons.volunteer_activism_rounded,
            title: 'No Donations Yet',
            description: 'You have not made any donations to the temple yet.',
            actionText: 'Make a Donation',
            onAction: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DonationsScreen()),
              );
            },
          );
        }

        final donations = snapshot.data!;

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: donations.length,
          itemBuilder: (context, index) {
            final donation = donations[index];
            final dateStr = donation.createdAt != null 
                ? DateFormat('dd MMM yyyy, hh:mm a').format(donation.createdAt!) 
                : 'Unknown Date';

            return Card(
              margin: const EdgeInsets.only(bottom: 14),
              child: InkWell(
                onTap: () {
                  if (donation.status.toLowerCase() == 'completed' || donation.status.toLowerCase() == 'success') {
                    _showReceiptDialog(context, donation);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Receipt not available for ${donation.status} status')),
                    );
                  }
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
                              donation.donationTypeName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          StatusBadge(status: donation.status),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.primary),
                          const SizedBox(width: 6),
                          Text(
                            dateStr,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const Spacer(),
                          Text(
                            '₹${donation.amount}',
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
                          const Icon(Icons.person_rounded, size: 16, color: AppColors.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            donation.donorName,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          if (donation.status.toLowerCase() == 'completed' || donation.status.toLowerCase() == 'success')
                            ...[
                              const Spacer(),
                              const Row(
                                children: [
                                  Icon(Icons.receipt_long_rounded, size: 14, color: AppColors.primary),
                                  SizedBox(width: 4),
                                  Text(
                                    'View Receipt',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ]
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
    );
  }

  void _showReceiptDialog(BuildContext context, DonationModel donation) {
    final dateStr = donation.createdAt != null 
        ? DateFormat('dd MMM yyyy, hh:mm a').format(donation.createdAt!) 
        : 'Unknown Date';

    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.verified_rounded, color: Colors.green, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Donation Receipt',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Tirumala Tirupati Devasthanams',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                
                _buildReceiptRow('Donation Type', donation.donationTypeName),
                _buildReceiptRow('Donor Name', donation.donorName),
                _buildReceiptRow('Date & Time', dateStr),
                
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Amount Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('₹${donation.amount}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primary)),
                  ],
                ),
                const Divider(height: 32),
                
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Transaction Details',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                ),
                const SizedBox(height: 12),
                
                _buildCopyableRow(context, 'Payment ID', donation.razorpayPaymentId ?? donation.paymentId),
                
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Close Receipt'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          ),
          Expanded(
            flex: 3,
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600), textAlign: TextAlign.right),
          ),
        ],
      ),
    );
  }

  Widget _buildCopyableRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          ),
          Expanded(
            flex: 3,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Flexible(
                  child: Text(
                    value, 
                    style: const TextStyle(fontWeight: FontWeight.w600), 
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                InkWell(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: value));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('$label copied'),
                        duration: const Duration(seconds: 2),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  child: const Icon(Icons.copy_rounded, size: 16, color: AppColors.primary),
                ),
              ],
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
