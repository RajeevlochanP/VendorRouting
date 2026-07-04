import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';

export class VendorRouter {
  constructor() {
    this.router = Router();
    this.controller = new VendorController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Registers a new vendor capability
    this.router.post('/', this.controller.registerVendor.bind(this.controller));
    
    // Fetches all registered vendors
    this.router.get('/', this.controller.getVendors.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}