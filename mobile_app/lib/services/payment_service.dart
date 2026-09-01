
import 'dart:async';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

enum PaymentUIState {
  idle,
  creatingOrder,
  openingCheckout,
  verifying,
  success,
  failed,
  cancelled,
  slotUnavailable,
  refundRequired,
  networkError,
}

class PaymentResult {
  final bool isSuccess;
  final bool isCancelled;
  final bool isRefundNeeded;
  final bool isVerificationFailed;
  final bool isSlotUnavailable;
  final bool isNetworkError;
  final String? bookingRef;
  final String? bookingId;
  final String? donationRef;
  final String? paymentId;
  final String? orderId;
  final String? message;
  final num? totalAmount;

  PaymentResult({
    required this.isSuccess,
    this.isCancelled = false,
    this.isRefundNeeded = false,
    this.isVerificationFailed = false,
    this.isSlotUnavailable = false,
    this.isNetworkError = false,
    this.bookingRef,
    this.bookingId,
    this.donationRef,
    this.paymentId,
    this.orderId,
    this.message,
    this.totalAmount,
  });

  factory PaymentResult.cancelled([String? msg]) {
    return PaymentResult(
      isSuccess: false,
      isCancelled: true,
      message: msg ?? 'Payment was cancelled by devotee.',
    );
  }

  factory PaymentResult.failed(
    String msg, {
    bool isVerificationFailed = false,
    bool isNetworkError = false,
    bool isSlotUnavailable = false,
  }) {
    return PaymentResult(
      isSuccess: false,
      isVerificationFailed: isVerificationFailed,
      isNetworkError: isNetworkError,
      isSlotUnavailable: isSlotUnavailable,
      message: msg,
    );
  }

