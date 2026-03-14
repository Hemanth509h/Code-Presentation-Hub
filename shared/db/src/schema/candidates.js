import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull().unique(),
  targetRole: text("target_role").notNull(),
  skills: text("skills").array().notNull(),
  experienceYears: integer("experience_years").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  overallScore: real("overall_score"),
});
