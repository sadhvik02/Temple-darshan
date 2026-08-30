import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../root_wrapper.dart';
import 'my_bookings_screen.dart';

enum SuccessType {
  seva,
  darshan,
  donation,
}

class PaymentSuccessScreen extends StatelessWidget {
  final SuccessType type;
  final String title;
  final String? bookingRef;
  final String? donationRef;
  final String? paymentId;
  final String? date;
  final String? time;
  final int? quantity;
  final num amount;
  final String? donorName;

  const PaymentSuccessScreen({
    super.key,
    required this.type,
    required this.title,
    this.bookingRef,
    this.donationRef,
    this.paymentId,
    this.date,
    this.time,
    this.quantity,
    required this.amount,
    this.donorName,
  });

  @override
  Widget build(BuildContext context) {
    final isDonation = type == SuccessType.donation;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _goToHome(context);
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text(isDonation ? 'Donation Confirmed' : 'Booking Confirmed'),
          centerTitle: true,
        ),
        body: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            // Success Icon & Header
            Center(
              child: Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF81C784), width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2E7D32).withValues(alpha: 0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFF2E7D32),
                      size: 54,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isDonation ? 'Donation Successful!' : 'Payment Successful!',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isDonation
                        ? 'May the divine blessings always be upon you and your family.'
                        : 'Your sacred darshan slot has been verified and reserved.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Reference & Summary Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Reference Tag
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isDonation ? 'Donation Ref' : 'Booking Ref',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          isDonation ? (donationRef ?? '—') : (bookingRef ?? '—'),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 24),

                  _buildDetailRow('Offering / Purpose', title),

                  if (donorName != null && donorName!.isNotEmpty)
                    _buildDetailRow('Devotee Name', donorName!),

                  if (date != null && date!.isNotEmpty)
                    _buildDetailRow('Date', date!),

                  if (time != null && time!.isNotEmpty)
                    _buildDetailRow('Time Slot', time!),

                  if (quantity != null && quantity! > 0)
                    _buildDetailRow('Persons / Quantity', '$quantity'),

                  if (paymentId != null && paymentId!.isNotEmpty)
                    _buildDetailRow('Payment ID', paymentId!),

                  _buildDetailRow('Payment Status', 'Paid', valueColor: const Color(0xFF2E7D32)),

                  const Divider(height: 24),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Amount Paid',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        '₹$amount',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Action Buttons
            if (!isDonation) ...[
              ElevatedButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MainNavigator(),
                    ),
                    (route) => false,
                  );
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.confirmation_number_rounded, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'View My Bookings',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            OutlinedButton(
              onPressed: () => _goToHome(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.home_rounded, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Go to Home',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _goToHome(BuildContext context) {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const MainNavigator()),
      (route) => false,
    );
  }
}
