import { pgTable, text, serial, integer, real, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const assessmentTypeEnum = pgEnum("assessment_type", ["coding", "aptitude", "technical"]);
export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "coding", "short_answer"]);

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().unique(),
  title: text("title").notNull(),
  type: assessmentTypeEnum("type").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  maxScore: real("max_score").notNull(),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionId: text("question_id").notNull().unique(),
  assessmentId: text("assessment_id").notNull(),
  text: text("text").notNull(),
  type: questionTypeEnum("type").notNull(),
  options: text("options").array(),
  correctOption: integer("correct_option"),
  points: real("points").notNull(),
});

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  assessmentId: text("assessment_id").notNull(),
  score: real("score").notNull(),
  maxScore: real("max_score").notNull(),
  percentage: real("percentage").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});
