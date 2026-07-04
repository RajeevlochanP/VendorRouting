import { RoutingEngine } from '../services/routingEngine.js';
import { metricsService } from '../services/metrics.service.js';
import { RouteLog } from '../models/RouteLog.js';

export class RouteController {
  constructor() {
    this.engine = new RoutingEngine();
    this.metrics = new MetricsService();
    this.aiAgent = new AiAgentService();
  }

  async processRoute(req, res, next) {
    try {
      // Extract requirements as per the sample input
      const { capability, payload, requirements } = req.body;
      
      if (!capability) {
        return res.status(400).json({ status: 'ERROR', message: 'Capability is required.' });
      }

      // Pass requirements directly to the engine
      const result = await this.engine.executeRoute(capability, payload, requirements);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }

  async getMetrics(req, res, next) {
    try {
      const metrics = metricsService.getAllMetrics();
      res.status(200).json({ status: 'SUCCESS', data: metrics });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }

  async getLogs(req, res, next) {
    try {
      const logs = await RouteLog.find({}).sort({ createdAt: -1 }).limit(50);
      res.status(200).json({ status: 'SUCCESS', data: logs });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }
}