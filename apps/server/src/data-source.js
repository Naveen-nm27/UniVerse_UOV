import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";
import { ManStaff } from "./entities/ManAssistence.js";

import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "universe_uov",
  synchronize: true,
  entities: [User, ManStaff],
});


import User from "./entities/User.js";
import Role from "./entities/Role.js";
import Student from "./entities/Student.js";
import Programme from "./entities/Programme.js";
import Batch from "./entities/Batch.js";
import StudentProgramme from "./entities/StudentProgramme.js";
import Semester from "./entities/Semester.js";
import ProgrammeSemester from "./entities/ProgrammeSemester.js";
import Module from "./entities/Module.js";
import ModuleOffering from "./entities/ModuleOffering.js";
import Enrollment from "./entities/Enrollment.js";
import ModuleIca from "./entities/ModuleIca.js";
import IcaGrade from "./entities/IcaGrade.js";
import Exam from "./entities/Exam.js";
import FinalResult from "./entities/FinalResult.js";
import GradeScale from "./entities/GradeScale.js";

export const AppDataSource = new DataSource({
  type: "mysql",

  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),

  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",

  database: process.env.DB_NAME || "universe_uov",

  synchronize: false,
  logging: process.env.NODE_ENV === "development",

  entities: [
    User,
    Role,
    Student,
    Programme,
    Batch,
    StudentProgramme,
    Semester,
    ProgrammeSemester,
    Module,
    ModuleOffering,
    Enrollment,
    ModuleIca,
    IcaGrade,
    Exam,
    FinalResult,
    GradeScale,
  ],
});