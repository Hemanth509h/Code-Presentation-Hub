import { pgTable, text, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull().unique(),
  targetRole: text("target_role").notNull(),
  skills: text("skills").array().notNull(),
  experienceYears: integer("experience_years").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  overallScore: real("overall_score"),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, registeredAt: true, overallScore: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
