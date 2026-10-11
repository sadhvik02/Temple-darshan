import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';
import 'donations_screen.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  int _selectedFilterIndex = 0;
  final Set<String> _remindedEventIds = <String>{};

  final List<Map<String, String>> _filterOptions = const [
    {'label': 'All Celebrations', 'icon': '⭐'},
    {'label': 'Upcoming Soon', 'icon': '🔥'},
    {'label': 'Brahmotsavams', 'icon': '🪔'},
  ];

  String _formatTime(String time) {
    try {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = parts[1];
        final period = hour >= 12 ? 'PM' : 'AM';
        final formattedHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return '$formattedHour:$minute $period';
      }
    } catch (_) {}
    return time;
  }

  String _formatTimeRange(String startTime, String endTime, String fallback) {
    if (startTime.isNotEmpty && endTime.isNotEmpty) {
      return '${_formatTime(startTime)} - ${_formatTime(endTime)}';
    } else if (startTime.isNotEmpty) {
      return _formatTime(startTime);
    }
    return fallback;
  }

  String _getDateStatus(String dateStr) {
    try {
      final parsed = DateTime.tryParse(dateStr);
      if (parsed != null) {
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);
        final eventDate = DateTime(parsed.year, parsed.month, parsed.day);
        final diff = eventDate.difference(today).inDays;

        if (diff == 0) return '● TODAY';
        if (diff == 1) return '● TOMORROW';
        if (diff > 1 && diff <= 7) return '● IN $diff DAYS';
        if (diff < 0) return '● COMPLETED';
        return '● UPCOMING';
      }
    } catch (_) {}
    return '● UPCOMING';
  }

  Widget _buildCalendarBadge(String dateStr) {
    String monthStr = 'DATE';
    String dayStr = dateStr;
    String weekdayStr = '';

    try {
      final parsed = DateTime.tryParse(dateStr);
      if (parsed != null) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        monthStr = months[parsed.month - 1];
        dayStr = parsed.day.toString().padLeft(2, '0');
        weekdayStr = weekdays[parsed.weekday - 1];
      }
    } catch (_) {}

    return Container(
      width: 58,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFDBA74), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withValues(alpha: 0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Orange month banner header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 4),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFD9480F), Color(0xFFEA580C)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Text(
              monthStr,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
          ),
          // Day number & Weekday
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                Text(
                  dayStr,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF9A3412),
                    height: 1.0,
                  ),
                ),
                if (weekdayStr.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    weekdayStr,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<EventModel> _filterEvents(List<EventModel> events) {
    if (_selectedFilterIndex == 1) {
      // Upcoming soon (today or within the next 14 days)
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      return events.where((e) {
        final parsed = DateTime.tryParse(e.eventDate);
        if (parsed == null) return true;
        final eventDay = DateTime(parsed.year, parsed.month, parsed.day);
        final diff = eventDay.difference(today).inDays;
        return diff >= 0 && diff <= 14;
      }).toList();
    } else if (_selectedFilterIndex == 2) {
      // Brahmotsavams & Utsavams
      return events.where((e) {
        final text = '${e.title} ${e.description}'.toLowerCase();
        return text.contains('brahmo') || text.contains('utsav') || text.contains('festival');
      }).toList();
    }
    return events;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        title: const Text(
          'Temple Events & Festivals',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: Color(0xFF1F2937),
            letterSpacing: -0.2,
          ),
        ),
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.volunteer_activism_rounded,
              color: Color(0xFFD9480F),
              size: 22,
            ),
            tooltip: 'Sacred Seva Donations',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DonationsScreen()),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: const Color(0xFFFFECC8),
          ),
        ),
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

          final allEvents = snapshot.data!;
          final displayedEvents = _filterEvents(allEvents);

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            children: [
              // 1. Top Sacred Header Banner Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF6E5), Color(0xFFFFECC8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFFFD59E), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFD9480F).withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Temple Icon Badge
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD9480F).withValues(alpha: 0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.temple_hindu_rounded,
                          color: Color(0xFFD9480F),
                          size: 26,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    // Header Text & Tags
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD9480F),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'SACRED UTSAVAMS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                '🕉️ Navasiddula Gutta',
                                style: TextStyle(
                                  color: Color(0xFF7C3AED),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Divine Festivals & Gatherings',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFB43B00),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Participate in holy brahmotsavams, special alankarams & spiritual celebrations.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B4E3D),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // 2. Horizontal Filter Chips Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(_filterOptions.length, (index) {
                    final isSelected = _selectedFilterIndex == index;
                    final opt = _filterOptions[index];
                    return Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedFilterIndex = index;
                          });
                        },
                        borderRadius: BorderRadius.circular(24),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: isSelected
                                ? const LinearGradient(
                                    colors: [Color(0xFFD9480F), Color(0xFFEA580C)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : null,
                            color: isSelected ? null : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: isSelected ? Colors.transparent : const Color(0xFFFFD59E),
                              width: 1.1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isSelected
                                    ? const Color(0xFFD9480F).withValues(alpha: 0.25)
                                    : Colors.black.withValues(alpha: 0.03),
                                blurRadius: isSelected ? 8 : 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                opt['icon']!,
                                style: const TextStyle(fontSize: 13),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                opt['label']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  color: isSelected ? Colors.white : const Color(0xFF374151),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),

              const SizedBox(height: 16),

              // 3. Events List
              if (displayedEvents.isEmpty)
                Container(
                  padding: const EdgeInsets.all(28),
                  margin: const EdgeInsets.only(top: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFFFECC8)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.event_busy_rounded, size: 40, color: Color(0xFFD9480F)),
                      const SizedBox(height: 10),
                      const Text(
                        'No events found in this category',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF374151),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedFilterIndex = 0;
                          });
                        },
                        child: const Text('View All Celebrations'),
                      ),
                    ],
                  ),
                )
              else
                ...displayedEvents.map((event) {
                  final isReminded = _remindedEventIds.contains(event.id);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFFFCC80),
                        width: 1.3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFD9480F).withValues(alpha: 0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Cover Image with Top Badges & Bottom Temple Location
                          if (event.imageUrl != null && event.imageUrl!.trim().isNotEmpty)
                            Stack(
                              children: [
                                CustomImage(
                                  imageUrl: event.imageUrl,
                                  height: 210,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  fallbackIcon: Icons.celebration_rounded,
                                ),
                                // Gradient Overlay
                                Positioned.fill(
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.transparent,
                                          Colors.black.withValues(alpha: 0.15),
                                          Colors.black.withValues(alpha: 0.75),
                                        ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        stops: const [0.4, 0.7, 1.0],
                                      ),
                                    ),
                                  ),
                                ),
                                // Top-Left: "🕉️ MAHA UTSAVAM"
                                Positioned(
                                  top: 14,
                                  left: 14,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.65),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white24, width: 0.8),
                                    ),
                                    child: const Text(
                                      '🕉️ MAHA UTSAVAM',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ),
                                // Top-Right: "● TOMORROW" / "● TODAY" / "● UPCOMING"
                                Positioned(
                                  top: 14,
                                  right: 14,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD9480F),
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFD9480F).withValues(alpha: 0.4),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Text(
                                      _getDateStatus(event.eventDate),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ),
                                ),
                                // Bottom-Left on Image: "📍 Sri Kedareshwara Ashramam • Navasiddula Gutta"
                                const Positioned(
                                  bottom: 12,
                                  left: 14,
                                  right: 14,
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.location_on_rounded,
                                        color: Color(0xFFFFD54F),
                                        size: 14,
                                      ),
                                      SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          'Sri Kedareshwara Ashramam • Navasiddula Gutta',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            shadows: [
                                              Shadow(color: Colors.black87, blurRadius: 4),
                                            ],
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),

                          // Card Body
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Calendar Date Tile
                                    _buildCalendarBadge(event.eventDate),
                                    const SizedBox(width: 14),

                                    // Title & Time Badge
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            event.title,
                                            style: const TextStyle(
                                              fontSize: 17,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF1F2937),
                                              height: 1.25,
                                              letterSpacing: -0.3,
                                            ),
                                          ),
                                          if (event.timeRange.isNotEmpty) ...[
                                            const SizedBox(height: 7),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 9,
                                                vertical: 4,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFFF7ED),
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(
                                                  color: const Color(0xFFFFEDD5),
                                                  width: 1,
                                                ),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(
                                                    Icons.access_time_filled_rounded,
                                                    size: 13,
                                                    color: Color(0xFFEA580C),
                                                  ),
                                                  const SizedBox(width: 5),
                                                  Text(
                                                    _formatTimeRange(
                                                      event.startTime,
                                                      event.endTime,
                                                      event.timeRange,
                                                    ),
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w700,
                                                      color: Color(0xFFC2410C),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),

                                // Event Description
                                if (event.description.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Text(
                                    event.description,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      color: Color(0xFF4B5563),
                                      height: 1.45,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],

                                // Bottom Divider Line
                                const SizedBox(height: 14),
                                const Divider(
                                  color: Color(0xFFF3F4F6),
                                  height: 1,
                                  thickness: 1,
                                ),
                                const SizedBox(height: 10),

                                // Bottom Action Row: "Remind Me" ONLY (No View Details)
                                InkWell(
                                  onTap: () {
                                    setState(() {
                                      if (_remindedEventIds.contains(event.id)) {
                                        _remindedEventIds.remove(event.id);
                                      } else {
                                        _remindedEventIds.add(event.id);
                                      }
                                    });
                                    final isSet = _remindedEventIds.contains(event.id);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          isSet
                                              ? '🔔 Reminder set for ${event.title}!'
                                              : 'Reminder removed for ${event.title}',
                                        ),
                                        behavior: SnackBarBehavior.floating,
                                        backgroundColor: const Color(0xFFD9480F),
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                  borderRadius: BorderRadius.circular(10),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isReminded
                                              ? Icons.notifications_active_rounded
                                              : Icons.notifications_none_rounded,
                                          color: const Color(0xFFD9480F),
                                          size: 19,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          isReminded ? 'Reminder Set' : 'Remind Me',
                                          style: const TextStyle(
                                            color: Color(0xFFD9480F),
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}
