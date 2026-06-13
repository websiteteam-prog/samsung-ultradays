import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import partnerRoutes from "./routes/partner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images/screenshots
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// API routes
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/partner", partnerRoutes);

// Multer / generic error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await initModels();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
