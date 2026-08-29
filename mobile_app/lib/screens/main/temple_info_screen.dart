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
          return CustomScrollView(
            slivers: [
              // Hero Image Header
              SliverAppBar(
                expandedHeight: 240.0,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    info.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      shadows: [
                        Shadow(color: Colors.black87, blurRadius: 8, offset: Offset(0, 1)),
                      ],
                    ),
                  ),
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      CustomImage(
                        imageUrl: info.imageUrl,
                        fit: BoxFit.cover,
                        fallbackIcon: Icons.temple_hindu,
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              Color(0x99000000),
                              Color(0xCC000000),
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Temple Details List
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // About Temple
                      const Text(
                        'About the Temple',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        info.description.isNotEmpty
                            ? info.description
                            : 'Welcome to the sacred sanctum.',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Timings Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.schedule, color: AppColors.primary, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Darshan Timings',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              _buildTimingRow(
                                icon: Icons.wb_sunny_rounded,
                                iconColor: AppColors.accent,
                                label: 'Morning Darshan',
                                time: info.morningTimings,
                              ),
                              const SizedBox(height: 12),
                              _buildTimingRow(
                                icon: Icons.nights_stay_rounded,
                                iconColor: AppColors.primary,
                                label: 'Evening Darshan',
                                time: info.eveningTimings,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Location & Address Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.location_on, color: AppColors.primary, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Temple Location',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              Text(
                                info.fullAddress,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: info.fullAddress));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Address copied to clipboard'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.copy, size: 16),
                                label: const Text('Copy Address'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Contact Details Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.contact_phone_rounded, color: AppColors.primary, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Contact & Support',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              _buildContactRow(
                                context,
                                icon: Icons.phone,
                                label: 'Phone',
                                value: info.phone,
                              ),
                              if (info.email != null && info.email!.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                _buildContactRow(
                                  context,
                                  icon: Icons.email_outlined,
                                  label: 'Email',
                                  value: info.email!,
                                ),
                              ],
                              if (info.website != null && info.website!.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                _buildContactRow(
                                  context,
                                  icon: Icons.language,
                                  label: 'Website',
                                  value: info.website!,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTimingRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String time,
  }) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              Text(
                time,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildContactRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              Text(
                value,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy, size: 18, color: AppColors.textSecondary),
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
    );
  }
}
