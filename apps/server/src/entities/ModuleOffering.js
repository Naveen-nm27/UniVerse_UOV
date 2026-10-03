import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ModuleOffering",
  tableName: "MODULE_OFFERINGS",

  columns: {
    offeringId: {
      name: "offering_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    moduleId: {
      name: "module_id",
      type: "int",
      unsigned: true
    },

    semesterId: {
      name: "semester_id",
      type: "int",
      unsigned: true
    },

    lecturerId: {
      name: "lecturer_id",
      type: "int",
      unsigned: true
    },

    hallId: {
      name: "hall_id",
      type: "int",
      unsigned: true
    }
  }
});
