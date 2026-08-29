import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import 'service_details_screen.dart';
import 'slots_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  int _selectedFilter = 0; // 0: All, 1: Bookable Online, 2: Free Sevas

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Services & Sevas'),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                _buildFilterChip(0, 'All Sevas'),
                const SizedBox(width: 8),
                _buildFilterChip(1, 'Online Booking Available'),
                const SizedBox(width: 8),
                _buildFilterChip(2, 'Free Darshan & Sevas'),
              ],
            ),
          ),

          // Services List
          Expanded(
            child: StreamBuilder<List<ServiceModel>>(
              stream: DatabaseService().getActiveServices(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  );
                }
                if (snapshot.hasError) {
                  return ErrorStateWidget(
                    message: 'Failed to load temple services.',
                    onRetry: () => setState(() {}),
                  );
                }
                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.volunteer_activism_outlined,
                    title: 'No Sevas Available',
                    description: 'No active services are available at this moment. Please check back soon.',
                  );
                }

                var services = snapshot.data!;
                if (_selectedFilter == 1) {
                  services = services.where((s) => s.bookingEnabled).toList();
                } else if (_selectedFilter == 2) {
                  services = services.where((s) => s.price == 0).toList();
                }

                if (services.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.filter_list_off,
                    title: 'No Matching Sevas',
                    description: 'No services found for the selected filter.',
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: services.length,
                  itemBuilder: (context, index) {
                    final service = services[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ServiceDetailsScreen(service: service),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (service.imageUrl != null && service.imageUrl!.trim().isNotEmpty)
                              CustomImage(
                                imageUrl: service.imageUrl,
                                height: 160,
                                fit: BoxFit.cover,
                                fallbackIcon: Icons.temple_hindu,
                              ),
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          service.name,
                                          style: const TextStyle(
                                            fontSize: 17,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        service.formattedPrice,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (service.description.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      service.description,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textSecondary,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                  const Divider(height: 24),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            service.bookingEnabled
                                                ? Icons.check_circle_outline
                                                : Icons.info_outline,
                                            size: 16,
                                            color: service.bookingEnabled
                                                ? AppColors.statusConfirmed
                                                : AppColors.textTertiary,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            service.bookingEnabled
                                                ? 'Slots Available'
                                                : 'Offline Only',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: service.bookingEnabled
                                                  ? AppColors.statusConfirmed
                                                  : AppColors.textTertiary,
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (service.bookingEnabled)
                                        ElevatedButton(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => SlotsScreen(service: service),
                                              ),
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                            minimumSize: Size.zero,
                                          ),
                                          child: const Text('Book Now', style: TextStyle(fontSize: 13)),
                                        )
                                      else
                                        OutlinedButton(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => ServiceDetailsScreen(service: service),
                                              ),
                                            );
                                          },
                                          style: OutlinedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                            minimumSize: Size.zero,
                                          ),
                                          child: const Text('View Details', style: TextStyle(fontSize: 13)),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedFilter = index),
      selectedColor: AppColors.primaryLight.withValues(alpha: 0.2),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
      ),
      side: BorderSide(
        color: isSelected ? AppColors.primary : AppColors.cardBorder,
      ),
    );
  }
}
