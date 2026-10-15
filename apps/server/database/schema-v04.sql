-- =====================================================================
-- UniVerse UOV — MA-managed, grade-only full schema
-- MySQL 8.x / InnoDB / utf8mb4
-- Fresh-install schema: the DROP TABLE statements below DELETE existing data.
-- Do not run against a populated database; migrate existing data separately.
-- Passwords must be stored as application-generated hashes (Argon2id/bcrypt).
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `AUDIT_LOG`;
DROP TABLE IF EXISTS `RESULT_STATUS_HISTORY`;
DROP TABLE IF EXISTS `FINAL_RESULTS`;
DROP TABLE IF EXISTS `EXAMS`;
DROP TABLE IF EXISTS `ICA_GRADES`;
DROP TABLE IF EXISTS `ICA_MARKS`;
DROP TABLE IF EXISTS `MODULE_ICAS`;
DROP TABLE IF EXISTS `GRADE_SCALE`;
DROP TABLE IF EXISTS `GRADE_BOUNDARIES`;
DROP TABLE IF EXISTS `RESULT_VERIFICATIONS`;
DROP TABLE IF EXISTS `VERIFICATION_STEPS`;
DROP TABLE IF EXISTS `ATTENDANCE`;
DROP TABLE IF EXISTS `LECTURE_SESSIONS`;
DROP TABLE IF EXISTS `TIMETABLE_SLOTS`;
DROP TABLE IF EXISTS `DEVICES`;
DROP TABLE IF EXISTS `HALLS`;
DROP TABLE IF EXISTS `MODULE_OFFERINGS`;
DROP TABLE IF EXISTS `ENROLLMENTS`;
DROP TABLE IF EXISTS `MODULES`;
DROP TABLE IF EXISTS `PROGRAMME_SEMESTERS`;
DROP TABLE IF EXISTS `SEMESTERS`;
DROP TABLE IF EXISTS `STUDENT_PROGRAMMES`;
DROP TABLE IF EXISTS `STUDENTS`;
DROP TABLE IF EXISTS `BATCHES`;
DROP TABLE IF EXISTS `LECTURERS`;
DROP TABLE IF EXISTS `DEANS`;
DROP TABLE IF EXISTS `MA_STAFF`;
DROP TABLE IF EXISTS `ADMINISTRATORS`;
DROP TABLE IF EXISTS `USER_PERMISSIONS`;
DROP TABLE IF EXISTS `ROLE_DEFAULT_PERMISSIONS`;
DROP TABLE IF EXISTS `PERMISSIONS`;
DROP TABLE IF EXISTS `DOCUMENTS`;
DROP TABLE IF EXISTS `USERS`;
DROP TABLE IF EXISTS `ROLES`;
DROP TABLE IF EXISTS `PROGRAMMES`;
DROP TABLE IF EXISTS `DEPARTMENTS`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. IDENTITY & ORGANISATION
-- =====================================================================

