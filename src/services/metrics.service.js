// Acts as an in-memory store for fast metric tracking
export class MetricsService {
  constructor() {
    // Use a Map or Object to store live metrics per vendor ID
    this.store = new Map(); 
  }

  recordSuccess(vendorId, latencyMs) {
    // TODO: Update success count, calculate moving average latency
  }

  recordError(vendorId) {
    // TODO: Increment error count
  }

  getVendorMetrics(vendorId) {
    // TODO: Return current metrics (error rate, latency) for failover evaluation
  }
}