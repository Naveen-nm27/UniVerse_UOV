import dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config({ path: new URL("../.env", import.meta.url) });

import { User } from "./entities/User.js";
import Role from "./entities/Role.js";
import Student from "./entities/Student.js";
import Batch from "./entities/Batch.js";
import Programme from "./entities/Programme.js";
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
import ResultStatusHistory from "./entities/ResultStatusHistory.js";
import GradeScale from "./entities/GradeScale.js";

export const AppDataSource = new DataSource({
  type: "mysql",

  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),

  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",

  database: process.env.DB_NAME || "universe_uov",

  synchronize: false,
  logging: false,

  entities: [
    User,
    Role,
    Student,
    Batch,
    Programme,
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
    ResultStatusHistory,
    GradeScale,
  ],
});
