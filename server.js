import { App } from './src/app.js';
import { Database } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

class Server {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.db = new Database();
    this.appInstance = new App();
  }

  async start() {
    await this.db.connect();

    const expressApp = this.appInstance.getExpressInstance();

    this.httpServer = expressApp.listen(this.port, () => {
      console.log(`Vendor Router running on port [${this.port}]`);
    });

    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const shutdownHandler = async (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown procedure...`);
      
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('HTTP server stopped accepting new connections.');
        });
      }

      await this.db.disconnect();
      console.log('Process gracefully closed.');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  }
}

const server = new Server();
server.start();