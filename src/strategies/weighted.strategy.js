export class WeightedStrategy {
  selectVendor(vendors) {
    const totalWeight = vendors.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight === 0) return vendors[0]; // Fallback

    let randomNum = Math.random() * totalWeight;
    for (const vendor of vendors) {
      if (randomNum < vendor.weight) return vendor;
      randomNum -= vendor.weight;
    }
    return vendors[0];
  }
}