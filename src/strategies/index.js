import { PriorityStrategy } from './priority.strategy.js';
import { WeightedStrategy } from './weighted.strategy.js';
import { FailoverStrategy } from './failover.strategy.js';
import { CostStrategy } from './cost.strategy.js';
import { LatencyStrategy } from './latency.strategy.js';

export class StrategyFactory {
  static getStrategy(type) {
    switch (type.toUpperCase()) {
      case 'WEIGHTED': return new WeightedStrategy();
      case 'COST': return new CostStrategy();
      case 'LATENCY': return new LatencyStrategy();
      case 'PRIORITY': 
      default: return new PriorityStrategy();
    }
  }
}