const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.PORT = 0; // random port
process.env.JWT_SECRET = 'test_jwt_secret_for_auth';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/studymate_test_db';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
