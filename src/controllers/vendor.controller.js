import { Vendor } from '../models/Vendor.js';

export class VendorController {
  async registerVendor(req, res, next) {
    try {
      const vendor = new Vendor(req.body);
      const savedVendor = await vendor.save();
      res.status(201).json({ status: 'SUCCESS', data: savedVendor });
    } catch (error) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  }

  async getVendors(req, res, next) {
    try {
      const vendors = await Vendor.find({});
      res.status(200).json({ status: 'SUCCESS', count: vendors.length, data: vendors });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }
}