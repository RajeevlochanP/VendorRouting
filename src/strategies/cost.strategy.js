export class CostStrategy {
  /**
   * Selects the cheapest vendor that also meets the max latency requirement if provided.
   */
  selectVendor(vendors, metricsService, requirements = {}) {
    let eligibleVendors = vendors;

    // If maxLatencyMs is provided, filter out vendors whose historical average is too slow
    if (requirements.maxLatencyMs) {
      eligibleVendors = vendors.filter(v => {
        const health = metricsService.getHealth(v._id.toString());
        return health.avgLatency <= requirements.maxLatencyMs;
      });
    }

    // Fallback if all eligible vendors are too slow, use the original list
    if (eligibleVendors.length === 0) {
      eligibleVendors = vendors;
    }

    // Sort by cost ascending and return the cheapest
    return eligibleVendors.sort((a, b) => a.costPerRequest - b.costPerRequest)[0];
  }
}