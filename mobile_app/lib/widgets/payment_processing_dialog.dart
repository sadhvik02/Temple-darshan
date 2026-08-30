import 'package:flutter/material.dart';
import '../services/payment_service.dart';
import '../theme/app_colors.dart';

class PaymentProcessingDialog extends StatelessWidget {
  final PaymentUIState state;

  const PaymentProcessingDialog({super.key, required this.state});

  static void show(BuildContext context, {required ValueNotifier<PaymentUIState> stateNotifier}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => ValueListenableBuilder<PaymentUIState>(
        valueListenable: stateNotifier,
        builder: (context, currentState, _) {
          return PaymentProcessingDialog(state: currentState);
        },
      ),
    );
  }

  static void hide(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  String _getMessage() {
    switch (state) {
      case PaymentUIState.creatingOrder:
        return 'Creating Secure Temple Order...';
      case PaymentUIState.openingCheckout:
        return 'Opening Payment Gateway...';
      case PaymentUIState.verifying:
        return 'Verifying Payment & Reserving Slot...';
      case PaymentUIState.success:
        return 'Booking Confirmed!';
      default:
        return 'Processing Secure Transaction...';
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: SizedBox(
                    width: 38,
                    height: 38,
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 3,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _getMessage(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.1,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please do not close or press back while we confirm your payment.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
