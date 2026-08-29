import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/database_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_image.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_state_widget.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('News & Announcements'),
      ),
      body: StreamBuilder<List<NewsModel>>(
        stream: DatabaseService().getPublishedNews(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (snapshot.hasError) {
            return ErrorStateWidget(
              message: 'Unable to load announcements.',
              onRetry: () => setState(() {}),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.newspaper_outlined,
              title: 'No Announcements',
              description: 'There are no active news or announcements at this time.',
            );
          }

          final newsList = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: newsList.length,
            itemBuilder: (context, index) {
              final news = newsList[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () => _showNewsDetailsModal(context, news),
                  borderRadius: BorderRadius.circular(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (news.imageUrl != null && news.imageUrl!.trim().isNotEmpty)
                        CustomImage(
                          imageUrl: news.imageUrl,
                          height: 180,
                          fit: BoxFit.cover,
                          fallbackIcon: Icons.newspaper,
                        ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (news.publishedAt != null) ...[
                              Row(
                                children: [
                                  const Icon(
                                    Icons.calendar_today_outlined,
                                    size: 14,
                                    color: AppColors.textTertiary,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${news.publishedAt!.day.toString().padLeft(2, '0')}/${news.publishedAt!.month.toString().padLeft(2, '0')}/${news.publishedAt!.year}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textTertiary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                            ],
                            Text(
                              news.title,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              news.content,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Row(
                              children: [
                                Text(
                                  'Read More',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward, size: 14, color: AppColors.primary),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showNewsDetailsModal(BuildContext context, NewsModel news) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              if (news.imageUrl != null && news.imageUrl!.trim().isNotEmpty) ...[
                CustomImage(
                  imageUrl: news.imageUrl,
                  height: 200,
                  borderRadius: BorderRadius.circular(12),
                  fit: BoxFit.cover,
                  fallbackIcon: Icons.newspaper,
                ),
                const SizedBox(height: 16),
              ],
              Text(
                news.title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              if (news.publishedAt != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Published on ${news.publishedAt!.day}/${news.publishedAt!.month}/${news.publishedAt!.year}',
                  style: const TextStyle(fontSize: 13, color: AppColors.textTertiary),
                ),
              ],
              const Divider(height: 24),
              Text(
                news.content,
                style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
