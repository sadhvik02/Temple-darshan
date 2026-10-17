import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../theme/app_colors.dart';
import 'custom_image.dart';

class BannerVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final String? fallbackImageUrl;
  final bool isCurrentSlide;
  final ValueChanged<bool>? onPlayStateChanged;

  const BannerVideoPlayer({
    super.key,
    required this.videoUrl,
    this.fallbackImageUrl,
    this.isCurrentSlide = true,
    this.onPlayStateChanged,
  });

  /// Helper to check if a URL is a playable video (MP4/MOV/HLS or YouTube)
  static bool isVideoUrl(String? url) {
    if (url == null) return false;
    final clean = url.trim().toLowerCase();
    if (clean.isEmpty) return false;
    return clean.endsWith('.mp4') ||
        clean.endsWith('.mov') ||
        clean.endsWith('.m4v') ||
        clean.endsWith('.m3u8') ||
        clean.contains('youtube.com/') ||
        clean.contains('youtu.be/');
  }

  /// Helper to check if a URL is specifically a YouTube URL
  static bool isYoutubeUrl(String? url) {
    if (url == null) return false;
    final clean = url.trim().toLowerCase();
    return clean.contains('youtube.com/') || clean.contains('youtu.be/');
  }

  @override
  State<BannerVideoPlayer> createState() => _BannerVideoPlayerState();
}

class _BannerVideoPlayerState extends State<BannerVideoPlayer> {
  // Direct Video Controller (MP4/HLS/MOV)
  VideoPlayerController? _videoController;

  // YouTube Controller
  YoutubePlayerController? _youtubeController;

  bool _isInitialized = false;
  bool _hasError = false;
  bool _isMuted = true;
  bool _isYoutube = false;

  @override
  void initState() {
    super.initState();
    _isYoutube = BannerVideoPlayer.isYoutubeUrl(widget.videoUrl);
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    try {
      if (_isYoutube) {
        final videoId = YoutubePlayerController.convertUrlToId(widget.videoUrl);
        if (videoId != null && videoId.isNotEmpty) {
          _youtubeController = YoutubePlayerController.fromVideoId(
            videoId: videoId,
            autoPlay: widget.isCurrentSlide,
            params: const YoutubePlayerParams(
              mute: true,
              loop: true,
              showControls: false,
              showFullscreenButton: false,
              enableCaption: false,
            ),
          );
          if (mounted) {
            setState(() {
              _isInitialized = true;
            });
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) widget.onPlayStateChanged?.call(true);
            });
          }
        } else {
          if (mounted) setState(() => _hasError = true);
        }
      } else {
        final uri = Uri.parse(widget.videoUrl.trim());
        _videoController = VideoPlayerController.networkUrl(uri);
        await _videoController!.initialize();
        await _videoController!.setLooping(true);
        await _videoController!.setVolume(0.0); // start muted for polite autoplay

        if (widget.isCurrentSlide) {
          await _videoController!.play();
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) widget.onPlayStateChanged?.call(true);
          });
        }

        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    } catch (e) {
      debugPrint('BannerVideoPlayer init error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  @override
  void didUpdateWidget(covariant BannerVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeControllers();
      _isYoutube = BannerVideoPlayer.isYoutubeUrl(widget.videoUrl);
      _initPlayer();
      return;
    }

    // Pause playback when user swipes to a different banner slide
    if (oldWidget.isCurrentSlide != widget.isCurrentSlide) {
      if (widget.isCurrentSlide) {
        _videoController?.play();
        _youtubeController?.playVideo();
        widget.onPlayStateChanged?.call(true);
      } else {
        _videoController?.pause();
        _youtubeController?.pauseVideo();
        widget.onPlayStateChanged?.call(false);
      }
    }
  }

  void _disposeControllers() {
    _videoController?.dispose();
    _videoController = null;
    _youtubeController?.close();
    _youtubeController = null;
    _isInitialized = false;
    _hasError = false;
  }

  @override
  void dispose() {
    _disposeControllers();
    super.dispose();
  }

  void _togglePlayPause() {
    if (_videoController == null || !_videoController!.value.isInitialized) return;
    setState(() {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
        widget.onPlayStateChanged?.call(false);
      } else {
        _videoController!.play();
        widget.onPlayStateChanged?.call(true);
      }
    });
  }

  void _toggleMute() {
    if (_isYoutube && _youtubeController != null) {
      setState(() {
        if (_isMuted) {
          _youtubeController!.unMute();
          _isMuted = false;
        } else {
          _youtubeController!.mute();
          _isMuted = true;
        }
      });
      return;
    }

    if (_videoController == null) return;
    setState(() {
      _isMuted = !_isMuted;
      _videoController!.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError || (!_isInitialized && widget.fallbackImageUrl != null)) {
      if (widget.fallbackImageUrl != null && widget.fallbackImageUrl!.isNotEmpty) {
        return CustomImage(
          imageUrl: widget.fallbackImageUrl,
          fit: BoxFit.cover,
          fallbackIcon: Icons.videocam,
        );
      }
    }

    if (_isYoutube && _youtubeController != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          FittedBox(
            fit: BoxFit.cover,
            clipBehavior: Clip.hardEdge,
            child: SizedBox(
              width: 16,
              height: 9,
              child: YoutubePlayer(
                controller: _youtubeController!,
              ),
            ),
          ),
          // Audio Mute/Unmute quick button
          Positioned(
            top: 12,
            right: 12,
            child: Material(
              color: Colors.black.withValues(alpha: 0.6),
              shape: const CircleBorder(),
              child: IconButton(
                iconSize: 20,
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                icon: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  color: Colors.white,
                ),
                onPressed: _toggleMute,
              ),
            ),
          ),
        ],
      );
    }

    if (_videoController != null && _videoController!.value.isInitialized) {
      final isPlaying = _videoController!.value.isPlaying;

      return GestureDetector(
        onTap: _togglePlayPause,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video Surface
            FittedBox(
              fit: BoxFit.cover,
              clipBehavior: Clip.hardEdge,
              child: SizedBox(
                width: _videoController!.value.size.width,
                height: _videoController!.value.size.height,
                child: VideoPlayer(_videoController!),
              ),
            ),

            // Subtle Pause Indicator if paused
            if (!isPlaying)
              Center(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 38,
                  ),
                ),
              ),

            // Live progress indicator line along bottom
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: VideoProgressIndicator(
                _videoController!,
                allowScrubbing: true,
                padding: EdgeInsets.zero,
                colors: VideoProgressColors(
                  playedColor: AppColors.primaryLight,
                  bufferedColor: Colors.white24,
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),

            // Audio Mute/Unmute toggle button
            Positioned(
              top: 12,
              right: 12,
              child: Material(
                color: Colors.black.withValues(alpha: 0.6),
                shape: const CircleBorder(),
                child: IconButton(
                  iconSize: 20,
                  padding: const EdgeInsets.all(6),
                  constraints: const BoxConstraints(),
                  icon: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: Colors.white,
                  ),
                  onPressed: _toggleMute,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Loading State
    if (widget.fallbackImageUrl != null && widget.fallbackImageUrl!.isNotEmpty) {
      return CustomImage(
        imageUrl: widget.fallbackImageUrl,
        fit: BoxFit.cover,
        fallbackIcon: Icons.videocam,
      );
    }

    return Container(
      color: Colors.black87,
      child: const Center(
        child: SizedBox(
          width: 28,
          height: 28,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.primaryLight,
          ),
        ),
      ),
    );
  }
}
