import { Router } from "express";
import healthRouter from "./health.js";
import candidatesRouter from "./candidates.js";
import assessmentsRouter from "./assessments.js";
import recruitersRouter from "./recruiters.js";

const router = Router();

router.use(healthRouter);
router.use("/candidates", candidatesRouter);
router.use("/assessments", assessmentsRouter);
router.use("/recruiters", recruitersRouter);

export default router;
