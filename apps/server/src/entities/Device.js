import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Device",
  tableName: "DEVICES",
  columns: {
    deviceId: {
      name: "device_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },
    deviceSerial: {
      name: "device_serial",
      type: "varchar",
      length: 100,
    },
    hallId: {
      name: "hall_id",
      type: "int",
      unsigned: true,
    },
    secretRef: {
      name: "secret_ref",
      type: "varchar",
      length: 255,
      nullable: true,
      select: false,
    },
    isActive: {
      name: "is_active",
      type: "boolean",
    },
    registeredAt: {
      name: "registered_at",
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      name: "updated_at",
      type: "datetime",
      updateDate: true,
    },
    updatedBy: {
      name: "updated_by",
      type: "int",
      unsigned: true,
      nullable: true,
    },
  },
});
