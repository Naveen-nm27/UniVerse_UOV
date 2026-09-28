import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ModuleIca",
  tableName: "MODULE_ICAS",

  columns: {
    icaId: {
      name: "ica_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    offeringId: {
      name: "offering_id",
      type: "int",
      unsigned: true
    },

    
    icaNumber: {
      name: "ica_number",
      type: "tinyint",
      unsigned: true
    },

    title: {
      type: "varchar",
      length: 150,
      nullable: true
    }
  }
});