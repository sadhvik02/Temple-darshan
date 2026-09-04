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
import 'slots_screen.dart';

class DarshanScreen extends StatelessWidget {
  const DarshanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Darshan Seva'),
        elevation: 0,
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
                (context as Element).markNeedsBuild();
              },
            );
          }

          final darshans = snapshot.data ?? [];

          if (darshans.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.temple_hindu_rounded,
              title: 'No Darshan Available',
              description: 'Darshan options will appear here once scheduled by the temple.',
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Devotional Header Hero Banner
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFF3E0), Color(0xFFFFE0B2)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFFFCC80), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withValues(alpha: 0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Image.asset(
                          'assets/icons/darshan_selected.png',
                          width: 32,
                          height: 32,
                        ),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Divine Darshan Booking',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFE65100),
                                letterSpacing: -0.3,
                              ),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'Reserve fast-track passes & special entry slots in advance.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5D4037),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 2. Darshan Offerings List
                ...darshans.map((d) => _DarshanCard(darshan: d)),

                const SizedBox(height: 10),

                // 3. Pilgrim Guidelines Note
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 18),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Traditional temple attire is mandatory. Please bring your digital pass on the booking date.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => SlotsScreen(
                  service: ServiceModel(
                    id: darshan.id,
                    name: darshan.name,
                    description: darshan.description,
                    price: darshan.price,
                    bookingEnabled: darshan.bookingEnabled,
                    category: 'darshan',
                    imageUrl: darshan.imageUrl,
                  ),
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon / Image Container
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFF3E0), Color(0xFFFFE0B2)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFFCC80), width: 1),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: darshan.imageUrl != null && darshan.imageUrl!.isNotEmpty
                            ? CustomImage(imageUrl: darshan.imageUrl!, fit: BoxFit.cover)
                            : Center(
                                child: Image.asset(
                                  'assets/icons/darshan_selected.png',
                                  width: 36,
                                  height: 36,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Title & Fast-Track Badge
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                darshan.name,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE8F5E9),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFA5D6A7)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.bolt_rounded, size: 12, color: Color(0xFF2E7D32)),
                                    SizedBox(width: 2),
                                    Text(
                                      'Fast Track',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF2E7D32),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            darshan.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Divider(height: 24, color: Color(0xFFF5F5F5)),

                // Price & Action Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Dakshina / Devotee',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textTertiary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          darshan.formattedPrice,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFE65100),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.accent],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Select Slots',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, size: 15, color: Colors.white),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
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
class DarshanReviewScreen extends StatefulWidget {
  final DarshanModel darshan;
  final SlotModel slot;

  const DarshanReviewScreen({super.key, required this.darshan, required this.slot});

  @override
  State<DarshanReviewScreen> createState() => DarshanReviewScreenState();
}

class DarshanReviewScreenState extends State<DarshanReviewScreen> {
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
                                category: 'darshan',
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
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Darshan & Slot Details Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF3E0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Image.asset('assets/icons/darshan_selected.png', width: 22, height: 22),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Darshan Pass Summary',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 22, color: Color(0xFFF5F5F5)),
                  _buildRow('Darshan Type', widget.darshan.name),
                  _buildRow('Date of Visit', widget.slot.date),
                  _buildRow('Timing Slot', widget.slot.timeRange),
                  _buildRow('Dakshina / Person', widget.darshan.formattedPrice),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Number of Devotees Counter Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Number of Devotees',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAFAFA),
                          border: Border.all(color: const Color(0xFFFFCC80)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_rounded, size: 20),
                              color: _quantity > 1 ? const Color(0xFFE65100) : AppColors.textTertiary,
                              onPressed: _quantity > 1 ? () => _updateQuantity(_quantity - 1) : null,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              child: Text(
                                '$_quantity',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFE65100),
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_rounded, size: 20),
                              color: _quantity < maxAllowed ? const Color(0xFFE65100) : AppColors.textTertiary,
                              onPressed: _quantity < maxAllowed ? () => _updateQuantity(_quantity + 1) : null,
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F5E9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFA5D6A7)),
                        ),
                        child: Text(
                          '$available spots left',
                          style: const TextStyle(
                            color: Color(0xFF2E7D32),
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // 3. Dynamic Devotee Information Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Devotee Details ($_quantity ${_quantity == 1 ? 'Person' : 'Persons'})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const Text(
                    'All Fields Required *',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            ..._devotees.asMap().entries.map((entry) {
              final index = entry.key;
              final devotee = entry.value;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: const Color(0xFFFFF3E0),
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFE65100),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          index == 0 ? 'Primary Devotee (You)' : 'Devotee ${index + 1}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
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
                        prefixIcon: const Icon(Icons.person_outline_rounded, size: 20, color: AppColors.primary),
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
                        prefixIcon: const Icon(Icons.phone_outlined, size: 20, color: AppColors.primary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 6),

            // 4. Payment Summary Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFF8E1), Color(0xFFFFECB3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFFD54F), width: 1.2),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Dakshina',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF795548),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$_quantity Devotee(s) × ${widget.darshan.formattedPrice}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF8D6E63),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    totalAmount > 0 ? '₹$totalAmount' : 'Free',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFE65100),
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // 5. Pay Now Button
            CustomButton(
              text: 'PAY NOW (₹$totalAmount)',
              icon: Icons.lock_outline_rounded,
              onPressed: _confirmAndPay,
              isLoading: _isLoading,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _confirmAndPay() {
    final user = context.read<AuthProvider>().userModel;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to complete your booking.')),
      );
      return;
    }

    // Validate Devotee Inputs first
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

    final expectedTotal = widget.darshan.price * _quantity;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Image.asset('assets/icons/darshan_selected.png', width: 24, height: 24),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Payment Summary',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        'Sri Kedareshwara Ashramam',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Breakdown Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8E1),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFFFD54F), width: 1.2),
                ),
                child: Column(
                  children: [
                    _buildRow('Seva Type', widget.darshan.name),
                    _buildRow('Date of Visit', widget.slot.date),
                    _buildRow('Slot Time', widget.slot.timeRange),
                    const Divider(height: 16, color: Color(0xFFFFE082)),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Text(
                            'Devotees ($_quantity)',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF795548),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ..._devotees.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final dev = entry.value;
                      final devName = dev.nameController.text.trim();
                      final devPhone = dev.phoneController.text.trim();
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 9,
                              backgroundColor: const Color(0xFFFFECB3),
                              child: Text(
                                '${idx + 1}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFE65100),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    idx == 0 ? '$devName (Primary)' : devName,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  if (devPhone.isNotEmpty)
                                    Text(
                                      devPhone,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const Divider(height: 18, color: Color(0xFFFFE082)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Dakshina',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF795548)),
                        ),
                        Text(
                          '₹$expectedTotal',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFE65100),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Confirm button
              CustomButton(
                text: 'CONTINUE TO PAYMENT (₹$expectedTotal) →',
                icon: Icons.lock_outline_rounded,
                onPressed: () {
                  Navigator.pop(sheetCtx);
                  _submitBooking();
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
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
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
