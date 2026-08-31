import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../services/payment_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import '../../widgets/payment_processing_dialog.dart';
import 'payment_failure_screen.dart';
import 'booking_success_screen.dart';

class DarshanScreen extends StatelessWidget {
  const DarshanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Darshan'),
      ),
      body: StreamBuilder<List<DarshanModel>>(
        stream: DatabaseService().getActiveDarshans(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            );
          }

          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Failed to load darshan types.',
              onRetry: () {
                // StreamBuilder automatically handles reconnection
                (context as Element).markNeedsBuild();
              },
            );
          }

          final darshans = snapshot.data ?? [];

          if (darshans.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.temple_hindu_rounded,
              title: 'No Darshan Available',
              description: 'Darshan options will appear here once added.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: darshans.length,
            itemBuilder: (context, index) => _DarshanCard(darshan: darshans[index]),
          );
        },
      ),
    );
  }
}

class _DarshanCard extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanCard({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => _DarshanDetailScreen(darshan: darshan),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Image
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: darshan.imageUrl != null && darshan.imageUrl!.isNotEmpty
                      ? CustomImage(imageUrl: darshan.imageUrl!, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.primaryLight.withValues(alpha: 0.15),
                          child: const Icon(Icons.temple_hindu_rounded, color: AppColors.primary, size: 32),
                        ),
                ),
              ),
              const SizedBox(width: 16),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      darshan.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      darshan.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      darshan.formattedPrice,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}

/// Detail screen for a specific darshan type.
/// Shows darshan info, available slots, and a "Payment Coming Soon" stop.
class _DarshanDetailScreen extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanDetailScreen({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(darshan.name),
      ),
      body: Column(
        children: [
          // Darshan info header
          if (darshan.imageUrl != null && darshan.imageUrl!.isNotEmpty)
            SizedBox(
              height: 200,
              width: double.infinity,
              child: CustomImage(imageUrl: darshan.imageUrl!, fit: BoxFit.cover),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  darshan.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  darshan.description,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.currency_rupee, size: 18, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      darshan.formattedPrice,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Slots section
          Expanded(
            child: darshan.bookingEnabled
                ? _DarshanSlotsSection(darshan: darshan)
                : const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.event_busy_rounded, size: 56, color: AppColors.textTertiary),
                          SizedBox(height: 16),
                          Text(
                            'Online booking is not available for this darshan.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DarshanSlotsSection extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanSlotsSection({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<SlotModel>>(
      stream: DatabaseService().getActiveSlotsForService(darshan.id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
          );
        }

        final slots = snapshot.data ?? [];

        if (slots.isEmpty) {
          return const EmptyStateWidget(
            icon: Icons.calendar_today_rounded,
            title: 'No Slots Available',
            description: 'There are no available darshan slots at this time.',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: slots.length,
          itemBuilder: (context, index) {
            final slot = slots[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: Icon(
                  Icons.access_time_rounded,
                  color: slot.isFull ? AppColors.textTertiary : AppColors.primary,
                ),
                title: Text(
                  '${slot.date}  •  ${slot.timeRange}',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: slot.isFull ? AppColors.textTertiary : AppColors.textPrimary,
                  ),
                ),
                subtitle: Text(
                  slot.isFull ? 'Fully booked' : '${slot.available} spots available',
                  style: TextStyle(
                    color: slot.isFull ? AppColors.statusCancelled : AppColors.statusConfirmed,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
                trailing: slot.isFull
                    ? const Text('Full', style: TextStyle(color: AppColors.textTertiary))
                    : const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.primary),
                onTap: slot.isFull
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => _DarshanReviewScreen(darshan: darshan, slot: slot),
                          ),
                        );
                      },
              ),
            );
          },
        );
      },
    );
  }
}

class _DarshanDevoteeEntry {
  final TextEditingController nameController;
  final TextEditingController phoneController;

  _DarshanDevoteeEntry({
    required this.nameController,
    required this.phoneController,
  });

  void dispose() {
    nameController.dispose();
    phoneController.dispose();
  }
}

/// Darshan Review Screen — shows darshan + slot details, dynamic multi-devotee selection,
/// and securely processes Darshan payment through PaymentService.
class _DarshanReviewScreen extends StatefulWidget {
  final DarshanModel darshan;
  final SlotModel slot;

