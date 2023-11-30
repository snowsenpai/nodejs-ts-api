import mongoose from 'mongoose';

// for Db related tests...
// run beforeAll
const connectDB = async () => {
  const { MONGO_PATH, MONGO_DATABASE } = process.env;
  mongoose.connect(`${MONGO_PATH}/${MONGO_DATABASE}`);
};

// run afterAll
const dropCollection = async (collectionName: string) => {
  await mongoose.connection.db.dropCollection(collectionName);
};

// run afterAll
const closeDB = async () => {
  await mongoose.connection.close();
};

export { connectDB, dropCollection, closeDB };
