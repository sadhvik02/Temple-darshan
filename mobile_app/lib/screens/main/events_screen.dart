import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Temple Events & Festivals'),
      ),
      body: StreamBuilder<List<EventModel>>(
        stream: DatabaseService().getPublishedEvents(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Unable to load events at this time.',
              onRetry: () => setState(() {}),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.celebration_rounded,
              title: 'No Upcoming Utsavams',
              description: 'There are no scheduled temple festivals or events right now.',
            );
          }

          final events = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            itemBuilder: (context, index) {
              final event = events[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (event.imageUrl != null && event.imageUrl!.trim().isNotEmpty)
                      CustomImage(
                        imageUrl: event.imageUrl,
                        height: 160,
                        fit: BoxFit.cover,
                        fallbackIcon: Icons.celebration_rounded,
                      ),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Date Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: AppColors.primary.withValues(alpha: 0.2),
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    const Icon(Icons.event, color: AppColors.primary, size: 20),
                                    const SizedBox(height: 2),
                                    Text(
                                      event.eventDate,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      event.title,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    if (event.timeRange.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.schedule,
                                            size: 14,
                                            color: AppColors.textSecondary,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            event.timeRange,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              color: AppColors.textSecondary,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (event.description.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              event.description,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
