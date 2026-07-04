export class MockVendorClient {
  async invoke(vendor, payload) {
    return new Promise((resolve, reject) => {
      // Simulate variable network latency (50ms to 900ms)
      const simulatedLatency = Math.floor(Math.random() * 850) + 50;
      
      setTimeout(() => {
        // Simulate a 5% chance of vendor failure
        const isFailure = Math.random() < 0.05; 
        
        if (isFailure || simulatedLatency > vendor.maxLatencyMs) {
          return reject(new Error(`Vendor ${vendor.name} timed out or failed.`));
        }

        // Generate the exact response format required by the sample
        let responseData = { message: `Processed by ${vendor.name}` };
        
        if (vendor.capability === 'PAN_VERIFICATION') {
          responseData = {
            panStatus: "VALID",
            nameMatch: true
          };
        }

        resolve({
          status: 'SUCCESS',
          vendorId: vendor._id,
          simulatedLatency,
          data: responseData
        });
      }, simulatedLatency);
    });
  }
}