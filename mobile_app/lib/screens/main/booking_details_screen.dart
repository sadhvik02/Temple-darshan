import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/status_badge.dart';

class BookingDetailsScreen extends StatelessWidget {
  final BookingModel booking;

  const BookingDetailsScreen({super.key, required this.booking});

  bool get isDarshan => booking.sourceType.toLowerCase() == 'darshan';
  String get offeringTypeLabel => isDarshan ? 'Darshan' : 'Seva';

  String get instructionsTitle => isDarshan ? 'Darshan Instructions' : 'Seva Instructions';
  String get instructionsBody => isDarshan 
    ? '• Show this booking reference at the darshan entrance.\n'
      '• Arrive 15 minutes prior to the slot timing.\n'
      '• Follow temple sanctity and traditional dress etiquette.'
    : '• Show this booking reference at the seva verification counter.\n'
      '• Arrive 15 minutes prior to the seva timing.\n'
      '• Follow temple sanctity and traditional dress etiquette.';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Reference Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Booking Status',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      StatusBadge(status: booking.status),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'REFERENCE NUMBER',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textTertiary,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            booking.bookingRef,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy_rounded, color: AppColors.primary),
                        tooltip: 'Copy Reference',
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: booking.bookingRef));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Reference copied to clipboard'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Offering Information Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$offeringTypeLabel Information',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Divider(height: 24),
                    _buildRow(offeringTypeLabel, booking.serviceName),
                    _buildRow('Date', booking.bookingDate),
                    _buildRow('Devotees', '${booking.quantity} Person(s)'),
                    _buildRow(
                      'Total Amount',
                      booking.formattedTotal,
                      isBold: true,
                      valueColor: AppColors.primary,
                    ),
                    _buildRow('Payment', booking.paymentStatus.toUpperCase()),
                    if (booking.createdAt != null)
                      _buildRow(
                        'Booked On',
                        '${booking.createdAt!.day.toString().padLeft(2, '0')}/${booking.createdAt!.month.toString().padLeft(2, '0')}/${booking.createdAt!.year}',
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Devotee Details Cards
            ..._buildDevoteeCards(),

            // Instructions Card
            Card(
              color: AppColors.surfaceVariant.withValues(alpha: 0.5),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.temple_hindu, size: 20, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          instructionsTitle,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      instructionsBody,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildDevoteeCards() {
    if (booking.devotees == null || booking.devotees!.isEmpty) {
      return [];
    }

    List<Widget> cards = [];
    for (int i = 0; i < booking.devotees!.length; i++) {
      final dev = booking.devotees![i];
      if (dev is! Map) continue;
      
      final Map<String, dynamic> devoteeData = Map<String, dynamic>.from(dev);

      cards.add(
        Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_rounded, size: 20, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      'DEVOTEE ${i + 1}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                if (devoteeData['devoteeId'] != null && devoteeData['devoteeId'].toString().isNotEmpty)
                  _buildRow('Ticket ID', devoteeData['devoteeId'].toString(), isBold: true, valueColor: AppColors.primary),
                if (devoteeData['name'] != null && devoteeData['name'].toString().isNotEmpty) 
                  _buildRow('Full Name', devoteeData['name'].toString()),
                if (devoteeData['age'] != null && devoteeData['age'].toString().isNotEmpty) 
                  _buildRow('Age', devoteeData['age'].toString()),
                if (devoteeData['gender'] != null && devoteeData['gender'].toString().isNotEmpty) 
                  _buildRow('Gender', devoteeData['gender'].toString()),
                if (devoteeData['gothram'] != null && devoteeData['gothram'].toString().isNotEmpty) 
                  _buildRow('Gothram', devoteeData['gothram'].toString()),
                if (devoteeData['phone'] != null && devoteeData['phone'].toString().isNotEmpty) 
                  _buildRow('Phone', devoteeData['phone'].toString()),
                if (devoteeData['email'] != null && devoteeData['email'].toString().isNotEmpty) 
                  _buildRow('Email', devoteeData['email'].toString()),
              ],
            ),
          ),
        ),
      );
    }
    return cards;
  }

  Widget _buildRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
