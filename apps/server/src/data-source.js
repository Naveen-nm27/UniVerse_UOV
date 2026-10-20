import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";
import Role from "./entities/Role.js";
import Department from "./entities/Department.js";
import Student from "./entities/Student.js";
import Batch from "./entities/Batch.js";
import Programme from "./entities/Programme.js";
import StudentProgramme from "./entities/StudentProgramme.js";
import Semester from "./entities/Semester.js";
import Module from "./entities/Module.js";
import ModuleOffering from "./entities/ModuleOffering.js";
import Enrollment from "./entities/Enrollment.js";
import ModuleIca from "./entities/ModuleIca.js";
import IcaGrade from "./entities/IcaGrade.js";
import Exam from "./entities/Exam.js";
import FinalResult from "./entities/FinalResult.js";
import ResultStatusHistory from "./entities/ResultStatusHistory.js";
import GradeScale from "./entities/GradeScale.js";
import ProgrammeSemester from "./entities/ProgrammeSemester.js";
import MaStaff from "./entities/MaStaff.js";
import Dean from "./entities/Dean.js";
import Administrator from "./entities/Administrator.js";
import Lecturer from "./entities/Lecturer.js";
import Hall from "./entities/Hall.js";
import Device from "./entities/Device.js";
import TimetableSlot from "./entities/TimetableSlot.js";
import LectureSession from "./entities/LectureSession.js";
import Attendance from "./entities/Attendance.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });
export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "universe_uov_v04",
  synchronize: false,
  migrationsRun: false,
  logging: false,
  timezone: "+05:30",
  supportBigNumbers: true,
  bigNumberStrings: true,
  extra: { dateStrings: true, connectTimeout: 5000 },
  entities: [
    User,
    Role,
    Department,
    Student,
    Batch,
    Programme,
    StudentProgramme,
    Semester,
    Module,
    ModuleOffering,
    Enrollment,
    ModuleIca,
    IcaGrade,
    Exam,
    FinalResult,
    ResultStatusHistory,
    GradeScale,
    ProgrammeSemester,
    MaStaff,
    Dean,
    Administrator,
    Lecturer,
    Hall,
    Device,
    TimetableSlot,
    LectureSession,
    Attendance,
  ],
  migrations: ["src/migrations/*.js"],
});
export async function initializeDatabase() {
  await AppDataSource.initialize();
  AppDataSource.driver.pool.on("connection", (connection) => {
    connection.query("SET SESSION time_zone = '+05:30'");
  });
  await AppDataSource.query("SET SESSION time_zone = '+05:30'");
  return AppDataSource;
}
