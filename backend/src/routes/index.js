import { Router } from "express";
import healthRouter from "./health.js";
import candidatesRouter from "./candidates.js";
import assessmentsRouter from "./assessments.js";
import recruitersRouter from "./recruiters.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/candidates", candidatesRouter);
router.use("/assessments", assessmentsRouter);
router.use("/recruiters", recruitersRouter);
router.use("/admin", adminRouter);

export default router;
