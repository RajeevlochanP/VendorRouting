import { PriorityStrategy } from './priority.strategy.js';
import { WeightedStrategy } from './weighted.strategy.js';
import { FailoverStrategy } from './failover.strategy.js';

export class StrategyFactory {
  static getStrategy(type) {
    switch(type) {
      case 'PRIORITY': return new PriorityStrategy();
      case 'WEIGHTED': return new WeightedStrategy();
      case 'FAILOVER': return new FailoverStrategy();
      default: return new PriorityStrategy(); // Fallback
    }
  }
}