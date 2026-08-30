import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_image.dart';

class DonationCheckoutScreen extends StatefulWidget {
  final DonationTypeModel donationType;
  final int? initialAmount;

  const DonationCheckoutScreen({
    super.key,
    required this.donationType,
    this.initialAmount,
  });

  @override
  State<DonationCheckoutScreen> createState() => _DonationCheckoutScreenState();
}

class _DonationCheckoutScreenState extends State<DonationCheckoutScreen> {
  late TextEditingController _amountController;
  bool _isLoading = false;
  late Razorpay _razorpay;
  final PaymentService _paymentService = PaymentService();
  String? _currentPaymentDocId;
  String? _currentOrderId;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(text: widget.initialAmount?.toString() ?? '');
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _amountController.dispose();
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _submitDonation() async {
    final user = context.read<AuthProvider>().userModel;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to make a donation.')),
      );
      return;
    }

    final amountStr = _amountController.text.trim();
    if (amountStr.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount.')),
      );
      return;
    }

    final amount = int.tryParse(amountStr);
    if (amount == null || amount < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount (minimum ₹1).')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final orderDetails = await _paymentService.createPaymentOrder(
        sourceType: 'donation',
        offeringId: widget.donationType.id!,
        donationAmount: amount,
      );

      if (!mounted) return;

      _currentOrderId = orderDetails['orderId'];
      _currentPaymentDocId = orderDetails['paymentDocId'];

      var options = {
        'key': orderDetails['keyId'],
        'amount': orderDetails['amount'],
        'name': 'Temple Donation',
        'description': widget.donationType.title,
        'order_id': orderDetails['orderId'],
        'prefill': {
          'contact': user.phone ?? '',
          'email': user.email ?? ''
        }
      };

      _razorpay.open(options);
      
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception:', '').trim()),
          backgroundColor: AppColors.statusCancelled,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final verifyResult = await _paymentService.verifyPayment(
        razorpayOrderId: response.orderId ?? _currentOrderId!,
        razorpayPaymentId: response.paymentId!,
        razorpaySignature: response.signature!,
        paymentDocId: _currentPaymentDocId!,
      );

      if (!mounted) return;

      if (verifyResult['success'] == true) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            title: const Text('Donation Successful'),
            content: Text('Thank you for your donation of ₹${_amountController.text}. May you be blessed.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // close dialog
                  Navigator.pop(context); // go back to donations list
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment verification failed: $e'),
          backgroundColor: AppColors.statusCancelled,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment Failed: ${response.message}'),
        backgroundColor: AppColors.statusCancelled,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Donation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (widget.donationType.imageUrl != null && widget.donationType.imageUrl!.isNotEmpty)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          height: 120,
                          width: double.infinity,
                          child: CustomImage(imageUrl: widget.donationType.imageUrl!, fit: BoxFit.cover),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      widget.donationType.title,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.donationType.description,
                      style: const TextStyle(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Enter Donation Amount (₹)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: '₹ ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: AppColors.background,
              ),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            CustomButton(
              text: 'PROCEED TO PAY',
              icon: Icons.favorite,
              onPressed: _submitDonation,
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
