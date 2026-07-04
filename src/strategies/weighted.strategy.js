export class WeightedStrategy {
  selectVendor(vendors) {
    if (!vendors || vendors.length === 0) return null;
    
    // If only one vendor made the cut, just return it immediately
    if (vendors.length === 1) return vendors[0];

    const totalWeight = vendors.reduce((sum, v) => sum + (v.weight || 0), 0);
    
    // Fallback: If no weights are set, distribute evenly (random choice)
    if (totalWeight === 0) {
      return vendors[Math.floor(Math.random() * vendors.length)];
    }

    let randomNum = Math.random() * totalWeight;
    for (const vendor of vendors) {
      if (randomNum < vendor.weight) return vendor;
      randomNum -= vendor.weight;
    }
    
    return vendors[0];
  }
}