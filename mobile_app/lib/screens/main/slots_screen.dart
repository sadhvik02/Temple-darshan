import 'package:flutter/material.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';
import 'booking_screen.dart';

class SlotsScreen extends StatelessWidget {
  final ServiceModel service;
  
  const SlotsScreen({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(service.name)),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.deepOrange.withValues(alpha: 0.1),
            width: double.infinity,
            child: Text(
              'Select a date and time slot for your booking.',
              style: TextStyle(color: Colors.deepOrange[800], fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<SlotModel>>(
              stream: DatabaseService().getActiveSlotsForService(service.id),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return const Center(child: Text('Error loading slots'));
                }
                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Text(
                        'No slots currently available for this service.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 18),
                      ),
                    ),
                  );
                }

                final slots = snapshot.data!;
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: slots.length,
                  itemBuilder: (context, index) {
                    final slot = slots[index];
                    final isFull = slot.available <= 0;

                    return Card(
                      color: isFull ? Colors.grey[200] : Colors.white,
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Icon(
                          Icons.schedule,
                          color: isFull ? Colors.grey : Colors.deepOrange,
                          size: 32,
                        ),
                        title: Text(
                          '${slot.date} | ${slot.startTime} - ${slot.endTime}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isFull ? Colors.grey : Colors.black87,
                          ),
                        ),
                        subtitle: Text(
                          isFull 
                              ? 'Fully Booked' 
                              : '${slot.available} spots available',
                          style: TextStyle(
                            color: isFull ? Colors.red : Colors.green[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        trailing: isFull 
                            ? null 
                            : const Icon(Icons.arrow_forward_ios, size: 16),
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
}
