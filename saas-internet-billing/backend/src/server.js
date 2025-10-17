import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import healthRoutes from "./routes/health.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.send("SaaS Internet Billing API is live 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
