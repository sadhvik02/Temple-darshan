import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import 'events_screen.dart';
import 'news_screen.dart';
import 'services_screen.dart';
import 'temple_info_screen.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/banner_video_player.dart';
import 'video_player_screen.dart';
import 'donations_screen.dart';
import 'darshan_screen.dart';
import 'notifications_screen.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseService _db = DatabaseService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndPromptNotificationPermission();
    });
  }

  Future<void> _checkAndPromptNotificationPermission() async {
    try {
      final status = await Permission.notification.status;
      if (status.isDenied) {
        if (!mounted) return;
        _showNotificationPermissionDialog();
      }
    } catch (_) {}
  }

  void _showNotificationPermissionDialog() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(22.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.notifications_active_rounded, color: AppColors.primary, size: 34),
              ),
              const SizedBox(height: 16),
              const Text(
                'Stay Connected with Temple Blessings',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Allow notifications to receive auspicious puja reminders, live darshan updates, festival announcements, and important temple circulars.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Later', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await Permission.notification.request();
                      },
                      child: const Text('Allow', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().userModel;
    final displayName = user != null && user.name.isNotEmpty
        ? user.name.split(' ').first
        : 'Devotee';

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/icons/app_icon.png',
                  width: 36,
                  height: 36,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Palgutta Ashramam',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  Text(
                    'Namaste, $displayName 🙏',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Notifications Bell with Live Badge
          StreamBuilder<List<NotificationModel>>(
            stream: _db.getNotifications(),
            builder: (context, snapshot) {
              final count = snapshot.data?.length ?? 0;
              return IconButton(
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                visualDensity: VisualDensity.compact,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.notifications_outlined, color: AppColors.primary, size: 20),
                    ),
                    if (count > 0)
                      Positioned(
                        right: 2,
                        top: 2,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Color(0xFFDC2626),
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(minWidth: 10, minHeight: 10),
                        ),
                      ),
                  ],
                ),
                tooltip: 'Temple Announcements',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  );
                },
              );
            },
          ),
          IconButton(
            padding: const EdgeInsets.all(4),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            visualDensity: VisualDensity.compact,
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 20),
            ),
            tooltip: 'Temple Information',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: StreamBuilder<TempleInfoModel?>(
        stream: _db.getTempleInfoStream(),
        builder: (context, infoSnapshot) {
          final templeInfo = infoSnapshot.data;
          final bool isDarshanEnabled = templeInfo?.isDarshanEnabled ?? false;
          final String? marqueeText = templeInfo?.scrollingAnnouncement?.trim();

          return StreamBuilder<List<BannerModel>>(
            stream: _db.getActiveBanners(),
            builder: (context, bannerSnapshot) {
              // 1. Filter out videos from the top banner carousel so only valid images slide
              BannerModel? videoBanner;
              final List<BannerModel> imageOnlyBanners = [];

              for (final b in bannerSnapshot.data ?? <BannerModel>[]) {
                final img = b.imageUrl.trim();
                final vid = b.videoUrl?.trim();
                final bool isVideo = BannerVideoPlayer.isVideoUrl(img) ||
                    (vid != null && vid.isNotEmpty) ||
                    BannerVideoPlayer.isYoutubeUrl(img) ||
                    (vid != null && BannerVideoPlayer.isYoutubeUrl(vid));
                if (isVideo) {
                  videoBanner ??= b;
                } else if (img.isNotEmpty &&
                    !BannerVideoPlayer.isVideoUrl(img) &&
                    !img.toLowerCase().contains('youtube') &&
                    !img.toLowerCase().contains('youtu.be') &&
                    (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/'))) {
                  imageOnlyBanners.add(b);
                }
              }

              // Determine multiple videos available from Temple Info / News configuration
              final List<FeaturedVideoItem> effectiveVideos = [];
              if (templeInfo != null && templeInfo.featuredVideos.isNotEmpty) {
                effectiveVideos.addAll(templeInfo.featuredVideos);
              } else if (templeInfo?.featuredVideoUrl != null && templeInfo!.featuredVideoUrl!.trim().isNotEmpty) {
                effectiveVideos.add(
                  FeaturedVideoItem(
                    id: 'temple_legacy_vid',
                    title: templeInfo.featuredVideoTitle ?? 'Abhishekam',
                    videoUrl: templeInfo.featuredVideoUrl!.trim(),
                  ),
                );
              } else if (videoBanner != null) {
                final raw = (videoBanner.videoUrl != null && videoBanner.videoUrl!.isNotEmpty)
                    ? videoBanner.videoUrl!
                    : videoBanner.imageUrl;
                if (BannerVideoPlayer.isVideoUrl(raw)) {
                  effectiveVideos.add(
                    FeaturedVideoItem(
                      id: videoBanner.id,
                      title: videoBanner.title,
                      videoUrl: raw,
                    ),
                  );
                }
              }

              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async {
                  setState(() {});
                  await Future.delayed(const Duration(milliseconds: 600));
                },
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 40),
                  children: [
                    const SizedBox(height: 8),

                    // 1. TTD Style Auto-Sliding Banner Carousel (Clean images only; no video or broken image slides)
                    if (bannerSnapshot.connectionState == ConnectionState.waiting)
                      Container(
                        height: 185,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                        ),
                      )
                    else if (imageOnlyBanners.isNotEmpty)
                      BannerCarouselWidget(banners: imageOnlyBanners),

                    const SizedBox(height: 12),

                    // 2. Scrolling Marquee Ticker (The [UPDATE] section where text is scrolling)
                    _buildMarqueeSection(marqueeText),
                    const SizedBox(height: 14),

                    // 3. Sacred Ashram Videos (Directly under the Update section; appears ONLY if videos are uploaded; NO Latest Announcements heading)
                    if (effectiveVideos.isNotEmpty) ...[
                      SacredVideoCarouselWidget(
                        videos: effectiveVideos,
                        fallbackImageUrl: templeInfo?.imageUrl,
                      ),
                      const SizedBox(height: 16),
                    ],

                    // 4. Bookings / Quick Services Grid (Below the video: Ashrama Seva, Arjitha Sevas, Donations, Temple Info, Utsavams)
                    _buildTTDQuickServicesGrid(isDarshanEnabled: isDarshanEnabled),
                    const SizedBox(height: 20),

                    // 5. Donations
                    _buildDonationsSection(),
                    const SizedBox(height: 24),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  // Scrolling Marquee Ticker Section (Continuous Horizontal Scrolling)
  Widget _buildMarqueeSection(String? customText) {
    if (customText != null && customText.isNotEmpty) {
      return MarqueeTickerWidget(
        text: customText,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NewsScreen()),
          );
        },
      );
    }

    // Fallback: Stream latest published news announcements
    return StreamBuilder<List<NewsModel>>(
      stream: _db.getPublishedNews(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const MarqueeTickerWidget(
            text: '🕉️ Welcome to Sri Kedareshwara Palgutta Ashramam • Daily Poojas, Sevas & Holy Blessings',
          );
        }
        final headlines = snapshot.data!.map((n) => n.title).join('   •   ');
        return MarqueeTickerWidget(
          text: headlines,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NewsScreen()),
            );
          },
        );
      },
    );
  }

  // Quick Services Grid (Darshan excluded when isDarshanEnabled == false; Ashrama Seva prioritized)
  Widget _buildTTDQuickServicesGrid({required bool isDarshanEnabled}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14.0),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final itemWidth = (constraints.maxWidth - 24) / 3;
          final List<Widget> items = [];

          // 1. Darshan (Only if enabled from Admin Dashboard)
          if (isDarshanEnabled) {
            items.add(
              SizedBox(
                width: itemWidth,
                child: _buildTTDServiceItem(
                  assetImage: 'assets/icons/darshan_selected.png',
                  iconColor: const Color(0xFFE65100),
                  bgColor: const Color(0xFFFFF3E0),
                  label: 'Darshan',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const DarshanScreen()),
                    );
                  },
                ),
              ),
            );
          }

          // 2. Ashrama Seva (Always visible; prioritized first when darshan is off)
          items.add(
            SizedBox(
              width: itemWidth,
              child: _buildTTDServiceItem(
                assetImage: 'assets/icons/ashrama_seva_icon.png',
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                label: 'Ashrama Seva',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ServicesScreen(
                      categoryFilter: 'ashrama_seva',
                      title: 'Ashrama Sevas',
                    )),
                  );
                },
              ),
            ),
          );

          // 3. Arjitha Sevas
          items.add(
            SizedBox(
              width: itemWidth,
              child: _buildTTDServiceItem(
                icon: Icons.spa_rounded,
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                label: 'Arjitha Sevas',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ServicesScreen(
                      categoryFilter: 'arjita_seva',
                      title: 'Arjitha Sevas',
                    )),
                  );
                },
              ),
            ),
          );

          // 4. Donations
          items.add(
            SizedBox(
              width: itemWidth,
              child: _buildTTDServiceItem(
                icon: Icons.volunteer_activism_rounded,
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                label: 'Donations',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const DonationsScreen()),
                  );
                },
              ),
            ),
          );

          // 5. Temple Info
          items.add(
            SizedBox(
              width: itemWidth,
              child: _buildTTDServiceItem(
                assetImage: 'assets/icons/temple_info_icon.png',
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                label: 'Temple Info',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
                  );
                },
              ),
            ),
          );

          // 6. Utsavams
          items.add(
            SizedBox(
              width: itemWidth,
              child: _buildTTDServiceItem(
                icon: Icons.celebration_rounded,
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                label: 'Utsavams',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EventsScreen()),
                  );
                },
              ),
            ),
          );

          return Wrap(
            alignment: WrapAlignment.spaceEvenly,
            spacing: 12.0,
            runSpacing: 16.0,
            children: items,
          );
        },
      ),
    );
  }

  Widget _buildTTDServiceItem({
    IconData? icon,
    String? assetImage,
    required Color iconColor,
    required Color bgColor,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2.0, vertical: 4.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(18),
              ),
              child: assetImage != null
                  ? Center(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.asset(assetImage, width: 34, height: 34, fit: BoxFit.contain),
                      ),
                    )
                  : Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 20,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.center,
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }





  // 5. Donations Section
  Widget _buildDonationsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const DonationsScreen()),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, AppColors.primaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.volunteer_activism_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Make a Donation',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Support temple activities & annadanam',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}

