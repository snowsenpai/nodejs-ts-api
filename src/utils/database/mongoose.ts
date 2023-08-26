import mongoose from 'mongoose';
import logger from '../logger.util';

const mongooseConnect = (): void => {
  const { MONGO_DATABASE, MONGO_PATH } = process.env;

  logger.info('Connecting to MongoDB...');
  mongoose
    .connect(`${MONGO_PATH}/${MONGO_DATABASE}`)
    .then(() => {
      logger.info('connected to MongoDB');
    })
    .catch((error) => {
      logger.error(error, 'Failed to connect to MongoDB:');
      handleReconnection();
    });
};

const handleReconnection = (): void => {
  const reconectionInterval = 5000; //5 seconds

  setTimeout(() => {
    logger.info('Attempting to reconnect to MongoDb...');
    mongooseConnect();
  }, reconectionInterval);
};

export default mongooseConnect;
