import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, reservation, lead, feedback, Lead, Feedback } from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

const db = new Proxy({} as any, {
  get(target, prop) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is missing.");
    }
    if (!dbInstance) {
      const url = process.env.POSTGRES_URL;
      const connectionString = url.includes("sslmode") ? url : `${url}?sslmode=require`;
      client = postgres(connectionString);
      dbInstance = drizzle(client);
    }
    const value = (dbInstance as any)[prop];
    return typeof value === 'function' ? value.bind(dbInstance) : value;
  }
});

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
  skillId = "flights",
}: {
  id: string;
  messages: any;
  userId: string;
  skillId?: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
          .update(chat)
          .set({
            messages: JSON.stringify(messages),
            skillId,
          })
          .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
      skillId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  return await db.insert(reservation).values({
    id,
    createdAt: new Date(),
    userId,
    hasCompletedPayment: false,
    details: JSON.stringify(details),
  });
}

export async function getReservationById({ id }: { id: string }) {
  const [selectedReservation] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id));

  return selectedReservation;
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  return await db
    .update(reservation)
    .set({
      hasCompletedPayment,
    })
    .where(eq(reservation.id, id));
}

// ADR-0002 Queries
export async function createLead({
  name,
  email,
  whatsapp,
  climbingExperience,
  interestDetails,
  userId,
}: {
  name: string;
  email: string;
  whatsapp: string;
  climbingExperience: string;
  interestDetails?: string;
  userId?: string;
}) {
  try {
    return await db.insert(lead).values({
      createdAt: new Date(),
      userId,
      name,
      email,
      whatsapp,
      climbingExperience,
      interestDetails,
    });
  } catch (error) {
    console.error("Failed to create lead in database", error);
    throw error;
  }
}

export async function createFeedback({
  userId,
  rating,
  comment,
  category,
}: {
  userId: string;
  rating: number;
  comment?: string;
  category: string;
}) {
  try {
    return await db.insert(feedback).values({
      createdAt: new Date(),
      userId,
      rating,
      comment,
      category,
    });
  } catch (error) {
    console.error("Failed to create feedback in database", error);
    throw error;
  }
}
