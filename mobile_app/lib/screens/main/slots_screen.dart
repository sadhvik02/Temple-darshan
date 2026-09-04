import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/error_state_widget.dart';
import 'booking_screen.dart';
import 'darshan_screen.dart';
class SlotsScreen extends StatefulWidget {
  final ServiceModel service;

  const SlotsScreen({super.key, required this.service});

  @override
  State<SlotsScreen> createState() => _SlotsScreenState();
}

class _SlotsScreenState extends State<SlotsScreen> {
  DateTime _selectedDate = DateTime.now();
  SlotModel? _selectedSlot;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
  }

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
    return '$start – $end';
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

  static const List<Map<String, String>> _defaultMorningTimings = [
    {'start': '06:00', 'end': '07:00'},
    {'start': '07:00', 'end': '08:00'},
    {'start': '08:00', 'end': '09:00'},
    {'start': '10:00', 'end': '11:00'},
  ];

  static const List<Map<String, String>> _defaultEveningTimings = [
    {'start': '18:00', 'end': '19:00'},
    {'start': '19:00', 'end': '20:00'},
    {'start': '20:00', 'end': '21:00'},
  ];

  @override
  Widget build(BuildContext context) {
    final selectedDateKey = _formatDateKey(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Select Darshan & Seva Slot'),
        elevation: 0,
      ),
      body: StreamBuilder<List<SlotModel>>(
        stream: DatabaseService().getActiveSlotsForService(widget.service.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            );
          }
          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Unable to load slots from temple server.',
              onRetry: () => setState(() {}),
            );
          }

          final allDbSlots = snapshot.data ?? [];
          final activeDates = allDbSlots.map((s) => s.date).toSet();
          final dateSlots = allDbSlots.where((s) => s.date == selectedDateKey).toList();

          // Build display slots (merge live DB slots with standard temple schedule defaults)
          List<SlotModel> morningSlots = [];
          for (final d in _defaultMorningTimings) {
            final live = dateSlots.firstWhere(
              (s) => s.startTime == d['start'] && s.endTime == d['end'],
              orElse: () => SlotModel(
                id: 'auto_${widget.service.id}_${selectedDateKey}_${d['start']!.replaceAll(':', '')}',
                serviceId: widget.service.id,
                date: selectedDateKey,
                startTime: d['start']!,
                endTime: d['end']!,
                capacity: 50,
                bookedCount: 0,
                isActive: true,
              ),
            );
            morningSlots.add(live);
          }

          List<SlotModel> eveningSlots = [];
          for (final d in _defaultEveningTimings) {
            final live = dateSlots.firstWhere(
              (s) => s.startTime == d['start'] && s.endTime == d['end'],
              orElse: () => SlotModel(
                id: 'auto_${widget.service.id}_${selectedDateKey}_${d['start']!.replaceAll(':', '')}',
                serviceId: widget.service.id,
                date: selectedDateKey,
                startTime: d['start']!,
                endTime: d['end']!,
                capacity: 50,
                bookedCount: 0,
                isActive: true,
              ),
            );
            eveningSlots.add(live);
          }

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
                  physics: const BouncingScrollPhysics(),
                  children: [
                    // 1. Sleek Seva Hero Header Card
                    _buildSevaHeaderCard(),
                    const SizedBox(height: 18),

                    // 2. Date Selection Carousel Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Date',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.3,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 22),
                          tooltip: 'Open Calendar',
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 90)),
                              builder: (context, child) {
                                return Theme(
                                  data: Theme.of(context).copyWith(
                                    colorScheme: const ColorScheme.light(
                                      primary: AppColors.primary,
                                      onPrimary: Colors.white,
                                      surface: Colors.white,
                                    ),
                                  ),
                                  child: child!,
                                );
                              },
                            );
                            if (picked != null) {
                              setState(() {
                                _selectedDate = picked;
                                _selectedSlot = null; // Reset selection on date change
                              });
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // 3. Horizontal Date Strip (Next 30 Days)
                    _buildHorizontalDateStrip(activeDates),
                    const SizedBox(height: 22),

                    // 4. Morning Slots Section
                    if (morningSlots.isNotEmpty) ...[
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF3E0),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.wb_sunny_rounded, color: Color(0xFFE65100), size: 16),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Morning Slots',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF3E0),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '06:00 AM – 11:00 AM',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFFE65100)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _buildSlotChipsGrid(morningSlots),
                      const SizedBox(height: 20),
                    ],

                    // 5. Evening Slots Section
                    if (eveningSlots.isNotEmpty) ...[
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEDE7F6),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.nights_stay_rounded, color: Color(0xFF5E35B1), size: 16),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Evening Slots',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEDE7F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '06:00 PM – 09:00 PM',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF5E35B1)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _buildSlotChipsGrid(eveningSlots),
                      const SizedBox(height: 20),
                    ],

                    // 6. Pilgrim Notice
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF8E1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFFE082)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline_rounded, color: Color(0xFFE65100), size: 18),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Devotees are requested to arrive at the ashram 15 mins prior to the slot timing.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5D4037),
                                height: 1.35,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 7. Sticky Bottom CTA Bar
              _buildBottomActionSheet(),
            ],
          );
        },
      ),
    );
  }

  // Seva Details Hero Banner
  Widget _buildSevaHeaderCard() {
    final isAshrama = widget.service.category == 'ashrama_seva' || widget.service.price == 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFF3E0), Color(0xFFFFE0B2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFFFCC80)),
            ),
            child: Center(
              child: Image.asset(
                isAshrama ? 'assets/icons/ashrama_seva_icon.png' : 'assets/icons/darshan_selected.png',
                width: 28,
                height: 28,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.temple_hindu, color: AppColors.primary, size: 24),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        widget.service.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      widget.service.formattedPrice,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: isAshrama ? const Color(0xFF047857) : const Color(0xFFE65100),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isAshrama ? const Color(0xFFE0F2FE) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isAshrama ? '🕉️ Ashrama Seva (Free)' : '🪷 Arjitha Seva (Paid)',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: isAshrama ? const Color(0xFF0369A1) : const Color(0xFFB45309),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Horizontal Date Strip (Next 30 Days)
  Widget _buildHorizontalDateStrip(Set<String> activeDates) {
    const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: 30,
        itemBuilder: (context, index) {
          final date = today.add(Duration(days: index));
          final isSelected = date.year == _selectedDate.year &&
              date.month == _selectedDate.month &&
              date.day == _selectedDate.day;

          String dayLabel = daysShort[date.weekday - 1];
          if (index == 0) dayLabel = 'TODAY';
          if (index == 1) dayLabel = 'TOM';

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedDate = date;
                _selectedSlot = null; // Reset chosen slot on date switch
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 62,
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [Color(0xFFE65100), Color(0xFFFF8F00)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      )
                    : null,
                color: isSelected ? null : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? const Color(0xFFE65100) : const Color(0xFFE2E8F0),
                  width: isSelected ? 1.8 : 1.0,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFFE65100).withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    dayLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isSelected ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${date.day}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isSelected ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    monthsShort[date.month - 1],
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Available Slot Grid
  Widget _buildSlotChipsGrid(List<SlotModel> slots) {
    if (slots.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24.0),
        child: Center(
          child: Text(
            'No slots available in this session. Try another filter or date.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: slots.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.1,
      ),
      itemBuilder: (context, index) {
        final slot = slots[index];
        final isSelected = _selectedSlot?.id == slot.id;
        final isFull = slot.isFull;
        final isMorn = isMorningSlot(slot.startTime);
        final formattedRange = _formatSlotRange(slot);

        return GestureDetector(
          onTap: isFull
              ? null
              : () {
                  setState(() {
                    _selectedSlot = slot;
                  });
                },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFFFFF3E0)
                  : isFull
                      ? const Color(0xFFF1F5F9)
                      : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFFE65100)
                    : isFull
                        ? const Color(0xFFE2E8F0)
                        : const Color(0xFFFFE0B2),
                width: isSelected ? 2.0 : 1.0,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: const Color(0xFFE65100).withValues(alpha: 0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
            ),
            child: Row(
              children: [
                Icon(
                  isMorn ? Icons.wb_sunny_rounded : Icons.nights_stay_rounded,
                  size: 18,
                  color: isSelected
                      ? const Color(0xFFE65100)
                      : isFull
                          ? const Color(0xFF94A3B8)
                          : isMorn
                              ? const Color(0xFFF57F17)
                              : const Color(0xFF5E35B1),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        formattedRange,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: isFull ? const Color(0xFF94A3B8) : const Color(0xFF0F172A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isFull ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              isFull ? 'Full' : '${slot.available} left',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isFull ? const Color(0xFFEF4444) : const Color(0xFF047857),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle_rounded, color: Color(0xFFE65100), size: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  // Sticky Bottom CTA Bar
  Widget _buildBottomActionSheet() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _selectedSlot != null
                    ? _formatSlotRange(_selectedSlot!)
                    : 'Select a time slot',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: _selectedSlot != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _formatFullDisplay(_selectedDate),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
          ElevatedButton(
            onPressed: _selectedSlot == null
                ? null
                : () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => widget.service.category == 'darshan'
                            ? DarshanReviewScreen(
                                darshan: DarshanModel(
                                  id: widget.service.id,
                                  name: widget.service.name,
                                  description: widget.service.description,
                                  price: widget.service.price,
                                  bookingEnabled: widget.service.bookingEnabled,
                                  isActive: true,
                                  imageUrl: widget.service.imageUrl,
                                ),
                                slot: _selectedSlot!,
                              )
                            : BookingScreen(
                                service: widget.service,
                                slot: _selectedSlot!,
                              ),
                      ),
                    );
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE65100),
              disabledBackgroundColor: const Color(0xFFCBD5E1),
              foregroundColor: Colors.white,
              disabledForegroundColor: Colors.white70,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: _selectedSlot != null ? 3 : 0,
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Continue',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward_rounded, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Retained for backwards compatibility if referenced
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

  @override
  Widget build(BuildContext context) {
    return SlotsScreen(service: service);
  }
}
