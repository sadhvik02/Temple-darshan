import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class MyBookingsScreen extends StatelessWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().userModel;

    if (user == null) {
      return const Center(child: Text('Not authenticated.'));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')),
      body: StreamBuilder<List<BookingModel>>(
        stream: DatabaseService().getUserBookings(user.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Error loading bookings'));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'You have no bookings yet.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18),
                ),
              ),
            );
          }

          final bookings = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bookings.length,
            itemBuilder: (context, index) {
              final booking = bookings[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              booking.serviceName,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          _buildStatusBadge(booking.status),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Date: ${booking.bookingDate}', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('Quantity: ${booking.quantity}', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('Total Amount: ₹${booking.totalAmount}', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 12),
                      Text(
                        'Ref: ${booking.bookingRef}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'confirmed':
        color = Colors.green;
        break;
      case 'cancelled':
        color = Colors.red;
        break;
      case 'completed':
        color = Colors.blue;
        break;
      default:
        color = Colors.orange;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
