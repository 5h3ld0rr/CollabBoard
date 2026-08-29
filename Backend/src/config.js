import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'fullstack-development-secret',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};
