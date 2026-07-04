import { Vendor } from '../models/Vendor.js';

export class VendorController {
  async registerVendor(req, res, next) {
    try {
      const vendorData = req.body;
      const vendor = new Vendor(vendorData);
      await vendor.save();
      
      const vendorObj = vendor.toObject();
      delete vendorObj.__v;

      return res.status(201).json({
        status: 'SUCCESS',
        message: 'Vendor registered successfully.',
        data: vendorObj
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          status: 'ERROR',
          message: 'Vendor with this name already exists.'
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Invalid vendor schema.',
          details: error.message
        });
      }
      next(error);
    }
  }

  async getAllVendors(req, res, next) {
    try {
      const vendors = await Vendor.find({}).select('-__v');
      return res.status(200).json({
        status: 'SUCCESS',
        data: vendors
      });
    } catch (error) {
      next(error);
    }
  }
}