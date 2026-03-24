// Force event loop to stay open
setInterval(() => {}, 10000);

import app from "./app.js";

const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("FATAL: Unhandled Rejection:", reason);
});

process.on("exit", (code) => {
  console.log(`Server process exiting with code: ${code}`);
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port} (0.0.0.0)`);
});

// Robust Keep-Alive to prevent premature exit
const timer = setInterval(() => {
  if (!server.listening) {
    console.warn("Server stopped listening! Re-initializing...");
    // Attempting to restart would be risky, better to just log
  }
}, 60000);

process.on("SIGTERM", () => {
  clearInterval(timer);
  server.close();
});
