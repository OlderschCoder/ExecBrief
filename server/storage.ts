import { 
  users, 
  organizations,
  roles,
  emailAccounts, 
  briefingItems,
  briefingPolicies,
  userBriefingSubscriptions,
  integrationProviders,
  contractorAssignments,
  auditLogs,
  systemSettings,
  type User, 
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Role,
  type EmailAccount,
  type InsertEmailAccount,
  type BriefingItem,
  type InsertBriefingItem,
  type BriefingPolicy,
  type InsertBriefingPolicy,
  type IntegrationProvider,
  type InsertIntegrationProvider,
  type ContractorAssignment,
  type InsertContractorAssignment,
  type UserBriefingSubscription,
  type InsertUserBriefingSubscription,
  type AuditLog,
  type InsertAuditLog,
  type SystemSetting,
  type InsertSystemSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(organizationId?: number, search?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Organizations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByDomain(domain: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;

  // Email Accounts
  getEmailAccounts(userId: string): Promise<EmailAccount[]>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  getAllEmailAccounts(organizationId?: number): Promise<EmailAccount[]>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: number, data: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined>;
  updateEmailAccountsSyncTime(provider: string): Promise<void>;
  deleteEmailAccount(id: number): Promise<void>;

  // Contractor Assignments
  getContractorAssignments(contractorUserId: string): Promise<ContractorAssignment[]>;
  getSponsorAssignments(sponsorUserId: string): Promise<ContractorAssignment[]>;
  createContractorAssignment(assignment: InsertContractorAssignment): Promise<ContractorAssignment>;
  deleteContractorAssignment(id: number): Promise<void>;

  // Integration Providers
  getIntegrationProviders(organizationId: number): Promise<IntegrationProvider[]>;
  getIntegrationProvider(id: number): Promise<IntegrationProvider | undefined>;
  createIntegrationProvider(provider: InsertIntegrationProvider): Promise<IntegrationProvider>;
  updateIntegrationProvider(id: number, data: Partial<InsertIntegrationProvider>): Promise<IntegrationProvider | undefined>;

  // Briefing Policies
  getBriefingPolicies(organizationId: number): Promise<BriefingPolicy[]>;
  getBriefingPolicy(id: number): Promise<BriefingPolicy | undefined>;
  createBriefingPolicy(policy: InsertBriefingPolicy): Promise<BriefingPolicy>;
  updateBriefingPolicy(id: number, data: Partial<InsertBriefingPolicy>): Promise<BriefingPolicy | undefined>;
  deleteBriefingPolicy(id: number): Promise<void>;

  // User Subscriptions
  getUserSubscription(userId: string): Promise<UserBriefingSubscription | undefined>;
  createUserSubscription(sub: InsertUserBriefingSubscription): Promise<UserBriefingSubscription>;
  updateUserSubscription(id: number, data: Partial<InsertUserBriefingSubscription>): Promise<UserBriefingSubscription | undefined>;

  // Briefing Items
  getBriefingItems(userId: string, limit?: number): Promise<BriefingItem[]>;
  createBriefingItem(item: InsertBriefingItem): Promise<BriefingItem>;
  markBriefingItemRead(id: number): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(organizationId?: number, limit?: number): Promise<AuditLog[]>;

  // System Settings
  getSystemSettings(organizationId: number): Promise<SystemSetting[]>;
  getSystemSetting(organizationId: number, key: string): Promise<SystemSetting | undefined>;
  upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsers(organizationId?: number, search?: string, limit: number = 50, offset: number = 0): Promise<{ users: User[], total: number }> {
    let query = db.select().from(users);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);

    const conditions = [];
    if (organizationId) {
      conditions.push(eq(users.organizationId, organizationId));
    }
    if (search) {
      conditions.push(or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ));
    }

    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause!) as typeof query;
      countQuery = countQuery.where(whereClause!) as typeof countQuery;
    }

    const [userList, countResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      countQuery
    ]);

    return { users: userList, total: Number(countResult[0]?.count || 0) };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  }

  // Organizations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.domain, domain));
    return org || undefined;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db.update(organizations).set(data).where(eq(organizations.id, id)).returning();
    return org || undefined;
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  // Email Accounts
  async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts)
      .where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.isActive, true)));
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account || undefined;
  }

  async getAllEmailAccounts(organizationId?: number): Promise<EmailAccount[]> {
    if (organizationId) {
      return await db.select().from(emailAccounts)
        .innerJoin(users, eq(emailAccounts.userId, users.id))
        .where(eq(users.organizationId, organizationId))
        .then(rows => rows.map(r => r.email_accounts));
    }
    return await db.select().from(emailAccounts);
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [emailAccount] = await db.insert(emailAccounts).values(account).returning();
    return emailAccount;
  }

  async updateEmailAccount(id: number, data: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    const [account] = await db.update(emailAccounts).set(data).where(eq(emailAccounts.id, id)).returning();
    return account || undefined;
  }

  async updateEmailAccountsSyncTime(provider: string): Promise<void> {
    await db.update(emailAccounts)
      .set({ lastSyncedAt: new Date(), syncStatus: 'synced' })
      .where(eq(emailAccounts.provider, provider));
  }

  async deleteEmailAccount(id: number): Promise<void> {
    await db.update(emailAccounts).set({ isActive: false }).where(eq(emailAccounts.id, id));
  }

  // Contractor Assignments
  async getContractorAssignments(contractorUserId: string): Promise<ContractorAssignment[]> {
    return await db.select().from(contractorAssignments)
      .where(and(eq(contractorAssignments.contractorUserId, contractorUserId), eq(contractorAssignments.isActive, true)));
  }

  async getSponsorAssignments(sponsorUserId: string): Promise<ContractorAssignment[]> {
    return await db.select().from(contractorAssignments)
      .where(and(eq(contractorAssignments.sponsorUserId, sponsorUserId), eq(contractorAssignments.isActive, true)));
  }

  async createContractorAssignment(assignment: InsertContractorAssignment): Promise<ContractorAssignment> {
    const [result] = await db.insert(contractorAssignments).values(assignment).returning();
    return result;
  }

  async deleteContractorAssignment(id: number): Promise<void> {
    await db.update(contractorAssignments).set({ isActive: false }).where(eq(contractorAssignments.id, id));
  }

  // Integration Providers
  async getIntegrationProviders(organizationId: number): Promise<IntegrationProvider[]> {
    return await db.select().from(integrationProviders)
      .where(eq(integrationProviders.organizationId, organizationId));
  }

  async getIntegrationProvider(id: number): Promise<IntegrationProvider | undefined> {
    const [provider] = await db.select().from(integrationProviders).where(eq(integrationProviders.id, id));
    return provider || undefined;
  }

  async createIntegrationProvider(provider: InsertIntegrationProvider): Promise<IntegrationProvider> {
    const [result] = await db.insert(integrationProviders).values(provider).returning();
    return result;
  }

  async updateIntegrationProvider(id: number, data: Partial<InsertIntegrationProvider>): Promise<IntegrationProvider | undefined> {
    const [provider] = await db.update(integrationProviders).set(data).where(eq(integrationProviders.id, id)).returning();
    return provider || undefined;
  }

  // Briefing Policies
  async getBriefingPolicies(organizationId: number): Promise<BriefingPolicy[]> {
    return await db.select().from(briefingPolicies)
      .where(eq(briefingPolicies.organizationId, organizationId));
  }

  async getBriefingPolicy(id: number): Promise<BriefingPolicy | undefined> {
    const [policy] = await db.select().from(briefingPolicies).where(eq(briefingPolicies.id, id));
    return policy || undefined;
  }

  async createBriefingPolicy(policy: InsertBriefingPolicy): Promise<BriefingPolicy> {
    const [result] = await db.insert(briefingPolicies).values(policy).returning();
    return result;
  }

  async updateBriefingPolicy(id: number, data: Partial<InsertBriefingPolicy>): Promise<BriefingPolicy | undefined> {
    const [policy] = await db.update(briefingPolicies).set(data).where(eq(briefingPolicies.id, id)).returning();
    return policy || undefined;
  }

  async deleteBriefingPolicy(id: number): Promise<void> {
    await db.update(briefingPolicies).set({ isActive: false }).where(eq(briefingPolicies.id, id));
  }

  // User Subscriptions
  async getUserSubscription(userId: string): Promise<UserBriefingSubscription | undefined> {
    const [sub] = await db.select().from(userBriefingSubscriptions)
      .where(eq(userBriefingSubscriptions.userId, userId));
    return sub || undefined;
  }

  async createUserSubscription(sub: InsertUserBriefingSubscription): Promise<UserBriefingSubscription> {
    const [result] = await db.insert(userBriefingSubscriptions).values(sub).returning();
    return result;
  }

  async updateUserSubscription(id: number, data: Partial<InsertUserBriefingSubscription>): Promise<UserBriefingSubscription | undefined> {
    const [sub] = await db.update(userBriefingSubscriptions).set(data).where(eq(userBriefingSubscriptions.id, id)).returning();
    return sub || undefined;
  }

  // Briefing Items
  async getBriefingItems(userId: string, limit: number = 50): Promise<BriefingItem[]> {
    return await db.select().from(briefingItems)
      .where(eq(briefingItems.userId, userId))
      .orderBy(desc(briefingItems.timestamp))
      .limit(limit);
  }

  async createBriefingItem(item: InsertBriefingItem): Promise<BriefingItem> {
    const [briefingItem] = await db.insert(briefingItems).values(item).returning();
    return briefingItem;
  }

  async markBriefingItemRead(id: number): Promise<void> {
    await db.update(briefingItems).set({ isRead: true }).where(eq(briefingItems.id, id));
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async getAuditLogs(organizationId?: number, limit: number = 100): Promise<AuditLog[]> {
    // For org filtering, would need to join with users
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // System Settings
  async getSystemSettings(organizationId: number): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings)
      .where(eq(systemSettings.organizationId, organizationId));
  }

  async getSystemSetting(organizationId: number, key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings)
      .where(and(eq(systemSettings.organizationId, organizationId), eq(systemSettings.settingKey, key)));
    return setting || undefined;
  }

  async upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(setting.organizationId!, setting.settingKey);
    if (existing) {
      const [updated] = await db.update(systemSettings)
        .set({ settingValue: setting.settingValue, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [result] = await db.insert(systemSettings).values(setting).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
