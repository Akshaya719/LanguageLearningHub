import { db } from "./db";
import { languageClasses, classSessions } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Seeding database with sample language classes...");

    // Sample language classes
    const sampleClasses = [
      {
        title: "Spanish Conversation for Beginners",
        description: "Build confidence speaking Spanish in everyday situations. Perfect for beginners who want to practice basic conversations.",
        language: "Spanish",
        level: "beginner" as const,
        type: "conversation" as const,
        instructorName: "Maria Rodriguez",
        location: "Downtown Community Center",
        address: "123 Main St, Downtown",
        price: 2500, // $25.00
        duration: 60,
        maxStudents: 8,
        currentStudents: 3,
        contactEmail: "maria@linguaconnect.com",
        contactPhone: "(555) 123-4567",
        isActive: true,
      },
      {
        title: "French Grammar Workshop",
        description: "Master French grammar fundamentals in this intensive workshop. Covers verb conjugations, articles, and sentence structure.",
        language: "French",
        level: "intermediate" as const,
        type: "workshop" as const,
        instructorName: "Pierre Dubois",
        location: "Language Institute",
        address: "456 Academic Ave, University District",
        price: 4000, // $40.00
        duration: 90,
        maxStudents: 12,
        currentStudents: 7,
        contactEmail: "pierre@languageinstititute.edu",
        contactPhone: "(555) 234-5678",
        isActive: true,
      },
      {
        title: "German for Business Professionals",
        description: "Learn professional German for business settings. Focus on meetings, presentations, and formal communication.",
        language: "German",
        level: "advanced" as const,
        type: "class" as const,
        instructorName: "Hans Mueller",
        location: "Business Center",
        address: "789 Corporate Blvd, Business District",
        price: 6000, // $60.00
        duration: 120,
        maxStudents: 6,
        currentStudents: 4,
        contactEmail: "hans@businesslanguage.com",
        contactPhone: "(555) 345-6789",
        isActive: true,
      },
      {
        title: "Italian Cultural Immersion",
        description: "Explore Italian culture through language. Learn about traditions, cuisine, and history while improving your Italian.",
        language: "Italian",
        level: "intermediate" as const,
        type: "workshop" as const,
        instructorName: "Giulia Rossi",
        location: "Cultural Arts Center",
        address: "321 Arts Plaza, Cultural Quarter",
        price: 3500, // $35.00
        duration: 75,
        maxStudents: 10,
        currentStudents: 6,
        contactEmail: "giulia@culturalcenter.org",
        contactPhone: "(555) 456-7890",
        isActive: true,
      },
      {
        title: "Japanese Beginner's Course",
        description: "Start your Japanese journey with hiragana, basic vocabulary, and simple conversations.",
        language: "Japanese",
        level: "beginner" as const,
        type: "class" as const,
        instructorName: "Yuki Tanaka",
        location: "East Side Language School",
        address: "654 East St, Riverside",
        price: 4500, // $45.00
        duration: 90,
        maxStudents: 8,
        currentStudents: 2,
        contactEmail: "yuki@eastlanguage.com",
        contactPhone: "(555) 567-8901",
        isActive: true,
      },
      {
        title: "Portuguese for Travel",
        description: "Essential Portuguese phrases and vocabulary for travelers. Perfect for those planning trips to Brazil or Portugal.",
        language: "Portuguese",
        level: "beginner" as const,
        type: "workshop" as const,
        instructorName: "Carlos Silva",
        location: "Travel Language Hub",
        address: "987 Explorer Way, Airport District",
        price: 3000, // $30.00
        duration: 60,
        maxStudents: 12,
        currentStudents: 8,
        contactEmail: "carlos@travellanguage.com",
        contactPhone: "(555) 678-9012",
        isActive: true,
      }
    ];

    // Insert classes
    const insertedClasses = await db.insert(languageClasses).values(sampleClasses).returning();
    console.log(`Inserted ${insertedClasses.length} language classes`);

    // Create sessions for each class
    const sessions = [];
    const now = new Date();
    
    for (const classItem of insertedClasses) {
      // Create 3 upcoming sessions for each class
      for (let i = 1; i <= 3; i++) {
        const sessionDate = new Date(now);
        sessionDate.setDate(now.getDate() + (i * 7)); // Weekly sessions
        sessionDate.setHours(14, 0, 0, 0); // 2 PM start time
        
        const endDate = new Date(sessionDate);
        endDate.setMinutes(sessionDate.getMinutes() + classItem.duration);
        
        sessions.push({
          classId: classItem.id,
          startTime: sessionDate,
          endTime: endDate,
          availableSpots: classItem.maxStudents - classItem.currentStudents,
          isRecurring: true,
          recurringPattern: "weekly",
          status: "scheduled" as const,
        });
      }
    }

    const insertedSessions = await db.insert(classSessions).values(sessions).returning();
    console.log(`Inserted ${insertedSessions.length} class sessions`);

    console.log("Database seeding completed successfully!");
    return { classes: insertedClasses, sessions: insertedSessions };
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}