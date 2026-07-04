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