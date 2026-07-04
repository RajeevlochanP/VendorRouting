// Acts as an in-memory store for fast metric tracking
export class MetricsService {
  constructor() {
    this.metrics = new Map();
  }

  _initialize(vendorId) {
    if (!this.metrics.has(vendorId)) {
      this.metrics.set(vendorId, { totalRequests: 0, failures: 0, totalLatency: 0 });
    }
  }

  record(vendorId, latency, isSuccess) {
    this._initialize(vendorId);
    const data = this.metrics.get(vendorId);
    
    data.totalRequests += 1;
    data.totalLatency += latency;
    if (!isSuccess) data.failures += 1;
  }

  getHealth(vendorId) {
    this._initialize(vendorId);
    const data = this.metrics.get(vendorId);
    
    if (data.totalRequests === 0) return { errorRate: 0, avgLatency: 0 };
    
    return {
      errorRate: data.failures / data.totalRequests,
      avgLatency: data.totalLatency / data.totalRequests
    };
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Export as a singleton so all requests share the same metrics map
export const metricsService = new MetricsService();