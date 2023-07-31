import express, { Application, Router } from 'express';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import ErrorMiddleware from '@/middleware/error.middleware';
import helmet from 'helmet';
import logger from '@/utils/logger';

class App {
  public express: Application;
  public port: number;

  constructor(apiRoutes: Router[], port: number) {
    this.express = express();
    this.port = port;

    this.initialiseMiddleware();
    this.initialiseControllers(apiRoutes);
    this.initialiseErrorHandling();
  }

  private initialiseMiddleware(): void {
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(compression());
  }

  private initialiseControllers(apiRoutes: Router[]): void {
    apiRoutes.forEach((apiRoute: Router) => {
      this.express.use('/api', apiRoute);
    });
  }

  private initialiseErrorHandling(): void {
    this.express.use(ErrorMiddleware);
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      logger.info(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
