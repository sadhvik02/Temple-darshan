import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class BookingSuccessScreen extends StatelessWidget {
  final String bookingRef;
  final ServiceModel service;
  final SlotModel? slot;
  final int quantity;
  final num totalAmount;
  final String date;

  const BookingSuccessScreen({
    super.key,
    required this.bookingRef,
    required this.service,
    required this.slot,
    required this.quantity,
    required this.totalAmount,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.popUntil(context, (route) => route.isFirst);
      },
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                // Success Badge / Icon
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.statusConfirmedBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.statusConfirmed.withValues(alpha: 0.3), width: 2),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.check_circle_rounded,
                      size: 60,
                      color: AppColors.statusConfirmed,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Booking Confirmed!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your seva darshan booking has been recorded.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),

                // Booking Reference Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'BOOKING REFERENCE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            bookingRef,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 1.2,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.copy, size: 20, color: AppColors.primary),
                            tooltip: 'Copy Reference',
                            onPressed: () {
                              Clipboard.setData(ClipboardData(text: bookingRef));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Booking reference copied to clipboard'),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Please present this code at the temple seva counter.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Summary Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Seva Details',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            StatusBadge(status: 'pending'),
                          ],
                        ),
                        const Divider(height: 24),
                        _buildRow('Seva Name', service.name),
                        _buildRow('Date', date),
                        if (slot != null)
                          _buildRow('Time Slot', slot!.timeRange),
                        _buildRow('Devotee Count', '$quantity Person(s)'),
                        _buildRow(
                          'Total Dakshina',
                          totalAmount > 0 ? '₹$totalAmount' : 'Free',
                          isBold: true,
                          valueColor: AppColors.primary,
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.statusPendingBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.info_outline, size: 16, color: AppColors.statusPending),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Dakshina/Payment to be offered at the counter.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.statusPending,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Actions
                CustomButton(
                  text: 'BACK TO HOME',
                  icon: Icons.home,
                  onPressed: () {
                    Navigator.popUntil(context, (route) => route.isFirst);
                  },
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
