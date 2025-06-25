import {
  users,
  tasks,
  taskCollections,
  type User,
  type UpsertUser,
  type Task,
  type InsertTask,
  type TaskCollection,
  type InsertTaskCollection,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Task operations
  getTasks(userId: string, filters?: {
    completed?: boolean;
    category?: string;
    priority?: string;
  }): Promise<Task[]>;
  getTask(id: number, userId: string): Promise<Task | undefined>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<boolean>;
  completeTask(id: number, userId: string): Promise<Task | undefined>;
  
  // Task collection operations
  getTaskCollections(userId: string): Promise<TaskCollection[]>;
  createTaskCollection(userId: string, collection: InsertTaskCollection): Promise<TaskCollection>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Language class operations
  async getLanguageClasses(filters?: { 
    language?: string; 
    level?: string; 
    type?: string; 
    location?: string; 
    maxPrice?: number;
  }): Promise<(LanguageClass & { nextSession?: ClassSession; availableSpots?: number })[]> {
    const conditions = [eq(languageClasses.isActive, true)];
    
    if (filters?.language) {
      conditions.push(eq(languageClasses.language, filters.language));
    }
    if (filters?.level) {
      conditions.push(eq(languageClasses.level, filters.level as any));
    }
    if (filters?.type) {
      conditions.push(eq(languageClasses.type, filters.type as any));
    }
    if (filters?.location) {
      conditions.push(sql`${languageClasses.location} ILIKE ${'%' + filters.location + '%'}`);
    }
    if (filters?.maxPrice) {
      conditions.push(lte(languageClasses.price, filters.maxPrice));
    }
    
    const classes = await db
      .select()
      .from(languageClasses)
      .where(and(...conditions))
      .orderBy(asc(languageClasses.title));
    
    // Get next session for each class
    const enrichedClasses = await Promise.all(
      classes.map(async (classItem) => {
        const [nextSession] = await db
          .select()
          .from(classSessions)
          .where(
            and(
              eq(classSessions.classId, classItem.id),
              gte(classSessions.startTime, new Date()),
              eq(classSessions.status, 'scheduled')
            )
          )
          .orderBy(asc(classSessions.startTime))
          .limit(1);
        
        return {
          ...classItem,
          nextSession,
          availableSpots: nextSession?.availableSpots || 0,
        };
      })
    );
    
    return enrichedClasses;
  }

  async getLanguageClass(id: number): Promise<LanguageClass | undefined> {
    const [classItem] = await db
      .select()
      .from(languageClasses)
      .where(eq(languageClasses.id, id));
    return classItem;
  }

  async createLanguageClass(classData: InsertLanguageClass): Promise<LanguageClass> {
    const [newClass] = await db
      .insert(languageClasses)
      .values(classData)
      .returning();
    return newClass;
  }

  // Class session operations
  async getClassSessions(classId: number): Promise<ClassSession[]> {
    return await db
      .select()
      .from(classSessions)
      .where(eq(classSessions.classId, classId))
      .orderBy(asc(classSessions.startTime));
  }

  async getUpcomingSessions(filters?: { 
    language?: string; 
    startDate?: Date; 
    endDate?: Date;
  }): Promise<(ClassSession & { class: LanguageClass })[]> {
    const conditions = [
      gte(classSessions.startTime, filters?.startDate || new Date()),
      eq(classSessions.status, 'scheduled'),
      eq(languageClasses.isActive, true)
    ];
    
    if (filters?.endDate) {
      conditions.push(lte(classSessions.startTime, filters.endDate));
    }
    if (filters?.language) {
      conditions.push(eq(languageClasses.language, filters.language));
    }
    
    const sessions = await db
      .select({
        id: classSessions.id,
        classId: classSessions.classId,
        startTime: classSessions.startTime,
        endTime: classSessions.endTime,
        availableSpots: classSessions.availableSpots,
        isRecurring: classSessions.isRecurring,
        recurringPattern: classSessions.recurringPattern,
        status: classSessions.status,
        createdAt: classSessions.createdAt,
        class: languageClasses,
      })
      .from(classSessions)
      .innerJoin(languageClasses, eq(classSessions.classId, languageClasses.id))
      .where(and(...conditions))
      .orderBy(asc(classSessions.startTime));
    
    return sessions as (ClassSession & { class: LanguageClass })[];
  }

  async createClassSession(sessionData: InsertClassSession): Promise<ClassSession> {
    const [newSession] = await db
      .insert(classSessions)
      .values(sessionData)
      .returning();
    return newSession;
  }

  async updateSessionAvailability(sessionId: number, spotsChange: number): Promise<boolean> {
    const result = await db
      .update(classSessions)
      .set({
        availableSpots: sql`${classSessions.availableSpots} + ${spotsChange}`,
      })
      .where(eq(classSessions.id, sessionId));
    return (result.rowCount || 0) > 0;
  }

  // User booking operations
  async getUserBookings(userId: string): Promise<(UserBooking & { session: ClassSession & { class: LanguageClass } })[]> {
    const bookings = await db
      .select({
        id: userBookings.id,
        userId: userBookings.userId,
        sessionId: userBookings.sessionId,
        status: userBookings.status,
        bookedAt: userBookings.bookedAt,
        notes: userBookings.notes,
        session: {
          id: classSessions.id,
          classId: classSessions.classId,
          startTime: classSessions.startTime,
          endTime: classSessions.endTime,
          availableSpots: classSessions.availableSpots,
          isRecurring: classSessions.isRecurring,
          recurringPattern: classSessions.recurringPattern,
          status: classSessions.status,
          createdAt: classSessions.createdAt,
          class: languageClasses,
        },
      })
      .from(userBookings)
      .innerJoin(classSessions, eq(userBookings.sessionId, classSessions.id))
      .innerJoin(languageClasses, eq(classSessions.classId, languageClasses.id))
      .where(eq(userBookings.userId, userId))
      .orderBy(desc(classSessions.startTime));
    
    return bookings as (UserBooking & { session: ClassSession & { class: LanguageClass } })[];
  }

  async createBooking(userId: string, booking: InsertUserBooking): Promise<UserBooking> {
    const [newBooking] = await db
      .insert(userBookings)
      .values({ ...booking, userId })
      .returning();
    
    // Update available spots
    await this.updateSessionAvailability(booking.sessionId, -1);
    
    return newBooking;
  }

  async cancelBooking(bookingId: number, userId: string): Promise<boolean> {
    // Get the booking first to update session availability
    const [booking] = await db
      .select()
      .from(userBookings)
      .where(and(eq(userBookings.id, bookingId), eq(userBookings.userId, userId)));
    
    if (!booking) return false;
    
    const result = await db
      .update(userBookings)
      .set({ status: 'cancelled' })
      .where(and(eq(userBookings.id, bookingId), eq(userBookings.userId, userId)));
    
    if ((result.rowCount || 0) > 0) {
      // Return the spot to available inventory
      await this.updateSessionAvailability(booking.sessionId, 1);
      return true;
    }
    
    return false;
  }

  // User reminder operations
  async getUserReminders(userId: string, unreadOnly?: boolean): Promise<UserReminder[]> {
    const conditions = [eq(userReminders.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(userReminders.isRead, false));
    }
    
    return await db
      .select()
      .from(userReminders)
      .where(and(...conditions))
      .orderBy(desc(userReminders.createdAt));
  }

  async createReminder(userId: string, reminder: InsertUserReminder): Promise<UserReminder> {
    const [newReminder] = await db
      .insert(userReminders)
      .values({ ...reminder, userId })
      .returning();
    return newReminder;
  }

  async markReminderAsRead(reminderId: number, userId: string): Promise<boolean> {
    const result = await db
      .update(userReminders)
      .set({ isRead: true })
      .where(and(eq(userReminders.id, reminderId), eq(userReminders.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [upsertedPreferences] = await db
      .insert(userPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedPreferences;
  }
}

export const storage = new DatabaseStorage();
