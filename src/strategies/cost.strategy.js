import { WeightedStrategy } from './weighted.strategy.js';

export class CostStrategy {
  constructor() {
    this.weightedSelector = new WeightedStrategy();
  }

  selectVendor(vendors, metricsService, requirements = {}) {
    if (!vendors || vendors.length === 0) return null;

    let eligibleVendors = vendors;

    if (requirements.maxLatencyMs) {
      eligibleVendors = vendors.filter(v => {
        const health = metricsService.getHealth(v._id.toString());
        return health.avgLatency <= requirements.maxLatencyMs;
      });
    }

    if (eligibleVendors.length === 0) eligibleVendors = vendors;

    const minCost = Math.min(...eligibleVendors.map(v => v.costPerRequest));

    const tiedCheapestVendors = eligibleVendors.filter(v => v.costPerRequest === minCost);

    return this.weightedSelector.selectVendor(tiedCheapestVendors);
  }
}