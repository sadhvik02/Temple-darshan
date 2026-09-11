import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state_widget.dart';
import 'darshan_screen.dart';
import 'donations_screen.dart';
import 'events_screen.dart';
import 'news_screen.dart';
import 'services_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final DatabaseService _db = DatabaseService();
  final TextEditingController _searchController = TextEditingController();

  String _selectedCategory = 'all';
  String _searchQuery = '';
  final Set<String> _expandedDocIds = <String>{};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }


  void _handleActionRoute(BuildContext context, String? route) {
    if (route == null || route.isEmpty) return;

    if (route == '/darshan') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const DarshanScreen()));
    } else if (route == '/services') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const ServicesScreen()));
    } else if (route == '/events') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsScreen()));
    } else if (route == '/news') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsScreen()));
    } else if (route == '/donations') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const DonationsScreen()));
    }
  }

  Map<String, dynamic> _getTypeStyle(String type) {
    switch (type.toLowerCase()) {
      case 'urgent':
        return {
          'icon': Icons.warning_amber_rounded,
          'color': const Color(0xFFDC2626),
          'gradient': const [Color(0xFFEF4444), Color(0xFFDC2626)],
          'bg': const Color(0xFFFEF2F2),
          'border': const Color(0xFFFECACA),
          'label': 'Urgent Notice',
          'emoji': '⚠️',
        };
      case 'puja':
        return {
          'icon': Icons.spa_rounded,
          'color': const Color(0xFFD97706),
          'gradient': const [Color(0xFFF59E0B), Color(0xFFD97706)],
          'bg': const Color(0xFFFFFBEB),
          'border': const Color(0xFFFDE68A),
          'label': 'Puja & Seva',
          'emoji': '🪔',
        };
      case 'darshan':
        return {
          'icon': Icons.temple_hindu_rounded,
          'color': const Color(0xFFEA580C),
          'gradient': const [Color(0xFFF97316), Color(0xFFEA580C)],
          'bg': const Color(0xFFFFF7ED),
          'border': const Color(0xFFFED7AA),
          'label': 'Darshan Timings',
          'emoji': '🙏',
        };
      case 'event':
      case 'festival':
        return {
          'icon': Icons.celebration_rounded,
          'color': const Color(0xFF7C3AED),
          'gradient': const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          'bg': const Color(0xFFF5F3FF),
          'border': const Color(0xFFDDD6FE),
          'label': 'Festival & Event',
          'emoji': '🎉',
        };
      case 'general':
        return {
          'icon': Icons.self_improvement_rounded,
          'color': const Color(0xFF059669),
          'gradient': const [Color(0xFF10B981), Color(0xFF059669)],
          'bg': const Color(0xFFECFDF5),
          'border': const Color(0xFFA7F3D0),
          'label': 'Spiritual Message',
          'emoji': '🕊️',
        };
      case 'announcement':
      default:
        return {
          'icon': Icons.campaign_rounded,
          'color': const Color(0xFFE65100),
          'gradient': const [Color(0xFFFF8A65), Color(0xFFE65100)],
          'bg': const Color(0xFFFFF3E0),
          'border': const Color(0xFFFFCC80),
          'label': 'Announcement',
          'emoji': '📢',
        };
    }
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return 'Just now';
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2), // Warm sacred cream
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF3EFEA),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: AppColors.textPrimary),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Temple Announcements',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'Circulars, pujas & auspicious schedules',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFEDE8E1), height: 1.0),
        ),
      ),
      body: StreamBuilder<List<NotificationModel>>(
        stream: _db.getNotifications(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
            );
          }

          final allItems = snapshot.data ?? [];

          // Compute category counts
          final counts = <String, int>{
            'all': allItems.length,
            'announcement': allItems.where((n) => n.type == 'announcement' || n.type.isEmpty).length,
            'puja': allItems.where((n) => n.type == 'puja').length,
            'darshan': allItems.where((n) => n.type == 'darshan').length,
            'event': allItems.where((n) => n.type == 'event' || n.type == 'festival').length,
            'urgent': allItems.where((n) => n.type == 'urgent').length,
          };

          // Filter by category
          var filtered = allItems.where((item) {
            if (_selectedCategory == 'all') return true;
            if (_selectedCategory == 'event') {
              return item.type == 'event' || item.type == 'festival';
            }
            return item.type == _selectedCategory;
          }).toList();

          // Filter by search query
          if (_searchQuery.trim().isNotEmpty) {
            final query = _searchQuery.toLowerCase();
            filtered = filtered.where((item) {
              return item.title.toLowerCase().contains(query) ||
                  item.body.toLowerCase().contains(query);
            }).toList();
          }

          return Column(
            children: [
              // -------------------------------------------------------------
              // Header Controls: Search Bar & Category Filter Chips
              // -------------------------------------------------------------
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Column(
                  children: [
                    // Search Bar
                    Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F1EA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE8E2D8)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                        },
                        style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF8E8D8C)),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF8E8D8C)),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  },
                                )
                              : null,
                          hintText: 'Search notices, pujas, festivals...',
                          hintStyle: const TextStyle(fontSize: 13, color: Color(0xFFA09E9B)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Filter Chips Row
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _buildFilterChip('all', 'All', counts['all'] ?? 0),
                          _buildFilterChip('announcement', '📢 Circulars', counts['announcement'] ?? 0),
                          _buildFilterChip('puja', '🪔 Pujas', counts['puja'] ?? 0),
                          _buildFilterChip('darshan', '🙏 Darshan', counts['darshan'] ?? 0),
                          _buildFilterChip('event', '🎉 Festivals', counts['event'] ?? 0),
                          _buildFilterChip('urgent', '⚠️ Urgent', counts['urgent'] ?? 0),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Decorative subtle divider
              Container(
                height: 1,
                color: const Color(0xFFEDE6DC),
              ),

              // -------------------------------------------------------------
              // Main List / Empty State
              // -------------------------------------------------------------
              Expanded(
                child: filtered.isEmpty
                    ? (allItems.isEmpty
                        ? const EmptyStateWidget(
                            icon: Icons.notifications_none_rounded,
                            title: 'No Announcements Yet',
                            description: 'Auspicious puja schedules, festival notifications, and temple circulars will appear here.',
                          )
                        : Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 64,
                                    height: 64,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF3EFEA),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.filter_list_off_rounded, size: 32, color: Color(0xFF8E8D8C)),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'No Matching Notices',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Try selecting a different filter or clearing your search term.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 16),
                                  TextButton(
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _selectedCategory = 'all';
                                        _searchQuery = '';
                                      });
                                    },
                                    child: const Text('Reset Filters', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                                  ),
                                ],
                              ),
                            ),
                          ))
                    : RefreshIndicator(
                        color: AppColors.primary,
                        backgroundColor: Colors.white,
                        onRefresh: () async {
                          setState(() {});
                        },
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final item = filtered[index];
                            return _buildNotificationCard(item);
                          },
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChip(String key, String label, int count) {
    final isSelected = _selectedCategory == key;

    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            setState(() {
              _selectedCategory = key;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : const Color(0xFFF5F1EA),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppColors.primary : const Color(0xFFE5DDD0),
                width: 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected ? Colors.white : const Color(0xFF4A4947),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFE2DAD0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$count',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: isSelected ? Colors.white : const Color(0xFF5A5856),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(NotificationModel item) {
    final style = _getTypeStyle(item.type);
    final accentColor = style['color'] as Color;
    final isExpanded = _expandedDocIds.contains(item.id);
    final isLongBody = item.body.length > 120;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: item.type == 'urgent' ? const Color(0xFFFCA5A5) : const Color(0xFFEFE8DE),
          width: item.type == 'urgent' ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E1B18).withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Left Color Accent Strip
              Container(
                width: 5,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: style['gradient'] as List<Color>,
                  ),
                ),
              ),

              // Main Card Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header: Badge + Relative Time
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: style['bg'] as Color,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: style['border'] as Color, width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(style['icon'] as IconData, size: 13, color: accentColor),
                                const SizedBox(width: 5),
                                Text(
                                  style['label'] as String,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: accentColor,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.access_time_rounded, size: 12, color: Color(0xFF94A3B8)),
                              const SizedBox(width: 4),
                              Text(
                                _formatDate(item.createdAt),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Title
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          height: 1.25,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Body (with read more if long)
                      Text(
                        item.body,
                        maxLines: (!isExpanded && isLongBody) ? 3 : 100,
                        overflow: (!isExpanded && isLongBody) ? TextOverflow.ellipsis : TextOverflow.clip,
                        style: const TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF334155),
                          height: 1.5,
                          letterSpacing: -0.1,
                        ),
                      ),

                      // Read More Toggle Button
                      if (isLongBody) ...[
                        const SizedBox(height: 4),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              if (isExpanded) {
                                _expandedDocIds.remove(item.id);
                              } else {
                                _expandedDocIds.add(item.id);
                              }
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2.0),
                            child: Text(
                              isExpanded ? 'Show less' : 'Read full notice...',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: accentColor,
                              ),
                            ),
                          ),
                        ),
                      ],

                      // Optional Image attachment
                      if (item.imageUrl != null && item.imageUrl!.trim().isNotEmpty) ...[
                        const SizedBox(height: 14),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Image.network(
                              item.imageUrl!,
                              width: double.infinity,
                              height: 160,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                            ),
                          ),
                        ),
                      ],

                      // Primary Action Button (if linked to screen)
                      if (item.actionRoute != null && item.actionRoute!.trim().isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Container(
                          height: 1,
                          color: const Color(0xFFF1EBE3),
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(10),
                              onTap: () => _handleActionRoute(context, item.actionRoute),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [AppColors.primary, AppColors.primaryDark],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.3),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      _getActionLabel(item.actionRoute!),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 5),
                                    const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getActionLabel(String route) {
    switch (route) {
      case '/services':
        return 'Book Seva';
      case '/darshan':
        return 'View Darshan';
      case '/events':
        return 'View Event';
      case '/donations':
        return 'Donate';
      case '/news':
        return 'Read Circular';
      default:
        return 'View Details';
    }
  }
}
