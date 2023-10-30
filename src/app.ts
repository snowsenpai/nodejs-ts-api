import express, { Application, Router } from 'express';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { handelInvalidRoutes } from './middlewares/invalid-routes.middleware';
import helmet from 'helmet';
import { logger } from '@/utils/logger.util';

class App {
  public express: Application;
  public port: number;

  /**
   * @param apiRoutes - App Routes.
   * @param port - Port number to listen for connections.
   */
  constructor(apiRoutes: Router[], port: number) {
    this.express = express();
    this.port = port;

    this.initializeMiddleware();
    this.initializeRoutes(apiRoutes);
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(compression());
  }

  private initializeRoutes(apiRoutes: Router[]): void {
    apiRoutes.forEach((apiRoute: Router) => {
      this.express.use('/api/v1', apiRoute);
    });
    this.express.use('*', handelInvalidRoutes);
  }

  private initializeErrorHandling(): void {
    this.express.use(errorMiddleware);
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      logger.info(`App listening on the port ${this.port}`);
    });
  }
}

export { App };
