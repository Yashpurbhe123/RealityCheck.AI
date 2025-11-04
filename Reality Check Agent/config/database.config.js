import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { Connector } from '@google-cloud/cloud-sql-connector';

dotenv.config();

async function getSequelizeClient() {
  const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME;
  const username = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  if (!instanceConnectionName || !username || !password || !database) {
    throw new Error('Missing database configuration in environment variables');
  }

  const connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType: 'PUBLIC'
  });

  const sequelizeClient = new Sequelize(database, username, password, {
    dialect: "postgres",
    dialectOptions: clientOpts,
    logging: false,
  });

  try {
    await sequelizeClient.authenticate();
    console.log("✅ Connected to Cloud SQL via connector!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }

  return sequelizeClient;
}

const sequelizeClient = await getSequelizeClient();
export default sequelizeClient;