// Dedicated Stateful Banner Carousel with guaranteed timer execution
class BannerCarouselWidget extends StatefulWidget {
  final List<BannerModel> banners;
  const BannerCarouselWidget({super.key, required this.banners});

  @override
  State<BannerCarouselWidget> createState() => _BannerCarouselWidgetState();
}

class _BannerCarouselWidgetState extends State<BannerCarouselWidget> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.banners.length <= 1) return;

    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted || !_pageController.hasClients) return;
      int next = _currentPage + 1;
      if (next >= widget.banners.length) {
        next = 0;
      }
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void didUpdateWidget(covariant BannerCarouselWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.banners.length != widget.banners.length) {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _handleBannerTap(BannerModel banner, String? rawVideo) {
    if (rawVideo != null && rawVideo.isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => VideoPlayerScreen(
            videoUrl: rawVideo,
            title: banner.title,
          ),
        ),
      );
      return;
    }

    final action = banner.actionUrl?.trim();
    if (action == null || action.isEmpty) return;

    try {
      if (action.startsWith('http://') || action.startsWith('https://')) {
        launchUrl(Uri.parse(action), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Banner tap launch error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        Container(
          height: 215,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: PageView.builder(
              controller: _pageController,
              itemCount: widget.banners.length,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemBuilder: (context, index) {
                final banner = widget.banners[index];
                final String? rawVideo = (banner.videoUrl != null && banner.videoUrl!.isNotEmpty)
                    ? banner.videoUrl
                    : (BannerVideoPlayer.isVideoUrl(banner.imageUrl) ? banner.imageUrl : null);

                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => _handleBannerTap(banner, rawVideo),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Clean, high quality image banner
                      CustomImage(
                        imageUrl: banner.imageUrl,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                        fallbackIcon: Icons.temple_hindu,
                      ),

                      // Gradient overlay for title readability (only at bottom)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 70,
                        child: IgnorePointer(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.85),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ),
                      ),

                      if (banner.title.isNotEmpty)
                        Positioned(
                          left: 18,
                          right: 18,
                          bottom: 12,
                          child: IgnorePointer(
                            child: Text(
                              banner.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                shadows: [
                                  Shadow(color: Colors.black87, blurRadius: 6),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        if (widget.banners.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.banners.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _currentPage == index ? 22 : 6,
                height: 5,
                margin: const EdgeInsets.symmetric(horizontal: 2.5),
                decoration: BoxDecoration(
                  color: _currentPage == index
                      ? AppColors.primary
                      : AppColors.primaryLight.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// Dedicated Sacred Ashram Videos Carousel (Multiple videos scrolling widget)
class SacredVideoCarouselWidget extends StatefulWidget {
  final List<FeaturedVideoItem> videos;
  final String? fallbackImageUrl;

  const SacredVideoCarouselWidget({
    super.key,
    required this.videos,
    this.fallbackImageUrl,
  });

  @override
  State<SacredVideoCarouselWidget> createState() => _SacredVideoCarouselWidgetState();
}

class _SacredVideoCarouselWidgetState extends State<SacredVideoCarouselWidget> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.videos.length <= 1) return;

    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted || !_pageController.hasClients) return;
      int next = _currentPage + 1;
      if (next >= widget.videos.length) {
        next = 0;
      }
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void didUpdateWidget(covariant SacredVideoCarouselWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videos.length != widget.videos.length) {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _openPlayer(FeaturedVideoItem video) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VideoPlayerScreen(
          videoUrl: video.videoUrl,
          title: video.title.isNotEmpty ? video.title : 'Sacred Video',
        ),
      ),
    );
  }

  String _getVideoThumbnail(FeaturedVideoItem video) {
    if (video.thumbnailUrl != null && video.thumbnailUrl!.trim().isNotEmpty) {
      return video.thumbnailUrl!.trim();
    }
    if (BannerVideoPlayer.isYoutubeUrl(video.videoUrl)) {
      final yId = BannerVideoPlayer.extractYoutubeId(video.videoUrl);
      if (yId != null && yId.isNotEmpty) {
        return 'https://img.youtube.com/vi/$yId/hqdefault.jpg';
      }
    }
    if (widget.fallbackImageUrl != null && widget.fallbackImageUrl!.trim().isNotEmpty) {
      return widget.fallbackImageUrl!.trim();
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.videos.isEmpty) return const SizedBox.shrink();

    // If only 1 video is available, show standard full width card
    if (widget.videos.length == 1) {
      final singleVideo = widget.videos.first;
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Container(
          height: 195,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: _buildVideoSlide(singleVideo, 0, 1),
          ),
        ),
      );
    }

    // Multiple videos (e.g. 2 to 3 videos): scrollable horizontal carousel with dots
    return Column(
      children: [
        Container(
          height: 195,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: PageView.builder(
              controller: _pageController,
              itemCount: widget.videos.length,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemBuilder: (context, index) {
                final video = widget.videos[index];
                return _buildVideoSlide(video, index, widget.videos.length);
              },
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.videos.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: _currentPage == index ? 22 : 6,
              height: 5,
              margin: const EdgeInsets.symmetric(horizontal: 2.5),
              decoration: BoxDecoration(
                color: _currentPage == index
                    ? AppColors.primary
                    : AppColors.primaryLight.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoSlide(FeaturedVideoItem video, int index, int total) {
    final thumb = _getVideoThumbnail(video);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openPlayer(video),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video Thumbnail Poster
            CustomImage(
              imageUrl: thumb,
              fit: BoxFit.cover,
              fallbackIcon: Icons.videocam_rounded,
            ),

            // Soft Dark Tint
            Container(
              color: Colors.black.withValues(alpha: 0.25),
            ),

            // Top-left "Watch Video" badge with counter if multiple
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black38, blurRadius: 4, offset: Offset(0, 1)),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.play_circle_fill, color: Colors.white, size: 14),
                    const SizedBox(width: 5),
                    Text(
                      total > 1 ? 'Watch Video (${index + 1}/$total)' : 'Watch Video',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Center Glowing Play Button
            Center(
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.85), width: 2.5),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black54,
                      blurRadius: 14,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),

            // Bottom Gradient Overlay with Title
            if (video.title.isNotEmpty)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.85),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: Text(
                    video.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      shadows: [Shadow(color: Colors.black87, blurRadius: 4)],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// Dedicated Continuous Horizontal Marquee Announcement Ticker
class MarqueeTickerWidget extends StatefulWidget {
  final String text;
  final VoidCallback? onTap;

  const MarqueeTickerWidget({
    super.key,
    required this.text,
    this.onTap,
  });

  @override
  State<MarqueeTickerWidget> createState() => _MarqueeTickerWidgetState();
}

class _MarqueeTickerWidgetState extends State<MarqueeTickerWidget> {
  late final ScrollController _scrollController;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
  }

  void _startScrolling() {
    _timer?.cancel();
    if (!mounted) return;
    _timer = Timer.periodic(const Duration(milliseconds: 35), (timer) {
      if (!mounted || !_scrollController.hasClients) return;
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.offset;
      if (currentScroll >= maxScroll) {
        _scrollController.jumpTo(0.0);
      } else {
        _scrollController.jumpTo(currentScroll + 1.2);
      }
    });
  }

  @override
  void didUpdateWidget(covariant MarqueeTickerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: widget.onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 44,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7ED),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFED7AA), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.06),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.campaign_rounded, size: 14, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'UPDATE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ListView(
                controller: _scrollController,
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  Center(
                    child: Text(
                      '${widget.text}               ${widget.text}               ',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF9A3412),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

