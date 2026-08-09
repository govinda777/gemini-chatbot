import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  skillId: varchar("skillId", { length: 32 }).notNull().default("flights"),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export const reservation = pgTable("Reservation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  details: json("details").notNull(),
  hasCompletedPayment: boolean("hasCompletedPayment").notNull().default(false),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Reservation = InferSelectModel<typeof reservation>;

// ADR-0002: Table for capturing Leads
export const lead = pgTable("Lead", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  userId: uuid("userId").references(() => user.id),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  climbingExperience: varchar("climbingExperience", { length: 64 }).notNull(), // iniciante, intermediário, avançado
  interestDetails: varchar("interestDetails", { length: 1024 }),
});

export type Lead = InferSelectModel<typeof lead>;

// ADR-0002: Table for collecting user Feedback
export const feedback = pgTable("Feedback", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  rating: integer("rating").notNull(), // 1 to 5
  comment: varchar("comment", { length: 1024 }),
  category: varchar("category", { length: 64 }).notNull(), // e.g., 'sistema', 'servico', 'instrutores'
});

export type Feedback = InferSelectModel<typeof feedback>;
