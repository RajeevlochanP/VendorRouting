export class LatencyStrategy {
  /**
   * Selects the vendor with the lowest historical average latency.
   */
  selectVendor(vendors, metricsService, requirements = {}) {
    if (!vendors || vendors.length === 0) return null;

    // Map vendors to their current health/latency stats
    const vendorsWithMetrics = vendors.map(vendor => {
      const health = metricsService.getHealth(vendor._id.toString());
      return {
        ...vendor.toObject(), // Convert Mongoose document to plain object
        avgLatency: health.avgLatency > 0 ? health.avgLatency : vendor.maxLatencyMs // Use max allowed if no data yet
      };
    });

    // Sort ascending by latency (fastest first)
    vendorsWithMetrics.sort((a, b) => a.avgLatency - b.avgLatency);

    // Return the fastest vendor
    return vendors.find(v => v._id.toString() === vendorsWithMetrics[0]._id.toString());
  }
}