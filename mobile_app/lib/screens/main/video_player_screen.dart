import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';
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
  WebViewController? _webViewController;
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
          late final PlatformWebViewControllerCreationParams params;
          if (WebViewPlatform.instance is WebKitWebViewPlatform) {
            params = WebKitWebViewControllerCreationParams(
              allowsInlineMediaPlayback: true,
              mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
            );
          } else {
            params = const PlatformWebViewControllerCreationParams();
          }

          final controller = WebViewController.fromPlatformCreationParams(params);
          controller
            ..setJavaScriptMode(JavaScriptMode.unrestricted)
            ..setBackgroundColor(Colors.black)
            ..setUserAgent(
              'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            )
            ..setNavigationDelegate(
              NavigationDelegate(
                onNavigationRequest: (NavigationRequest request) {
                  final url = request.url;
                  // If user clicked "Watch on YouTube" on the YouTube player error card
                  if (url.contains('youtube.com/watch') || url.contains('youtu.be/')) {
                    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                    return NavigationDecision.prevent;
                  }
                  // Allow embed, streaming endpoints, and media CDN assets
                  if (url.contains('/embed/') ||
                      url.contains('googlevideo.com') ||
                      url.contains('ytimg.com') ||
                      url.contains('google.com') ||
                      url.contains('gstatic.com') ||
                      url.contains('doubleclick.net') ||
                      url.startsWith('data:') ||
                      url.startsWith('about:blank')) {
                    return NavigationDecision.navigate;
                  }
                  // Prevent unexpected redirects
                  debugPrint('Prevented redirect out to: $url');
                  return NavigationDecision.prevent;
                },
              ),
            );

          if (controller.platform is AndroidWebViewController) {
            (controller.platform as AndroidWebViewController)
                .setMediaPlaybackRequiresUserGesture(false);
          }

          final html = '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/$videoId?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1&fs=1&enablejsapi=1"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</body>
</html>
''';

          await controller.loadHtmlString(html, baseUrl: 'https://www.youtube.com');
          _webViewController = controller;

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
            // Top Navigation Bar
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
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: _hasError
                          ? _buildErrorView()
                          : (!_isInitialized ? _buildLoadingView() : _buildPlayerView()),
                    ),
                    const SizedBox(height: 24),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            widget.title.isNotEmpty ? widget.title : 'Sri Kedareshwara Darshan',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (_isYoutube) ...[
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFCC0000),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 3,
                              ),
                              onPressed: () {
                                launchUrl(
                                  Uri.parse(widget.videoUrl.trim()),
                                  mode: LaunchMode.externalApplication,
                                );
                              },
                              icon: const Icon(Icons.play_circle_fill, size: 20),
                              label: const Text(
                                'Watch on YouTube App',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.1),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.info_outline,
                                    size: 16,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Note: Videos with "Allow embedding" enabled in YouTube Studio play directly in-app. If restricted by the creator, use the button above to watch seamlessly.',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.white.withValues(alpha: 0.6),
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildPlayerView() {
    if (_isYoutube && _webViewController != null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: WebViewWidget(controller: _webViewController!),
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