CREATE TABLE `DEPARTMENTS` (
  `department_id`     INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `department_name`   VARCHAR(255) NOT NULL,
  `department_code`   VARCHAR(20)  NOT NULL UNIQUE,
  `head_lecturer_id`  INTEGER UNSIGNED NULL,          -- FK added later (circular)
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `PROGRAMMES` (
  `programme_id`    INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `programme_code`  VARCHAR(20)  NOT NULL UNIQUE,
  `programme_name`  VARCHAR(255) NOT NULL,
  `department_id`   INTEGER UNSIGNED NOT NULL,
  `duration_years`  TINYINT UNSIGNED NOT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`programme_id`),
  KEY `idx_programme_department` (`department_id`),
  CONSTRAINT `fk_programme_department`
    FOREIGN KEY (`department_id`) REFERENCES `DEPARTMENTS`(`department_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One primary role determines the dashboard after login. Never trust a client-sent role.
CREATE TABLE `ROLES` (
  `role_code` VARCHAR(20) NOT NULL PRIMARY KEY,
  `dashboard_path` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `ROLES` (`role_code`, `dashboard_path`) VALUES
 ('STUDENT','/student'), ('LECTURER','/lecturer'), ('HOD','/hod'),
 ('DEAN','/dean'), ('MA','/ma'), ('ADMIN','/admin');

CREATE TABLE `USERS` (
  `user_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_code` VARCHAR(20) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `must_change_password` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_by` INTEGER UNSIGNED NULL, -- null only for initial bootstrap MA
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_role` (`role_code`),
  KEY `idx_user_created_by` (`created_by`),
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_code`) REFERENCES `ROLES`(`role_code`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `LECTURERS` (
  `user_id`        INTEGER UNSIGNED NOT NULL,
  `department_id`  INTEGER UNSIGNED NOT NULL,
  `is_hod`         BOOLEAN NOT NULL DEFAULT FALSE,
  `staff_number`   VARCHAR(50) NULL UNIQUE,
  `date_joined`    DATE NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_lecturer_department` (`department_id`),
  KEY `idx_lecturer_hod` (`department_id`, `is_hod`),
  CONSTRAINT `fk_lecturer_user`
    FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_lecturer_department`
    FOREIGN KEY (`department_id`) REFERENCES `DEPARTMENTS`(`department_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Now close the department-head circular FK
ALTER TABLE `DEPARTMENTS`
  ADD CONSTRAINT `fk_department_head`
  FOREIGN KEY (`head_lecturer_id`) REFERENCES `LECTURERS`(`user_id`)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Deans have their own role and profile.
CREATE TABLE `DEANS` (
  `user_id`        INTEGER UNSIGNED NOT NULL,
  `department_id`  INTEGER UNSIGNED NOT NULL,   -- Dean oversees a department/faculty
  `appointed_at`   DATE NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_dean_department` (`department_id`),
  CONSTRAINT `fk_dean_user`
    FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_dean_department`
    FOREIGN KEY (`department_id`) REFERENCES `DEPARTMENTS`(`department_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `MA_STAFF` (
  `user_id` INTEGER UNSIGNED NOT NULL,
  `staff_number` VARCHAR(50) NULL UNIQUE,
  `office_name` VARCHAR(100) NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_ma_user` FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create the first MA account with created_by=NULL, then use MA accounts.
ALTER TABLE `USERS` ADD CONSTRAINT `fk_user_creator_ma`
  FOREIGN KEY (`created_by`) REFERENCES `MA_STAFF`(`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE `ADMINISTRATORS` (
  `user_id`     INTEGER UNSIGNED NOT NULL,
  `admin_level` VARCHAR(50) NOT NULL,          -- e.g. 'clerk','master'
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_admin_user`
    FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 2. AUTHORISATION
-- =====================================================================

CREATE TABLE `PERMISSIONS` (
  `permission_id`   INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_name` VARCHAR(100) NOT NULL UNIQUE,
  `description`     VARCHAR(255) NULL,
  PRIMARY KEY (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ROLE_DEFAULT_PERMISSIONS` (
  `role`          VARCHAR(20) NOT NULL,        -- role from ROLES, including MA
  `permission_id` INTEGER UNSIGNED NOT NULL,
  PRIMARY KEY (`role`, `permission_id`),
  CONSTRAINT `fk_rdp_role`
    FOREIGN KEY (`role`) REFERENCES `ROLES`(`role_code`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_rdp_permission`
    FOREIGN KEY (`permission_id`) REFERENCES `PERMISSIONS`(`permission_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `USER_PERMISSIONS` (
  `user_id`       INTEGER UNSIGNED NOT NULL,
  `permission_id` INTEGER UNSIGNED NOT NULL,
  `granted_by`    INTEGER UNSIGNED NULL,
  `granted_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `permission_id`),
  CONSTRAINT `fk_up_user`
    FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_up_permission`
    FOREIGN KEY (`permission_id`) REFERENCES `PERMISSIONS`(`permission_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_up_granted_by`
    FOREIGN KEY (`granted_by`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 3. COHORTS & STUDENTS
-- =====================================================================

-- Batch = intake cohort. Start date only (Task 2, point 1).
CREATE TABLE `BATCHES` (
  `batch_id`    INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_name`  VARCHAR(100) NOT NULL,        -- e.g. "2024 Intake"
  `start_date`  DATE NOT NULL,
  PRIMARY KEY (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `STUDENTS` (
  `user_id`             INTEGER UNSIGNED NOT NULL,
  `registration_number` VARCHAR(50) NOT NULL UNIQUE,
  `batch_id`            INTEGER UNSIGNED NOT NULL,
  `current_semester`    TINYINT UNSIGNED NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_student_batch` (`batch_id`),
  CONSTRAINT `fk_student_user`
    FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_student_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `BATCHES`(`batch_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A student can pursue more than one programme (e.g. special degree),
-- each with its own expected/actual end date.
CREATE TABLE `STUDENT_PROGRAMMES` (
  `student_programme_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id`           INTEGER UNSIGNED NOT NULL,
  `programme_id`         INTEGER UNSIGNED NOT NULL,
  `start_date`           DATE NOT NULL,
  `expected_end_date`    DATE NULL,
  `actual_end_date`      DATE NULL,
  `status`               VARCHAR(20) NOT NULL DEFAULT 'active', -- active|completed|withdrawn
  PRIMARY KEY (`student_programme_id`),
  UNIQUE KEY `uq_student_programme` (`student_id`, `programme_id`),
  KEY `idx_sp_programme` (`programme_id`),
  CONSTRAINT `fk_sp_student`
    FOREIGN KEY (`student_id`) REFERENCES `STUDENTS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_sp_programme`
    FOREIGN KEY (`programme_id`) REFERENCES `PROGRAMMES`(`programme_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 4. CALENDAR & CURRICULUM
-- =====================================================================

-- Calendar semester (an actual teaching term).
CREATE TABLE `SEMESTERS` (
  `semester_id`   INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `semester_name` VARCHAR(50) NOT NULL,       -- "Semester 1"
  `academic_year` VARCHAR(20) NOT NULL,       -- "2025/2026"
  `start_date`    DATE NOT NULL,
  `end_date`      DATE NOT NULL,
  PRIMARY KEY (`semester_id`),
  UNIQUE KEY `uq_semester` (`academic_year`, `semester_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Curriculum slot: programme's Nth semester.
CREATE TABLE `PROGRAMME_SEMESTERS` (
  `programme_semester_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `programme_id`          INTEGER UNSIGNED NOT NULL,
  `semester_number`       TINYINT UNSIGNED NOT NULL,     -- 1,2,...
  `name`                  VARCHAR(100) NOT NULL,         -- "Year 1 Semester 1"
  PRIMARY KEY (`programme_semester_id`),
  UNIQUE KEY `uq_prog_sem` (`programme_id`, `semester_number`),
  CONSTRAINT `fk_ps_programme`
    FOREIGN KEY (`programme_id`) REFERENCES `PROGRAMMES`(`programme_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Modules (formerly COURSES).
CREATE TABLE `MODULES` (
  `module_id`             INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `module_code`           VARCHAR(20) NOT NULL UNIQUE,
  `module_name`           VARCHAR(255) NOT NULL,
  `credits`               TINYINT UNSIGNED NOT NULL,
  `programme_semester_id` INTEGER UNSIGNED NOT NULL,
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`module_id`),
  KEY `idx_module_prog_sem` (`programme_semester_id`),
  CONSTRAINT `fk_module_prog_sem`
    FOREIGN KEY (`programme_semester_id`) REFERENCES `PROGRAMME_SEMESTERS`(`programme_semester_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 5. HALLS, DEVICES & SESSIONS (Task 2, point 3)
-- =====================================================================

CREATE TABLE `HALLS` (
  `hall_id`    INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `hall_name`  VARCHAR(100) NOT NULL,
  `capacity`   SMALLINT UNSIGNED NULL,
  PRIMARY KEY (`hall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `DEVICES` (
  `device_id`      INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_serial`  VARCHAR(100) NOT NULL UNIQUE,
  `hall_id`        INTEGER UNSIGNED NOT NULL,
  `secret_ref`    VARCHAR(255) NULL, -- reference to secret held outside database
  `is_active`      BOOLEAN NOT NULL DEFAULT TRUE,
  `registered_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INTEGER UNSIGNED NULL,
  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uq_hall_device` (`hall_id`),      -- one device per hall
  CONSTRAINT `fk_device_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_device_hall`
    FOREIGN KEY (`hall_id`) REFERENCES `HALLS`(`hall_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A module being taught in a given calendar semester by a given lecturer
-- in a given hall. This is the anchor for enrolment/attendance/results.
CREATE TABLE `MODULE_OFFERINGS` (
  `offering_id`  INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `module_id`    INTEGER UNSIGNED NOT NULL,
  `semester_id`  INTEGER UNSIGNED NOT NULL,
  `lecturer_id`  INTEGER UNSIGNED NOT NULL,
  `hall_id`      INTEGER UNSIGNED NOT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INTEGER UNSIGNED NULL,
  PRIMARY KEY (`offering_id`),
  UNIQUE KEY `uq_offering` (`module_id`, `semester_id`, `lecturer_id`),
  KEY `idx_offering_semester` (`semester_id`),
  KEY `idx_offering_lecturer` (`lecturer_id`),
  KEY `idx_offering_hall` (`hall_id`),
  CONSTRAINT `fk_offering_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_offering_module`
    FOREIGN KEY (`module_id`) REFERENCES `MODULES`(`module_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_offering_semester`
    FOREIGN KEY (`semester_id`) REFERENCES `SEMESTERS`(`semester_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_offering_lecturer`
    FOREIGN KEY (`lecturer_id`) REFERENCES `LECTURERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_offering_hall`
    FOREIGN KEY (`hall_id`) REFERENCES `HALLS`(`hall_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MA maintains recurring lecture times. A slot is an offering in a hall on
-- a weekday during the effective dates. The application checks overlaps.
CREATE TABLE `TIMETABLE_SLOTS` (
  `slot_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `offering_id` INTEGER UNSIGNED NOT NULL,
  `hall_id` INTEGER UNSIGNED NOT NULL,
  `day_of_week` TINYINT UNSIGNED NOT NULL, -- 1=Monday ... 7=Sunday
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `effective_from` DATE NOT NULL,
  `effective_until` DATE NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_by` INTEGER UNSIGNED NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  KEY `idx_timetable_offering` (`offering_id`),
  KEY `idx_timetable_hall_day` (`hall_id`, `day_of_week`, `start_time`),
  CONSTRAINT `chk_timetable_day` CHECK (`day_of_week` BETWEEN 1 AND 7),
  CONSTRAINT `chk_timetable_time` CHECK (`end_time` > `start_time`),
  CONSTRAINT `chk_timetable_dates` CHECK (`effective_until` IS NULL OR `effective_until` >= `effective_from`),
  CONSTRAINT `fk_slot_offering` FOREIGN KEY (`offering_id`) REFERENCES `MODULE_OFFERINGS`(`offering_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_slot_hall` FOREIGN KEY (`hall_id`) REFERENCES `HALLS`(`hall_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_slot_updater` FOREIGN KEY (`updated_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lecturer opens a session on the hall device by supplying module code.
CREATE TABLE `LECTURE_SESSIONS` (
  `session_id`   INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `offering_id`  INTEGER UNSIGNED NOT NULL,
  `slot_id` INTEGER UNSIGNED NULL,
  `hall_id`      INTEGER UNSIGNED NOT NULL,
  `device_id`    INTEGER UNSIGNED NOT NULL,
  `session_date` DATE NOT NULL,
  `opened_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at`    DATETIME NULL,
  `opened_by`    INTEGER UNSIGNED NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_session_offering` (`offering_id`),
  KEY `idx_session_device_open` (`device_id`, `closed_at`),
  KEY `idx_session_date` (`session_date`),
  CONSTRAINT `fk_session_slot` FOREIGN KEY (`slot_id`) REFERENCES `TIMETABLE_SLOTS`(`slot_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_session_offering`
    FOREIGN KEY (`offering_id`) REFERENCES `MODULE_OFFERINGS`(`offering_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_session_hall`
    FOREIGN KEY (`hall_id`) REFERENCES `HALLS`(`hall_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_session_device`
    FOREIGN KEY (`device_id`) REFERENCES `DEVICES`(`device_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_session_opened_by`
    FOREIGN KEY (`opened_by`) REFERENCES `LECTURERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 6. ENROLMENT
-- =====================================================================

-- One row per attempt (repeat = new row). Latest has is_current = 1.
CREATE TABLE `ENROLLMENTS` (
  `enrollment_id`  INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id`     INTEGER UNSIGNED NOT NULL,
  `offering_id`    INTEGER UNSIGNED NOT NULL,
  `attempt_number` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `is_current`     BOOLEAN NOT NULL DEFAULT TRUE,
  `status`         VARCHAR(20) NOT NULL DEFAULT 'registered', -- registered|withdrawn|completed
  `enrolled_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `uq_enrollment_attempt` (`student_id`, `offering_id`, `attempt_number`),
  KEY `idx_enrollment_offering` (`offering_id`),
  KEY `idx_enrollment_student_current` (`student_id`, `is_current`),
  CONSTRAINT `fk_enrollment_student`
    FOREIGN KEY (`student_id`) REFERENCES `STUDENTS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_enrollment_offering`
    FOREIGN KEY (`offering_id`) REFERENCES `MODULE_OFFERINGS`(`offering_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 7. ATTENDANCE (Task 2, point 3)
-- =====================================================================

CREATE TABLE `ATTENDANCE` (
  `attendance_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`    INTEGER UNSIGNED NOT NULL,   -- carries offering/hall/date/device
  `student_id`    INTEGER UNSIGNED NOT NULL,
  `device_id`     INTEGER UNSIGNED NOT NULL,
  `scanned_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status`        VARCHAR(20) NOT NULL DEFAULT 'present',  -- present|late|absent
  `recorded_via`  VARCHAR(50) NOT NULL DEFAULT 'fingerprint',
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uq_attendance` (`session_id`, `student_id`),
  KEY `idx_attendance_student` (`student_id`),
  CONSTRAINT `fk_attendance_session`
    FOREIGN KEY (`session_id`) REFERENCES `LECTURE_SESSIONS`(`session_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_student`
    FOREIGN KEY (`student_id`) REFERENCES `STUDENTS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_device`
    FOREIGN KEY (`device_id`) REFERENCES `DEVICES`(`device_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 8. ASSESSMENT DEFINITIONS AND GRADES
-- =====================================================================

CREATE TABLE `MODULE_ICAS` (
  `ica_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `offering_id` INTEGER UNSIGNED NOT NULL,
  `ica_number` TINYINT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NULL,
  PRIMARY KEY (`ica_id`),
  UNIQUE KEY `uq_offering_ica` (`offering_id`, `ica_number`),
  CONSTRAINT `fk_ica_offering` FOREIGN KEY (`offering_id`) REFERENCES `MODULE_OFFERINGS`(`offering_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `GRADE_SCALE` (
  `grade` VARCHAR(2) NOT NULL PRIMARY KEY,
  `grade_point` DECIMAL(3,2) NOT NULL,
  `description` VARCHAR(100) NULL,
  CONSTRAINT `chk_grade_point` CHECK (`grade_point` BETWEEN 0 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate with the university-approved grade scale before grade entry.
-- GPA/CGPA use FINAL_RESULTS.final_grade only after status=PUBLISHED.
CREATE TABLE `ICA_GRADES` (
  `ica_grade_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `ica_id` INTEGER UNSIGNED NOT NULL,
  `enrollment_id` INTEGER UNSIGNED NOT NULL,
  `grade` VARCHAR(2) NOT NULL,
  `entered_by` INTEGER UNSIGNED NOT NULL,
  `entered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ica_grade_id`),
  UNIQUE KEY `uq_ica_enrollment` (`ica_id`, `enrollment_id`),
  KEY `idx_ica_grade_enrollment` (`enrollment_id`),
  CONSTRAINT `fk_ica_grade_ica` FOREIGN KEY (`ica_id`) REFERENCES `MODULE_ICAS`(`ica_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ica_grade_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `ENROLLMENTS`(`enrollment_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ica_grade_value` FOREIGN KEY (`grade`) REFERENCES `GRADE_SCALE`(`grade`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ica_grade_ma` FOREIGN KEY (`entered_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `EXAMS` (
  `exam_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `offering_id` INTEGER UNSIGNED NOT NULL,
  `exam_type` VARCHAR(50) NOT NULL, -- final, practical, resit, etc.
  `is_resit` BOOLEAN NOT NULL DEFAULT FALSE,
  `exam_date` DATE NULL,
  PRIMARY KEY (`exam_id`),
  KEY `idx_exam_offering` (`offering_id`),
  CONSTRAINT `fk_exam_offering` FOREIGN KEY (`offering_id`) REFERENCES `MODULE_OFFERINGS`(`offering_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `FINAL_RESULTS` (
  `result_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `enrollment_id` INTEGER UNSIGNED NOT NULL,
  `exam_id` INTEGER UNSIGNED NOT NULL,
  `exam_grade` VARCHAR(2) NOT NULL,
  `final_grade` VARCHAR(2) NOT NULL, -- approved overall grade; used for GPA
  `status` ENUM('ENTERED','VALIDATED','WITH_DEAN_OFFICE','PUBLISHED','RETURNED')
    NOT NULL DEFAULT 'ENTERED',
  `entered_by` INTEGER UNSIGNED NOT NULL,
  `entered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INTEGER UNSIGNED NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` DATETIME NULL,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `uq_result_enrollment_exam` (`enrollment_id`, `exam_id`),
  KEY `idx_result_status` (`status`),
  CONSTRAINT `fk_result_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `ENROLLMENTS`(`enrollment_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_result_exam` FOREIGN KEY (`exam_id`) REFERENCES `EXAMS`(`exam_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_result_exam_grade` FOREIGN KEY (`exam_grade`) REFERENCES `GRADE_SCALE`(`grade`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_result_final_grade` FOREIGN KEY (`final_grade`) REFERENCES `GRADE_SCALE`(`grade`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_result_entered_ma` FOREIGN KEY (`entered_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_result_updated_ma` FOREIGN KEY (`updated_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MA records every change in the verification flow; viewers read this history.
CREATE TABLE `RESULT_STATUS_HISTORY` (
  `history_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `result_id` INTEGER UNSIGNED NOT NULL,
  `from_status` ENUM('ENTERED','VALIDATED','WITH_DEAN_OFFICE','PUBLISHED','RETURNED') NULL,
  `to_status` ENUM('ENTERED','VALIDATED','WITH_DEAN_OFFICE','PUBLISHED','RETURNED') NOT NULL,
  `note` VARCHAR(500) NULL,
  `updated_by` INTEGER UNSIGNED NOT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_history_result_time` (`result_id`, `changed_at`),
  CONSTRAINT `fk_history_result` FOREIGN KEY (`result_id`) REFERENCES `FINAL_RESULTS`(`result_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_history_ma` FOREIGN KEY (`updated_by`) REFERENCES `MA_STAFF`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 12. DOCUMENTS & AUDIT
-- =====================================================================

CREATE TABLE `DOCUMENTS` (
  `document_id`   INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id`    INTEGER UNSIGNED NOT NULL,
  `document_type` VARCHAR(50) NOT NULL,
  `file_path`     VARCHAR(500) NOT NULL,       -- Google Drive file id/path (OPEN-02)
  `drive_file_id` VARCHAR(255) NULL,
  `uploaded_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by`   INTEGER UNSIGNED NOT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_doc_student` (`student_id`),
  CONSTRAINT `fk_doc_student`
    FOREIGN KEY (`student_id`) REFERENCES `STUDENTS`(`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_doc_uploader`
    FOREIGN KEY (`uploaded_by`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AUDIT_LOG` (
  `audit_id`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `table_name` VARCHAR(100) NOT NULL,
  `row_id`     BIGINT UNSIGNED NOT NULL,
  `action`     VARCHAR(20) NOT NULL,           -- INSERT|UPDATE|DELETE
  `old_value`  JSON NULL,
  `new_value`  JSON NULL,
  `actor_id`   INTEGER UNSIGNED NULL,
  `acted_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_table_row` (`table_name`, `row_id`),
  KEY `idx_audit_actor` (`actor_id`),
  CONSTRAINT `fk_audit_actor`
    FOREIGN KEY (`actor_id`) REFERENCES `USERS`(`user_id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Permissions express MA responsibilities. Backend checks permission and role
-- on EVERY write; database actor FKs ensure an MA profile for grade/status entry.
INSERT INTO `PERMISSIONS` (`permission_name`, `description`) VALUES
 ('users.create', 'Create student, lecturer, and other accounts'),
 ('grades.write', 'Enter ICA and final grades'),
 ('results.status.update', 'Record verification flow status'),
 ('results.status.view', 'View verification flow'),
 ('timetable.write', 'Manage offering and lecture timetable'),
 ('devices.write', 'Manage fingerprint devices');

INSERT INTO `ROLE_DEFAULT_PERMISSIONS` (`role`, `permission_id`)
SELECT 'MA', `permission_id` FROM `PERMISSIONS`;

INSERT INTO `ROLE_DEFAULT_PERMISSIONS` (`role`, `permission_id`)
SELECT r.`role_code`, p.`permission_id`
FROM `ROLES` r CROSS JOIN `PERMISSIONS` p
WHERE r.`role_code` IN ('STUDENT','LECTURER','HOD','DEAN','ADMIN')
  AND p.`permission_name` = 'results.status.view';

-- Transaction rule: update FINAL_RESULTS.status and insert RESULT_STATUS_HISTORY
-- together. Enforce allowed transitions and publication rules in backend.
-- Validate that enrollment and ICA/exam refer to the same offering in backend.
-- Backend also rejects lecturer/hall timetable overlaps and checks that a
-- lecture session's device is installed in the selected hall.
