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

  Stream<List<DarshanModel>> getActiveDarshans() {
    return _db
        .collection('darshans')
        .where('isActive', isEqualTo: true)
        .orderBy('displayOrder')
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => DarshanModel.fromFirestore(doc)).toList());
  }

  Stream<List<DonationTypeModel>> getActiveDonationTypes() {
    return _db
        .collection('donationTypes')
        .where('isActive', isEqualTo: true)
        .orderBy('displayOrder')
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => DonationTypeModel.fromFirestore(doc)).toList());
  }

  /// CRITICAL: Atomic Booking Transaction
  /// The sourceType field ('seva' or 'darshan') determines which collection
  /// the serviceId references. Price is validated server-side via firestore.rules.
  /// Returns the unique booking reference code (refCode)
  Future<String> createBooking({
    required String userId,
    required String offeringId,
    required String offeringName,
    required num offeringPrice,
    required String sourceType, // 'seva' or 'darshan'
    required SlotModel? slot,
    required int quantity,
    required String date,
    List<Map<String, dynamic>>? devotees,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final refCode = 'BK-${timestamp.substring(timestamp.length - 6)}';

    await _db.runTransaction((transaction) async {
      // 1. If slot-based, safely increment bookedCount
      if (slot != null && !slot.id.startsWith('auto_')) {
        final slotRef = _db.collection('slots').doc(slot.id);
        final slotDoc = await transaction.get(slotRef);
        
        if (slotDoc.exists) {
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
      }

      // 2. Derive total amount from the offering price.
      // Security rules validate totalAmount == price * quantity against the correct collection.
      final totalAmount = offeringPrice * quantity;

      // 3. Save booking document with sourceType discriminator
      final bookingRef = _db.collection('bookings').doc();
      final Map<String, dynamic> bookingData = {
        'userId': userId,
        'serviceId': offeringId,
        'serviceName': offeringName,
        'slotId': slot?.id,
        'bookingRef': refCode,
        'bookingDate': date,
        'quantity': quantity,
        'status': 'pending',
        'paymentStatus': 'pending',
        'totalAmount': totalAmount,
        'sourceType': sourceType,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (devotees != null && devotees.isNotEmpty) {
        bookingData['devotees'] = devotees;
      }

      transaction.set(bookingRef, bookingData);
    });

    return refCode;
  }
}

