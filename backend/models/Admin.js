import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db.js";

const Admin = sequelize.define(
  "Admin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "admins" }
);

Admin.prototype.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

Admin.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

export default Admin;
