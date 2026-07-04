import { Router } from 'express';
import { RouteController } from '../controllers/route.controller.js';

export class ApiRouter {
  constructor() {
    this.router = Router();
    this.controller = new RouteController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/route', this.controller.executeRoute.bind(this.controller));
    this.router.get('/vendor-metrics', this.controller.getVendorMetrics.bind(this.controller));
    this.router.get('/routing-logs', this.controller.getRoutingLogs.bind(this.controller));
    this.router.post('/ai/generate-config', this.controller.generateAiConfig.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}