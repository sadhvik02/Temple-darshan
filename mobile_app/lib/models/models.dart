import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String id;
  final String name;
  final String phone;
  final String? email;

  UserModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return UserModel(
      id: doc.id,
      name: data['name'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'],
    );
  }
}

class BannerModel {
  final String id;
  final String title;
  final String imageUrl;
  final String? actionUrl;
  final int displayOrder;

  BannerModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.actionUrl,
    this.displayOrder = 0,
  });

  factory BannerModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return BannerModel(
      id: doc.id,
      title: data['title'] ?? '',
      imageUrl: data['imageUrl'] ?? '',
      actionUrl: data['actionUrl'],
      displayOrder: (data['displayOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class ServiceModel {
  final String id;
  final String name;
  final String description;
  final num price;
  final String? imageUrl;
  final bool bookingEnabled;
  final String category;

  ServiceModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.bookingEnabled,
    required this.category,
  });

  factory ServiceModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return ServiceModel(
      id: doc.id,
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      price: data['price'] ?? 0,
      imageUrl: data['imageUrl'],
      bookingEnabled: data['bookingEnabled'] ?? false,
      category: (data['category'] == 'seva' || data['category'] == null) ? 'ashrama_seva' : data['category'],
    );
  }

  String get formattedPrice => price > 0 ? '₹$price' : 'Free';
}

class SlotModel {
  final String id;
  final String serviceId;
  final String date;
  final String startTime;
  final String endTime;
  final int capacity;
  final int bookedCount;
  final bool isActive;

  SlotModel({
    required this.id,
    required this.serviceId,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.capacity,
    required this.bookedCount,
    required this.isActive,
  });

  factory SlotModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return SlotModel(
      id: doc.id,
      serviceId: data['serviceId'] ?? '',
      date: data['date'] ?? '',
      startTime: data['startTime'] ?? '',
      endTime: data['endTime'] ?? '',
      capacity: (data['capacity'] as num?)?.toInt() ?? 0,
      bookedCount: (data['bookedCount'] as num?)?.toInt() ?? 0,
      isActive: data['isActive'] ?? false,
    );
  }

  int get available => (capacity - bookedCount).clamp(0, capacity);
  bool get isFull => available <= 0;
  String get timeRange => '$startTime - $endTime';
}

class BookingModel {
  final String id;
  final String userId;
  final String serviceId;
  final String serviceName;
  final String? slotId;
  final String bookingRef;
  final String bookingDate;
  final int quantity;
  final String status;
  final num totalAmount;
  final String paymentStatus;
  final String sourceType;
  final List<dynamic>? devotees;
  final DateTime? createdAt;
  
  BookingModel({
    required this.id,
    required this.userId,
    required this.serviceId,
    required this.serviceName,
    this.slotId,
    required this.bookingRef,
    required this.bookingDate,
    required this.quantity,
    required this.status,
    required this.totalAmount,
    required this.paymentStatus,
    this.sourceType = 'seva',
    this.devotees,
    this.createdAt,
  });

  factory BookingModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return BookingModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      serviceId: data['serviceId'] ?? '',
      serviceName: data['serviceName'] ?? '',
      slotId: data['slotId'],
      bookingRef: data['bookingRef'] ?? '',
      bookingDate: data['bookingDate'] ?? '',
      quantity: (data['quantity'] as num?)?.toInt() ?? 1,
      status: data['status'] ?? 'pending',
      totalAmount: data['totalAmount'] ?? 0,
      paymentStatus: data['paymentStatus'] ?? 'pending',
      sourceType: data['sourceType'] ?? 'seva',
      devotees: data['devotees'] as List<dynamic>?,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  String get formattedTotal => totalAmount > 0 ? '₹$totalAmount' : 'Free';
}

class DonationModel {
  final String id;
  final String userId;
  final String donationTypeId;
  final String donationTypeName;
  final num amount;
  final String paymentId;
  final String? razorpayPaymentId;
  final String status;
  final String donorName;
  final String donorPhone;
  final DateTime? createdAt;

