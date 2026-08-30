import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/payment_processing_dialog.dart';
import 'payment_failure_screen.dart';
import 'payment_success_screen.dart';

class DevoteeEntry {
  final TextEditingController nameController;
  final TextEditingController phoneController;

  DevoteeEntry({
    required this.nameController,
    required this.phoneController,
  });

  void dispose() {
    nameController.dispose();
    phoneController.dispose();
  }
}

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
  final List<DevoteeEntry> _devotees = [];
  bool _isInitialized = false;
  final ValueNotifier<PaymentUIState> _paymentStateNotifier = ValueNotifier(PaymentUIState.idle);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      final user = context.read<AuthProvider>().userModel;
      _devotees.add(
        DevoteeEntry(
          nameController: TextEditingController(text: user?.name ?? ''),
          phoneController: TextEditingController(text: user?.phone ?? ''),
        ),
      );
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    for (final d in _devotees) {
      d.dispose();
    }
    _paymentStateNotifier.dispose();
    super.dispose();
  }

  void _updateQuantity(int newQty) {
    if (newQty < 1) return;
    final available = widget.slot.available;
    final maxAllowed = available > 10 ? 10 : (available > 0 ? available : 10);
    if (newQty > maxAllowed) return;

    setState(() {
      if (newQty > _quantity) {
        for (int i = _quantity; i < newQty; i++) {
          _devotees.add(
            DevoteeEntry(
              nameController: TextEditingController(),
              phoneController: TextEditingController(),
            ),
          );
        }
      } else if (newQty < _quantity) {
        for (int i = _quantity - 1; i >= newQty; i--) {
          _devotees[i].dispose();
          _devotees.removeAt(i);
        }
      }
      _quantity = newQty;
    });
  }

  Future<void> _submitBooking() async {
    if (_isLoading || PaymentService().isProcessing) return;

    final user = context.read<AuthProvider>().userModel;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to complete your booking.')),
      );
      return;
    }

    // Validate Devotee Inputs
    for (int i = 0; i < _devotees.length; i++) {
      final name = _devotees[i].nameController.text.trim();
      final phone = _devotees[i].phoneController.text.trim();

      if (name.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Please enter the name for Devotee ${i + 1}.'),
            backgroundColor: AppColors.statusCancelled,
          ),
        );
        return;
      }

      if (i == 0 && phone.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please enter a valid contact phone number for Primary Devotee.'),
            backgroundColor: AppColors.statusCancelled,
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    final totalAmount = widget.service.price * _quantity;
    final primaryName = _devotees.first.nameController.text.trim();
    final primaryPhone = _devotees.first.phoneController.text.trim();

    final List<Map<String, String>> devoteeList = _devotees.map((entry) {
      return {
        'name': entry.nameController.text.trim(),
        'phone': entry.phoneController.text.trim(),
      };
    }).toList();

    // Show non-dismissible devotional processing modal
    PaymentProcessingDialog.show(context, stateNotifier: _paymentStateNotifier);

    try {
      final PaymentResult result = await PaymentService().startSevaPayment(
        serviceId: widget.service.id,
        serviceName: widget.service.name,
        slotId: widget.slot.id,
        date: widget.slot.date,
        timeRange: widget.slot.timeRange,
        quantity: _quantity,
        expectedTotal: totalAmount,
        devoteeDetails: devoteeList,
        donorName: primaryName,
        donorPhone: primaryPhone,
        donorEmail: user.email,
        onStateChange: (state) {
          _paymentStateNotifier.value = state;
        },
      );

      if (!mounted) return;
      PaymentProcessingDialog.hide(context);

      if (result.isSuccess) {
        // Backend verified payment & created booking
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentSuccessScreen(
              type: SuccessType.seva,
              title: widget.service.name,
              bookingRef: result.bookingRef,
              paymentId: result.paymentId,
              date: widget.slot.date,
              time: widget.slot.timeRange,
              quantity: _quantity,
              amount: totalAmount,
              donorName: primaryName,
            ),
          ),
        );
      } else if (result.isRefundNeeded) {
        // Slot unavailable after payment -> Refund required
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentFailureScreen(
              type: FailureType.refundRequired,
              title: widget.service.name,
              paymentId: result.paymentId,
              orderId: result.orderId,
              totalAmount: totalAmount,
            ),
          ),
        );
      } else if (result.isCancelled) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message ?? 'Payment was cancelled.'),
            backgroundColor: AppColors.textSecondary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        // Gateway or verification failure
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentFailureScreen(
              type: result.isVerificationFailed
                  ? FailureType.verificationFailed
                  : (result.isNetworkError ? FailureType.networkError : FailureType.failed),
              title: widget.service.name,
              message: result.message,
              paymentId: result.paymentId,
              orderId: result.orderId,
              totalAmount: totalAmount,
              onRetry: () => _submitBooking(),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      PaymentProcessingDialog.hide(context);
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
    final available = widget.slot.available > 0 ? widget.slot.available : 50;
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
            // 1. Seva & Slot Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.spa_rounded, color: AppColors.primary, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.service.name,
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${widget.slot.date} • ${widget.slot.timeRange}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // 2. Number of Devotees Counter
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Number of Persons',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Dakshina: ${widget.service.formattedPrice} per person',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_rounded),
                            color: _quantity > 1 ? AppColors.primary : AppColors.textTertiary,
                            onPressed: _quantity > 1 ? () => _updateQuantity(_quantity - 1) : null,
                          ),
                          Text(
                            '$_quantity',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_rounded),
                            color: _quantity < maxAllowed ? AppColors.primary : AppColors.textTertiary,
                            onPressed: _quantity < maxAllowed ? () => _updateQuantity(_quantity + 1) : null,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // 3. Devotee Details Input Section
            Text(
              'Devotee Details ($_quantity ${_quantity == 1 ? 'Person' : 'Persons'})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 10),

            ..._devotees.asMap().entries.map((entry) {
              final index = entry.key;
              final devotee = entry.value;

              return Card(
                elevation: 1,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AppColors.cardBorder),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            index == 0 ? 'Primary Devotee (You)' : 'Devotee ${index + 1}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: devotee.nameController,
                        decoration: InputDecoration(
                          labelText: 'Full Name *',
                          hintText: 'Enter devotee full name',
                          isDense: true,
                          prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: devotee.phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: index == 0 ? 'Phone Number *' : 'Phone Number (Optional)',
                          hintText: 'Enter 10-digit mobile number',
                          isDense: true,
                          prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),

            const SizedBox(height: 12),

            // 4. Payment Summary Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Dakshina',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '₹$totalAmount',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Icon(Icons.lock_rounded, size: 14, color: AppColors.textSecondary),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Secured via Temple Payment Gateway (Razorpay)',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // 5. Pay Now Button (Protected against double taps)
            CustomButton(
              text: 'Pay ₹$totalAmount & Confirm',
              isLoading: _isLoading,
              onPressed: _isLoading ? null : _submitBooking,
            ),
          ],
        ),
      ),
    );
  }
}
