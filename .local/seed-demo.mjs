import bcrypt from "bcrypt";
import { writeFile } from "node:fs/promises";
import { AppDataSource as db, initializeDatabase } from "../apps/server/src/data-source.js";
import { campusDate } from "../apps/server/src/utils/campus-time.js";
const password = "UniVerseDemo@2026!";
const roles = ["MA", "ADMIN", "HOD", "DEAN", "LECTURER", "STUDENT"];
try {
  await initializeDatabase();
  const [database] = await db.query("SELECT DATABASE() AS name");
  if (database.name !== "universe_uov_v04") throw new Error("Demo seeding is restricted to the separate V04 development database.");
  const hash = await bcrypt.hash(password,12);
  const accounts = await db.transaction(async manager => {
    const [actor] = await manager.query("SELECT ma.user_id AS id FROM MA_STAFF ma JOIN USERS u ON u.user_id=ma.user_id WHERE u.is_active=1 ORDER BY ma.user_id LIMIT 1");
    if (!actor) throw new Error("An active MA is required.");
    async function one(sql,args=[]) { return (await manager.query(sql,args))[0]; }
    async function insert(sql,args=[]) { return (await manager.query(sql,args)).insertId; }
    let department = await one("SELECT department_id AS id FROM DEPARTMENTS WHERE department_code='DEMO-ICT'");
    if (!department) department = {id:await insert("INSERT INTO DEPARTMENTS (department_name,department_code) VALUES ('Demo Computing Department','DEMO-ICT')")};
    const accounts = [];
    for (const role of roles) {
      const email = `demo.${role.toLowerCase()}@example.test`;
      let user = await one("SELECT user_id AS id,password_hash AS passwordHash,role_code AS role,is_active AS isActive FROM USERS WHERE email=?",[email]);
      if (user) {
        if (user.role !== role || !user.isActive || !(await bcrypt.compare(password,user.passwordHash))) throw new Error(`Existing ${email} differs from this fixture; no account was overwritten.`);
      } else {
        const id = await insert("INSERT INTO USERS (name,email,password_hash,role_code,must_change_password,created_by) VALUES (?,?,?,?,0,?)",[`Demo ${role}`,email,hash,role,actor.id]);
        user = {id};
        if (role === "MA") await manager.query("INSERT INTO MA_STAFF (user_id,staff_number,office_name) VALUES (?,'DEMO-MA','Demo Academic Office')",[id]);
        if (role === "ADMIN") await manager.query("INSERT INTO ADMINISTRATORS (user_id,admin_level) VALUES (?,'demo')",[id]);
        if (["HOD","LECTURER"].includes(role)) await manager.query("INSERT INTO LECTURERS (user_id,department_id,is_hod,staff_number,date_joined) VALUES (?,?,?,?,?)",[id,department.id,role==="HOD",`DEMO-${role}`,"2026-01-01"]);
        if (role === "HOD") await manager.query("UPDATE DEPARTMENTS SET head_lecturer_id=? WHERE department_id=? AND head_lecturer_id IS NULL",[id,department.id]);
        if (role === "DEAN") await manager.query("INSERT INTO DEANS (user_id,department_id,appointed_at) VALUES (?,?,'2026-01-01')",[id,department.id]);
        await manager.query("INSERT INTO AUDIT_LOG (table_name,row_id,action,actor_id,new_value) VALUES ('USERS',?,'INSERT',?,?)",[id,actor.id,JSON.stringify({demo:true,role})]);
      }
      accounts.push({id:user.id,role,email,password});
    }
    let programme = await one("SELECT programme_id AS id FROM PROGRAMMES WHERE programme_code='DEMO-ICT'");
    if (!programme) programme={id:await insert("INSERT INTO PROGRAMMES (programme_code,programme_name,department_id,duration_years) VALUES ('DEMO-ICT','Demo Information Technology Programme',?,3)",[department.id])};
    let batch = await one("SELECT batch_id AS id FROM BATCHES WHERE batch_name='Demo 2026 Intake'");
    if (!batch) batch={id:await insert("INSERT INTO BATCHES (batch_name,start_date) VALUES ('Demo 2026 Intake','2026-09-01')")};
    const student=accounts.find(a=>a.role==="STUDENT");
    if (!(await one("SELECT user_id FROM STUDENTS WHERE user_id=?",[student.id]))) {
      await manager.query("INSERT INTO STUDENTS (user_id,registration_number,batch_id,current_semester) VALUES (?,'DEMO/ICT/001',?,1)",[student.id,batch.id]);
      await manager.query("INSERT INTO STUDENT_PROGRAMMES (student_id,programme_id,start_date) VALUES (?,?,'2026-09-01')",[student.id,programme.id]);
    }
    let curriculum=await one("SELECT programme_semester_id AS id FROM PROGRAMME_SEMESTERS WHERE programme_id=? AND semester_number=1",[programme.id]);
    if (!curriculum) curriculum={id:await insert("INSERT INTO PROGRAMME_SEMESTERS (programme_id,semester_number,name) VALUES (?,1,'Demo Year 1 Semester 1')",[programme.id])};
    let semester=await one("SELECT semester_id AS id FROM SEMESTERS WHERE semester_name='Demo Semester 1' AND academic_year='2026/2027'");
    if (!semester) semester={id:await insert("INSERT INTO SEMESTERS (semester_name,academic_year,start_date,end_date) VALUES ('Demo Semester 1','2026/2027','2026-09-01','2027-01-31')")};
    let hall=await one("SELECT hall_id AS id FROM HALLS WHERE hall_name='Demo Teaching Hall'");
    if (!hall) hall={id:await insert("INSERT INTO HALLS (hall_name,capacity) VALUES ('Demo Teaching Hall',60)")};
    let device=await one("SELECT device_id AS id FROM DEVICES WHERE device_serial='DEMO-SIMULATOR-001'");
    if (!device) device={id:await insert("INSERT INTO DEVICES (device_serial,hall_id,is_active,updated_by) VALUES ('DEMO-SIMULATOR-001',?,0,?)",[hall.id,actor.id])};
    // These are labelled development grades, not an approved institutional grade scale.
    for (const [grade,point] of [["A",4],["B",3],["C",2],["F",0]]) {
      if (!(await one("SELECT grade FROM GRADE_SCALE WHERE grade=?",[grade]))) await manager.query("INSERT INTO GRADE_SCALE (grade,grade_point,description) VALUES (?,?,?)",[grade,point,"Development demo scale"]);
    }
    for (const [code,title,credits,grade,status] of [["DEMO101","Demo Programming",3,"A","PUBLISHED"],["DEMO102","Demo Databases",2,"B","PUBLISHED"],["DEMO103","Demo Networks",2,"C","ENTERED"]]) {
      let module=await one("SELECT module_id AS id FROM MODULES WHERE module_code=?",[code]);
      if (!module) module={id:await insert("INSERT INTO MODULES (module_code,module_name,credits,programme_semester_id) VALUES (?,?,?,?)",[code,title,credits,curriculum.id])};
      const lecturer=accounts.find(a=>a.role==="LECTURER");
      let offering=await one("SELECT offering_id AS id FROM MODULE_OFFERINGS WHERE module_id=? AND semester_id=? AND lecturer_id=?",[module.id,semester.id,lecturer.id]);
      if (!offering) offering={id:await insert("INSERT INTO MODULE_OFFERINGS (module_id,semester_id,lecturer_id,hall_id,updated_by) VALUES (?,?,?,?,?)",[module.id,semester.id,lecturer.id,hall.id,actor.id])};
      let enrollment=await one("SELECT enrollment_id AS id FROM ENROLLMENTS WHERE student_id=? AND offering_id=? AND attempt_number=1",[student.id,offering.id]);
      if (!enrollment) enrollment={id:await insert("INSERT INTO ENROLLMENTS (student_id,offering_id) VALUES (?,?)",[student.id,offering.id])};
      let ica=await one("SELECT ica_id AS id FROM MODULE_ICAS WHERE offering_id=? AND ica_number=1",[offering.id]);
      if (!ica) ica={id:await insert("INSERT INTO MODULE_ICAS (offering_id,ica_number,title) VALUES (?,1,'Demo ICA 1')",[offering.id])};
      if (!(await one("SELECT ica_grade_id FROM ICA_GRADES WHERE ica_id=? AND enrollment_id=?",[ica.id,enrollment.id]))) await manager.query("INSERT INTO ICA_GRADES (ica_id,enrollment_id,grade,entered_by) VALUES (?,?,?,?)",[ica.id,enrollment.id,grade,actor.id]);
      let exam=await one("SELECT exam_id AS id FROM EXAMS WHERE offering_id=? AND exam_type='demo-final'",[offering.id]);
      if (!exam) exam={id:await insert("INSERT INTO EXAMS (offering_id,exam_type,exam_date) VALUES (?,'demo-final',?)",[offering.id,campusDate()])};
      if (!(await one("SELECT result_id FROM FINAL_RESULTS WHERE enrollment_id=? AND exam_id=?",[enrollment.id,exam.id]))) {
        const resultId=await insert("INSERT INTO FINAL_RESULTS (enrollment_id,exam_id,exam_grade,final_grade,status,entered_by,updated_by,published_at) VALUES (?,?,?,?,?,?,?,CASE WHEN ?='PUBLISHED' THEN NOW() ELSE NULL END)",[enrollment.id,exam.id,grade,grade,status,actor.id,actor.id,status]);
        for (const transition of status==="PUBLISHED"?[[null,"ENTERED"],["ENTERED","VALIDATED"],["VALIDATED","WITH_DEAN_OFFICE"],["WITH_DEAN_OFFICE","PUBLISHED"]]:[[null,"ENTERED"]]) await manager.query("INSERT INTO RESULT_STATUS_HISTORY (result_id,from_status,to_status,note,updated_by) VALUES (?,?,?,'Development demo fixture',?)",[resultId,...transition,actor.id]);
      }
      if (code==="DEMO101" && !(await one("SELECT session_id FROM LECTURE_SESSIONS WHERE offering_id=?",[offering.id]))) {
        const today=campusDate();
        const day=(new Date(today+"T00:00:00Z").getUTCDay()+6)%7+1;
        const slotId=await insert("INSERT INTO TIMETABLE_SLOTS (offering_id,hall_id,day_of_week,start_time,end_time,effective_from,effective_until,updated_by) VALUES (?,?,?,'09:00:00','10:00:00','2026-09-01','2027-01-31',?)",[offering.id,hall.id,day,actor.id]);
        const sessionId=await insert("INSERT INTO LECTURE_SESSIONS (offering_id,slot_id,hall_id,device_id,session_date,opened_at,closed_at,opened_by) VALUES (?,?,?,?,?,CONCAT(?,' 09:00:00'),CONCAT(?,' 10:00:00'),?)",[offering.id,slotId,hall.id,device.id,today,today,today,lecturer.id]);
        await manager.query("INSERT INTO ATTENDANCE (session_id,student_id,device_id,scanned_at,status,recorded_via) VALUES (?,?,?,CONCAT(?,' 09:05:00'),'present','demo')",[sessionId,student.id,device.id,today]);
      }
    }
    return accounts.map(({id,...account})=>account);
  });
  await writeFile(new URL("./demo-signins.json",import.meta.url),JSON.stringify({url:"http://127.0.0.1:5173",accounts,note:"Fictional local test accounts and academic records; development grade scale only."},null,2)+"\n",{mode:0o600});
  console.log("Created or verified six demo accounts and labelled sample records. Existing accounts were not changed.");
  for (const account of accounts) {
    const response=await fetch("http://localhost:4000/api/users/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:account.email,password})});
    const data=await response.json();
    if (response.status!==200 || data.user?.role!==account.role || data.user?.mustChangePassword) throw new Error(`Login verification failed for ${account.role}`);
    console.log(`${account.role}: login verified`);
  }
} catch(error) { console.error(error.code || error.message);process.exitCode=1; }
finally { if(db.isInitialized)await db.destroy(); }
