import mongoose from 'mongoose';

// TODO use a try-catch block, a logger helper and process.exit(1) | retry db connection
const mongooseConnect = (): void => {
  const { MONGO_DATABASE, MONGO_PATH } = process.env;

  mongoose.connect(`${MONGO_PATH}/${MONGO_DATABASE}`);
}

export default mongooseConnect;