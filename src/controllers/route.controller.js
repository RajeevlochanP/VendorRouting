import { RoutingEngine } from '../services/routingEngine.js';
import { metricsService } from '../services/metrics.service.js';
import { RouteLog } from '../models/RouteLog.js';
import { Vendor } from '../models/Vendor.js';
import { AiAgentService } from '../services/aiAgent.service.js';

export class RouteController {
  constructor() {
    this.routingEngine = new RoutingEngine();
    this.aiAgentService = new AiAgentService();
  }

  async executeRoute(req, res, next) {
    try {
      const body = req.body || {};
      const { capability, payload, requirements } = body;

      if (!capability || typeof capability !== 'string' || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Valid capability (string) and payload (object) are required.'
        });
      }

      const result = await this.routingEngine.executeRoute(capability, payload, requirements || {});
      return res.status(200).json(result);
    } catch (error) {
      if (error.message && error.message.includes('No vendors found for capability')) {
        return res.status(404).json({
          status: 'ERROR',
          message: error.message
        });
      }
      next(error);
    }
  }

  async getVendorMetrics(req, res, next) {
    try {
      const metrics = metricsService.getAllMetrics();
      const vendorIds = Object.keys(metrics);
      
      const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select('name');
      const vendorMap = {};
      vendors.forEach(v => {
        vendorMap[v._id.toString()] = v.name;
      });

      const formattedMetrics = {};
      for (const [vendorId, data] of Object.entries(metrics)) {
        const vendorName = vendorMap[vendorId] || vendorId;
        formattedMetrics[vendorName] = data;
      }

      return res.status(200).json({
        status: 'SUCCESS',
        data: formattedMetrics
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoutingLogs(req, res, next) {
    try {
      const logs = await RouteLog.find().select('-__v').sort({ createdAt: -1 }).limit(50);
      return res.status(200).json({
        status: 'SUCCESS',
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAiConfig(req, res, next) {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Prompt is required.'
        });
      }

      const config = await this.aiAgentService.generateVendorConfig(prompt);
      return res.status(200).json({
        status: 'SUCCESS',
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
}