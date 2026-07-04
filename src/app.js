import express from 'express';
import cors from 'cors';
import { VendorRouter } from './routes/vendor.router.js';
import { ApiRouter } from './routes/api.router.js';

export class App {
  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  configureMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  configureRoutes() {
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'UP', timestamp: new Date() });
    });

    const apiRouter = new ApiRouter();
    const vendorRouter = new VendorRouter();

    this.app.use('/', apiRouter.getRouter());
    this.app.use('/vendors', vendorRouter.getRouter());

    // 404 handler for API routes
    this.app.use((req, res, next) => {
      res.status(404).json({
        status: 'ERROR',
        message: `Route ${req.method} ${req.originalUrl} not found`
      });
    });
  }

  configureErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error('Unhandled Server Exception:', err.stack);
      const statusCode = err.status || 500;
      res.status(statusCode).json({
        status: 'ERROR',
        message: statusCode >= 500 ? 'An internal server error occurred.' : err.message
      });
    });
  }

  getExpressInstance() {
    return this.app;
  }
}