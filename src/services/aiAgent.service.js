import { GoogleGenerativeAI } from '@google/generative-ai';
import { Vendor } from '../models/Vendor.js';
import { RouteLog } from '../models/RouteLog.js';
import { metricsService } from './metrics.service.js';

export class AiAgentService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
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
Your task is to analyze the user's natural language request along with the current live system state, health metrics, and recent failures.

--- SYSTEM CONTEXT ---
1. CURRENT REGISTERED VENDORS:
${JSON.stringify(currentVendors, null, 2)}

2. LIVE PERFORMANCE METRICS (In-Memory O(1) tracking):
${JSON.stringify(liveMetrics, null, 2)}

3. RECENT FAILOVER/FAILURE LOGS:
${JSON.stringify(recentFailures, null, 2)}

--- TARGET DATA SCHEMA REQUIREMENTS ---
You must output a strict JSON object that fulfills all Agentic AI requirements. The JSON MUST match this exact schema:

{
  "recommendedStrategy": "string (e.g., 'Dynamic Scoring', 'Weighted', 'Cost')",
  "reasoning": "string (Explain EXACTLY why these vendors and strategies were selected based on the user prompt and live metrics)",
  "unhealthyVendorsDetected": ["string (List names of vendors failing in logs/metrics, or empty array)"],
  "suggestedFallbackRules": "string (Suggest rules like 'If Vendor A crosses 2000ms, failover to Vendor B')",
  "generatedConfiguration": [
    {
      "name": "string",
      "capability": "string",
      "priority": "number",
      "weight": "number",
      "costPerRequest": "number",
      "maxLatencyMs": "number",
      "rateLimitPerMinute": "number"
    }
  ]
}

--- RULES ---
- If live metrics or recent logs show high failures for a vendor, explicitly mention them in "unhealthyVendorsDetected" and lower their weight in the "generatedConfiguration".
- Return strictly ONLY the raw JSON object. Do not include markdown code block formatting like \`\`\`json. Just the raw JSON object starting with { and ending with }.

--- USER COMMAND ---
"${userInstructions}"`;

      const result = await this.model.generateContent(systemPrompt);
      const text = result.response.text().trim();
      
      let jsonStr = text;
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);

      const aiResponse = JSON.parse(jsonStr.trim());
      return aiResponse;

    } catch (error) {
      throw new Error(`AI Agent   Execution Failed: ${error.message}`);
    }
  }
}