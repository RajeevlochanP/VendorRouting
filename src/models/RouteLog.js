import mongoose from 'mongoose';

const RouteLogSchema = new mongoose.Schema({
  capability: { type: String, required: true },
  vendorUsed: { type: String, required: true },
  routingStrategy: { type: String, required: true },
  routingReason: { type: String },
  latencyMs: { type: Number, required: true },
  isSuccess: { type: Boolean, required: true },
  cost: { type: Number, required: true },
  requestPayload: { type: mongoose.Schema.Types.Mixed },
  responsePayload: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const RouteLog = mongoose.model('RouteLog', RouteLogSchema);