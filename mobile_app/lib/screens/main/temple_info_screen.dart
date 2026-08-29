import 'package:flutter/material.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';

class TempleInfoScreen extends StatelessWidget {
  const TempleInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Temple Info')),
      body: FutureBuilder<TempleInfoModel?>(
        future: DatabaseService().getTempleInfo(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Error loading temple info'));
          }
          if (!snapshot.hasData || snapshot.data == null) {
            return const Center(child: Text('Temple information not found.'));
          }

          final info = snapshot.data!;
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (info.imageUrl != null && info.imageUrl!.isNotEmpty)
                  Image.network(info.imageUrl!, height: 250, fit: BoxFit.cover),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(info.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Text(info.description, style: Theme.of(context).textTheme.bodyLarge),
                      const Divider(height: 32),
                      _buildInfoRow(Icons.location_on, '${info.address}\n${info.city}, ${info.state} - ${info.phone}'),
                      if (info.email != null && info.email!.isNotEmpty)
                        _buildInfoRow(Icons.email, info.email!),
                      if (info.website != null && info.website!.isNotEmpty)
                        _buildInfoRow(Icons.language, info.website!),
                      const Divider(height: 32),
                      const Text('Timings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      _buildInfoRow(Icons.wb_sunny, 'Morning: ${info.timings['morning'] ?? 'N/A'}'),
                      _buildInfoRow(Icons.nights_stay, 'Evening: ${info.timings['evening'] ?? 'N/A'}'),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.deepOrange, size: 24),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }
}
