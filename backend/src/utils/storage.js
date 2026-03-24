import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Store data in a persistent directory outside the src folder to avoid unnecessary restarts
const STORAGE_DIR = path.resolve(__dirname, "../../../persistence");
const STORAGE_FILE = path.join(STORAGE_DIR, "recruiter_data.json");

export async function ensureStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create storage directory:", err);
  }
}

export const db = {
  shortlists: {},
  connections: {},
  masks: {},
  revMasks: {},
  connectionCounter: 1,
  maskCounter: 0,
};

export async function initStorage() {
  await ensureStorage();
  try {
    const content = await fs.readFile(STORAGE_FILE, "utf-8");
    if (!content.trim()) return; // Handle empty file
    const data = JSON.parse(content);
    Object.assign(db, data);
    console.log("[Storage] Data loaded successfully");
  } catch (err) {
    console.log("[Storage] No existing data found, using defaults");
  }
}

export async function sync() {
  await ensureStorage();
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save recruiter data:", err);
  }
}
