import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/error_state_widget.dart';
import 'booking_screen.dart';

class SlotsScreen extends StatefulWidget {
  final ServiceModel service;

  const SlotsScreen({super.key, required this.service});

  @override
  State<SlotsScreen> createState() => _SlotsScreenState();
}

class _SlotsScreenState extends State<SlotsScreen> {
  DateTime _selectedDate = DateTime.now();
  late DateTime _displayedMonth;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
    _displayedMonth = DateTime(now.year, now.month, 1);
  }

  static String _formatDateKey(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  static String _formatMonthYear(DateTime dt) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[dt.month - 1]} ${dt.year}';
  }

  static String _formatFullDisplay(DateTime dt) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${days[dt.weekday - 1]}, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  static bool isMorningSlot(String startTime) {
    final lower = startTime.toLowerCase().trim();
    if (lower.contains('am')) return true;
    if (lower.contains('pm')) {
      final match = RegExp(r'^(\d{1,2})').firstMatch(lower);
      if (match != null) {
        final h = int.tryParse(match.group(1)!) ?? 12;
        return h == 12;
      }
      return false;
    }
    final match = RegExp(r'^(\d{1,2})').firstMatch(startTime);
    if (match != null) {
      final h = int.tryParse(match.group(1)!) ?? 9;
      return h < 14;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final selectedDateKey = _formatDateKey(_selectedDate);

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
              message: 'Unable to load slots from temple server.',
              onRetry: () => setState(() {}),
            );
          }

          final allSlots = snapshot.data ?? [];
          final activeDates = allSlots.map((s) => s.date).toSet();

          final dateSlots = allSlots.where((s) => s.date == selectedDateKey).toList();
          final morningDbSlots = dateSlots.where((s) => isMorningSlot(s.startTime)).toList();
          final eveningDbSlots = dateSlots.where((s) => !isMorningSlot(s.startTime)).toList();

          final morningCount = morningDbSlots.isNotEmpty ? morningDbSlots.length : 4;
          final eveningCount = eveningDbSlots.isNotEmpty ? eveningDbSlots.length : 2;

          return ListView(
            padding: const EdgeInsets.only(bottom: 30),
            children: [
              // 1. Selected Seva Summary Banner
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
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.service.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text(
                          'Dakshina',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          widget.service.formattedPrice,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 2. Embedded Monthly Calendar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select Darshan Date',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildInlineCalendarCard(activeDates),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // 3. Selected Date Confirmation Strip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.event_available_rounded, color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _formatFullDisplay(_selectedDate),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // 4. Session Selection Cards (Morning & Evening)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Choose Darshan Session',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Morning Session Card
                    _buildSessionCard(
                      title: 'Morning Darshan Slots',
                      timeRangeDesc: '06:00 AM – 11:00 AM • $morningCount Timings',
                      icon: Icons.wb_sunny_rounded,
                      iconColor: const Color(0xFFE65100),
                      bgGradient: const [Color(0xFFFFF3E0), Color(0xFFFFE0B2)],
                      borderColor: const Color(0xFFFFB74D),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SlotTimingScreen(
                              service: widget.service,
                              selectedDate: _selectedDate,
                              isMorning: true,
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 12),

                    // Evening Session Card
                    _buildSessionCard(
                      title: 'Evening Darshan Slots',
                      timeRangeDesc: '07:00 PM – 09:00 PM • $eveningCount Timings',
                      icon: Icons.nights_stay_rounded,
                      iconColor: AppColors.primary,
                      bgGradient: [
                        AppColors.primary.withValues(alpha: 0.08),
                        AppColors.accent.withValues(alpha: 0.12),
                      ],
                      borderColor: AppColors.primary.withValues(alpha: 0.3),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SlotTimingScreen(
                              service: widget.service,
                              selectedDate: _selectedDate,
                              isMorning: false,
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSessionCard({
    required String title,
    required String timeRangeDesc,
    required IconData icon,
    required Color iconColor,
    required List<Color> bgGradient,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: bgGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: iconColor.withValues(alpha: 0.15),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(icon, color: iconColor, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeRangeDesc,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View Timings',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInlineCalendarCard(Set<String> activeDates) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final daysInMonth = DateUtils.getDaysInMonth(_displayedMonth.year, _displayedMonth.month);
    final firstDayOfWeek = DateTime(_displayedMonth.year, _displayedMonth.month, 1).weekday; // 1 = Mon, 7 = Sun

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, color: AppColors.primary, size: 22),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: () {
                  setState(() {
                    _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1, 1);
                  });
                },
              ),
              Text(
                _formatMonthYear(_displayedMonth),
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded, color: AppColors.primary, size: 22),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: () {
                  setState(() {
                    _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1, 1);
                  });
                },
              ),
            ],
          ),

          const SizedBox(height: 2),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: const [
              _WeekdayLabel('Mo'),
              _WeekdayLabel('Tu'),
              _WeekdayLabel('We'),
              _WeekdayLabel('Th'),
              _WeekdayLabel('Fr'),
              _WeekdayLabel('Sa'),
              _WeekdayLabel('Su'),
            ],
          ),

          const Divider(height: 10),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: (firstDayOfWeek - 1) + daysInMonth,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 2,
              crossAxisSpacing: 2,
              childAspectRatio: 1.4,
            ),
            itemBuilder: (context, index) {
              if (index < firstDayOfWeek - 1) {
                return const SizedBox.shrink();
              }

              final dayNum = index - (firstDayOfWeek - 2);
              final currentDayDate = DateTime(_displayedMonth.year, _displayedMonth.month, dayNum);
              final dateKey = _formatDateKey(currentDayDate);
              final hasActiveSlots = activeDates.contains(dateKey);

              final isPast = currentDayDate.isBefore(today);
              final isSelected = currentDayDate.year == _selectedDate.year &&
                  currentDayDate.month == _selectedDate.month &&
                  currentDayDate.day == _selectedDate.day;

              return InkWell(
                onTap: isPast
                    ? null
                    : () {
                        setState(() {
                          _selectedDate = currentDayDate;
                        });
                      },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : (currentDayDate == today ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$dayNum',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : (isPast ? AppColors.textTertiary.withValues(alpha: 0.45) : AppColors.textPrimary),
                        ),
                      ),
                      if (hasActiveSlots && !isSelected) ...[
                        const SizedBox(height: 1),
                        Container(
                          width: 3.5,
                          height: 3.5,
                          decoration: const BoxDecoration(
                            color: Color(0xFF2E7D32),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _WeekdayLabel extends StatelessWidget {
  final String label;
  const _WeekdayLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

// =========================================================================
// SCREEN 2: Specific Darshan Timing Selection Screen (Live Streamed)
// =========================================================================
class SlotTimingScreen extends StatelessWidget {
  final ServiceModel service;
  final DateTime selectedDate;
  final bool isMorning;

  const SlotTimingScreen({
    super.key,
    required this.service,
    required this.selectedDate,
    required this.isMorning,
  });

  static const List<Map<String, String>> _defaultMorningTimings = [
    {'start': '06:00', 'end': '07:00'},
    {'start': '07:00', 'end': '08:00'},
    {'start': '08:00', 'end': '09:00'},
    {'start': '10:00', 'end': '11:00'},
  ];

  static const List<Map<String, String>> _defaultEveningTimings = [
    {'start': '19:00', 'end': '20:00'},
    {'start': '20:00', 'end': '21:00'},
  ];

  static String _formatDateKey(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  static String _formatFullDisplay(DateTime dt) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${days[dt.weekday - 1]}, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  static String _formatTimeForDisplay(String time) {
    final trimmed = time.trim();
    if (trimmed.toLowerCase().contains('am') || trimmed.toLowerCase().contains('pm')) {
      return trimmed;
    }
    try {
      final parts = trimmed.split(':');
      if (parts.isNotEmpty) {
        int h = int.parse(parts[0]);
        int m = parts.length > 1 ? int.parse(parts[1]) : 0;
        final period = h >= 12 ? 'PM' : 'AM';
        final displayH = h % 12 == 0 ? 12 : h % 12;
        final displayM = m.toString().padLeft(2, '0');
        return '$displayH:$displayM $period';
      }
    } catch (_) {}
    return trimmed;
  }

  static String _formatSlotRange(SlotModel slot) {
    final start = _formatTimeForDisplay(slot.startTime);
    final end = _formatTimeForDisplay(slot.endTime);
    return '$start - $end';
  }

  @override
  Widget build(BuildContext context) {
    final dateKey = _formatDateKey(selectedDate);

    return Scaffold(
      appBar: AppBar(
        title: Text(isMorning ? 'Morning Darshan Slots' : 'Evening Darshan Slots'),
      ),
      body: StreamBuilder<List<SlotModel>>(
        stream: DatabaseService().getActiveSlotsForService(service.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Unable to load slots for this service.',
              onRetry: () {},
            );
          }

          final allSlots = snapshot.data ?? [];
          final dateSlots = allSlots.where((s) => s.date == dateKey).toList();
          final effectiveSessionSlots = isMorning
              ? dateSlots.where((s) => _SlotsScreenState.isMorningSlot(s.startTime)).toList()
              : dateSlots.where((s) => !_SlotsScreenState.isMorningSlot(s.startTime)).toList();

          List<SlotModel> displaySlots;

          if (effectiveSessionSlots.isNotEmpty) {
            // Live Admin-configured slots for this date
            displaySlots = effectiveSessionSlots;
          } else {
            // Defaults
            final defaults = isMorning ? _defaultMorningTimings : _defaultEveningTimings;
            displaySlots = defaults.map((d) {
              final start = d['start']!;
              final end = d['end']!;
              final safeId = 'auto_${service.id}_${dateKey}_${start.replaceAll(':', '')}${end.replaceAll(':', '')}';
              return SlotModel(
                id: safeId,
                serviceId: service.id,
                date: dateKey,
                startTime: start,
                endTime: end,
                capacity: 50,
                bookedCount: 0,
                isActive: true,
              );
            }).toList();
          }

          return ListView(
            padding: const EdgeInsets.only(bottom: 36),
            children: [
              // Header Date Summary Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                        Text(
                          service.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            const Icon(Icons.event_rounded, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 5),
                            Text(
                              _formatFullDisplay(selectedDate),
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Text(
                      service.formattedPrice,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Instruction Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: (isMorning ? const Color(0xFFFFA000) : AppColors.primary).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        isMorning ? Icons.wb_sunny_rounded : Icons.nights_stay_rounded,
                        color: isMorning ? const Color(0xFFE65100) : AppColors.primary,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Select ${isMorning ? 'Morning' : 'Evening'} Time Slot',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Live Slot Cards
              ...displaySlots.map((slot) {
                final isFull = slot.isFull;
                final formattedRange = _formatSlotRange(slot);

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                  child: Card(
                    elevation: isFull ? 0 : 1,
                    color: isFull ? AppColors.surfaceVariant.withValues(alpha: 0.5) : AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: isFull ? AppColors.cardBorder : AppColors.primaryLight.withValues(alpha: 0.3),
                      ),
                    ),
                    child: InkWell(
                      onTap: isFull
                          ? null
                          : () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BookingScreen(
                                    service: service,
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
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isFull
                                    ? AppColors.textTertiary.withValues(alpha: 0.1)
                                    : (isMorning
                                        ? const Color(0xFFFFA000).withValues(alpha: 0.12)
                                        : AppColors.primary.withValues(alpha: 0.12)),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(
                                isMorning ? Icons.wb_sunny_rounded : Icons.nights_stay_rounded,
                                color: isFull
                                    ? AppColors.textTertiary
                                    : (isMorning ? const Color(0xFFE65100) : AppColors.primary),
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    formattedRange,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: isFull ? AppColors.textSecondary : AppColors.textPrimary,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Row(
                                    children: [
                                      Icon(
                                        isFull ? Icons.cancel_rounded : Icons.check_circle_rounded,
                                        size: 14,
                                        color: isFull ? AppColors.statusCancelled : const Color(0xFF2E7D32),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isFull
                                            ? 'Fully Booked'
                                            : '${slot.available} spots available',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: isFull ? AppColors.statusCancelled : const Color(0xFF2E7D32),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (!isFull)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [AppColors.primary, AppColors.accent],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.25),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Select',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    SizedBox(width: 4),
                                    Icon(Icons.arrow_forward_rounded, size: 12, color: Colors.white),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
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
