import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final cleanStatus = status.trim().toLowerCase();
    Color textColor;
    Color bgColor;
    String displayLabel;

    switch (cleanStatus) {
      case 'confirmed':
        textColor = AppColors.statusConfirmed;
        bgColor = AppColors.statusConfirmedBg;
        displayLabel = 'Confirmed';
        break;
      case 'completed':
        textColor = AppColors.statusCompleted;
        bgColor = AppColors.statusCompletedBg;
        displayLabel = 'Completed';
        break;
      case 'cancelled':
        textColor = AppColors.statusCancelled;
        bgColor = AppColors.statusCancelledBg;
        displayLabel = 'Cancelled';
        break;
      case 'paid':
        textColor = AppColors.statusConfirmed;
        bgColor = AppColors.statusConfirmedBg;
        displayLabel = 'Paid';
        break;
      case 'pending':
      default:
        textColor = AppColors.statusPending;
        bgColor = AppColors.statusPendingBg;
        displayLabel = cleanStatus.isEmpty ? 'Pending' : cleanStatus.toUpperCase();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        displayLabel,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
