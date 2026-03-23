import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import candidatesRouter from "./candidates.js";
import assessmentsRouter from "./assessments.js";
import recruitersRouter from "./recruiters.js";
import adminRouter from "./admin.js";
import customTestsRouter from "./custom-tests.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/candidates", candidatesRouter);
router.use("/assessments", assessmentsRouter);
router.use("/recruiters", recruitersRouter);
router.use("/admin", adminRouter);
router.use("/custom-tests", customTestsRouter);

export default router;
