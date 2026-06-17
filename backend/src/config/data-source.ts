import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const isTsNode = process.argv.some((arg) => arg.includes('ts-node'));

const dbUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = dbUrl
  ? {
      type: 'postgres',
      url: dbUrl,
      entities: isTsNode
        ? [join(__dirname, '/../**/*.entity{.ts,.js}')]
        : [join(__dirname, '/../**/*.entity{.js}')],
      migrations: isTsNode
        ? [join(__dirname, '/../migrations/*{.ts,.js}')]
        : [join(__dirname, '/../migrations/*{.js}')],
      migrationsTableName: 'migrations',
      migrationsRun: false,
      synchronize: false,
      ssl: { rejectUnauthorized: false },
      logging: process.env.NODE_ENV === 'development',
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'pos_db',
      entities: isTsNode
        ? [join(__dirname, '/../**/*.entity{.ts,.js}')]
        : [join(__dirname, '/../**/*.entity{.js}')],
      migrations: isTsNode
        ? [join(__dirname, '/../migrations/*{.ts,.js}')]
        : [join(__dirname, '/../migrations/*{.js}')],
      migrationsTableName: 'migrations',
      migrationsRun: false,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    };

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
