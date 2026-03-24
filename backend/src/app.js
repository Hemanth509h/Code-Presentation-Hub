import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", router);

export default app;
