import express from 'express';
import cors from 'cors';

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

    // TODO: Instantiated routers from src/routes will be mounted here
    // Example: this.app.use('/api/v1/vendors', new VendorRouter().getRouter());
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