  const _DarshanReviewScreen({required this.darshan, required this.slot});

  @override
  State<_DarshanReviewScreen> createState() => _DarshanReviewScreenState();
}

class _DarshanReviewScreenState extends State<_DarshanReviewScreen> {
  int _quantity = 1;
  bool _isLoading = false;
  final List<_DarshanDevoteeEntry> _devotees = [];
  bool _isInitialized = false;
  final ValueNotifier<PaymentUIState> _paymentStateNotifier = ValueNotifier(PaymentUIState.idle);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      final user = context.read<AuthProvider>().userModel;
      _devotees.add(
        _DarshanDevoteeEntry(
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
    final available = widget.slot.available > 0 ? widget.slot.available : 50;
    final maxAllowed = available > 10 ? 10 : available;
    if (newQty > maxAllowed) return;

    setState(() {
      if (newQty > _quantity) {
        for (int i = _quantity; i < newQty; i++) {
          _devotees.add(
            _DarshanDevoteeEntry(
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
    final expectedTotal = widget.darshan.price * _quantity;

    PaymentProcessingDialog.show(context, stateNotifier: _paymentStateNotifier);

    try {
      final result = await PaymentService().startDarshanPayment(
        darshanId: widget.darshan.id,
        darshanName: widget.darshan.name,
        slotId: widget.slot.id,
        date: widget.slot.date,
        timeRange: widget.slot.timeRange,
        quantity: _quantity,
        expectedTotal: expectedTotal,
        devoteeDetails: devoteeList,
        devoteeName: primaryName,
        devoteePhone: primaryPhone,
        devoteeEmail: user.email,
        onStateChange: (state) {
          _paymentStateNotifier.value = state;
        },
      );

      if (!mounted) return;
      PaymentProcessingDialog.hide(context);

      if (result.isSuccess) {
        final serviceMock = ServiceModel(
          id: widget.darshan.id,
          name: widget.darshan.name,
          description: widget.darshan.description,
          price: widget.darshan.price,
          bookingEnabled: true,
        );

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingSuccessScreen(
              bookingRef: result.bookingRef ?? 'BK-VERIFIED',
              service: serviceMock,
              slot: widget.slot,
              quantity: _quantity,
              totalAmount: expectedTotal.toDouble(),
              date: widget.slot.date,
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
              type: result.isVerificationFailed
                  ? FailureType.verificationFailed
                  : (result.isNetworkError ? FailureType.networkError : FailureType.failed),
              title: widget.darshan.name,
              message: result.message,
              paymentId: result.paymentId,
              orderId: result.orderId,
              totalAmount: expectedTotal.toDouble(),
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
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final available = widget.slot.available > 0 ? widget.slot.available : 50;
    final maxAllowed = available > 10 ? 10 : available;
    final totalAmount = widget.darshan.price * _quantity;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Darshan Booking'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Darshan & Slot Details Card
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
                    const Row(
                      children: [
                        Icon(Icons.temple_hindu_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Darshan Details',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildRow('Darshan', widget.darshan.name),
                    _buildRow('Date', widget.slot.date),
                    _buildRow('Time', widget.slot.timeRange),
                    _buildRow('Price / Person', widget.darshan.formattedPrice),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 2. Number of Devotees Counter Card
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
                    const Text(
                      'Number of Devotees',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
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
                                icon: const Icon(Icons.remove_rounded, size: 20),
                                color: _quantity > 1 ? AppColors.primary : AppColors.textTertiary,
                                onPressed: _quantity > 1 ? () => _updateQuantity(_quantity - 1) : null,
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Text(
                                  '$_quantity',
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_rounded, size: 20),
                                color: _quantity < maxAllowed ? AppColors.primary : AppColors.textTertiary,
                                onPressed: _quantity < maxAllowed ? () => _updateQuantity(_quantity + 1) : null,
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
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 3. Dynamic Devotee Information Section
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
                          labelText: index == 0 ? 'Contact Phone Number *' : 'Phone Number (Optional)',
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
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total Dakshina Amount',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                    Text(
                      totalAmount > 0 ? '₹$totalAmount' : 'Free',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // 5. Pay Now Button
            CustomButton(
              text: 'PAY NOW (₹$totalAmount)',
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
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

