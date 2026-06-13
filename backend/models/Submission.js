import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Submission = sequelize.define(
  "Submission",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Links to the registered customer (matched by mobile at submit time)
    customerId: { type: DataTypes.INTEGER, allowNull: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    // Screenshot proving the framed image was posted on social media
    screenshotPath: { type: DataTypes.STRING, allowNull: false },
    // The branded frame generated in step 2
    framedImagePath: { type: DataTypes.STRING },
    // OTP is mandatory now, so every submission is verified
    verified: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "submissions",
    indexes: [{ fields: ["mobile"] }],
  }
);

export default Submission;
