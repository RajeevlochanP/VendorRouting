import { Router } from 'express';
import { RouteController } from '../controllers/route.controller.js';

export class ApiRouter {
  constructor() {
    this.router = Router();
    this.controller = new RouteController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // The core routing endpoint
    this.router.post('/route', this.controller.processRoute.bind(this.controller));
    
    // Metrics and logging endpoints
    this.router.get('/vendor-metrics', this.controller.getMetrics.bind(this.controller));
    this.router.get('/routing-logs', this.controller.getLogs.bind(this.controller));
    
    // AI Bonus endpoint
    this.router.post('/ai/config', this.controller.generateAiConfig.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}