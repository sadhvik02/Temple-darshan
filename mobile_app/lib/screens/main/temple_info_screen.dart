import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';

class TempleInfoScreen extends StatefulWidget {
  const TempleInfoScreen({super.key});

  @override
  State<TempleInfoScreen> createState() => _TempleInfoScreenState();
}

class _TempleInfoScreenState extends State<TempleInfoScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF9F5),
      body: StreamBuilder<TempleInfoModel?>(
        stream: DatabaseService().getTempleInfoStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (snapshot.hasError) {
            return Scaffold(
              appBar: AppBar(title: const Text('Temple Information')),
              body: ErrorStateWidget(
                message: 'Unable to load temple details.',
                onRetry: () => setState(() {}),
              ),
            );
          }
          if (!snapshot.hasData || snapshot.data == null) {
            return Scaffold(
              appBar: AppBar(title: const Text('Temple Information')),
              body: const EmptyStateWidget(
                icon: Icons.temple_hindu,
                title: 'Temple Details Not Found',
                description: 'Temple details are currently being updated by the administration.',
              ),
            );
          }

          final info = snapshot.data!;
          return Column(
            children: [
              // 1. Permanently Sticky Shiva Photo Header (Does not scroll)
              _buildStickyHeroHeader(info),

              // 2. Scrollable Body Content
              Expanded(
                child: ListView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  children: [
                    // Quick Action Pills
                    _buildQuickActionRow(info),
                    const SizedBox(height: 18),

                    // About the Temple Card
                    _buildAboutCard(info),
                    const SizedBox(height: 18),

                    // Darshan Timings Card
                    _buildTimingsCard(info),
                    const SizedBox(height: 18),

                    // Temple Location & Address Card
                    _buildLocationCard(info),
                    const SizedBox(height: 18),

                    // Contact & Support Card
                    _buildContactCard(info),
                    const SizedBox(height: 18),

                    // Pilgrim Guidelines Card
                    _buildGuidelinesCard(),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // 1. Permanently Sticky Shiva Photo Hero Header
  Widget _buildStickyHeroHeader(TempleInfoModel info) {
    return SizedBox(
      height: 250,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomImage(
            imageUrl: info.imageUrl,
            fit: BoxFit.cover,
            fallbackIcon: Icons.temple_hindu,
          ),
          // Multi-stop devotional gradient
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.5),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.7),
                  const Color(0xFF1E1005).withValues(alpha: 0.95),
                ],
                stops: const [0.0, 0.35, 0.7, 1.0],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          // Back Button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            child: CircleAvatar(
              backgroundColor: Colors.black.withValues(alpha: 0.45),
              radius: 18,
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                onPressed: () => Navigator.maybePop(context),
              ),
            ),
          ),
          // Title & Subtitle on Hero Image
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6F00).withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                      SizedBox(width: 4),
                      Text(
                        'Sacred Sanctum & Ashramam',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  info.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    height: 1.2,
                    shadows: [
                      Shadow(
                        color: Colors.black87,
                        blurRadius: 10,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                const Row(
                  children: [
                    Icon(Icons.self_improvement_rounded, color: Color(0xFFFFD54F), size: 15),
                    SizedBox(width: 6),
                    Text(
                      'Guided by Kedarananda Maharaj',
                      style: TextStyle(
                        color: Color(0xFFFFE082),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Quick Action Buttons Row
  Widget _buildQuickActionRow(TempleInfoModel info) {
    return Row(
      children: [
        Expanded(
          child: _buildQuickActionButton(
            icon: Icons.phone_rounded,
            label: 'Call Ashram',
            color: const Color(0xFFD84315),
            bgColor: const Color(0xFFFFF3E0),
            onTap: () {
              Clipboard.setData(ClipboardData(text: info.phone));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Phone number (${info.phone}) copied to clipboard'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: const Color(0xFFD84315),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickActionButton(
            icon: Icons.copy_rounded,
            label: 'Copy Address',
            color: const Color(0xFF2E7D32),
            bgColor: const Color(0xFFE8F5E9),
            onTap: () {
              Clipboard.setData(ClipboardData(text: info.fullAddress));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Address copied to clipboard'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Color(0xFF2E7D32),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickActionButton(
            icon: Icons.share_rounded,
            label: 'Share',
            color: const Color(0xFF0288D1),
            bgColor: const Color(0xFFE1F5FE),
            onTap: () {
              final shareText = '${info.name}\n${info.fullAddress}\nPhone: ${info.phone}';
              Clipboard.setData(ClipboardData(text: shareText));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Temple details copied to share'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Color(0xFF0288D1),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // About The Temple Card
  Widget _buildAboutCard(TempleInfoModel info) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD84315).withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.temple_hindu_rounded, color: Color(0xFFD84315), size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'About the Temple',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            info.description.isNotEmpty
                ? info.description
                : 'Welcome to Sri Kedareshwara Ashramam, a holy place of prayer, tranquility, and devotion.',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF4A4A4A),
              height: 1.65,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFFD54F), width: 1),
            ),
            child: const Row(
              children: [
                Icon(Icons.stars_rounded, color: Color(0xFFF57F17), size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Special Darshan of Maharaj on Amavasya & Pournami days.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFE65100),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Darshan Timings Card
  Widget _buildTimingsCard(TempleInfoModel info) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.schedule_rounded, color: Color(0xFFD84315), size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Darshan Timings',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Daily temple sanctum visiting hours',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFFFFECB3)),
          Row(
            children: [
              // Morning Slot
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8E1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFFE082)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.wb_sunny_rounded, color: Color(0xFFF57F17), size: 18),
                          SizedBox(width: 6),
                          Text(
                            'Morning',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF795548),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        info.morningTimings,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFD84315),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Evening Slot
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDE7F6),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFD1C4E9)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.nights_stay_rounded, color: Color(0xFF5E35B1), size: 18),
                          SizedBox(width: 6),
                          Text(
                            'Evening',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF4527A0),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        info.eveningTimings,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF4527A0),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Location & Address Card
  Widget _buildLocationCard(TempleInfoModel info) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.location_on_rounded, color: Color(0xFF2E7D32), size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Temple Location',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFFFFECB3)),
          Text(
            info.fullAddress,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF374151),
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E7D32),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: info.fullAddress));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Address copied to clipboard'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Color(0xFF2E7D32),
                ),
              );
            },
            icon: const Icon(Icons.copy_rounded, size: 16),
            label: const Text(
              'Copy Complete Address',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  // Contact Details Card
  Widget _buildContactCard(TempleInfoModel info) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE0B2), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFE1F5FE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.contact_phone_rounded, color: Color(0xFF0288D1), size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Contact & Support',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFFFFECB3)),
          _buildContactTile(
            icon: Icons.phone_rounded,
            label: 'Helpline Number',
            value: info.phone,
            color: const Color(0xFFD84315),
          ),
          if (info.email != null && info.email!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildContactTile(
              icon: Icons.email_outlined,
              label: 'Ashram Email',
              value: info.email!,
              color: const Color(0xFF0288D1),
            ),
          ],
          if (info.website != null && info.website!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildContactTile(
              icon: Icons.language_rounded,
              label: 'Official Website',
              value: info.website!,
              color: const Color(0xFF7B1FA2),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContactTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                Text(
                  value,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy_rounded, size: 16, color: AppColors.textSecondary),
            tooltip: 'Copy $label',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: value));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$label copied to clipboard'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // Pilgrim Guidelines Card
  Widget _buildGuidelinesCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFD54F), width: 1.2),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline_rounded, color: Color(0xFFE65100), size: 20),
              SizedBox(width: 8),
              Text(
                'Pilgrim Guidelines',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFE65100),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildGuidelineItem('Traditional Indian attire is recommended for Darshan and Pujas.'),
          _buildGuidelineItem('Footwear must be deposited in the designated cloakroom before entry.'),
          _buildGuidelineItem('Maintain silence and sanctity in the inner sanctum prayer halls.'),
        ],
      ),
    );
  }

  Widget _buildGuidelineItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Color(0xFFE65100), fontSize: 16, fontWeight: FontWeight.w900)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, color: Color(0xFF5D4037), height: 1.45, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
