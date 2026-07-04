import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capability: { type: String, required: true, index: true },
  priority: { type: Number, required: true },
  weight: { type: Number, default: 0 },
  costPerRequest: { type: Number, required: true },
  maxLatencyMs: { type: Number, required: true },
  rateLimitPerMinute: { type: Number, required: true },

  integration: {
    steps: [{
      stepOrder: { type: Number, required: true },
      method: { type: String, enum: ['GET', 'POST', 'PUT'], required: true },
      endpoint: { type: String, required: true },
      
      auth: {
        type: { type: String, enum: ['NONE', 'API_KEY', 'BEARER', 'BASIC'] },
        keyName: { type: String },
        location: { type: String, enum: ['HEADER', 'QUERY'] }
      },
      
      requestTemplate: { type: mongoose.Schema.Types.Mixed },
      
      responseMapping: { type: mongoose.Schema.Types.Mixed },
      systemErrorIndicator: {
        keyPath: { type: String },
        failureValue: { type: String }
      }
    }]
  }
}, { timestamps: true });

export const Vendor = mongoose.model('Vendor', VendorSchema);