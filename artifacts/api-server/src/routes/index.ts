import { Router, type IRouter } from "express";
import healthRouter from "./health";
import candidatesRouter from "./candidates";
import assessmentsRouter from "./assessments";
import recruitersRouter from "./recruiters";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/candidates", candidatesRouter);
router.use("/assessments", assessmentsRouter);
router.use("/recruiters", recruitersRouter);

export default router;
