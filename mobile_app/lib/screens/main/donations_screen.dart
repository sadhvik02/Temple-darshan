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
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import 'donation_checkout_screen.dart';
import '../../widgets/payment_processing_dialog.dart';
import 'payment_failure_screen.dart';
import 'payment_success_screen.dart';

class DonationsScreen extends StatelessWidget {
  const DonationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sacred Donations (Hundi & Seva)'),
      ),
      body: StreamBuilder<List<DonationTypeModel>>(
        stream: DatabaseService().getActiveDonationTypes(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            );
          }

          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Failed to load donation options.',
              onRetry: () {
                (context as Element).markNeedsBuild();
              },
            );
          }

          final donationTypes = snapshot.data ?? [];

          if (donationTypes.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.volunteer_activism_rounded,
              title: 'No Donations Available',
              description: 'Donation funds will appear here once added.',
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Devotional header banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.08),
                      AppColors.accent.withValues(alpha: 0.12),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.volunteer_activism_rounded, color: AppColors.primary, size: 28),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Support the Sacred Mandir',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'All offerings are utilized directly for Nitya Annadanam, temple maintenance, and Vedic sevas.',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Donation type cards
              ...donationTypes.map((dt) => _DonationTypeCard(donationType: dt)),
            ],
          );
        },
      ),
    );
  }
}

class _DonationTypeCard extends StatelessWidget {
  final DonationTypeModel donationType;
  const _DonationTypeCard({required this.donationType});

  void _openDonationModal(BuildContext context, [num? prefilledAmount]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DonationCheckoutSheet(
        donationType: donationType,
        initialAmount: prefilledAmount,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DonationCheckoutScreen(donationType: donationType),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.cardBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                if (donationType.imageUrl != null && donationType.imageUrl!.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: SizedBox(
                      width: 64,
                      height: 64,
                      child: CustomImage(imageUrl: donationType.imageUrl!, fit: BoxFit.cover),
                    ),
                  )
                else
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.volunteer_activism_rounded, color: AppColors.accent, size: 30),
                  ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        donationType.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          donationType.category.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Description
            Text(
              donationType.description,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 14),

            // Suggested amounts
            if (donationType.suggestedAmounts.isNotEmpty) ...[
              const Text(
                'Suggested Offerings',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textTertiary),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: donationType.suggestedAmounts.map((amount) {
                  return InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => DonationCheckoutScreen(
                            donationType: donationType,
                            initialAmount: amount.toInt(),
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.accent.withValues(alpha: 0.5)),
                        borderRadius: BorderRadius.circular(20),
                        color: AppColors.accentGold.withValues(alpha: 0.08),
                      ),
                      child: Text(
                        '₹$amount',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryDark,
                          fontSize: 14,
                        ),
                  return InkWell(
                    onTap: () => _openDonationModal(context, amount),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
                        borderRadius: BorderRadius.circular(20),
                        color: AppColors.accentGold.withValues(alpha: 0.08),
                      ),
                      child: Text(
                        '₹$amount',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryDark,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // Donate button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _openDonationModal(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 1,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.favorite_rounded, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Offer Sacred Donation',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
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
}

class _DonationCheckoutSheet extends StatefulWidget {
  final DonationTypeModel donationType;
  final num? initialAmount;

  const _DonationCheckoutSheet({required this.donationType, this.initialAmount});

  @override
  State<_DonationCheckoutSheet> createState() => _DonationCheckoutSheetState();
}

class _DonationCheckoutSheetState extends State<_DonationCheckoutSheet> {
  late TextEditingController _amountController;
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _panController;
  bool _isLoading = false;
  final ValueNotifier<PaymentUIState> _paymentStateNotifier = ValueNotifier(PaymentUIState.idle);

  @override
  void initState() {
    super.initState();
    final defaultAmt = widget.initialAmount ??
        (widget.donationType.suggestedAmounts.isNotEmpty ? widget.donationType.suggestedAmounts.first : 501);
    _amountController = TextEditingController(text: defaultAmt.toString());
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
    _emailController = TextEditingController();
    _panController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().userModel;
      if (user != null) {
        _nameController.text = user.name;
        _phoneController.text = user.phone;
        if (user.email != null) {
          _emailController.text = user.email!;
        }
      }
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _panController.dispose();
    _paymentStateNotifier.dispose();
    super.dispose();
  }

  Future<void> _submitDonation() async {
    if (_isLoading || PaymentService().isProcessing) return;

    final user = context.read<AuthProvider>().userModel;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to offer a donation.')),
      );
      return;
    }

    final double? parsedAmount = double.tryParse(_amountController.text.trim());
    if (parsedAmount == null || parsedAmount < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid donation amount (minimum ₹1).'),
          backgroundColor: AppColors.statusCancelled,
        ),
      );
      return;
    }

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter donor full name.'),
          backgroundColor: AppColors.statusCancelled,
        ),
      );
      return;
    }

    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter contact mobile number.'),
          backgroundColor: AppColors.statusCancelled,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Show non-dismissible devotional processing modal
    PaymentProcessingDialog.show(context, stateNotifier: _paymentStateNotifier);

    try {
      final PaymentResult result = await PaymentService().startDonationPayment(
        donationTypeId: widget.donationType.id,
        donationTitle: widget.donationType.title,
        amount: parsedAmount,
        donorName: name,
        donorPhone: phone,
        donorEmail: _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : user.email,
        panNumber: _panController.text.trim().isNotEmpty ? _panController.text.trim() : null,
        onStateChange: (state) {
          _paymentStateNotifier.value = state;
        },
      );

      if (!mounted) return;
      PaymentProcessingDialog.hide(context);

      if (result.isSuccess) {
        // Pop the modal sheet
        Navigator.pop(context);

        // Navigate to dedicated PaymentSuccessScreen for donation
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentSuccessScreen(
              type: SuccessType.donation,
              title: widget.donationType.title,
              donationRef: result.donationRef,
              paymentId: result.paymentId,
              amount: parsedAmount,
              donorName: name,
            ),
          ),
        );
      } else if (result.isCancelled) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message ?? 'Donation payment was cancelled.'),
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
              title: 'Donation: ${widget.donationType.title}',
              message: result.message,
              paymentId: result.paymentId,
              orderId: result.orderId,
              totalAmount: parsedAmount,
              onRetry: () => _submitDonation(),
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
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.volunteer_activism_rounded, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.donationType.title,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Direct Mandir Contribution',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            // Suggested amount quick selector
            if (widget.donationType.suggestedAmounts.isNotEmpty) ...[
              const Text(
                'Select Amount',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.donationType.suggestedAmounts.map((amount) {
                  final isSelected = _amountController.text == amount.toString();
                  return ChoiceChip(
                    label: Text('₹$amount'),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _amountController.text = amount.toString();
                        });
                      }
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],

            // Custom Amount Input
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
              decoration: InputDecoration(
                labelText: 'Donation Amount (₹) *',
                prefixIcon: const Icon(Icons.currency_rupee_rounded, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 14),

            // Donor Information
            const Text(
              'Donor Details',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),

            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Donor Full Name *',
                isDense: true,
                prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Mobile Number *',
                isDense: true,
                prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Email Address (For e-Receipt)',
                isDense: true,
                prefixIcon: const Icon(Icons.email_outlined, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _panController,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                labelText: 'PAN Number (Optional, for 80G Tax Exemption)',
                isDense: true,
                prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),

            // Donate Now Button
            CustomButton(
              text: 'Donate Now with Razorpay',
              isLoading: _isLoading,
              onPressed: _isLoading ? null : _submitDonation,
            ),
          ],
        ),
      ),
      ),
    );
  }
}
