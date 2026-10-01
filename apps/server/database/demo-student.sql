-- LOCAL DEMO ONLY. Replaces rows in the reserved 9000-9999 fixture ID range.
-- Run from the repository root with:
--   Get-Content apps/server/database/demo-student.sql | docker compose exec -T mysql mysql -uroot -padmin universe_uov
-- Course names and credits: https://fas.vau.ac.lk/dps/it/ and https://fas.vau.ac.lk/dps/amc/
-- Environmental examples: docs/University_of_Vavuniya_Applied_Science_Guide.md
-- The names, grades, cohort dates and selections below are fictional examples.

CREATE TABLE IF NOT EXISTS USERS (user_id INT UNSIGNED PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role_code VARCHAR(20) NOT NULL, phone VARCHAR(30), is_active BOOLEAN NOT NULL DEFAULT TRUE, must_change_password BOOLEAN NOT NULL DEFAULT FALSE, created_by INT UNSIGNED NULL, last_login_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS BATCHES (batch_id INT UNSIGNED PRIMARY KEY, batch_name VARCHAR(100) NOT NULL, start_date DATE NOT NULL);
CREATE TABLE IF NOT EXISTS DEPARTMENTS (department_id INT UNSIGNED PRIMARY KEY, department_name VARCHAR(100) NOT NULL);
CREATE TABLE IF NOT EXISTS PROGRAMMES (programme_id INT UNSIGNED PRIMARY KEY, programme_code VARCHAR(20) NOT NULL UNIQUE, programme_name VARCHAR(255) NOT NULL, department_id INT UNSIGNED NOT NULL, duration_years TINYINT UNSIGNED NOT NULL);
CREATE TABLE IF NOT EXISTS STUDENTS (user_id INT UNSIGNED PRIMARY KEY, registration_number VARCHAR(50) NOT NULL UNIQUE, batch_id INT UNSIGNED NOT NULL, current_semester TINYINT UNSIGNED NULL);
CREATE TABLE IF NOT EXISTS STUDENT_PROGRAMMES (student_programme_id INT UNSIGNED PRIMARY KEY, student_id INT UNSIGNED NOT NULL, programme_id INT UNSIGNED NOT NULL, start_date DATE NOT NULL, expected_end_date DATE NULL, actual_end_date DATE NULL, status VARCHAR(20) NOT NULL);
CREATE TABLE IF NOT EXISTS SEMESTERS (semester_id INT UNSIGNED PRIMARY KEY, semester_name VARCHAR(50) NOT NULL, academic_year VARCHAR(20) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL);
CREATE TABLE IF NOT EXISTS MODULES (module_id INT UNSIGNED PRIMARY KEY, module_code VARCHAR(20) NOT NULL UNIQUE, module_name VARCHAR(255) NOT NULL, credits TINYINT UNSIGNED NOT NULL, programme_semester_id INT UNSIGNED NOT NULL);
CREATE TABLE IF NOT EXISTS MODULE_OFFERINGS (offering_id INT UNSIGNED PRIMARY KEY, module_id INT UNSIGNED NOT NULL, semester_id INT UNSIGNED NOT NULL, lecturer_id INT UNSIGNED NOT NULL, hall_id INT UNSIGNED NOT NULL);
CREATE TABLE IF NOT EXISTS ENROLLMENTS (enrollment_id INT UNSIGNED PRIMARY KEY, student_id INT UNSIGNED NOT NULL, offering_id INT UNSIGNED NOT NULL, attempt_number TINYINT UNSIGNED NOT NULL DEFAULT 1, is_current BOOLEAN NOT NULL DEFAULT TRUE, status VARCHAR(20) NOT NULL DEFAULT 'registered', enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS GRADE_SCALE (grade VARCHAR(2) PRIMARY KEY, grade_point DECIMAL(3,2) NOT NULL, description VARCHAR(100) NULL);
CREATE TABLE IF NOT EXISTS EXAMS (exam_id INT UNSIGNED PRIMARY KEY, offering_id INT UNSIGNED NOT NULL, exam_type VARCHAR(50) NOT NULL, is_resit BOOLEAN NOT NULL DEFAULT FALSE, exam_date DATE NULL);
CREATE TABLE IF NOT EXISTS FINAL_RESULTS (result_id INT UNSIGNED PRIMARY KEY, enrollment_id INT UNSIGNED NOT NULL, exam_id INT UNSIGNED NOT NULL, exam_grade VARCHAR(2) NOT NULL, final_grade VARCHAR(2) NOT NULL, status VARCHAR(30) NOT NULL, entered_by INT UNSIGNED NOT NULL, entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by INT UNSIGNED NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, published_at DATETIME NULL);
CREATE TABLE IF NOT EXISTS MODULE_ICAS (ica_id INT UNSIGNED PRIMARY KEY, offering_id INT UNSIGNED NOT NULL, ica_number TINYINT UNSIGNED NOT NULL, title VARCHAR(150) NULL);
CREATE TABLE IF NOT EXISTS ICA_GRADES (ica_grade_id INT UNSIGNED PRIMARY KEY, ica_id INT UNSIGNED NOT NULL, enrollment_id INT UNSIGNED NOT NULL, grade VARCHAR(2) NOT NULL, entered_by INT UNSIGNED NOT NULL, entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);

-- All records in this range belong to this fixture. Clear child rows first so reruns
-- replace the old mixed CS/IT example without touching unrelated application data.
START TRANSACTION;
DELETE FROM ICA_GRADES WHERE ica_grade_id BETWEEN 9000 AND 9999;
DELETE FROM MODULE_ICAS WHERE ica_id BETWEEN 9000 AND 9999;
DELETE FROM FINAL_RESULTS WHERE result_id BETWEEN 9000 AND 9999;
DELETE FROM ENROLLMENTS WHERE enrollment_id BETWEEN 9000 AND 9999;
DELETE FROM EXAMS WHERE exam_id BETWEEN 9000 AND 9999;
DELETE FROM MODULE_OFFERINGS WHERE offering_id BETWEEN 9000 AND 9999;
DELETE FROM MODULES WHERE module_id BETWEEN 9000 AND 9999;
DELETE FROM STUDENT_PROGRAMMES WHERE student_programme_id BETWEEN 9000 AND 9999;
DELETE FROM STUDENTS WHERE user_id BETWEEN 9000 AND 9999;
DELETE FROM PROGRAMMES WHERE programme_id BETWEEN 9000 AND 9999;
DELETE FROM BATCHES WHERE batch_id BETWEEN 9000 AND 9999;
DELETE FROM SEMESTERS WHERE semester_id BETWEEN 9000 AND 9999;

-- The five paths in the faculty guide. Honours enrolment here illustrates a
-- fictional selection; these rows do not implement admission eligibility.
INSERT INTO DEPARTMENTS (department_id,department_name) VALUES
 (9001,'Physical Science'),(9002,'Bio-Science')
ON DUPLICATE KEY UPDATE department_name=VALUES(department_name);
INSERT INTO PROGRAMMES VALUES
 (9001,'BSC-IT','BSc in Information Technology',9001,3),
 (9002,'BSC-IT-H','BSc Honours in Information Technology',9001,4),
 (9003,'BSC-AMC','BSc in Applied Mathematics and Computing',9001,3),
 (9004,'BSC-CS-H','BSc Honours in Computer Science',9001,4),
 (9005,'BSC-ENS-H','BSc Honours in Environmental Science',9002,4);
INSERT INTO BATCHES VALUES
 (9001,'2024 Information Technology','2024-09-01'),
 (9002,'2022 Information Technology','2022-09-01'),
 (9003,'2023 Applied Mathematics and Computing','2023-09-01'),
 (9004,'2024 Environmental Science','2024-09-01');

-- Existing demo credentials remain valid. The same demo password is used for
-- the four additional fictional accounts; never use these accounts in production.
-- Demo password for all six fresh accounts: Student@123.
INSERT INTO USERS (user_id,name,email,password_hash,role_code,is_active,must_change_password) VALUES
 (9001,'Sandeep Mendis','sandeep.mendis@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0),
 (9002,'Nethmi Perera','nethmi.perera@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0),
 (9003,'Kavindu Fernando','kavindu.fernando@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0),
 (9004,'Asha Raman','asha.raman@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0),
 (9005,'Tharindu Silva','tharindu.silva@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0),
 (9006,'Dinithi Jayasekara','dinithi.jayasekara@student.universe.test','$2b$12$65gRKMe8bYeKFhfM9Pc.nO3unl80pw5r138/RNRUz5j3Qr0Z1jKlG','STUDENT',1,0)
ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),role_code='STUDENT',is_active=1;
INSERT INTO STUDENTS VALUES
 (9001,'2024/IT/221',9001,4),(9002,'2024/IT/222',9001,4),
 (9003,'2022/IT/041',9002,8),(9004,'2023/AMC/081',9003,6),
 (9005,'2023/CS/082',9003,6),(9006,'2024/ENS/031',9004,4);
INSERT INTO STUDENT_PROGRAMMES VALUES
 (9001,9001,9001,'2024-09-01','2027-08-31',NULL,'active'),
 (9002,9002,9001,'2024-09-01','2027-08-31',NULL,'active'),
 (9003,9003,9002,'2022-09-01','2026-08-31',NULL,'active'),
 (9004,9004,9003,'2023-09-01','2026-08-31',NULL,'active'),
 (9005,9005,9004,'2023-09-01','2027-08-31',NULL,'active'),
 (9006,9006,9005,'2024-09-01','2028-08-31',NULL,'active');

INSERT INTO SEMESTERS VALUES
 (9001,'Semester 1','2024/2025','2024-09-01','2025-01-31'),
 (9002,'Semester 2','2024/2025','2025-02-01','2025-07-31'),
 (9003,'Semester 1','2025/2026','2025-09-01','2026-01-31'),
 (9004,'Semester 2','2025/2026','2026-02-01','2026-07-31'),
 (9005,'Semester 1','2023/2024','2023-09-01','2024-01-31');
INSERT INTO GRADE_SCALE (grade,grade_point,description) VALUES
 ('A',4.00,'Excellent'),('A-',3.70,'Very good'),('B+',3.30,'Good'),
 ('B',3.00,'Satisfactory'),('C',2.00,'Pass'),('C-',1.70,'Pass'),('D+',1.30,'Pass')
ON DUPLICATE KEY UPDATE grade_point=VALUES(grade_point),description=VALUES(description);
-- A first-attempt F remains visible in results; it has no GPA point mapping
-- in this illustrative fixture. The university's resit GPA rule is not encoded.

-- IT2114 is 2 credits on the official curriculum page despite its suffix.
INSERT INTO MODULES VALUES
 (9001,'IT1113','Fundamentals of Information Technology',3,1),
 (9002,'IT1134','Fundamentals of Programming',4,1),
 (9003,'ACU1113','English Language I',3,1),
 (9004,'IT1223','Database Management Systems',3,2),
 (9005,'IT1242','Principles of Computer Networks',2,2),
 (9006,'IT2114','Data Structures',2,3),
 (9007,'IT2122','Software Engineering',2,3),
 (9008,'ACU2113','English Language II',3,3),
 (9009,'IT2234','Web Services and Server Technologies',4,4),
 (9010,'IT2244','Operating Systems',4,4),
 (9011,'IT4113','Computer Organisation and Architecture',3,7),
 (9012,'IT4216','Research Project',6,8),
 (9013,'IT4226','Industrial Training',6,8),
 (9014,'AMA1113','Differential Equations',3,1),
 (9015,'CSC1123','Introduction to Programming',3,1),
 (9016,'CSC2113','Data Structures and Algorithms',3,3),
 (9017,'AMA3113','Mathematical Modelling',3,5),
 (9018,'CSH3143','Knowledge Representation and Programming in Logic',3,5),
 (9019,'ENS1142','Plant Biology',2,1),
 (9020,'ENS1232','Environmental Sanitation',2,2);
-- ENS1142: Faculty Handbook 2021/22; ENS1232: Faculty Handbook 2023/24.
-- Their example credits were checked in those official handbooks, not inferred from codes.
INSERT INTO MODULE_OFFERINGS (offering_id,module_id,semester_id,lecturer_id,hall_id) VALUES
 (9001,9001,9001,1,1),(9002,9002,9001,1,1),(9003,9003,9001,1,1),
 (9004,9004,9002,1,1),(9005,9005,9002,1,1),
 (9006,9006,9003,1,1),(9007,9007,9003,1,1),(9008,9008,9003,1,1),
 (9009,9009,9004,1,1),(9010,9010,9004,1,1),
 (9011,9011,9003,1,1),(9012,9012,9004,1,1),(9013,9013,9004,1,1),
 (9014,9014,9005,1,1),(9015,9015,9005,1,1),(9016,9016,9001,1,1),
 (9017,9017,9003,1,1),(9018,9018,9003,1,1),
 (9019,9019,9001,1,1),(9020,9020,9002,1,1);

-- Two IT classmates take the same ten modules; the dashboard batch chart
-- therefore has a real two-student comparison. The resit shares its module's
-- original offering and academic semester, with a distinct exam and attempt.
INSERT INTO ENROLLMENTS (enrollment_id,student_id,offering_id,attempt_number,is_current,status) 
SELECT 9000 + (u.user_id - 9001) * 100 + (mo.offering_id - 9000),
       u.user_id,mo.offering_id,1,NOT (u.user_id=9001 AND mo.offering_id=9004),'completed'
FROM USERS u CROSS JOIN MODULE_OFFERINGS mo
WHERE u.user_id IN (9001,9002) AND mo.offering_id BETWEEN 9001 AND 9010;
INSERT INTO ENROLLMENTS (enrollment_id,student_id,offering_id,attempt_number,is_current,status) VALUES
 (9020,9001,9004,2,1,'completed'),
 (9201,9003,9011,1,1,'completed'),(9202,9003,9012,1,1,'completed'),(9203,9003,9013,1,1,'completed'),
 (9301,9004,9014,1,1,'completed'),(9302,9004,9015,1,1,'completed'),(9303,9004,9016,1,1,'completed'),(9304,9004,9017,1,1,'completed'),
 (9401,9005,9014,1,1,'completed'),(9402,9005,9015,1,1,'completed'),(9403,9005,9016,1,1,'completed'),(9404,9005,9018,1,1,'completed'),
 (9501,9006,9019,1,1,'completed'),(9502,9006,9020,1,1,'completed');
INSERT INTO EXAMS (exam_id,offering_id,exam_type,is_resit,exam_date)
SELECT mo.offering_id,mo.offering_id,'Final',0,DATE_SUB(sem.end_date,INTERVAL 14 DAY)
FROM MODULE_OFFERINGS mo INNER JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id
WHERE mo.offering_id BETWEEN 9001 AND 9020;
INSERT INTO EXAMS VALUES (9021,9004,'Resit',1,'2026-06-15');

INSERT INTO FINAL_RESULTS (result_id,enrollment_id,exam_id,exam_grade,final_grade,status,entered_by,updated_by,published_at)
SELECT e.enrollment_id,e.enrollment_id,e.enrollment_id - (e.student_id - 9001)*100,
 CASE
  WHEN e.student_id=9001 AND e.offering_id=9004 THEN 'F'
  WHEN e.student_id=9001 AND e.offering_id IN (9001,9009) THEN 'A'
  WHEN e.student_id=9001 AND e.offering_id IN (9002,9006) THEN 'A-'
  WHEN e.student_id=9001 AND e.offering_id IN (9003,9007,9010) THEN 'B+'
  WHEN e.student_id=9001 THEN 'B'
  WHEN e.offering_id IN (9002,9007) THEN 'A'
  WHEN e.offering_id IN (9003,9005,9010) THEN 'A-'
  WHEN e.offering_id IN (9001,9004,9008) THEN 'B+'
  ELSE 'B' END,
 CASE
  WHEN e.student_id=9001 AND e.offering_id=9004 THEN 'F'
  WHEN e.student_id=9001 AND e.offering_id IN (9001,9009) THEN 'A'
  WHEN e.student_id=9001 AND e.offering_id IN (9002,9006) THEN 'A-'
  WHEN e.student_id=9001 AND e.offering_id IN (9003,9007,9010) THEN 'B+'
  WHEN e.student_id=9001 THEN 'B'
  WHEN e.offering_id IN (9002,9007) THEN 'A'
  WHEN e.offering_id IN (9003,9005,9010) THEN 'A-'
  WHEN e.offering_id IN (9001,9004,9008) THEN 'B+'
  ELSE 'B' END,
 'PUBLISHED',9001,9001,DATE_ADD(sem.end_date,INTERVAL 14 DAY)
FROM ENROLLMENTS e
INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
INNER JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id
WHERE e.student_id IN (9001,9002) AND e.attempt_number=1;
INSERT INTO FINAL_RESULTS (result_id,enrollment_id,exam_id,exam_grade,final_grade,status,entered_by,updated_by,published_at) VALUES
 (9020,9020,9021,'C','C','PUBLISHED',9001,9001,'2026-07-15'),
 (9201,9201,9011,'A','A','PUBLISHED',9003,9003,'2026-02-14'),
 (9202,9202,9012,'A-','A-','PUBLISHED',9003,9003,'2026-08-14'),
 (9203,9203,9013,'B+','B+','PUBLISHED',9003,9003,'2026-08-14'),
 (9301,9301,9014,'A-','A-','PUBLISHED',9004,9004,'2024-02-14'),
 (9302,9302,9015,'B+','B+','PUBLISHED',9004,9004,'2024-02-14'),
 (9303,9303,9016,'A','A','PUBLISHED',9004,9004,'2025-02-14'),
 (9304,9304,9017,'B+','B+','PUBLISHED',9004,9004,'2026-02-14'),
 (9401,9401,9014,'A','A','PUBLISHED',9005,9005,'2024-02-14'),
 (9402,9402,9015,'A-','A-','PUBLISHED',9005,9005,'2024-02-14'),
 (9403,9403,9016,'A','A','PUBLISHED',9005,9005,'2025-02-14'),
 (9404,9404,9018,'B+','B+','PUBLISHED',9005,9005,'2026-02-14'),
 (9501,9501,9019,'A-','A-','PUBLISHED',9006,9006,'2025-02-14'),
 (9502,9502,9020,'B','B','PUBLISHED',9006,9006,'2025-08-14');

INSERT INTO MODULE_ICAS VALUES
 (9001,9002,1,'Programming Lab'),
 (9002,9004,1,'Database Design Assignment'),
 (9003,9006,1,'Data Structures Quiz');
INSERT INTO ICA_GRADES (ica_grade_id,ica_id,enrollment_id,grade,entered_by) VALUES
 (9001,9001,9002,'A-',9001),
 (9002,9002,9004,'B',9001),
 (9003,9003,9006,'A-',9001),
 (9004,9001,9102,'A',9002),
 (9005,9002,9104,'B+',9002),
 (9006,9003,9106,'B',9002);
COMMIT;
