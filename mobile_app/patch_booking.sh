#!/bin/bash
sed -i '' -e '/late Razorpay _razorpay;/d' \
          -e '/final PaymentService _paymentService = PaymentService();/d' \
          -e '/String? _currentPaymentDocId;/d' \
          -e '/String? _currentOrderId;/d' \
          -e '/_razorpay = Razorpay();/d' \
          -e '/_razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);/d' \
          -e '/_razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);/d' \
          -e '/_razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);/d' \
          -e '/_razorpay.clear();/d' \
          lib/screens/main/booking_screen.dart
