import "dotenv/config";

import {
  DataSource,
} from "typeorm";

import { User } from "./entities/User.js";

import {
  ManStaff,
} from "./entities/ManAssistence.js";

export const AppDataSource =
  new DataSource({
    type: "mysql",

    host:
      process.env.DB_HOST ||
      "localhost",

    port:
      Number(
        process.env.DB_PORT || 3306
      ),

    username:
      process.env.DB_USER ||
      "root",

    password:
      process.env.DB_PASSWORD ||
      "",

    database:
      process.env.DB_NAME ||
      "universe_uov",

    /*
     * IMPORTANT:
     * Do not allow TypeORM to modify
     * the existing V04 database.
     */
    synchronize: false,

    migrationsRun: false,

    entities: [
      User,
      ManStaff,
    ],

    migrations: [
      "src/migrations/*.js",
    ],
  });