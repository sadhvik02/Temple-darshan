import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class DatabaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<TempleInfoModel?> getTempleInfo() async {
    final doc = await _db.collection('templeInfo').doc('main').get();
    if (doc.exists) {
      return TempleInfoModel.fromFirestore(doc);
    }
    return null;
  }

  Stream<List<BannerModel>> getActiveBanners() {
    return _db
        .collection('banners')
        .where('isActive', isEqualTo: true)
        .orderBy('displayOrder')
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => BannerModel.fromFirestore(doc)).toList());
  }

  Stream<List<ServiceModel>> getActiveServices() {
    return _db
        .collection('services')
        .where('isActive', isEqualTo: true)
        .orderBy('displayOrder')
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => ServiceModel.fromFirestore(doc)).toList());
  }

  Stream<List<SlotModel>> getActiveSlotsForService(String serviceId) {
    return _db
        .collection('slots')
        .where('serviceId', isEqualTo: serviceId)
        .where('isActive', isEqualTo: true)
        // Note: Ordering by multiple fields requires a composite index. 
        // Admin dashboard indexes support date sorting. We will fetch and sort in dart if needed.
        .snapshots()
        .map((snap) {
          final slots = snap.docs.map((doc) => SlotModel.fromFirestore(doc)).toList();
          slots.sort((a, b) {
            final dateCmp = a.date.compareTo(b.date);
            if (dateCmp != 0) return dateCmp;
            return a.startTime.compareTo(b.startTime);
          });
          return slots;
        });
  }

  Stream<List<BookingModel>> getUserBookings(String userId) {
    return _db
        .collection('bookings')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => BookingModel.fromFirestore(doc)).toList());
  }

  Stream<List<NewsModel>> getPublishedNews() {
    return _db
        .collection('news')
        .where('isPublished', isEqualTo: true)
        .orderBy('publishedAt', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => NewsModel.fromFirestore(doc)).toList());
  }

  /// CRITICAL: Atomic Booking Transaction
  Future<void> createBooking({
    required String userId,
    required ServiceModel service,
    required SlotModel? slot, // null if service is not slot-based
    required int quantity,
    required String date,
  }) async {
    return _db.runTransaction((transaction) async {
      // 1. If slot-based, safely increment bookedCount
      if (slot != null) {
        final slotRef = _db.collection('slots').doc(slot.id);
        final slotDoc = await transaction.get(slotRef);
        
        if (!slotDoc.exists) {
          throw Exception("Slot does not exist.");
        }

        final currentBooked = slotDoc.data()?['bookedCount'] ?? 0;
        final capacity = slotDoc.data()?['capacity'] ?? 0;

        if (currentBooked + quantity > capacity) {
          throw Exception("Capacity exceeded. Not enough available spots.");
        }

        transaction.update(slotRef, {
          'bookedCount': currentBooked + quantity,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      // 2. Derive total amount from SERVER-SIDE/fetched service data. 
      // Do NOT trust client UI input for price!
      final totalAmount = service.price * quantity;

      // 3. Create booking reference
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final refCode = 'BK-${timestamp.substring(timestamp.length - 6)}';

      // 4. Save booking
      final bookingRef = _db.collection('bookings').doc();
      transaction.set(bookingRef, {
        'userId': userId,
        'serviceId': service.id,
        'serviceName': service.name,
        'slotId': slot?.id,
        'bookingRef': refCode,
        'bookingDate': date,
        'quantity': quantity,
        'status': 'pending',
        'paymentStatus': 'pending', // No payments in this phase
        'totalAmount': totalAmount,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
  }
}
