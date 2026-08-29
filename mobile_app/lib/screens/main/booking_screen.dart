import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class BookingScreen extends StatefulWidget {
  final ServiceModel service;
  final SlotModel slot;

  const BookingScreen({super.key, required this.service, required this.slot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _quantity = 1;
  bool _loading = false;

  Future<void> _submitBooking() async {
    final user = context.read<AuthProvider>().userModel;
    if (user == null) return;

    setState(() => _loading = true);
    
    try {
      await DatabaseService().createBooking(
        userId: user.id,
        service: widget.service,
        slot: widget.slot,
        quantity: _quantity,
        date: widget.slot.date,
      );
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking Successful!'), backgroundColor: Colors.green),
      );
      
      // Pop back to home/services
      Navigator.popUntil(context, (route) => route.isFirst);
      
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to book: ${e.toString()}'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final available = widget.slot.capacity - widget.slot.bookedCount;
    final maxAllowed = available > 10 ? 10 : available;
    final totalAmount = widget.service.price * _quantity;

    return Scaffold(
      appBar: AppBar(title: const Text('Review Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Booking Details', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildDetailRow('Service', widget.service.name),
            _buildDetailRow('Date', widget.slot.date),
            _buildDetailRow('Time', '${widget.slot.startTime} - ${widget.slot.endTime}'),
            _buildDetailRow('Price per person', widget.service.price > 0 ? '₹${widget.service.price}' : 'Free'),
            
            const Divider(height: 32),
            
            Text('Select Quantity', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                ),
                Text('$_quantity', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: _quantity < maxAllowed ? () => setState(() => _quantity++) : null,
                ),
                const Spacer(),
                Text('$available spots left', style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.w500)),
              ],
            ),
            
            const Divider(height: 32),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Amount', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text(
                  totalAmount > 0 ? '₹$totalAmount' : 'Free',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.deepOrange),
                ),
              ],
            ),
            
            const SizedBox(height: 48),
            
            ElevatedButton(
              onPressed: _loading ? null : _submitBooking,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.deepOrange,
                foregroundColor: Colors.white,
              ),
              child: _loading 
                  ? const CircularProgressIndicator(color: Colors.white) 
                  : const Text('CONFIRM BOOKING', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 16))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
