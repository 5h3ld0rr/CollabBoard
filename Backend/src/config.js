import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
};
