import mongoose from 'mongoose';

// for Db related tests...
// run beforeAll
const connectDB = async () => {
  const { MONGO_PATH, MONGO_DATABASE } = process.env;
  mongoose.connect(`${MONGO_PATH}/${MONGO_DATABASE}`);
};

// run afterAll
const dropDB = async () => {
  mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

// run afterEach
const dropCollections = async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.drop();
  }
};

// afterAll
const closeDB = async () => {
  await mongoose.connection.close();
};

export { connectDB, dropDB, dropCollections, closeDB };
