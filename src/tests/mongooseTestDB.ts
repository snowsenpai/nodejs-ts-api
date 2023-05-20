import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// TODO use an test database, memory server fails to start
let mongoServer: MongoMemoryServer;

const id = new mongoose.Types.ObjectId().toString();

// for Db related tests...
// run beforeAll
const connectDB = async() => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
}

// run afterAll
const dropDB = async() => {
  if(mongoServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }
}

// run afterEach
const dropCollections = async() => {
  if(mongoServer) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
    }
  }
}

export { id, connectDB, dropDB, dropCollections };
