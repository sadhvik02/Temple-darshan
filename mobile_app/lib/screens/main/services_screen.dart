import 'package:flutter/material.dart';
import '../../services/database_service.dart';
import '../../models/models.dart';
import 'slots_screen.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Services & Sevas')),
      body: StreamBuilder<List<ServiceModel>>(
        stream: DatabaseService().getActiveServices(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Error loading services'));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'No services currently available.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18),
                ),
              ),
            );
          }

          final services = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: service.bookingEnabled
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => SlotsScreen(service: service),
                            ),
                          );
                        }
                      : null,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (service.imageUrl != null && service.imageUrl!.isNotEmpty)
                        Image.network(service.imageUrl!, height: 160, fit: BoxFit.cover),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    service.name,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Text(
                                  service.price > 0 ? '₹${service.price}' : 'Free',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepOrange),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(service.description, style: TextStyle(color: Colors.grey[700])),
                            const SizedBox(height: 16),
                            if (service.bookingEnabled)
                              const Align(
                                alignment: Alignment.centerRight,
                                child: Text(
                                  'Select to Book →',
                                  style: TextStyle(color: Colors.deepOrange, fontWeight: FontWeight.bold),
                                ),
                              )
                            else
                              const Align(
                                alignment: Alignment.centerRight,
                                child: Text(
                                  'Online booking unavailable',
                                  style: TextStyle(color: Colors.grey),
                                ),
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
}
