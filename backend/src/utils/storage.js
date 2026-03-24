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

export async function loadData() {
  await ensureStorage();
  try {
    const content = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    // If file doesn't exist, return default structure
    return {
      shortlists: {}, // recruiterId -> array of maskedIds
      connections: {}, // connectionId -> connection data
      masks: {}, // candidateId -> alias
      revMasks: {}, // alias -> candidateId
      connectionCounter: 1,
      maskCounter: 0,
    };
  }
}

export async function saveData(data) {
  await ensureStorage();
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save recruiter data:", err);
  }
}
