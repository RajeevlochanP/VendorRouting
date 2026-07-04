import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';

export class VendorRouter {
  constructor() {
    this.router = Router();
    this.controller = new VendorController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/', this.controller.registerVendor.bind(this.controller));
    this.router.get('/', this.controller.getAllVendors.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}