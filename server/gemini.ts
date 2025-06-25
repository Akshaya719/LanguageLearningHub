import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedMinutes: number;
}

export async function generateTasksFromTopic(topic: string): Promise<GeneratedTask[]> {
  try {
    const prompt = `Generate 5 concise, actionable tasks for learning about "${topic}". 
    
    For each task, provide:
    - A clear, specific title (max 60 characters)
    - A brief description explaining what to do (max 150 characters)
    - A category from: general, work, learning, personal, health, finance
    - A priority level: low, medium, high, urgent
    - Estimated time in minutes (15-120 minutes)
    
    Return ONLY a JSON array with this exact format:
    [
      {
        "title": "Task title here",
        "description": "Brief description of what to do",
        "category": "learning",
        "priority": "medium",
        "estimatedMinutes": 30
      }
    ]
    
    Make tasks practical and actionable. Avoid generic advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { 
                type: "string",
                enum: ["general", "work", "learning", "personal", "health", "finance"]
              },
              priority: {
                type: "string", 
                enum: ["low", "medium", "high", "urgent"]
              },
              estimatedMinutes: { type: "number" }
            },
            required: ["title", "description", "category", "priority", "estimatedMinutes"]
          }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const tasks: GeneratedTask[] = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!Array.isArray(tasks) || tasks.length !== 5) {
      throw new Error("Invalid response format from Gemini API");
    }

    return tasks;
  } catch (error) {
    console.error("Error generating tasks:", error);
    throw new Error(`Failed to generate tasks: ${error}`);
  }
}

export async function generateTaskSuggestions(completedTasks: string[]): Promise<string[]> {
  try {
    const prompt = `Based on these completed tasks: ${completedTasks.join(", ")}
    
    Suggest 3 related topics that would be good to learn next. Each suggestion should be a short phrase (2-4 words).
    
    Return ONLY a JSON array of strings:
    ["Topic 1", "Topic 2", "Topic 3"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      return [];
    }

    const suggestions: string[] = JSON.parse(rawJson);
    return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}