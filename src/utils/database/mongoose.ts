import mongoose from 'mongoose';

const mongooseConnect = (): void => {
  const { MONGO_DATABASE, MONGO_PATH } = process.env;

  console.log('Connecting to MongoDB...');
  mongoose.connect(`${MONGO_PATH}/${MONGO_DATABASE}`)
    .then(() => {
      console.log('connected to MongoDB');
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB: ', error);
      handleReconnection();
    });
}

const handleReconnection = (): void => {
  const reconectionInterval = 5000; //5 seconds

  setTimeout(() => {
    console.log('Attempting to reconnect to MongoDb...');
    mongooseConnect();
  }, reconectionInterval);
}

export default mongooseConnect;