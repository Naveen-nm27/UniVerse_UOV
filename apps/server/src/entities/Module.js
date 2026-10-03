import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Module",
  tableName: "MODULES",

  columns: {
    moduleId: {
      name: "module_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    moduleCode: {
      name: "module_code",
      type: "varchar",
      length: 20,
      unique: true
    },

    moduleName: {
      name: "module_name",
      type: "varchar",
      length: 255
    },

    credits: {
      type: "tinyint",
      unsigned: true
    },

    programmeSemesterId: {
      name: "programme_semester_id",
      type: "int",
      unsigned: true
    }
  }
});
