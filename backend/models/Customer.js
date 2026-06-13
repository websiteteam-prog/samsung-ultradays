import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Customer = sequelize.define(
  "Customer",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: false, unique: true },
    imei: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    storeLocation: { type: DataTypes.STRING, allowNull: false },
    sesId: { type: DataTypes.STRING, allowNull: false },
    productPurchased: { type: DataTypes.STRING, allowNull: false },
    giftEligible: { type: DataTypes.BOOLEAN, defaultValue: true },
    giftClaimed: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "customers",
    indexes: [{ fields: ["mobile"] }],
  }
);

export default Customer;