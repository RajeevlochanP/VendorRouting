import { WeightedStrategy } from './weighted.strategy.js';

export class DynamicScoringStrategy {
  constructor() {
    this.weightedSelector = new WeightedStrategy();
  }

  selectVendor(vendors, metricsService, requirements = {}) {
    if (!vendors || vendors.length === 0) return null;

    const vendorStats = vendors.map(vendor => {
      const health = metricsService.getHealth(vendor._id.toString());
      return {
        vendor,
        cost: vendor.costPerRequest,
        latency: health.avgLatency > 0 ? health.avgLatency : (vendor.maxLatencyMs / 2)
      };
    });

    const minCost = Math.min(...vendorStats.map(v => v.cost));
    const minLatency = Math.min(...vendorStats.map(v => v.latency));

    // Calculate scores for all vendors
    vendorStats.forEach(stat => {
      let score = 0;
      let criteriaCount = 0;

      if (requirements.preferLowCost) {
        score += (minCost / stat.cost) * 100;
        criteriaCount++;
      }
      if (requirements.preferFastest) {
        score += (minLatency / stat.latency) * 100;
        criteriaCount++;
      }

      stat.finalScore = criteriaCount > 0 ? (score / criteriaCount) : 0;
    });

    // 1. Find the highest score
    const highestScore = Math.max(...vendorStats.map(v => v.finalScore));

    // 2. Group ALL vendors that have a score effectively tied for 1st place
    const topScorers = vendorStats
      .filter(v => Math.abs(v.finalScore - highestScore) < 0.1)
      .map(v => v.vendor);

    // 3. Break the tie using the Weighted Strategy
    return this.weightedSelector.selectVendor(topScorers);
  }
}