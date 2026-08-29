import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/section_header.dart';
import 'events_screen.dart';
import 'news_screen.dart';
import 'service_details_screen.dart';
import 'services_screen.dart';
import 'temple_info_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _pageController = PageController(viewportFraction: 0.92);
  int _activeBannerIndex = 0;
  final DatabaseService _db = DatabaseService();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;
    final displayName = user != null && user.name.isNotEmpty
        ? user.name.split(' ').first
        : 'Devotee';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.temple_hindu, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Namaste, $displayName',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Text(
                  'Temple Darshan Portal',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline_rounded, color: AppColors.primary),
            tooltip: 'Temple Information',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          setState(() {});
          await Future.delayed(const Duration(milliseconds: 600));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            // 1. Live Banners Carousel
            _buildBannersSection(),
            const SizedBox(height: 18),

            // 2. Quick Action Grid
            _buildQuickActions(),
            const SizedBox(height: 18),

            // 3. Darshan Timings Card
            _buildTimingsCard(),
            const SizedBox(height: 20),

            // 4. Featured / Active Sevas
            _buildServicesSection(),
            const SizedBox(height: 20),

            // 5. Latest News & Announcements
            _buildNewsSection(),
            const SizedBox(height: 20),

            // 6. Upcoming Festivals & Events
            _buildEventsSection(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // 1. Banners Section
  Widget _buildBannersSection() {
    return StreamBuilder<List<BannerModel>>(
      stream: _db.getActiveBanners(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Container(
            height: 170,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final banners = snapshot.data!;
        return Column(
          children: [
            SizedBox(
              height: 170,
              child: PageView.builder(
                controller: _pageController,
                itemCount: banners.length,
                onPageChanged: (idx) => setState(() => _activeBannerIndex = idx),
                itemBuilder: (context, index) {
                  final banner = banners[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CustomImage(
                            imageUrl: banner.imageUrl,
                            fit: BoxFit.cover,
                            fallbackIcon: Icons.temple_hindu,
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.75),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                          if (banner.title.isNotEmpty)
                            Positioned(
                              left: 16,
                              right: 16,
                              bottom: 14,
                              child: Text(
                                banner.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  shadows: [
                                    Shadow(color: Colors.black54, blurRadius: 4),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            if (banners.length > 1) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  banners.length,
                  (index) => Container(
                    width: _activeBannerIndex == index ? 18 : 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    decoration: BoxDecoration(
                      color: _activeBannerIndex == index
                          ? AppColors.primary
                          : AppColors.primaryLight.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  // 2. Quick Actions
  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildActionItem(
            icon: Icons.volunteer_activism_rounded,
            label: 'Book Seva',
            color: const Color(0xFFE65100),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ServicesScreen()),
              );
            },
          ),
          _buildActionItem(
            icon: Icons.temple_hindu_rounded,
            label: 'Temple Info',
            color: const Color(0xFFC2185B),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
              );
            },
          ),
          _buildActionItem(
            icon: Icons.newspaper_rounded,
            label: 'News',
            color: const Color(0xFF0288D1),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NewsScreen()),
              );
            },
          ),
          _buildActionItem(
            icon: Icons.festival_rounded,
            label: 'Events',
            color: const Color(0xFF7B1FA2),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const EventsScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 76,
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 3. Darshan Timings Quick Card
  Widget _buildTimingsCard() {
    return FutureBuilder<TempleInfoModel?>(
      future: _db.getTempleInfo(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data == null) {
          return const SizedBox.shrink();
        }
        final info = snapshot.data!;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Card(
            color: AppColors.surfaceVariant.withValues(alpha: 0.6),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.access_time_filled_rounded, size: 18, color: AppColors.primary),
                          SizedBox(width: 8),
                          Text(
                            'Darshan & Temple Timings',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
                          );
                        },
                        child: const Text(
                          'Details →',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.wb_sunny_rounded, color: AppColors.accent, size: 18),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Morning', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                    Text(
                                      info.morningTimings,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.nights_stay_rounded, color: AppColors.primary, size: 18),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Evening', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                    Text(
                                      info.eveningTimings,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
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
            ),
          ),
        );
      },
    );
  }

  // 4. Featured Services / Sevas Section
  Widget _buildServicesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Services & Sevas',
          subtitle: 'Sacred offerings and puja bookings',
          actionText: 'View All',
          onAction: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ServicesScreen()),
            );
          },
        ),
        const SizedBox(height: 8),
        StreamBuilder<List<ServiceModel>>(
          stream: _db.getActiveServices(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                ),
              );
            }
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Text('No active sevas available at the moment.'),
              );
            }

            final services = snapshot.data!;
            return SizedBox(
              height: 220,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: services.length,
                itemBuilder: (context, index) {
                  final service = services[index];
                  return Container(
                    width: 200,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ServiceDetailsScreen(service: service),
                            ),
                          );
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            CustomImage(
                              imageUrl: service.imageUrl,
                              height: 105,
                              fit: BoxFit.cover,
                              fallbackIcon: Icons.temple_hindu,
                            ),
                            Padding(
                              padding: const EdgeInsets.all(10.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    service.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        service.formattedPrice,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                      if (service.bookingEnabled)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: const Text(
                                            'Book',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // 5. News & Announcements Section
  Widget _buildNewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Latest Announcements',
          actionText: 'View All',
          onAction: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NewsScreen()),
            );
          },
        ),
        const SizedBox(height: 6),
        StreamBuilder<List<NewsModel>>(
          stream: _db.getPublishedNews(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox.shrink();
            }
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const SizedBox.shrink();
            }

            final latestNews = snapshot.data!.take(2).toList();
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: latestNews.map((news) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      leading: CustomImage(
                        imageUrl: news.imageUrl,
                        width: 50,
                        height: 50,
                        borderRadius: BorderRadius.circular(8),
                        fit: BoxFit.cover,
                        fallbackIcon: Icons.newspaper,
                      ),
                      title: Text(
                        news.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      subtitle: Text(
                        news.content,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const NewsScreen()),
                        );
                      },
                    ),
                  );
                }).toList(),
              ),
            );
          },
        ),
      ],
    );
  }

  // 6. Upcoming Festivals & Events
  Widget _buildEventsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Festivals & Events',
          actionText: 'View All',
          onAction: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const EventsScreen()),
            );
          },
        ),
        const SizedBox(height: 6),
        StreamBuilder<List<EventModel>>(
          stream: _db.getPublishedEvents(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox.shrink();
            }
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const SizedBox.shrink();
            }

            final events = snapshot.data!.take(2).toList();
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: events.map((event) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.festival_rounded, color: AppColors.primary, size: 24),
                      ),
                      title: Text(
                        event.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      subtitle: Text(
                        '${event.eventDate}${event.timeRange.isNotEmpty ? ' • ${event.timeRange}' : ''}',
                        style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const EventsScreen()),
                        );
                      },
                    ),
                  );
                }).toList(),
              ),
            );
          },
        ),
      ],
    );
  }
}
