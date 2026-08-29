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

  Stream<List<EventModel>> getPublishedEvents() {
    return _db
        .collection('events')
        .where('isPublished', isEqualTo: true)
        .snapshots()
        .map((snap) {
          final events = snap.docs.map((doc) => EventModel.fromFirestore(doc)).toList();
          events.sort((a, b) => a.eventDate.compareTo(b.eventDate));
          return events;
        });
  }

  /// CRITICAL: Atomic Booking Transaction
  /// Returns the unique booking reference code (refCode)
  Future<String> createBooking({
    required String userId,
    required ServiceModel service,
    required SlotModel? slot, // null if service is not slot-based
    required int quantity,
    required String date,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final refCode = 'BK-${timestamp.substring(timestamp.length - 6)}';

    await _db.runTransaction((transaction) async {
      // 1. If slot-based, safely increment bookedCount
      if (slot != null) {
        final slotRef = _db.collection('slots').doc(slot.id);
        final slotDoc = await transaction.get(slotRef);
        
        if (!slotDoc.exists) {
          throw Exception("The selected slot is no longer available.");
        }

        final currentBooked = (slotDoc.data()?['bookedCount'] as num?)?.toInt() ?? 0;
        final capacity = (slotDoc.data()?['capacity'] as num?)?.toInt() ?? 0;

        if (currentBooked + quantity > capacity) {
          throw Exception("Capacity exceeded. Only ${capacity - currentBooked} spots remain.");
        }

        transaction.update(slotRef, {
          'bookedCount': currentBooked + quantity,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      // 2. Derive total amount from SERVER-SIDE/fetched service data. 
      // Security rules require totalAmount == service.price * quantity
      final totalAmount = service.price * quantity;

      // 3. Save booking document
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
        'paymentStatus': 'pending',
        'totalAmount': totalAmount,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });

    return refCode;
  }
}
