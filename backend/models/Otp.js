import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Otp = sequelize.define(
  "Otp",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "otps",
    indexes: [{ fields: ["mobile"] }],
  }
);

export default Otp;
