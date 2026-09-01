import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_button.dart';
import 'booking_screen.dart';

class RecurringSevaScreen extends StatefulWidget {
  final ServiceModel service;

  const RecurringSevaScreen({super.key, required this.service});

  @override
  State<RecurringSevaScreen> createState() => _RecurringSevaScreenState();
}

class _RecurringSevaScreenState extends State<RecurringSevaScreen> {
  int _selectedDay = 1;
  int _selectedDuration = 3;
  String _selectedTimeRange = '06:00 - 07:00';

  final List<String> _timeOptions = [
    '06:00 - 07:00',
    '07:00 - 08:00',
    '08:00 - 09:00',
    '10:00 - 11:00',
    '19:00 - 20:00',
    '20:00 - 21:00',
  ];

  void _generateRecurringBookings() {
    List<Map<String, String>> occurrences = [];
    
    // Start generating from the next available month
    DateTime now = DateTime.now();
    int currentYear = now.year;
    int currentMonth = now.month;
    
    // If today is past the selected day, start next month
    if (now.day >= _selectedDay) {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    for (int i = 0; i < _selectedDuration; i++) {
      // Create date format YYYY-MM-DD
      String yearStr = currentYear.toString();
      String monthStr = currentMonth.toString().padLeft(2, '0');
      String dayStr = _selectedDay.toString().padLeft(2, '0');
      
      String dateKey = '$yearStr-$monthStr-$dayStr';
      occurrences.add({
        'date': dateKey,
        'timeRange': _selectedTimeRange,
      });
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // Navigate to booking screen, passing occurrences instead of a single slot
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingScreen(
          service: widget.service,
          slot: null, 
          recurringOccurrences: occurrences,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recurring Seva Schedule')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: AppColors.primary),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Select the day of the month for your recurring Seva. We require slots to be created by the admin in advance.',
                      style: TextStyle(color: AppColors.textPrimary, height: 1.4),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 30),
            
            // Day Selection
            const Text(
              'Select Day of the Month',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.divider),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int>(
                  isExpanded: true,
                  value: _selectedDay,
                  items: List.generate(28, (index) {
                    final day = index + 1;
                    return DropdownMenuItem(
                      value: day,
                      child: Text('Every $day${_getDaySuffix(day)} of the month'),
                    );
                  }),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedDay = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Time Slot Selection
            const Text(
              'Select Time Slot',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.divider),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedTimeRange,
                  items: _timeOptions.map((time) {
                    return DropdownMenuItem(
                      value: time,
                      child: Text(time),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedTimeRange = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Duration Selection
            const Text(
              'Duration (Months)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Slider(
                    value: _selectedDuration.toDouble(),
                    min: 1,
                    max: 12,
                    divisions: 11,
                    activeColor: AppColors.primary,
                    label: '$_selectedDuration Months',
                    onChanged: (val) => setState(() => _selectedDuration = val.toInt()),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Text(
                    '$_selectedDuration mo',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
            
            CustomButton(
              text: 'Continue to Devotee Details',
              onPressed: _generateRecurringBookings,
            ),
          ],
        ),
      ),
    );
  }

  String _getDaySuffix(int day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}
