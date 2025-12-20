import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations (e.g., SCCC)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  settings: jsonb("settings"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Roles: admin, manager, user, contractor
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Users with organization and role support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  department: text("department"),
  phone: text("phone"),
  organizationId: integer("organization_id").references(() => organizations.id),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true).notNull(),
  preferences: jsonb("preferences"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Email Accounts with multi-account and contractor support
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  email: text("email").notNull(),
  accountType: text("account_type").default("primary").notNull(),
  displayName: text("display_name"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: text("scopes"),
  syncEnabled: boolean("sync_enabled").default(true).notNull(),
  syncFolders: jsonb("sync_folders"),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status").default("pending"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

// Contractor assignments (sponsors)
export const contractorAssignments = pgTable("contractor_assignments", {
  id: serial("id").primaryKey(),
  contractorUserId: varchar("contractor_user_id").notNull().references(() => users.id),
  sponsorUserId: varchar("sponsor_user_id").notNull().references(() => users.id),
  emailAccountId: integer("email_account_id").references(() => emailAccounts.id),
  accessLevel: text("access_level").default("read").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractorAssignmentSchema = createInsertSchema(contractorAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertContractorAssignment = z.infer<typeof insertContractorAssignmentSchema>;
export type ContractorAssignment = typeof contractorAssignments.$inferSelect;

// Integration Providers Configuration
export const integrationProviders = pgTable("integration_providers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  provider: text("provider").notNull(),
  displayName: text("display_name").notNull(),
  clientId: text("client_id"),
  tenantId: text("tenant_id"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntegrationProviderSchema = createInsertSchema(integrationProviders).omit({
  id: true,
  createdAt: true,
});

export type InsertIntegrationProvider = z.infer<typeof insertIntegrationProviderSchema>;
export type IntegrationProvider = typeof integrationProviders.$inferSelect;

// Briefing Policies
export const briefingPolicies = pgTable("briefing_policies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  scheduleType: text("schedule_type").default("daily").notNull(),
  scheduleTime: text("schedule_time").default("07:00"),
  timezone: text("timezone").default("America/New_York"),
  daysOfWeek: jsonb("days_of_week"),
  priorityRules: jsonb("priority_rules"),
  notificationChannels: jsonb("notification_channels"),
  aiSummarizationEnabled: boolean("ai_summarization_enabled").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBriefingPolicySchema = createInsertSchema(briefingPolicies).omit({
  id: true,
  createdAt: true,
});

export type InsertBriefingPolicy = z.infer<typeof insertBriefingPolicySchema>;
export type BriefingPolicy = typeof briefingPolicies.$inferSelect;

// User Briefing Subscriptions
export const userBriefingSubscriptions = pgTable("user_briefing_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  policyId: integer("policy_id").references(() => briefingPolicies.id),
  customScheduleTime: text("custom_schedule_time"),
  customTimezone: text("custom_timezone"),
  emailNotification: boolean("email_notification").default(true).notNull(),
  smsNotification: boolean("sms_notification").default(false).notNull(),
  teamsNotification: boolean("teams_notification").default(false).notNull(),
  quietHoursStart: text("quiet_hours_start"),
  quietHoursEnd: text("quiet_hours_end"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserBriefingSubscriptionSchema = createInsertSchema(userBriefingSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserBriefingSubscription = z.infer<typeof insertUserBriefingSubscriptionSchema>;
export type UserBriefingSubscription = typeof userBriefingSubscriptions.$inferSelect;

// Briefing Items
export const briefingItems = pgTable("briefing_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailAccountId: integer("email_account_id").references(() => emailAccounts.id),
  type: text("type").notNull(),
  priority: text("priority").notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  aiSummary: text("ai_summary"),
  metadata: jsonb("metadata"),
  externalId: text("external_id"),
  timestamp: timestamp("timestamp").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBriefingItemSchema = createInsertSchema(briefingItems).omit({
  id: true,
  createdAt: true,
});

export type InsertBriefingItem = z.infer<typeof insertBriefingItemSchema>;
export type BriefingItem = typeof briefingItems.$inferSelect;

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: varchar("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Notification Templates
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  bodyTemplate: text("body_template").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  settingKey: text("setting_key").notNull(),
  settingValue: jsonb("setting_value"),
  description: text("description"),
  isSecret: boolean("is_secret").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
