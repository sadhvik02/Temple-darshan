import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import 'booking_screen.dart';

class SlotsScreen extends StatefulWidget {
  final ServiceModel service;

  const SlotsScreen({super.key, required this.service});

  @override
  State<SlotsScreen> createState() => _SlotsScreenState();
}

class _SlotsScreenState extends State<SlotsScreen> {
  String? _selectedDate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.service.name),
      ),
      body: StreamBuilder<List<SlotModel>>(
        stream: DatabaseService().getActiveSlotsForService(widget.service.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Unable to load available slots.',
              onRetry: () => setState(() {}),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.event_busy_outlined,
              title: 'No Slots Available',
              description: 'There are no active booking slots for this seva at the moment. Please check back later.',
            );
          }

          final allSlots = snapshot.data!;
          final uniqueDates = allSlots.map((s) => s.date).toSet().toList()..sort();

          if (_selectedDate == null || !uniqueDates.contains(_selectedDate)) {
            _selectedDate = uniqueDates.first;
          }

          final visibleSlots = allSlots.where((s) => s.date == _selectedDate).toList();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Service Summary Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(bottom: BorderSide(color: AppColors.divider)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Selected Seva',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        Text(
                          widget.service.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    Text(
                      widget.service.formattedPrice,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),

              // Date Selector
              if (uniqueDates.length > 1) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 6),
                  child: Text(
                    'Select Darshan Date',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                SizedBox(
                  height: 48,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: uniqueDates.length,
                    itemBuilder: (context, idx) {
                      final d = uniqueDates[idx];
                      final isSelected = d == _selectedDate;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: ChoiceChip(
                          label: Text(d),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedDate = d),
                          selectedColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            fontSize: 13,
                          ),
                          side: BorderSide(
                            color: isSelected ? AppColors.primary : AppColors.cardBorder,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
              ],

              // Slots List
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Text(
                  'Available Time Slots for $_selectedDate',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),

              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  itemCount: visibleSlots.length,
                  itemBuilder: (context, index) {
                    final slot = visibleSlots[index];
                    final isFull = slot.isFull;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: isFull ? AppColors.surfaceVariant.withValues(alpha: 0.6) : AppColors.surface,
                      child: InkWell(
                        onTap: isFull
                            ? null
                            : () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => BookingScreen(
                                      service: widget.service,
                                      slot: slot,
                                    ),
                                  ),
                                );
                              },
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isFull
                                      ? AppColors.textTertiary.withValues(alpha: 0.1)
                                      : AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.schedule,
                                  color: isFull ? AppColors.textTertiary : AppColors.primary,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      slot.timeRange,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: isFull ? AppColors.textSecondary : AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          isFull ? Icons.cancel_outlined : Icons.check_circle_outline,
                                          size: 14,
                                          color: isFull ? AppColors.statusCancelled : AppColors.statusConfirmed,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          isFull
                                              ? 'Fully Booked'
                                              : '${slot.available} spots available',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: isFull
                                                ? AppColors.statusCancelled
                                                : AppColors.statusConfirmed,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              if (!isFull)
                                const Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
