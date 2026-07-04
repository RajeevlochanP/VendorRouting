import { WeightedStrategy } from './weighted.strategy.js';

export class CostStrategy {
  constructor() {
    this.weightedSelector = new WeightedStrategy();
  }

  selectVendor(vendors, metricsService, requirements = {}) {
    if (!vendors || vendors.length === 0) return null;

    let eligibleVendors = vendors;

    // Filter by max latency if requested
    if (requirements.maxLatencyMs) {
      eligibleVendors = vendors.filter(v => {
        const health = metricsService.getHealth(v._id.toString());
        return health.avgLatency <= requirements.maxLatencyMs;
      });
    }

    if (eligibleVendors.length === 0) eligibleVendors = vendors;

    // 1. Find the absolute lowest cost in the pool
    const minCost = Math.min(...eligibleVendors.map(v => v.costPerRequest));

    // 2. Group ALL vendors that share this exact lowest cost
    const tiedCheapestVendors = eligibleVendors.filter(v => v.costPerRequest === minCost);

    // 3. Break the tie using the Weighted Strategy
    return this.weightedSelector.selectVendor(tiedCheapestVendors);
  }
}