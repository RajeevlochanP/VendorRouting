import { Vendor } from '../models/Vendor.js';
import { RouteLog } from '../models/RouteLog.js';
import { StrategyFactory } from '../strategies/index.js';
import { MockVendorClient } from '../utils/mockVendorClient.js';
import { metricsService } from './metrics.service.js';

export class RoutingEngine {
  constructor() {
    this.client = new MockVendorClient();
    this.MAX_RETRIES = 2; // Allow up to 2 failovers per request
  }

  async executeRoute(capability, payload, requirements = {}) {
    const startTime = Date.now();
    
    // 1. Fetch all vendors for this capability
    const rawVendors = await Vendor.find({ capability });
    if (!rawVendors || rawVendors.length === 0) {
      throw new Error(`No vendors found for capability: ${capability}`);
    }

    // 2. Determine the Business Strategy
    let strategyType = 'WEIGHTED'; // Default
    if (requirements.preferLowCost) strategyType = 'COST';
    else if (requirements.preferFastest) strategyType = 'LATENCY';
    
    const strategy = StrategyFactory.getStrategy(strategyType);

    // 3. The Failover/Retry Loop
    let attempt = 0;
    let failedVendorIds = new Set();
    let executionLog = []; // Track the chain of attempts
    
    while (attempt <= this.MAX_RETRIES) {
      // Filter out historically unhealthy vendors AND vendors that failed in this exact loop
      const eligibleVendors = rawVendors.filter(v => {
        const id = v._id.toString();
        if (failedVendorIds.has(id)) return false; // Already tried and failed on this request
        
        const health = metricsService.getHealth(id);
        const isFailing = health.errorRate > 0.30; 
        const isTooSlow = requirements.maxLatencyMs ? health.avgLatency > requirements.maxLatencyMs : false;
        
        return !isFailing && !isTooSlow;
      });

      // If no eligible vendors left, break the loop and return an error
      if (eligibleVendors.length === 0) {
        executionLog.push('Routing failed: No healthy or eligible vendors remaining.');
        break;
      }

      // Pick the best vendor from the REMAINING eligible pool using the chosen strategy
      const selectedVendor = strategy.selectVendor(eligibleVendors, metricsService, requirements);
      const attemptStartTime = Date.now();

      try {
        // Execute the call
        const vendorResponse = await this.client.invoke(selectedVendor, payload);
        
        // Success! Record metrics and log it
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