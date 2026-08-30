import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../root_wrapper.dart';

enum FailureType {
  cancelled,
  failed,
  verificationFailed,
  slotUnavailable,
  refundRequired,
  networkError,
}

class PaymentFailureScreen extends StatelessWidget {
  final FailureType type;
  final String title;
  final String? message;
  final String? paymentId;
  final String? orderId;
  final num? totalAmount;
  final VoidCallback? onRetry;

  const PaymentFailureScreen({
    super.key,
    required this.type,
    required this.title,
    this.message,
    this.paymentId,
    this.orderId,
    this.totalAmount,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final isRefund = type == FailureType.refundRequired;
    final isCancel = type == FailureType.cancelled;

    final IconData mainIcon = isRefund
        ? Icons.currency_exchange_rounded
        : (isCancel ? Icons.cancel_outlined : Icons.error_outline_rounded);

    final Color mainColor = isRefund
        ? const Color(0xFFE65100)
        : (isCancel ? AppColors.textSecondary : AppColors.statusCancelled);

    final String heading = isRefund
        ? 'Slot Unavailable — Refund Required'
        : (isCancel
            ? 'Payment Cancelled'
            : (type == FailureType.networkError
                ? 'Network Connection Error'
                : 'Payment Unsuccessful'));

    final String explanation = isRefund
        ? 'Payment was received, but the selected slot is no longer available. Your payment requires refund processing.'
        : (message ??
            (isCancel
                ? 'You cancelled the payment transaction. No amount was deducted.'
                : 'We could not complete your payment transaction. Please try again.'));

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
          title: Text(isRefund ? 'Refund Notice' : 'Payment Status'),
          centerTitle: true,
        ),
        body: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            // Status Icon & Heading
            Center(
              child: Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: mainColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: mainColor.withValues(alpha: 0.4), width: 2),
                    ),
                    child: Icon(mainIcon, color: mainColor, size: 50),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    heading,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: mainColor,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    explanation,
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

            // Refund Instructions or Details Box
            if (isRefund) ...[
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFFB74D)),
                ),
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.info_rounded, color: Color(0xFFE65100), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Refund Details',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFE65100),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (paymentId != null && paymentId!.isNotEmpty)
                      _buildRow('Payment ID', paymentId!),
                    if (orderId != null && orderId!.isNotEmpty)
                      _buildRow('Order ID', orderId!),
                    if (totalAmount != null)
                      _buildRow('Amount', '₹$totalAmount'),
                    _buildRow('Status', 'Refund Processing', valueColor: const Color(0xFFE65100)),
                    const SizedBox(height: 8),
                    const Text(
                      'Please save this Payment ID. The temple administration will process the refund to your original payment method.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ] else ...[
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRow('Offering', title),
                    if (paymentId != null && paymentId!.isNotEmpty)
                      _buildRow('Reference ID', paymentId!),
                    _buildRow(
                      'Transaction Status',
                      isCancel ? 'Cancelled' : 'Failed',
                      valueColor: isCancel ? AppColors.textSecondary : AppColors.statusCancelled,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Action Buttons
            if (onRetry != null && !isRefund) ...[
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.refresh_rounded, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Try Again',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back_rounded, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Back to Offerings',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            TextButton(
              onPressed: () => _goToHome(context),
              child: const Text(
                'Go to Home',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 13,
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
