import 'package:flutter/material.dart';
import '../services/payment_service.dart';
import '../theme/app_colors.dart';

class PaymentProcessingDialog extends StatelessWidget {
  final PaymentUIState state;

  const PaymentProcessingDialog({super.key, required this.state});

  static bool _isShowing = false;

  static void show(BuildContext context, {required ValueNotifier<PaymentUIState> stateNotifier}) {
    if (_isShowing) return;
    _isShowing = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      useRootNavigator: true,
      builder: (_) => ValueListenableBuilder<PaymentUIState>(
        valueListenable: stateNotifier,
        builder: (context, currentState, _) {
          return PaymentProcessingDialog(state: currentState);
        },
      ),
    ).then((_) {
      _isShowing = false;
    });
  }

  static void hide(BuildContext context) {
    if (_isShowing) {
      _isShowing = false;
      try {
        Navigator.of(context, rootNavigator: true).pop();
      } catch (_) {}
    }
  }

  String _getTitle() {
    switch (state) {
      case PaymentUIState.creatingOrder:
        return 'Preparing Booking...';
      case PaymentUIState.openingCheckout:
        return 'Opening Payment Gateway...';
      case PaymentUIState.verifying:
        return 'Verifying Payment...';
      case PaymentUIState.success:
        return 'Booking Confirmed!';
      case PaymentUIState.cancelled:
        return 'Payment Cancelled';
      case PaymentUIState.failed:
        return 'Payment Incomplete';
      default:
        return 'Processing Transaction...';
    }
  }

  String _getSubtitle() {
    switch (state) {
      case PaymentUIState.creatingOrder:
        return 'Connecting to temple booking server...';
      case PaymentUIState.openingCheckout:
        return 'Please complete payment in the secure Razorpay window.';
      case PaymentUIState.verifying:
        return 'Payment received! Reserving your slot and generating booking reference...';
      case PaymentUIState.success:
        return 'Your seva darshan booking is confirmed!';
      case PaymentUIState.cancelled:
        return 'Returning to booking details...';
      case PaymentUIState.failed:
        return 'Unable to verify payment. Please try again.';
      default:
        return 'Please do not close or press back while we process your request.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = state == PaymentUIState.success;
    final isFailed = state == PaymentUIState.failed || state == PaymentUIState.cancelled;

    return PopScope(
      canPop: isSuccess || isFailed,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: isSuccess
                      ? const Color(0xFFDCFCE7)
                      : isFailed
                          ? const Color(0xFFFEE2E2)
                          : AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isSuccess
                      ? const Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF16A34A),
                          size: 46,
                        )
                      : isFailed
                          ? const Icon(
                              Icons.error_outline_rounded,
                              color: Color(0xFFDC2626),
                              size: 44,
                            )
                          : const SizedBox(
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
                _getTitle(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isSuccess
                      ? const Color(0xFF15803D)
                      : isFailed
                          ? const Color(0xFFB91C1C)
                          : AppColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _getSubtitle(),
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
      ),
    );
  }
}
