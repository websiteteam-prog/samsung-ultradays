import { sequelize } from "../config/db.js";
import Customer from "./Customer.js";
import Submission from "./Submission.js";
import Admin from "./Admin.js";
import Otp from "./Otp.js";

export { Customer, Submission, Admin, Otp };

// A submission belongs to a registered customer (linked by mobile at submit time)
Submission.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Submission, { foreignKey: "customerId", as: "submissions" });

// Sync tables and seed the first admin from env if none exists.
export async function initModels() {
  await sequelize.sync(); // creates tables if they don't exist

  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await Admin.findOne({ where: { email } });
  if (!existing) {
    const passwordHash = await Admin.hashPassword(password);
    await Admin.create({ email, passwordHash });
    console.log(`Seeded admin: ${email}`);
  }
}
