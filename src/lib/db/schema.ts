import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const scenariosTable = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
});
export const sessionsTable = sqliteTable('case_sessions', {
  id: text('id').primaryKey(),
  scenarioId: text('scenario_id').notNull(),
  payload: text('payload').notNull(),
  version: integer('version').notNull(),
  requirementCounter: integer('requirement_counter').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});
export const adrsTable = sqliteTable('accepted_adrs', {
  caseId: text('case_id').notNull(),
  id: text('id').notNull(),
  payload: text('payload').notNull(),
});
export const snapshotsTable = sqliteTable('reasoning_snapshots', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  kind: text('kind').notNull(),
  payload: text('payload').notNull(),
});
