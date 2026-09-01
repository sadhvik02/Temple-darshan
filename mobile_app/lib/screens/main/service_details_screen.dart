import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_image.dart';
import 'seva_type_selection_screen.dart';
import 'slots_screen.dart';

class ServiceDetailsScreen extends StatelessWidget {
  final ServiceModel service;

  const ServiceDetailsScreen({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Hero App Bar with Image
          SliverAppBar(
            expandedHeight: 240.0,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                service.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  shadows: [
                    Shadow(color: Colors.black87, blurRadius: 8, offset: Offset(0, 1)),
                  ],
                ),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CustomImage(
                    imageUrl: service.imageUrl,
                    fit: BoxFit.cover,
                    alignment: Alignment.topCenter,
                    fallbackIcon: Icons.temple_hindu,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Color(0x99000000),
                          Color(0xCC000000),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Price and Booking Badge Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Seva Dakshina / Price',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            service.formattedPrice,
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: service.bookingEnabled
                              ? AppColors.statusConfirmedBg
                              : AppColors.statusCancelledBg,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: service.bookingEnabled
                                ? AppColors.statusConfirmed.withValues(alpha: 0.3)
                                : AppColors.statusCancelled.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              service.bookingEnabled
                                  ? Icons.check_circle_outline
                                  : Icons.info_outline,
                              size: 16,
                              color: service.bookingEnabled
                                  ? AppColors.statusConfirmed
                                  : AppColors.statusCancelled,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              service.bookingEnabled ? 'Booking Available' : 'Offline at Temple',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: service.bookingEnabled
                                    ? AppColors.statusConfirmed
                                    : AppColors.statusCancelled,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32),

                  // Description
                  const Text(
                    'About this Seva',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    service.description.isNotEmpty
                        ? service.description
                        : 'Devotees are invited to participate in this auspicious seva offering.',
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Darshan Guidelines Card
                  Card(
                    color: AppColors.surfaceVariant.withValues(alpha: 0.6),
                    child: const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline, color: AppColors.primary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Important Darshan Guidelines',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 10),
                          Text(
                            '• Please report to the seva counter 15 minutes before your scheduled slot.\n'
                            '• Traditional temple attire is requested.\n'
                            '• Present your booking reference code at the counter.',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 80), // Space for bottom bar
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: service.bookingEnabled
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: CustomButton(
                  text: 'SELECT DATE & TIME SLOT',
                  icon: Icons.calendar_month,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => service.category == 'arjita_seva'
                            ? SlotsScreen(service: service)
                            : SevaTypeSelectionScreen(service: service),
                      ),
                    );
                  },
                ),
              ),
            )
          : null,
    );
  }
}
