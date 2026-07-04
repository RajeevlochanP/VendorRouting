// Import Vendor model if doing direct DB operations, or a VendorService if abstracted
import Vendor from '../models/Vendor.js'; 

export class VendorController {
  async registerVendor(req, res, next) {
    try {
      // TODO: Extract vendor details from req.body
      // TODO: Save to DB
      // TODO: Return 201 Created
    } catch (error) {
      next(error);
    }
  }

  async getVendors(req, res, next) {
    try {
      // TODO: Query all vendors from DB (optionally filter by req.query)
      // TODO: Return 200 OK
    } catch (error) {
      next(error);
    }
  }
}