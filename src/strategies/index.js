import { WeightedStrategy } from './weighted.strategy.js';
import { CostStrategy } from './cost.strategy.js';
import { LatencyStrategy } from './latency.strategy.js';
import { DynamicScoringStrategy } from './dynamicScoring.strategy.js';

export class StrategyFactory {
  static getStrategy(type) {
    switch (type.toUpperCase()) {
      case 'COST': return new CostStrategy();
      case 'LATENCY': return new LatencyStrategy();
      case 'SCORING': return new DynamicScoringStrategy();
      case 'WEIGHTED': 
      default: return new WeightedStrategy();
    }
  }
}