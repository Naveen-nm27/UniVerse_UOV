import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";
import { Course } from "./entities/Course.js";


export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "universe_uov",
  synchronize: true,
  entities: [User,Course],
});