  DonationModel({
    required this.id,
    required this.userId,
    required this.donationTypeId,
    required this.donationTypeName,
    required this.amount,
    required this.paymentId,
    this.razorpayPaymentId,
    required this.status,
    required this.donorName,
    required this.donorPhone,
    this.createdAt,
  });

  factory DonationModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return DonationModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      donationTypeId: data['donationTypeId'] ?? '',
      donationTypeName: data['donationTypeName'] ?? 'General Donation',
      amount: data['amount'] ?? 0,
      paymentId: data['paymentId'] ?? '',
      razorpayPaymentId: data['razorpayPaymentId'],
      status: data['status'] ?? 'pending',
      donorName: data['donorName'] ?? '',
      donorPhone: data['donorPhone'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}

class NewsModel {
  final String id;
  final String title;
  final String content;
  final String? imageUrl;
  final DateTime? publishedAt;

  NewsModel({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    this.publishedAt,
  });

  factory NewsModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return NewsModel(
      id: doc.id,
      title: data['title'] ?? '',
      content: data['content'] ?? '',
      imageUrl: data['imageUrl'],
      publishedAt: (data['publishedAt'] as Timestamp?)?.toDate() ??
          (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}

class EventModel {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String eventDate;
  final String startTime;
  final String endTime;
  final bool isPublished;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    required this.eventDate,
    required this.startTime,
    required this.endTime,
    required this.isPublished,
  });

  factory EventModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return EventModel(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      imageUrl: data['imageUrl'],
      eventDate: data['eventDate'] ?? '',
      startTime: data['startTime'] ?? '',
      endTime: data['endTime'] ?? '',
      isPublished: data['isPublished'] ?? false,
    );
  }

  String get timeRange => (startTime.isNotEmpty && endTime.isNotEmpty)
      ? '$startTime - $endTime'
      : (startTime.isNotEmpty ? startTime : '');
}

class TempleInfoModel {
  final String name;
  final String description;
  final String address;
  final String city;
  final String state;
  final String pincode;
  final String phone;
  final String? email;
  final String? website;
  final Map<String, dynamic> timings;
  final String? imageUrl;

  TempleInfoModel({
    required this.name,
    required this.description,
    required this.address,
    required this.city,
    required this.state,
    required this.pincode,
    required this.phone,
    this.email,
    this.website,
    required this.timings,
    this.imageUrl,
  });

  factory TempleInfoModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return TempleInfoModel(
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      address: data['address'] ?? '',
      city: data['city'] ?? '',
      state: data['state'] ?? '',
      pincode: data['pincode'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'],
      website: data['website'],
      timings: data['timings'] as Map<String, dynamic>? ?? {},
      imageUrl: data['imageUrl'],
    );
  }

  String get morningTimings => timings['morning']?.toString() ?? '6:00 AM - 12:00 PM';
  String get eveningTimings => timings['evening']?.toString() ?? '4:00 PM - 9:00 PM';
  String get fullAddress => '$address, $city, $state${pincode.isNotEmpty ? ' - $pincode' : ''}';
}

class DarshanModel {
  final String id;
  final String name;
  final String description;
  final num price;
  final String? imageUrl;
  final bool bookingEnabled;
  final bool isActive;

  DarshanModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.bookingEnabled,
    required this.isActive,
  });

  factory DarshanModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return DarshanModel(
      id: doc.id,
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      price: data['price'] ?? 0,
      imageUrl: data['imageUrl'],
      bookingEnabled: data['bookingEnabled'] ?? false,
      isActive: data['isActive'] ?? false,
    );
  }

  String get formattedPrice => price > 0 ? '₹$price' : 'Free';
}

class DonationTypeModel {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String category;
  final List<num> suggestedAmounts;
  final bool isActive;

  DonationTypeModel({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    required this.category,
    required this.suggestedAmounts,
    required this.isActive,
  });

  factory DonationTypeModel.fromFirestore(DocumentSnapshot doc) {
    final Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return DonationTypeModel(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      imageUrl: data['imageUrl'],
      category: data['category'] ?? 'general',
      suggestedAmounts: (data['suggestedAmounts'] as List<dynamic>?)
              ?.map((e) => e as num)
              .toList() ??
          [],
      isActive: data['isActive'] ?? false,
    );
  }
}

