import { WeightedStrategy } from './weighted.strategy.js';

export class LatencyStrategy {
  constructor() {
    this.weightedSelector = new WeightedStrategy();
  }

  selectVendor(vendors, metricsService) {
    if (!vendors || vendors.length === 0) return null;

    const vendorsWithMetrics = vendors.map(vendor => {
      const health = metricsService.getHealth(vendor._id.toString());
      return {
        vendor,
        avgLatency: health.avgLatency > 0 ? health.avgLatency : vendor.maxLatencyMs
      };
    });

    // 1. Find the absolute fastest latency
    const minLatency = Math.min(...vendorsWithMetrics.map(v => v.avgLatency));

    // 2. Group ALL vendors that share this fastest time
    const tiedFastestVendors = vendorsWithMetrics
      .filter(v => v.avgLatency === minLatency)
      .map(v => v.vendor);

    // 3. Break the tie using the Weighted Strategy
    return this.weightedSelector.selectVendor(tiedFastestVendors);
  }
}