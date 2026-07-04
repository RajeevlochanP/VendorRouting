import { GoogleGenerativeAI } from '@google/generative-ai';
import { Vendor } from '../models/Vendor.js';
import { RouteLog } from '../models/RouteLog.js';
import { metricsService } from './metrics.service.js';

export class AiAgentService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateVendorConfig(userInstructions) {
    try {
      const currentVendorsRaw = await Vendor.find({}, 'name capability priority weight costPerRequest maxLatencyMs rateLimitPerMinute');

      const vendorMap = {};
      const currentVendors = currentVendorsRaw.map(v => {
        vendorMap[v._id.toString()] = v.name;
        const obj = v.toObject();
        delete obj._id;
        return obj;
      });

      const rawMetrics = metricsService.getAllMetrics();

      const liveMetrics = {};
      for (const [vendorId, data] of Object.entries(rawMetrics)) {
        const vendorName = vendorMap[vendorId] || vendorId;
        liveMetrics[vendorName] = data;
      }

      const recentFailures = await RouteLog.find({ isSuccess: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-_id vendorUsed routingReason latencyMs capability')
        .lean();

      const systemPrompt = `You are a Principal Infrastructure AI Agent managing an Intelligent Vendor Routing Platform.
Your task is to analyze the user's natural language request along with the current live system state, health metrics, and recent failures to generate an optimized array of Vendor configuration objects.

--- SYSTEM CONTEXT ---
1. CURRENT REGISTERED VENDORS:
${JSON.stringify(currentVendors, null, 2)}

2. LIVE PERFORMANCE METRICS (In-Memory):
${JSON.stringify(liveMetrics, null, 2)}

3. RECENT FAILOVER/FAILURE LOGS:
${JSON.stringify(recentFailures, null, 2)}

--- TARGET DATA SCHEMA REQUIREMENTS ---
You must output a strict JSON array matching our VendorSchema parameters:
- name: string (Must match an existing vendor if updating, or unique string if new)
- capability: string (e.g., 'PAN_VERIFICATION')
- priority: number (1 = Highest priority)
- weight: number (Traffic split percentage, total across a capability should equal 100)
- costPerRequest: number (Cost optimization parameter)
- maxLatencyMs: number (SLA timeout threshold)
- rateLimitPerMinute: number

--- RULES ---
- If live metrics or recent logs show high failures for a vendor, lower their weight or deprioritize them in the generated configuration.
- Return strictly ONLY the raw JSON array. Do not include markdown code block formatting like \`\`\`json. Just the raw JSON array.

--- USER COMMAND ---
"${userInstructions}"`;

      const result = await this.model.generateContent(systemPrompt);
      const text = result.response.text().trim();

      let jsonStr = text;
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.substring(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }

      const optimizedConfig = JSON.parse(jsonStr.trim());
      return optimizedConfig;

    } catch (error) {
      throw new Error(`AI Agent Context-Aware Optimization Failed: ${error.message}`);
    }
  }
}