  factory PaymentResult.refundNeeded({
    required String paymentId,
    String? orderId,
    String? message,
    num? totalAmount,
  }) {
    return PaymentResult(
      isSuccess: false,
      isRefundNeeded: true,
      paymentId: paymentId,
      orderId: orderId,
      totalAmount: totalAmount,
      message: message ??
          'Payment was received, but the selected slot is no longer available. Your payment requires refund processing.',
    );
  }
}

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  
  Razorpay? _razorpay;
  bool _isProcessing = false;
  String? _currentOrderId;
  String? _currentPaymentDocId;
  num? _currentAmount;
  List<Map<String, String>>? _currentDevotees;
  Completer<PaymentResult>? _activePaymentCompleter;

  bool get isProcessing => _isProcessing;

  void _initRazorpay() {
    _razorpay?.clear();
    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
    _isProcessing = false;
  }

  /// Start Seva Payment
  Future<PaymentResult> startSevaPayment({
    required String serviceId,
    required String serviceName,
    required String? slotId,
    required String date,
    required String timeRange,
    required int quantity,
    required num expectedTotal,
    required List<Map<String, String>> devoteeDetails,
    required String donorName,
    required String donorPhone,
    String? donorEmail,
    void Function(PaymentUIState state)? onStateChange,
  }) async {
    return _startPaymentFlow(
      payload: {
        'sourceType': 'seva',
        'offeringId': serviceId,
        'offeringName': serviceName,
        'slotId': slotId,
        'bookingDate': date,
        'timeRange': timeRange,
        'quantity': quantity,
        'expectedTotal': expectedTotal,
        'devotees': devoteeDetails,
        'devoteeName': donorName,
        'devoteePhone': donorPhone,
        'devoteeEmail': donorEmail,
      },
      offeringTitle: serviceName,
      donorName: donorName,
      donorPhone: donorPhone,
      donorEmail: donorEmail,
      onStateChange: onStateChange,
    );
  }

  /// Start Darshan Payment
  Future<PaymentResult> startDarshanPayment({
    required String darshanId,
    required String darshanName,
    required String? slotId,
    required String date,
    required String timeRange,
    required int quantity,
    required num expectedTotal,
    List<Map<String, String>>? devoteeDetails,
    required String devoteeName,
    required String devoteePhone,
    String? devoteeEmail,
    void Function(PaymentUIState state)? onStateChange,
  }) async {
    return _startPaymentFlow(
      payload: {
        'sourceType': 'darshan',
        'offeringId': darshanId,
        'offeringName': darshanName,
        'slotId': slotId,
        'bookingDate': date,
        'timeRange': timeRange,
        'quantity': quantity,
        'expectedTotal': expectedTotal,
        'devotees': ?devoteeDetails,
        'devoteeName': devoteeName,
        'devoteePhone': devoteePhone,
        'devoteeEmail': devoteeEmail,
      },
      offeringTitle: darshanName,
      donorName: devoteeName,
      donorPhone: devoteePhone,
      donorEmail: devoteeEmail,
      onStateChange: onStateChange,
    );
  }

  /// Start Donation Payment
  Future<PaymentResult> startDonationPayment({
    required String donationTypeId,
    required String donationTitle,
    required num amount,
    required String donorName,
    required String donorPhone,
    String? donorEmail,
    String? panNumber,
    void Function(PaymentUIState state)? onStateChange,
  }) async {
    return _startPaymentFlow(
      payload: {
        'sourceType': 'donation',
        'offeringId': donationTypeId,
        'offeringName': donationTitle,
        'donationAmount': amount,
        'donorName': donorName,
        'donorPhone': donorPhone,
        'donorEmail': donorEmail,
        'panNumber': panNumber,
      },
      offeringTitle: 'Donation: $donationTitle',
      donorName: donorName,
      donorPhone: donorPhone,
      donorEmail: donorEmail,
      onStateChange: onStateChange,
    );
  }

  /// Master payment flow orchestrator
  Future<PaymentResult> _startPaymentFlow({
    required Map<String, dynamic> payload,
    required String offeringTitle,
    required String donorName,
    required String donorPhone,
    String? donorEmail,
    void Function(PaymentUIState state)? onStateChange,
  }) async {
    if (_isProcessing) {
      debugPrint('[PaymentService] Payment already in progress. Rejecting duplicate tap.');
      return PaymentResult.failed('A payment is already in progress. Please wait.');
    }

    _isProcessing = true;
    _activePaymentCompleter = Completer<PaymentResult>();

    try {
      _initRazorpay();

      // 1. Create Payment Order via Cloud Function
      onStateChange?.call(PaymentUIState.creatingOrder);
      
      final HttpsCallable createOrderCallable = _functions.httpsCallable('createPaymentOrder');
      final HttpsCallableResult createResult = await createOrderCallable.call(payload);
      
      final dynamic rawData = createResult.data;
      final Map<String, dynamic> orderData = rawData is Map<String, dynamic>
          ? rawData
          : Map<String, dynamic>.from(rawData as Map);

      final String orderId = orderData['orderId']?.toString() ?? '';
      final String keyId = orderData['keyId']?.toString() ?? '';
      final dynamic rawAmount = orderData['amount'];
      final num amountInPaise = rawAmount is num ? rawAmount : (num.tryParse(rawAmount?.toString() ?? '0') ?? 0);
      final String paymentDocId = orderData['paymentDocId']?.toString() ?? '';

      if (orderId.isEmpty || keyId.isEmpty) {
        _isProcessing = false;
        onStateChange?.call(PaymentUIState.failed);
        return PaymentResult.failed('Invalid payment order response from temple server.');
      }

      _currentOrderId = orderId;
      _currentPaymentDocId = paymentDocId;
      _currentAmount = amountInPaise / 100;
      _currentDevotees = payload['devotees'] as List<Map<String, String>>?;

      // 2. Open Razorpay Checkout UI
      onStateChange?.call(PaymentUIState.openingCheckout);

      final int totalRupees = (amountInPaise / 100).toInt();

      final Map<String, dynamic> options = {
        'key': keyId,
        'amount': amountInPaise.toInt(),
        'name': 'Sri Kedareshwara Ashramam',
        'order_id': orderId,
        'theme': {
          'color': '#1E293B',
          'hide_topbar': true,
        },
        'modal': {
          'confirm_close': true,
        },
        'notes': {
          'temple': 'Sri Kedareshwara Ashramam',
          'offering': offeringTitle,
          'amount': '₹$totalRupees',
          'devotee': donorName,
        },
      };

      _razorpay!.open(options);

      // 3. Await completion of Razorpay callbacks & verification
      final result = await _activePaymentCompleter!.future;
      return result;
    } on FirebaseFunctionsException catch (e) {
      _isProcessing = false;
      debugPrint('[PaymentService] Firebase Functions Error: ${e.code} - ${e.message}');
      if (e.code == 'resource-exhausted' || e.code == 'failed-precondition') {
        onStateChange?.call(PaymentUIState.slotUnavailable);
        return PaymentResult.failed(
          e.message ?? 'Selected slot is no longer available. Please select another slot.',
          isSlotUnavailable: true,
        );
      }
      onStateChange?.call(PaymentUIState.networkError);
      return PaymentResult.failed(
        e.message ?? 'Unable to connect to temple payment server. Please try again.',
        isNetworkError: true,
      );
    } catch (e) {
      _isProcessing = false;
      debugPrint('[PaymentService] General Error starting payment: $e');
      onStateChange?.call(PaymentUIState.networkError);
      return PaymentResult.failed(
        'Network error while preparing payment. Please check your internet connection.',
        isNetworkError: true,
      );
    }
  }

  /// Razorpay Success Handler
  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    debugPrint('[PaymentService] Razorpay Callback: Success (Payment ID: ${response.paymentId})');
    
    // IMPORTANT: Razorpay callback is NOT final success. Must verify server-side.
    try {
      final HttpsCallable verifyCallable = _functions.httpsCallable('verifyPayment');
      
      final HttpsCallableResult verifyResult = await verifyCallable.call({
        'razorpay_order_id': response.orderId ?? _currentOrderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
        'paymentDocId': _currentPaymentDocId,
        if (_currentDevotees != null && _currentDevotees!.isNotEmpty)
          'devoteeDetails': _currentDevotees!.first,
      });

      final dynamic rawData = verifyResult.data;
      final Map<String, dynamic> data = rawData is Map<String, dynamic>
          ? rawData
          : Map<String, dynamic>.from(rawData as Map);

      final String status = data['status']?.toString() ?? 'failed';
      final bool isSuccess = data['success'] == true;
      final String? bookingRef = data['bookingRef']?.toString();
      final String? bookingId = data['bookingId']?.toString();
      final String? donationRef = data['donationRef']?.toString();
      final String? message = data['message']?.toString();

      _isProcessing = false;

      if (isSuccess || status == 'success' || status == 'paid' || status == 'already_paid') {
        _activePaymentCompleter?.complete(PaymentResult(
          isSuccess: true,
          bookingRef: bookingRef,
          bookingId: bookingId,
          donationRef: donationRef,
          paymentId: response.paymentId,
          orderId: response.orderId ?? _currentOrderId,
          totalAmount: _currentAmount,
          message: message ?? 'Payment verified and confirmed.',
        ));
      } else if (status == 'refund_needed') {
        _activePaymentCompleter?.complete(PaymentResult.refundNeeded(
          paymentId: response.paymentId ?? '',
          orderId: response.orderId ?? _currentOrderId,
          totalAmount: _currentAmount,
          message: message,
        ));
      } else {
        _activePaymentCompleter?.complete(PaymentResult.failed(
          message ?? 'Payment verification was unsuccessful.',
          isVerificationFailed: true,
        ));
      }
    } catch (e) {
      _isProcessing = false;
      debugPrint('[PaymentService] Verification Error: $e');
      _activePaymentCompleter?.complete(PaymentResult.failed(
        'Server verification failed. If payment was deducted, please contact temple support with reference ID: ${response.paymentId}.',
        isVerificationFailed: true,
      ));
    }
  }

  /// Razorpay Failure / Cancel Handler
  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint('[PaymentService] Razorpay Error: Code ${response.code}, Message: ${response.message}');
    _isProcessing = false;

    // Razorpay code 0 or 2 typically indicates user cancellation
    if (response.code == Razorpay.PAYMENT_CANCELLED || response.code == 0) {
      _activePaymentCompleter?.complete(PaymentResult.cancelled(
        response.message ?? 'Payment was cancelled.',
      ));
    } else {
      _activePaymentCompleter?.complete(PaymentResult.failed(
        response.message ?? 'Payment transaction failed. Please try again.',
      ));
    }
  }

  /// Razorpay External Wallet Handler
  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('[PaymentService] External Wallet Selected: ${response.walletName}');
    _isProcessing = false;
    _activePaymentCompleter?.complete(PaymentResult.failed(
      'External wallet ${response.walletName} selected. Please complete inside the wallet app.',
    ));
  }
}
