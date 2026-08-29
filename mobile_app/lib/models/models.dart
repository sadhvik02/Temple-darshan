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
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
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

  BannerModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.actionUrl,
  });

  factory BannerModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return BannerModel(
      id: doc.id,
      title: data['title'] ?? '',
      imageUrl: data['imageUrl'] ?? '',
      actionUrl: data['actionUrl'],
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

  ServiceModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.bookingEnabled,
  });

  factory ServiceModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return ServiceModel(
      id: doc.id,
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      price: data['price'] ?? 0,
      imageUrl: data['imageUrl'],
      bookingEnabled: data['bookingEnabled'] ?? false,
    );
  }
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
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return SlotModel(
      id: doc.id,
      serviceId: data['serviceId'] ?? '',
      date: data['date'] ?? '',
      startTime: data['startTime'] ?? '',
      endTime: data['endTime'] ?? '',
      capacity: data['capacity']?.toInt() ?? 0,
      bookedCount: data['bookedCount']?.toInt() ?? 0,
      isActive: data['isActive'] ?? false,
    );
  }

  int get available => capacity - bookedCount;
}

class BookingModel {
  final String id;
  final String serviceName;
  final String bookingRef;
  final String bookingDate;
  final int quantity;
  final String status;
  final num totalAmount;
  final String paymentStatus;
  
  BookingModel({
    required this.id,
    required this.serviceName,
    required this.bookingRef,
    required this.bookingDate,
    required this.quantity,
    required this.status,
    required this.totalAmount,
    required this.paymentStatus,
  });

  factory BookingModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return BookingModel(
      id: doc.id,
      serviceName: data['serviceName'] ?? '',
      bookingRef: data['bookingRef'] ?? '',
      bookingDate: data['bookingDate'] ?? '',
      quantity: data['quantity']?.toInt() ?? 1,
      status: data['status'] ?? 'pending',
      totalAmount: data['totalAmount'] ?? 0,
      paymentStatus: data['paymentStatus'] ?? 'pending',
    );
  }
}

class NewsModel {
  final String id;
  final String title;
  final String content;
  final String? imageUrl;
  final DateTime? createdAt;

  NewsModel({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    this.createdAt,
  });

  factory NewsModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return NewsModel(
      id: doc.id,
      title: data['title'] ?? '',
      content: data['content'] ?? '',
      imageUrl: data['imageUrl'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}

class TempleInfoModel {
  final String name;
  final String description;
  final String address;
  final String city;
  final String state;
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
    required this.phone,
    this.email,
    this.website,
    required this.timings,
    this.imageUrl,
  });

  factory TempleInfoModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>? ?? {};
    return TempleInfoModel(
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      address: data['address'] ?? '',
      city: data['city'] ?? '',
      state: data['state'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'],
      website: data['website'],
      timings: data['timings'] ?? {},
      imageUrl: data['imageUrl'],
    );
  }
}
