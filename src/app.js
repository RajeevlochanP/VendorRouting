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


    this.app.use('/', new ApiRouter().getRouter());
    this.app.use('/vendors', new VendorRouter().getRouter());

  }

  configureErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error('Unhandled Server Exception:', err.stack);
      res.status(500).json({
        status: 'ERROR',
        message: 'An internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
      });
    });
  }

  getExpressInstance() {
    return this.app;
  }
}