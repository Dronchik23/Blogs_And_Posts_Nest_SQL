export const settings = {
  MONGO_URI:
    process.env.MongoURI ||
    'mongodb+srv://solikamsk:solikamsk@cluster0.uu9g6jj.mongodb.net/?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || '123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '567',
};
