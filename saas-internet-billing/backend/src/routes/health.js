import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "SaaS Billing API running" });
});

export default router;
