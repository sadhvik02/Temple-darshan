import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../theme/app_colors.dart';

class VideoPlayerScreen extends StatefulWidget {
  final String videoUrl;
  final String title;

  const VideoPlayerScreen({
    super.key,
    required this.videoUrl,
    required this.title,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  YoutubePlayerController? _youtubeController;
  VideoPlayerController? _directVideoController;
  bool _isYoutube = false;
  bool _isInitialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _isYoutube = _checkIsYoutube(widget.videoUrl);
    _initPlayer();
  }

  bool _checkIsYoutube(String url) {
    final clean = url.trim().toLowerCase();
    return clean.contains('youtube.com/') || clean.contains('youtu.be/');
  }

  Future<void> _initPlayer() async {
    try {
      if (_isYoutube) {
        final videoId = YoutubePlayerController.convertUrlToId(widget.videoUrl);
        if (videoId != null && videoId.isNotEmpty) {
          _youtubeController = YoutubePlayerController.fromVideoId(
            videoId: videoId,
            autoPlay: true,
            params: const YoutubePlayerParams(
              mute: false,
              showControls: true,
              showFullscreenButton: true,
              enableCaption: true,
            ),
          );
          if (mounted) setState(() => _isInitialized = true);
        } else {
          if (mounted) setState(() => _hasError = true);
        }
      } else {
        final uri = Uri.parse(widget.videoUrl.trim());
        _directVideoController = VideoPlayerController.networkUrl(uri);
        await _directVideoController!.initialize();
        await _directVideoController!.setVolume(1.0);
        await _directVideoController!.play();
        if (mounted) setState(() => _isInitialized = true);
      }
    } catch (e) {
      debugPrint('VideoPlayerScreen init error: $e');
      if (mounted) setState(() => _hasError = true);
    }
  }

  @override
  void dispose() {
    _youtubeController?.close();
    _directVideoController?.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with Close button and Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 22),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.title.isNotEmpty ? widget.title : 'Sri Kedareshwara Darshan',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 24),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Video Player Section
            Expanded(
              child: Center(
                child: _hasError
                    ? _buildErrorView()
                    : (!_isInitialized ? _buildLoadingView() : _buildPlayerView()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerView() {
    if (_isYoutube && _youtubeController != null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: YoutubePlayer(
          controller: _youtubeController!,
          aspectRatio: 16 / 9,
        ),
      );
    }

    if (_directVideoController != null && _directVideoController!.value.isInitialized) {
      return AspectRatio(
        aspectRatio: _directVideoController!.value.aspectRatio,
        child: Stack(
          alignment: Alignment.bottomCenter,
          children: [
            VideoPlayer(_directVideoController!),
            VideoProgressIndicator(
              _directVideoController!,
              allowScrubbing: true,
              colors: VideoProgressColors(
                playedColor: AppColors.primary,
                bufferedColor: Colors.white24,
                backgroundColor: Colors.black38,
              ),
            ),
          ],
        ),
      );
    }

    return _buildLoadingView();
  }

  Widget _buildLoadingView() {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircularProgressIndicator(
          strokeWidth: 3,
          color: AppColors.primaryLight,
        ),
        SizedBox(height: 16),
        Text(
          'Loading sacred video...',
          style: TextStyle(color: Colors.white70, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.error_outline, color: Colors.orangeAccent, size: 48),
        const SizedBox(height: 12),
        const Text(
          'Unable to play video',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: () {
            setState(() {
              _hasError = false;
              _isInitialized = false;
            });
            _initPlayer();
          },
          icon: const Icon(Icons.refresh, color: AppColors.primaryLight),
          label: const Text('Retry', style: TextStyle(color: AppColors.primaryLight)),
        ),
      ],
    );
  }
}
