export class FailoverStrategy {
  /**
   * @param {Array} vendors - List of available vendors from DB
   * @param {Object} liveMetrics - Data from MetricsService
   * @returns {Object} The selected vendor
   */
  selectVendor(vendors, liveMetrics) {
    // TODO: Sort by priority. 
    // TODO: Check liveMetrics. If Vendor 1 has high error rate/latency, pick Vendor 2.
    // TODO: Return the chosen vendor.
  }
}