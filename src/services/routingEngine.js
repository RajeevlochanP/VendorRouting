import { Vendor } from '../models/Vendor.js';
import { RouteLog } from '../models/RouteLog.js';
import { StrategyFactory } from '../strategies/index.js';
import { VendorExecutionClient } from '../utils/VendorExecutionClient.js';
import { metricsService } from './metrics.service.js';

export class RoutingEngine {
  constructor() {
    this.client = new VendorExecutionClient();
    this.MAX_RETRIES = 2;
  }

  async executeRoute(capability, payload, requirements = {}) {
    const startTime = Date.now();
    
    const rawVendors = await Vendor.find({ capability });
    if (!rawVendors || rawVendors.length === 0) {
      throw new Error(`No vendors found for capability: ${capability}`);
    }

    let strategyType = 'WEIGHTED';
    
    const wantsCheap = requirements.preferLowCost === true;
    const wantsFast = requirements.preferFastest === true;

    if (wantsCheap && wantsFast) {
      strategyType = 'SCORING';
    } else if (wantsCheap) {
      strategyType = 'COST';
    } else if (wantsFast) {
      strategyType = 'LATENCY';
    }
    
    const strategy = StrategyFactory.getStrategy(strategyType);

    let attempt = 0;
    let failedVendorIds = new Set();
    let executionLog = [];
    
    while (attempt <= this.MAX_RETRIES) {
      const eligibleVendors = rawVendors.filter(v => {
        const id = v._id.toString();
        if (failedVendorIds.has(id)) return false;
        
        const health = metricsService.getHealth(id);
        const isFailing = health.errorRate > 0.30; 
        const isTooSlow = requirements.maxLatencyMs ? health.avgLatency > requirements.maxLatencyMs : false;
        
        return !isFailing && !isTooSlow;
      });

      if (eligibleVendors.length === 0) {
        executionLog.push('Routing failed: No healthy or eligible vendors remaining.');
        break;
      }

      const selectedVendor = strategy.selectVendor(eligibleVendors, metricsService, requirements);
      const attemptStartTime = Date.now();

      try {
        const vendorResponse = await this.client.invoke(selectedVendor, payload);
        
        const latency = Date.now() - attemptStartTime;
        metricsService.record(selectedVendor._id.toString(), latency, true);
        
        const routingReason = `Successfully routed to ${selectedVendor.name} using ${strategyType} strategy after ${attempt} failovers.`;
        
        await RouteLog.create({
          capability,
          vendorUsed: selectedVendor.name,
          routingStrategy: strategyType,
          routingReason,
          latencyMs: Date.now() - startTime, // Total time including retries
          isSuccess: true,
          cost: selectedVendor.costPerRequest,
          requestPayload: payload,
          responsePayload: vendorResponse
        });

        // Return the exact sample output format
        return {
          status: 'SUCCESS',
          vendorUsed: selectedVendor.name,
          routingReason,
          latencyMs: latency, // Latency of the successful call
          cost: selectedVendor.costPerRequest,
          response: vendorResponse.data
        };

      } catch (error) {
        // FAILOVER TRIGGERED: Execution failed. 
        const latency = Date.now() - attemptStartTime;
        metricsService.record(selectedVendor._id.toString(), latency, false);
        
        failedVendorIds.add(selectedVendor._id.toString());
        executionLog.push(`Attempt ${attempt + 1}: ${selectedVendor.name} failed (${error.message}). Triggering failover.`);
        
        attempt++; // Increment and try the next best vendor
      }
    }

    // 4. Exhausted all retries or ran out of vendors
    const totalLatency = Date.now() - startTime;
    await RouteLog.create({
      capability,
      vendorUsed: 'NONE',
      routingStrategy: strategyType,
      routingReason: `Failed after ${attempt} attempts. Log: ${executionLog.join(' | ')}`,
      latencyMs: totalLatency,
      isSuccess: false,
      cost: 0,
      requestPayload: payload,
      responsePayload: null
    });

    return {
      status: 'FAILED',
      vendorUsed: null,
      routingReason: `All failover attempts exhausted.`,
      latencyMs: totalLatency,
      cost: 0,
      response: null
    };
  }
}