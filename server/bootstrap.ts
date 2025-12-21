import { db } from "./db";
import { roles, organizations, quotes } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function bootstrapDatabase() {
  console.log("Bootstrapping database...");

  try {
    await db.execute(sql`
      INSERT INTO roles (name, description, permissions) VALUES 
        ('admin', 'Full system access', '{"all": true}'::jsonb),
        ('manager', 'Department management', '{"manage_users": true}'::jsonb),
        ('user', 'Standard user access', '{"view_briefing": true}'::jsonb),
        ('contractor', 'Limited contractor access', '{"view_assigned": true}'::jsonb)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log("Roles initialized");

    await db.execute(sql`
      INSERT INTO organizations (name, domain, is_active) VALUES 
        ('Seward County Community College', 'sccc.edu', true)
      ON CONFLICT (domain) DO NOTHING
    `);
    console.log("Organization initialized");

    await db.execute(sql`
      INSERT INTO quotes (text, author, category, is_active) VALUES 
        ('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela', 'Education', true),
        ('The function of education is to teach one to think intensively and to think critically.', 'Martin Luther King Jr.', 'Education', true),
        ('Leadership is not about being in charge. It is about taking care of those in your charge.', 'Simon Sinek', 'Leadership', true)
      ON CONFLICT DO NOTHING
    `);
    console.log("Initial quotes added");

    console.log("Database bootstrap complete");
  } catch (error) {
    console.error("Bootstrap error:", error);
  }
}
