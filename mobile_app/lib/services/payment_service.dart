  import 'package:cloud_functions/cloud_functions.dart';

class PaymentService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Call the backend to securely calculate amount and create a Razorpay order.
  /// [sourceType] must be 'seva', 'darshan', or 'donation'.
  /// Returns a map containing: orderId, amount, currency, keyId, paymentDocId
  Future<Map<String, dynamic>> createPaymentOrder({
    required String sourceType,
    required String offeringId,
    int? quantity,
    String? slotId,
    num? donationAmount,
  }) async {
    try {
      final callable = _functions.httpsCallable('createPaymentOrder');
      
      final response = await callable.call({
        'sourceType': sourceType,
        'offeringId': offeringId,
        'quantity': quantity ?? 1,
        if (slotId != null) 'slotId': slotId,
        if (donationAmount != null) 'donationAmount': donationAmount,
      });

      return Map<String, dynamic>.from(response.data as Map);
    } catch (e) {
      print('Error creating payment order: $e');
      rethrow;
    }
  }

  /// Call the backend to securely verify a Razorpay payment signature.
  /// If successful, the backend creates the booking or donation atomically.
  /// Returns a map containing: success, status, and bookingRef (if applicable)
  Future<Map<String, dynamic>> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    required String paymentDocId,
    Map<String, dynamic>? devoteeDetails,
  }) async {
    try {
      final callable = _functions.httpsCallable('verifyPayment');
      
      final response = await callable.call({
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
        'paymentDocId': paymentDocId,
        if (devoteeDetails != null) 'devoteeDetails': devoteeDetails,
      });

      return Map<String, dynamic>.from(response.data as Map);
    } catch (e) {
      print('Error verifying payment: $e');
      rethrow;
    }
  }
}
