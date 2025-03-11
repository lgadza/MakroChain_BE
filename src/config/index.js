import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const environment = process.env.NODE_ENV || 'development';

const config = {
  environment,
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: environment === 'production',
    url: process.env.DATABASE_URL,
  },
  // Add logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  blockchain: {
    key: process.env.BLOCKCHAIN_KEY,
    address: process.env.BLOCKCHAIN_ADDRESS,
    endpoint: process.env.BLOCKCHAIN_ENDPOINT,
    networkId: process.env.BLOCKCHAIN_NETWORK_ID,
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
  },
};

export default config;
