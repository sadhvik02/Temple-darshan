import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CustomImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final IconData fallbackIcon;
  final Color? backgroundColor;

  const CustomImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.fallbackIcon = Icons.temple_hindu,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderRadius = borderRadius ?? BorderRadius.zero;
    final effectiveBg = backgroundColor ?? AppColors.surfaceVariant;

    if (imageUrl == null || imageUrl!.trim().isEmpty) {
      return _buildFallback(effectiveBorderRadius, effectiveBg);
    }

    return ClipRRect(
      borderRadius: effectiveBorderRadius,
      child: Image.network(
        imageUrl!.trim(),
        width: width,
        height: height,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: width,
            height: height,
            color: effectiveBg,
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          (loadingProgress.expectedTotalBytes ?? 1)
                      : null,
                  color: AppColors.primaryLight,
                ),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return _buildFallback(effectiveBorderRadius, effectiveBg);
        },
      ),
    );
  }

  Widget _buildFallback(BorderRadius radius, Color bg) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: radius,
      ),
      child: Center(
        child: Icon(
          fallbackIcon,
          size: (height != null && height! < 60) ? 24 : 40,
          color: AppColors.textTertiary.withValues(alpha: 0.6),
        ),
      ),
    );
  }
}
