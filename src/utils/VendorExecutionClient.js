import dotenv from 'dotenv';
dotenv.config();

export class VendorExecutionClient {
  
  async invoke(vendor, payload) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      console.log(`[DEV MODE] Simulating execution for ${vendor.name}`);
      return this._simulateCall(vendor, payload);
    } else {
      console.log(`[PROD MODE] Executing live HTTP call for ${vendor.name}`);
      return this._executeRealCall(vendor, payload);
    }
  }

  // --- 1. THE PRODUCTION ENGINE (Real HTTP Calls) ---
  async _executeRealCall(vendor, payload) {
    const startTime = Date.now();
    let currentResponse = null;

    try {
      if (!vendor.integration || !vendor.integration.steps || vendor.integration.steps.length === 0) {
        throw new Error(`Vendor ${vendor.name} is missing integration configurations.`);
      }

      // Execute each step sequentially (handles tokens -> execution pipelines)
      for (const step of vendor.integration.steps) {
        
        // 1. Prepare Headers and Authentication
        const headers = { 'Content-Type': 'application/json' };
        if (step.auth && step.auth.type !== 'NONE') {
          if (step.auth.type === 'BEARER') {
            headers[step.auth.keyName || 'Authorization'] = `Bearer ${process.env[`${vendor.name.toUpperCase()}_API_KEY`]}`;
          } else if (step.auth.type === 'API_KEY' && step.auth.location === 'HEADER') {
            headers[step.auth.keyName] = process.env[`${vendor.name.toUpperCase()}_API_KEY`];
          }
        }

        // 2. Map the Request Payload using the template
        const body = this._applyRequestTemplate(step.requestTemplate, payload);
        
        // 3. Fire the real HTTP request
        const response = await fetch(step.endpoint, {
          method: step.method,
          headers,
          body: step.method !== 'GET' ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`HTTP System Error: ${response.status} ${response.statusText}`);
          }
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const rawJson = await response.json();

        if (step.systemErrorIndicator && step.systemErrorIndicator.keyPath) {
          const checkMapping = { errorCheck: step.systemErrorIndicator.keyPath };
          const extractedCheck = this._extractResponseMapping(checkMapping, rawJson);
          
          if (String(extractedCheck.errorCheck) === String(step.systemErrorIndicator.failureValue)) {
            throw new Error(`Vendor payload indicated system failure: ${step.systemErrorIndicator.failureValue}`);
          }
        }

        currentResponse = this._extractResponseMapping(step.responseMapping, rawJson);
      }

      return {
        status: 'SUCCESS',
        vendorId: vendor._id,
        simulatedLatency: Date.now() - startTime,
        data: currentResponse
      };

    } catch (error) {
      // Throwing this bubbles it straight back to the RoutingEngine's catch block to trigger failover
      throw new Error(`Live execution failed for ${vendor.name}: ${error.message}`);
    }
  }

  _applyRequestTemplate(template, payload) {
    if (!template) return payload; // Fallback if no template provided

    let templateString = JSON.stringify(template);
    
    templateString = templateString.replace(/\{\{payload\.([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return payload[key] || match;
    });

    return JSON.parse(templateString);
  }

  _extractResponseMapping(mapping, rawResponse) {
    if (!mapping) return rawResponse;

    const formattedResponse = {};

    for (const [key, path] of Object.entries(mapping)) {
      const cleanPath = path.startsWith('$.') ? path.substring(2) : path;
      const parts = cleanPath.split('.');
      
      let currentVal = rawResponse;
      for (const part of parts) {
        if (currentVal === undefined || currentVal === null) break;
        currentVal = currentVal[part];
      }
      
      formattedResponse[key] = currentVal;
    }

    return formattedResponse;
  }

  async _simulateCall(vendor, payload) {
    return new Promise((resolve, reject) => {
      const simulatedLatency = Math.floor(Math.random() * 850) + 50;
      
      setTimeout(() => {
        const isFailure = Math.random() < 0.05; 
        
        if (isFailure || simulatedLatency > vendor.maxLatencyMs) {
          return reject(new Error(`Vendor ${vendor.name} timed out or failed.`));
        }

        let responseData = { message: `Successfully processed by ${vendor.name}` };
        
        if (vendor.integration && vendor.integration.steps && vendor.integration.steps.length > 0) {
          const lastStep = vendor.integration.steps[vendor.integration.steps.length - 1];
          
          if (lastStep.responseMapping) {
            responseData = {}; 
            for (const key of Object.keys(lastStep.responseMapping)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('match') || lowerKey.includes('is') || lowerKey.includes('valid')) {
                responseData[key] = true;
              } else if (lowerKey.includes('status') || lowerKey.includes('state')) {
                responseData[key] = "VALID";
              } else if (lowerKey.includes('score') || lowerKey.includes('confidence')) {
                responseData[key] = Math.floor(Math.random() * 20) + 80;
              } else {
                responseData[key] = `Mocked ${key} from ${vendor.name}`;
              }
            }
          }
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