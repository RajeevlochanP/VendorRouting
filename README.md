# Intelligent Vendor Routing Platform

This platform is a highly scalable, configuration-driven routing engine built in Node.js. It evaluates multiple vendors capable of fulfilling a given request (e.g., PAN verification, payment processing) and dynamically routes traffic to the best vendor based on real-time metrics, cost constraints, and latency limits.

## Core Architecture

### Strategy Pattern (Dynamic Decision Making)
The application dynamically selects the best routing strategy based on the client's payload `requirements`. Strategies evaluate live metrics and vendor configuration:
- **WEIGHTED**: Splits traffic by statically assigned weights.
- **COST**: Always picks the cheapest vendor that is currently healthy.
- **LATENCY**: Routes to the vendor with the lowest moving average response time.
- **SCORING**: Calculates a composite score taking both latency and cost into account.

### Circuit Breaker & Failover Loop
The `RoutingEngine` features an enterprise-grade failover mechanism:
- If a vendor fails (e.g., throws an error, or timeout), the engine records the failure.
- If the error rate crosses the acceptable threshold, the circuit breaker opens for that vendor (making it ineligible for future routing until health restores).
- On failure, the loop automatically falls back and routes the same payload to the *next* best vendor (up to 2 retries).

### Dynamic Request / Response Templating
This is the "No-Code" magic of the platform. Vendors require different payload structures, authentication headers, and multi-step interactions. Instead of writing custom code per vendor:
- Each `Vendor` document in MongoDB defines an `integration.steps` array.
- This includes HTTP method, endpoints, auth type, and powerful `requestTemplate` and `responseMapping` json configurations to dynamically map our uniform API payloads to the vendor's specific schema before making the HTTP call.

### Agentic AI Configuration
The platform integrates with Google Generative AI (Gemini SDK) via `POST /ai/generate-config`. It translates plain natural language requests like *"Switch 70% traffic to Vendor A, but use Vendor B if latency spikes above 2000ms"* into valid JSON routing metadata that can be instantly saved into MongoDB.

---

## API Endpoints

### 1. Vendor Management

**`POST /vendors`** - Register a New Vendor
```bash
curl -X POST http://localhost:3000/vendors \
-H "Content-Type: application/json" \
-d '{
  "name": "Vendor A",
  "capability": "PAN_VERIFICATION",
  "priority": 1,
  "weight": 70,
  "costPerRequest": 0.05,
  "maxLatencyMs": 2000,
  "rateLimitPerMinute": 1000,
  "integration": {
    "steps": [{
      "stepOrder": 1,
      "method": "POST",
      "endpoint": "https://api.vendora.com/verify",
      "auth": { "type": "API_KEY", "keyName": "x-api-key", "location": "HEADER" }
    }]
  }
}'
```

**`GET /vendors`** - Get all Vendors
```bash
curl http://localhost:3000/vendors
```

### 2. Routing Engine

**`POST /route`** - Execute a Request (Dynamically Routed)
```bash
curl -X POST http://localhost:3000/route \
-H "Content-Type: application/json" \
-d '{
  "capability": "PAN_VERIFICATION",
  "payload": {
    "panNumber": "ABCDE1234F"
  },
  "requirements": {
    "preferFastest": true,
    "preferLowCost": false,
    "maxLatencyMs": 1500
  }
}'
```

### 3. Monitoring

**`GET /vendor-metrics`** - View Live Vendor Health (In-Memory)
```bash
curl http://localhost:3000/vendor-metrics
```

**`GET /routing-logs`** - View the 50 Most Recent Request Logs
```bash
curl http://localhost:3000/routing-logs
```

### 4. AI Agentic Integration

**`POST /ai/generate-config`** - Generate Vendor JSON from Natural Language
```bash
curl -X POST http://localhost:3000/ai/generate-config \
-H "Content-Type: application/json" \
-d '{
  "prompt": "Use Vendor A for 70% traffic, Vendor B for 30%, but switch to Vendor C if latency crosses 2 seconds or error rate is above 5%."
}'
```

---

## Setup & Running

1. **Install Dependencies:** `npm install`
2. **Environment Variables (`.env`):**
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/vendor-routing
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Start Server:** `npm start`
