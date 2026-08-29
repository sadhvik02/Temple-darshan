import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import 'booking_success_screen.dart';

class BookingScreen extends StatefulWidget {
  final ServiceModel service;
  final SlotModel slot;

  const BookingScreen({super.key, required this.service, required this.slot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _quantity = 1;
  bool _isLoading = false;

  Future<void> _submitBooking() async {
    final user = context.read<AuthProvider>().userModel;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to complete your booking.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final refCode = await DatabaseService().createBooking(
        userId: user.id,
        service: widget.service,
        slot: widget.slot,
        quantity: _quantity,
        date: widget.slot.date,
      );

      if (!mounted) return;

      final totalAmount = widget.service.price * _quantity;

      // Navigate to dedicated BookingSuccessScreen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookingSuccessScreen(
            bookingRef: refCode,
            service: widget.service,
            slot: widget.slot,
            quantity: _quantity,
            totalAmount: totalAmount,
            date: widget.slot.date,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception:', '').trim()),
          backgroundColor: AppColors.statusCancelled,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;
    final available = widget.slot.available;
    final maxAllowed = available > 10 ? 10 : available;
    final totalAmount = widget.service.price * _quantity;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review & Confirm Seva'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Devotee Information Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.person_pin_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Devotee Information',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildRow('Devotee Name', user?.name ?? 'Devotee'),
                    _buildRow('Phone Number', user?.phone ?? '—'),
                    if (user?.email != null && user!.email!.isNotEmpty)
                      _buildRow('Email Address', user.email!),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Seva & Slot Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.event_seat_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Seva & Darshan Details',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildRow('Seva Name', widget.service.name),
                    _buildRow('Darshan Date', widget.slot.date),
                    _buildRow('Time Slot', widget.slot.timeRange),
                    _buildRow('Dakshina / Person', widget.service.formattedPrice),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quantity & Pricing Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Number of Devotees / Persons',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.cardBorder),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove, size: 20),
                                color: _quantity > 1 ? AppColors.primary : AppColors.textTertiary,
                                onPressed: _quantity > 1
                                    ? () => setState(() => _quantity--)
                                    : null,
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                                child: Text(
                                  '$_quantity',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add, size: 20),
                                color: _quantity < maxAllowed
                                    ? AppColors.primary
                                    : AppColors.textTertiary,
                                onPressed: _quantity < maxAllowed
                                    ? () => setState(() => _quantity++)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '$available spots left',
                          style: const TextStyle(
                            color: AppColors.statusConfirmed,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Dakshina',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          totalAmount > 0 ? '₹$totalAmount' : 'Free',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Dakshina is collected at the temple counter upon arrival.',
                      style: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Confirm Button
            CustomButton(
              text: 'CONFIRM BOOKING',
              icon: Icons.check_circle_outline,
              onPressed: _submitBooking,
              isLoading: _isLoading,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
