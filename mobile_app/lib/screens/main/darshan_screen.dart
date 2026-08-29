import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';

class DarshanScreen extends StatelessWidget {
  const DarshanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Darshan'),
      ),
      body: StreamBuilder<List<DarshanModel>>(
        stream: DatabaseService().getActiveDarshans(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            );
          }

          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Failed to load darshan types.',
              onRetry: () {
                // StreamBuilder automatically handles reconnection
                (context as Element).markNeedsBuild();
              },
            );
          }

          final darshans = snapshot.data ?? [];

          if (darshans.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.temple_hindu_rounded,
              title: 'No Darshan Available',
              description: 'Darshan options will appear here once added.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: darshans.length,
            itemBuilder: (context, index) => _DarshanCard(darshan: darshans[index]),
          );
        },
      ),
    );
  }
}

class _DarshanCard extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanCard({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => _DarshanDetailScreen(darshan: darshan),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Image
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: darshan.imageUrl != null && darshan.imageUrl!.isNotEmpty
                      ? CustomImage(imageUrl: darshan.imageUrl!, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.primaryLight.withValues(alpha: 0.15),
                          child: const Icon(Icons.temple_hindu_rounded, color: AppColors.primary, size: 32),
                        ),
                ),
              ),
              const SizedBox(width: 16),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      darshan.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      darshan.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      darshan.formattedPrice,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}

/// Detail screen for a specific darshan type.
/// Shows darshan info, available slots, and a "Payment Coming Soon" stop.
class _DarshanDetailScreen extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanDetailScreen({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(darshan.name),
      ),
      body: Column(
        children: [
          // Darshan info header
          if (darshan.imageUrl != null && darshan.imageUrl!.isNotEmpty)
            SizedBox(
              height: 200,
              width: double.infinity,
              child: CustomImage(imageUrl: darshan.imageUrl!, fit: BoxFit.cover),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  darshan.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  darshan.description,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.currency_rupee, size: 18, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      darshan.formattedPrice,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Slots section
          Expanded(
            child: darshan.bookingEnabled
                ? _DarshanSlotsSection(darshan: darshan)
                : const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.event_busy_rounded, size: 56, color: AppColors.textTertiary),
                          SizedBox(height: 16),
                          Text(
                            'Online booking is not available for this darshan.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DarshanSlotsSection extends StatelessWidget {
  final DarshanModel darshan;
  const _DarshanSlotsSection({required this.darshan});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<SlotModel>>(
      stream: DatabaseService().getActiveSlotsForService(darshan.id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
          );
        }

        final slots = snapshot.data ?? [];

        if (slots.isEmpty) {
          return const EmptyStateWidget(
            icon: Icons.calendar_today_rounded,
            title: 'No Slots Available',
            description: 'There are no available darshan slots at this time.',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: slots.length,
          itemBuilder: (context, index) {
            final slot = slots[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: Icon(
                  Icons.access_time_rounded,
                  color: slot.isFull ? AppColors.textTertiary : AppColors.primary,
                ),
                title: Text(
                  '${slot.date}  •  ${slot.timeRange}',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: slot.isFull ? AppColors.textTertiary : AppColors.textPrimary,
                  ),
                ),
                subtitle: Text(
                  slot.isFull ? 'Fully booked' : '${slot.available} spots available',
                  style: TextStyle(
                    color: slot.isFull ? AppColors.statusCancelled : AppColors.statusConfirmed,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
                trailing: slot.isFull
                    ? const Text('Full', style: TextStyle(color: AppColors.textTertiary))
                    : const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.primary),
                onTap: slot.isFull
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => _DarshanReviewScreen(darshan: darshan, slot: slot),
                          ),
                        );
                      },
              ),
            );
          },
        );
      },
    );
  }
}

/// Darshan Review Screen — shows darshan + slot details, quantity selection,
/// and stops at "Payment Coming Soon" instead of creating a booking.
class _DarshanReviewScreen extends StatefulWidget {
  final DarshanModel darshan;
  final SlotModel slot;

  const _DarshanReviewScreen({required this.darshan, required this.slot});

  @override
  State<_DarshanReviewScreen> createState() => _DarshanReviewScreenState();
}

class _DarshanReviewScreenState extends State<_DarshanReviewScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;
    final available = widget.slot.available;
    final maxAllowed = available > 10 ? 10 : available;
    final totalAmount = widget.darshan.price * _quantity;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Darshan'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Devotee Info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.person_pin_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text('Devotee Information',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildRow('Name', user?.name ?? 'Devotee'),
                    _buildRow('Phone', user?.phone ?? '—'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Darshan & Slot details
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.temple_hindu_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text('Darshan Details',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildRow('Darshan', widget.darshan.name),
                    _buildRow('Date', widget.slot.date),
                    _buildRow('Time', widget.slot.timeRange),
                    _buildRow('Price / Person', widget.darshan.formattedPrice),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quantity selector
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Number of Devotees',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.cardBorder),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove, size: 20),
                                color: _quantity > 1 ? AppColors.primary : AppColors.textTertiary,
                                onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Text('$_quantity',
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add, size: 20),
                                color: _quantity < maxAllowed ? AppColors.primary : AppColors.textTertiary,
                                onPressed: _quantity < maxAllowed ? () => setState(() => _quantity++) : null,
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        Text('$available spots left',
                            style: const TextStyle(
                                color: AppColors.statusConfirmed, fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                    const Divider(height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        Text(
                          totalAmount > 0 ? '₹$totalAmount' : 'Free',
                          style: const TextStyle(
                              fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // PAYMENT COMING SOON — do NOT create a booking
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.statusPendingBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
              ),
              child: const Column(
                children: [
                  Icon(Icons.hourglass_top_rounded, size: 48, color: AppColors.accent),
                  SizedBox(height: 12),
                  Text(
                    'Payment Coming Soon',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryDark,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Online payment for Darshan bookings will be available soon. Please visit the temple counter for now.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }
}
