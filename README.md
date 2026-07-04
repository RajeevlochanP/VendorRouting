# Intelligent Vendor Routing Platform

Node.js + Express API for a configuration-driven API gateway that routes verification requests across vendors using a Dynamic Strategy Pattern and implicit failover. The platform supports Gemini AI integration for context-aware vendor configuration generation backed by live metrics and routing logs.

## Architecture Highlights

- **Strategy Pattern routing**
  - `Weighted`
  - `Cost`
  - `Latency`
  - `DynamicScoring`
- **Implicit failover**
  - Vendor execution is wrapped in a `while` loop that retries alternative eligible vendors.
  - Failed vendors are skipped through Circuit Breaker state.
  - Routing continues until a successful vendor response or the candidate pool is exhausted.
- **VendorExecutionClient**
  - Performs dynamic JSON request mapping.
  - Performs dynamic JSON response mapping.
  - Detects vendor-defined system errors via `systemErrorIndicator`.
  - Supports dual-mode execution:
    - `Simulated`: deterministic local execution for development and tests.
    - `Live`: outbound HTTP execution against configured vendor endpoints.
- **MetricsService**
  - In-memory O(1) metric lookup/update path.
  - Tracks success rate, latency, cost, failure counts, and circuit health.
  - Feeds routing strategies and AI config generation.

## Prerequisites

- Node.js `>= 20.x`
- npm `>= 10.x`
- MongoDB connection string
- Gemini API key

## Environment Setup

Create `.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/vendor-routing
GEMINI_API_KEY=your_gemini_api_key_here
VENDORA_API_KEY=your_vendora_api_key_here
VENDORB_API_KEY=your_vendorb_api_key_here
```

## Installation & Running

```bash
npm install
```

Start production mode:

```bash
npm start
```

Start development mode:

```bash
npm run dev
```

Base URL:

```text
http://localhost:3000
```

## API Documentation

### Create Vendor Config

`POST /vendors`

```bash
curl -X POST http://localhost:3000/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VendorA",
    "capabilities": ["PAN_VERIFICATION"],
    "mode": "Simulated",
    "endpoint": "https://api.vendora.example.com/pan/verify",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer ${VENDORA_API_KEY}",
      "Content-Type": "application/json"
    },
    "requestMapping": {
      "pan": "$.pan",
      "name": "$.name",
      "dob": "$.dob"
    },
    "responseMapping": {
      "verified": "$.result.isValid",
      "status": "$.result.status",
      "referenceId": "$.meta.requestId"
    },
    "systemErrorIndicator": {
      "path": "$.error.code",
      "values": ["SYSTEM_ERROR", "TIMEOUT", "RATE_LIMITED"]
    },
    "routing": {
      "weight": 70,
      "cost": 1.25,
      "priority": 1
    }
  }'
```

Expected response:

```json
{
  "id": "64f8c1f2a9b7e2a4c9a90111",
  "name": "VendorA",
  "capabilities": ["PAN_VERIFICATION"],
  "mode": "Simulated",
  "enabled": true,
  "createdAt": "2026-07-05T10:00:00.000Z"
}
```

### Route Request

`POST /route`

```bash
curl -X POST http://localhost:3000/route \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "PAN_VERIFICATION",
    "requirements": {
      "preferLowCost": true
    },
    "payload": {
      "pan": "ABCDE1234F",
      "name": "Jane Doe",
      "dob": "1990-01-15"
    }
  }'
```

Expected response:

```json
{
  "capability": "PAN_VERIFICATION",
  "vendor": "VendorA",
  "strategy": "Cost",
  "status": "SUCCESS",
  "attempts": [
    {
      "vendor": "VendorA",
      "status": "SUCCESS",
      "latencyMs": 142
    }
  ],
  "data": {
    "verified": true,
    "status": "VALID",
    "referenceId": "req_9f31b7"
  }
}
```

### Read Vendor Metrics

`GET /vendor-metrics`

```bash
curl -X GET http://localhost:3000/vendor-metrics
```

Expected response:

```json
[
  {
    "vendor": "VendorA",
    "capability": "PAN_VERIFICATION",
    "status": "healthy",
    "successRate": "98.20%",
    "averageLatency": "142 ms",
    "costPerRequest": "1.25",
    "totalRequests": 5000,
    "failedRequests": 90,
    "circuitBreaker": "closed"
  },
  {
    "vendor": "VendorB",
    "capability": "PAN_VERIFICATION",
    "status": "degraded",
    "successRate": "86.10%",
    "averageLatency": "310 ms",
    "costPerRequest": "0.95",
    "totalRequests": 5000,
    "failedRequests": 695,
    "circuitBreaker": "half_open"
  }
]
```

## Agentic AI Bonus Feature

`POST /ai/generate-config` generates vendor routing configuration from a natural language prompt.

- Uses **Gemini 1.5 Flash**.
- Context-aware generation:
  - Ingests live MongoDB vendor metrics.
  - Ingests recent routing logs.
  - Penalizes failing, slow, or circuit-open vendors in generated JSON.
  - Emits configuration ready for `POST /vendors`.

```bash
curl -X POST http://localhost:3000/ai/generate-config \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create vendor configs for PAN verification. Prefer low cost vendors, but penalize vendors with recent system errors or open circuits."
  }'
```

Expected response:

```json
[
  {
    "name": "VendorA",
    "capabilities": ["PAN_VERIFICATION"],
    "mode": "Live",
    "endpoint": "https://api.vendora.example.com/pan/verify",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer ${VENDORA_API_KEY}",
      "Content-Type": "application/json"
    },
    "requestMapping": {
      "pan": "$.pan",
      "name": "$.name",
      "dob": "$.dob"
    },
    "responseMapping": {
      "verified": "$.result.isValid",
      "status": "$.result.status",
      "referenceId": "$.meta.requestId"
    },
    "systemErrorIndicator": {
      "path": "$.error.code",
      "values": ["SYSTEM_ERROR", "TIMEOUT", "RATE_LIMITED"]
    },
    "routing": {
      "strategy": "DynamicScoring",
      "weight": 80,
      "cost": 1.25,
      "penaltyScore": 0
    }
  },
  {
    "name": "VendorB",
    "capabilities": ["PAN_VERIFICATION"],
    "mode": "Live",
    "endpoint": "https://api.vendorb.example.com/identity/pan",
    "method": "POST",
    "headers": {
      "x-api-key": "${VENDORB_API_KEY}",
      "Content-Type": "application/json"
    },
    "requestMapping": {
      "panNumber": "$.pan",
      "fullName": "$.name",
      "dateOfBirth": "$.dob"
    },
    "responseMapping": {
      "verified": "$.verification.panVerified",
      "status": "$.verification.status",
      "referenceId": "$.request.reference"
    },
    "systemErrorIndicator": {
      "path": "$.statusCode",
      "values": ["E500", "E_TIMEOUT", "E_RATE_LIMIT"]
    },
    "routing": {
      "strategy": "DynamicScoring",
      "weight": 35,
      "cost": 0.95,
      "penaltyScore": 45,
      "penaltyReason": "Recent system errors and degraded circuit breaker state"
    }
  }
]
```
