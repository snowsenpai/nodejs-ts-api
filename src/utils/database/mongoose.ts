import mongoose from 'mongoose';
import logger from '../logger.util';

/**
 * Connects to a mongodb database.
 *
 * Utilizes mongoose.
 */
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
  const reconnectionInterval = 10000; //10 seconds

  setTimeout(() => {
    logger.info('Attempting to reconnect to MongoDb...');
    mongooseConnect();
  }, reconnectionInterval);
};

export default mongooseConnect;
