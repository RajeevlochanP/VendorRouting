export class PriorityStrategy {
  selectVendor(vendors) {
    return vendors.sort((a, b) => a.priority - b.priority)[0];
  }
}