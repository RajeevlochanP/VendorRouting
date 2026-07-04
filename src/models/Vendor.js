import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  // --- 1. ROUTING METADATA (Used by Strategies) ---
  name: { type: String, required: true, unique: true },
  capability: { type: String, required: true, index: true }, // e.g., 'PAN_VERIFICATION'
  priority: { type: Number, required: true },
  weight: { type: Number, default: 0 },
  costPerRequest: { type: Number, required: true },
  maxLatencyMs: { type: Number, required: true },
  rateLimitPerMinute: { type: Number, required: true },

  // --- 2. INTEGRATION CONFIGURATION (The "No Code" Magic) ---
  integration: {
    // Allows handling single-step or multi-step requests (like fetching a token first)
    steps: [{
      stepOrder: { type: Number, required: true },
      method: { type: String, enum: ['GET', 'POST', 'PUT'], required: true },
      endpoint: { type: String, required: true },
      
      // Dynamic Authentication
      auth: {
        type: { type: String, enum: ['NONE', 'API_KEY', 'BEARER', 'BASIC'] },
        keyName: { type: String }, // e.g., 'x-api-key' or 'Authorization'
        location: { type: String, enum: ['HEADER', 'QUERY'] }
      },
      
      // Request Templating: Maps uniform payload to vendor's exact requirement
      requestTemplate: { type: mongoose.Schema.Types.Mixed },
      
      // Response Mapping: Maps vendor's weird response back to your standard
      responseMapping: { type: mongoose.Schema.Types.Mixed }
    }]
  }
}, { timestamps: true });

export const Vendor = mongoose.model('Vendor', VendorSchema);