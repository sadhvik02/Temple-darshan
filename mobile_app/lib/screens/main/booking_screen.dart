import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/payment_processing_dialog.dart';
import 'booking_success_screen.dart';
import 'payment_failure_screen.dart';

import 'package:cloud_functions/cloud_functions.dart';

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
  final SlotModel? slot;
  final List<Map<String, String>>? recurringOccurrences;

  const BookingScreen({
    super.key,
    required this.service,
    this.slot,
    this.recurringOccurrences,
  });

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
  void initState() {
    super.initState();
  }

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
    final available = widget.slot?.available ?? 50;
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

    final List<Map<String, String>> devoteeList = _devotees.map((entry) {
      return {
        'name': entry.nameController.text.trim(),
        'phone': entry.phoneController.text.trim(),
      };
    }).toList();

    final primaryName = _devotees.first.nameController.text.trim();
    final primaryPhone = _devotees.first.phoneController.text.trim();
    final expectedTotal = widget.service.price * _quantity;

    PaymentProcessingDialog.show(context, stateNotifier: _paymentStateNotifier);

    try {
      if (widget.service.category == 'ashrama_seva') {
        // FREE ASHRAMA SEVA FLOW (One-time or Recurring)
        List<Map<String, String>> occurrences = [];
        
        if (widget.recurringOccurrences != null) {
          occurrences = widget.recurringOccurrences!;
        } else if (widget.slot != null) {
          occurrences = [{
            'slotId': widget.slot!.id,
            'date': widget.slot!.date,
            'timeRange': widget.slot!.timeRange,
          }];
        } else {
          throw Exception("Missing booking schedule.");
        }

        final HttpsCallable callable = FirebaseFunctions.instance.httpsCallable('bookFreeSeva');
        final response = await callable.call({
          'serviceId': widget.service.id,
          'serviceName': widget.service.name,
          'quantity': _quantity,
          'devotees': devoteeList,
          'donorName': primaryName,
          'donorPhone': primaryPhone,
          'donorEmail': user.email,
          'occurrences': occurrences,
        });

        if (!mounted) return;
        PaymentProcessingDialog.hide(context);

        if (response.data != null && response.data['success'] == true) {
          final List<dynamic> refs = response.data['bookingRefs'] ?? [];
          final bookingRefStr = refs.isNotEmpty ? refs[0].toString() : 'BK-VERIFIED';

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => BookingSuccessScreen(
                bookingRef: bookingRefStr,
                service: widget.service,
                slot: widget.slot ?? SlotModel(
                  id: 'recurring',
                  serviceId: widget.service.id,
                  date: occurrences.first['date'] ?? '',
                  startTime: occurrences.first['timeRange']?.split(" - ")[0] ?? '',
                  endTime: occurrences.first['timeRange']?.split(" - ")[1] ?? '',
                  capacity: 50,
                  bookedCount: 0,
                  isActive: true,
                ),
                quantity: _quantity,
                totalAmount: 0,
                date: widget.recurringOccurrences != null 
                    ? 'Recurring (${occurrences.length} months)' 
                    : occurrences.first['date'] ?? '',
              ),
            ),
          );
        } else {
          throw Exception("Booking failed to process.");
        }
      } else {
        // PAID FLOW (Darshan etc)
        final result = await PaymentService().startSevaPayment(
          serviceId: widget.service.id,
          serviceName: widget.service.name,
          slotId: widget.slot!.id,
          date: widget.slot!.date,
          timeRange: widget.slot!.timeRange,
          quantity: _quantity,
          expectedTotal: expectedTotal,
          devoteeDetails: devoteeList,
          donorName: primaryName,
          donorPhone: primaryPhone,
          donorEmail: user.email,
          onStateChange: (state) {
            _paymentStateNotifier.value = state;
          }
        );

        if (!mounted) return;
        PaymentProcessingDialog.hide(context);

        if (result.isSuccess) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => BookingSuccessScreen(
                bookingRef: result.bookingRef ?? 'BK-VERIFIED',
                service: widget.service,
                slot: widget.slot!,
                quantity: _quantity,
                totalAmount: expectedTotal.toDouble(),
                date: widget.slot!.date,
              ),
            ),
          );
        } else if (result.isCancelled) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message ?? 'Payment cancelled.'),
              backgroundColor: AppColors.textSecondary,
            ),
          );
        } else {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => PaymentFailureScreen(
                type: result.isVerificationFailed ? FailureType.verificationFailed : (result.isNetworkError ? FailureType.networkError : FailureType.failed),
                title: widget.service.name,
                message: result.message,
                paymentId: result.paymentId,
                orderId: result.orderId,
                totalAmount: expectedTotal.toDouble(),
                onRetry: () => _submitBooking(),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      PaymentProcessingDialog.hide(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception:', '').trim()),
          backgroundColor: AppColors.statusCancelled,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final available = widget.slot?.available ?? 50;
    final maxAllowed = available > 10 ? 10 : available;
    final totalAmount = widget.service.price * _quantity;
    final isFree = widget.service.category == 'ashrama_seva';

    return Scaffold(
      appBar: AppBar(
        title: Text(isFree ? 'Review & Confirm Seva' : 'Review & Pay'),
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            widget.service.name,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ),
                        if (!isFree)
                          Text(
                            '₹${widget.service.price}',
                            style: const TextStyle(
                              fontSize: 18, 
                              fontWeight: FontWeight.bold, 
                              color: AppColors.primary
                            ),
                          )
                        else
                          const Text(
                            'FREE',
                            style: TextStyle(
                              fontSize: 18, 
                              fontWeight: FontWeight.bold, 
                              color: Color(0xFF2E7D32)
                            ),
                          )
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: AppColors.divider),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 8),
                        Text(
                          widget.recurringOccurrences != null 
                              ? 'Recurring (${widget.recurringOccurrences!.length} months)' 
                              : widget.slot?.date ?? '',
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 8),
                        Text(
                          widget.recurringOccurrences != null 
                              ? widget.recurringOccurrences!.first['timeRange'] ?? ''
                              : widget.slot?.timeRange ?? '',
                          style: const TextStyle(color: AppColors.textSecondary),
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

            // 4. Booking Summary & Pay Button
            if (!isFree)
              Container(
                margin: const EdgeInsets.only(top: 20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    )
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                        Text(
                          '₹$totalAmount',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Proceed to Pay',
                      isLoading: _isLoading,
                      onPressed: _submitBooking,
                    ),
                  ],
                ),
              )
            else
              Container(
                margin: const EdgeInsets.only(top: 20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF2E7D32).withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total Amount', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                        Text(
                          'FREE',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Confirm Seva Booking',
                      isLoading: _isLoading,
                      backgroundColor: const Color(0xFF2E7D32),
                      onPressed: _submitBooking,
                    ),
                  ],
                ),
              )
          ],
        ),
      ),
    );
  }
}
