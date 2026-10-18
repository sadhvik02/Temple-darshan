import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../screens/main/video_player_screen.dart';
import 'custom_image.dart';

class BannerVideoPlayer extends StatelessWidget {
  final String videoUrl;
  final String? fallbackImageUrl;
  final String title;

  const BannerVideoPlayer({
    super.key,
    required this.videoUrl,
    this.fallbackImageUrl,
    this.title = '',
  });

  /// Helper to check if a URL is a playable video (MP4/MOV/HLS or YouTube)
  static bool isVideoUrl(String? url) {
    if (url == null) return false;
    final clean = url.trim().toLowerCase();
    if (clean.isEmpty) return false;
    return clean.contains('.mp4') ||
        clean.contains('.mov') ||
        clean.contains('.m4v') ||
        clean.contains('.m3u8') ||
        clean.contains('youtube.com/') ||
        clean.contains('youtu.be/');
  }

  /// Helper to check if a URL is specifically a YouTube URL
  static bool isYoutubeUrl(String? url) {
    if (url == null) return false;
    final clean = url.trim().toLowerCase();
    return clean.contains('youtube.com/') || clean.contains('youtu.be/');
  }

  /// Helper to extract YouTube video ID from standard URLs, Shorts, and embed links
  static String? extractYoutubeId(String? url) {
    if (url == null) return null;
    final clean = url.trim();
    if (clean.isEmpty) return null;

    final regExp = RegExp(
      r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
      caseSensitive: false,
    );
    final match = regExp.firstMatch(clean);
    if (match != null && match.groupCount >= 1) {
      return match.group(1);
    }
    return YoutubePlayerController.convertUrlToId(clean);
  }

  /// Get the effective display thumbnail for this video
  String _getEffectiveImageUrl() {
    if (isYoutubeUrl(videoUrl)) {
      final videoId = extractYoutubeId(videoUrl);
      if (videoId != null && videoId.isNotEmpty) {
        return 'https://img.youtube.com/vi/$videoId/hqdefault.jpg';
      }
    }

    if (fallbackImageUrl != null &&
        fallbackImageUrl!.trim().isNotEmpty &&
        !isVideoUrl(fallbackImageUrl)) {
      return fallbackImageUrl!.trim();
    }

    return '';
  }

  void _openPlayer(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VideoPlayerScreen(
          videoUrl: videoUrl,
          title: title,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveImage = _getEffectiveImageUrl();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openPlayer(context),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video Thumbnail Poster
            CustomImage(
              imageUrl: effectiveImage,
              fit: BoxFit.cover,
              fallbackIcon: Icons.videocam,
            ),

            // Subtle dark overlay across image to make play button pop
            Container(
              color: Colors.black.withValues(alpha: 0.25),
            ),

            // Top-left "Watch Video" badge
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black38, blurRadius: 4, offset: Offset(0, 1)),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.play_circle_fill, color: Colors.white, size: 14),
                    SizedBox(width: 5),
                    Text(
                      'Watch Video',
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
            ),

            // Center Circular Glowing Play Button
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 2.5),
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
                  size: 42,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
