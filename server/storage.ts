import { 
  users, 
  emailAccounts, 
  briefingItems,
  type User, 
  type InsertUser,
  type EmailAccount,
  type InsertEmailAccount,
  type BriefingItem,
  type InsertBriefingItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getEmailAccounts(userId: string): Promise<EmailAccount[]>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccountSync(id: number, lastSyncedAt: Date): Promise<void>;
  
  getBriefingItems(userId: string, limit?: number): Promise<BriefingItem[]>;
  createBriefingItem(item: InsertBriefingItem): Promise<BriefingItem>;
  markBriefingItemRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
    return await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.isActive, true)));
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [emailAccount] = await db
      .insert(emailAccounts)
      .values(account)
      .returning();
    return emailAccount;
  }

  async updateEmailAccountSync(id: number, lastSyncedAt: Date): Promise<void> {
    await db
      .update(emailAccounts)
      .set({ lastSyncedAt })
      .where(eq(emailAccounts.id, id));
  }

  async getBriefingItems(userId: string, limit: number = 50): Promise<BriefingItem[]> {
    return await db
      .select()
      .from(briefingItems)
      .where(eq(briefingItems.userId, userId))
      .orderBy(desc(briefingItems.timestamp))
      .limit(limit);
  }

  async createBriefingItem(item: InsertBriefingItem): Promise<BriefingItem> {
    const [briefingItem] = await db
      .insert(briefingItems)
      .values(item)
      .returning();
    return briefingItem;
  }

  async markBriefingItemRead(id: number): Promise<void> {
    await db
      .update(briefingItems)
      .set({ isRead: true })
      .where(eq(briefingItems.id, id));
  }
}

export const storage = new DatabaseStorage();
