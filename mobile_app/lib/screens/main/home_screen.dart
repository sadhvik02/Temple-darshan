import 'package:flutter/material.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';
import 'temple_info_screen.dart';
// import 'services_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = DatabaseService();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Temple Darshan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TempleInfoScreen()),
              );
            },
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // A simple delay since streams automatically push new data
          await Future.delayed(const Duration(seconds: 1));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            _buildBanners(db),
            const SizedBox(height: 24),
            _buildNews(db),
          ],
        ),
      ),
    );
  }

  Widget _buildBanners(DatabaseService db) {
    return StreamBuilder<List<BannerModel>>(
      stream: db.getActiveBanners(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
        }
        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink(); // Hide if empty
        }

        final banners = snapshot.data!;
        return SizedBox(
          height: 180,
          child: PageView.builder(
            itemCount: banners.length,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: banner.imageUrl.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(banner.imageUrl),
                          fit: BoxFit.cover,
                        )
                      : null,
                  color: Colors.grey[300],
                ),
                alignment: Alignment.bottomLeft,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                    gradient: LinearGradient(
                      colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                    ),
                  ),
                  child: Text(
                    banner.title,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildNews(DatabaseService db) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            'Latest News & Announcements',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        StreamBuilder<List<NewsModel>>(
          stream: db.getPublishedNews(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('No announcements at this time.'),
              );
            }

            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final news = snapshot.data![index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: news.imageUrl != null && news.imageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              news.imageUrl!,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                            ),
                          )
                        : const Icon(Icons.newspaper, size: 40),
                    title: Text(news.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(
                      news.content,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                );
              },
            );
          },
        ),
      ],
    );
  }
}
