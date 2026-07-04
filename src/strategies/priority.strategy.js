export class PriorityStrategy {
  selectVendor(vendors) {
    // Sorts ascending (Priority 1 is higher than Priority 2)
    return vendors.sort((a, b) => a.priority - b.priority)[0];
  }
}