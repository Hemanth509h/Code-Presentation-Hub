import { db } from "@workspace/db";
import { assessmentsTable, questionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const assessments = [
  {
    assessmentId: "coding-basics",
    title: "Coding Fundamentals",
    type: "coding",
    description: "Test your knowledge of core programming concepts including algorithms, data structures, and problem-solving.",
    durationMinutes: 45,
    maxScore: 100,
    questions: [
      { questionId: "c1", text: "What is the time complexity of binary search?", type: "multiple_choice", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctOption: 1, points: 10 },
      { questionId: "c2", text: "Which data structure uses LIFO (Last In, First Out) ordering?", type: "multiple_choice", options: ["Queue", "Linked List", "Stack", "Tree"], correctOption: 2, points: 10 },
      { questionId: "c3", text: "What does SQL stand for?", type: "multiple_choice", options: ["Structured Query Language", "Sequential Query Logic", "System Query Layer", "Simple Queue List"], correctOption: 0, points: 10 },
      { questionId: "c4", text: "Which sorting algorithm has the best average-case time complexity?", type: "multiple_choice", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctOption: 2, points: 10 },
      { questionId: "c5", text: "What is the purpose of a hash table?", type: "multiple_choice", options: ["Store sorted data", "Enable O(1) average lookup by key", "Traverse elements in order", "Balance binary trees"], correctOption: 1, points: 10 },
      { questionId: "c6", text: "Write a brief description of what recursion is and give a real-world analogy.", type: "short_answer", options: null, correctOption: null, points: 20 },
      { questionId: "c7", text: "In object-oriented programming, what does 'encapsulation' mean?", type: "multiple_choice", options: ["Creating multiple instances of a class", "Hiding internal state and requiring all interaction through methods", "Inheriting methods from a parent class", "Overriding methods in a subclass"], correctOption: 1, points: 10 },
      { questionId: "c8", text: "What is the difference between an interface and an abstract class? Write your answer below.", type: "short_answer", options: null, correctOption: null, points: 20 },
    ],
  },
  {
    assessmentId: "aptitude-general",
    title: "Logical Aptitude Test",
    type: "aptitude",
    description: "Evaluate analytical thinking, logical reasoning, and quantitative aptitude skills.",
    durationMinutes: 30,
    maxScore: 100,
    questions: [
      { questionId: "a1", text: "If a train travels 300 km in 5 hours, what is its average speed?", type: "multiple_choice", options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], correctOption: 2, points: 15 },
      { questionId: "a2", text: "Complete the series: 2, 6, 12, 20, 30, ?", type: "multiple_choice", options: ["36", "40", "42", "44"], correctOption: 2, points: 15 },
      { questionId: "a3", text: "If all roses are flowers and some flowers fade quickly, which statement must be true?", type: "multiple_choice", options: ["All roses fade quickly", "Some roses may or may not fade quickly", "No roses fade quickly", "All flowers are roses"], correctOption: 1, points: 15 },
      { questionId: "a4", text: "A project takes 8 people 12 days to complete. How many days would it take 16 people?", type: "multiple_choice", options: ["4 days", "6 days", "8 days", "10 days"], correctOption: 1, points: 15 },
      { questionId: "a5", text: "What comes next in the pattern? Circle, Triangle, Square, Pentagon, ?", type: "multiple_choice", options: ["Hexagon", "Heptagon", "Octagon", "Rectangle"], correctOption: 0, points: 15 },
      { questionId: "a6", text: "Describe a situation where you used logical reasoning to solve a complex problem. What was your approach?", type: "short_answer", options: null, correctOption: null, points: 25 },
    ],
  },
  {
    assessmentId: "technical-system-design",
    title: "System Design & Architecture",
    type: "technical",
    description: "Test your understanding of system architecture, scalability, databases, and software engineering principles.",
    durationMinutes: 60,
    maxScore: 100,
    questions: [
      { questionId: "t1", text: "Which HTTP method is idempotent and used to retrieve data?", type: "multiple_choice", options: ["POST", "GET", "PUT", "PATCH"], correctOption: 1, points: 10 },
      { questionId: "t2", text: "What is the CAP theorem in distributed systems?", type: "multiple_choice", options: ["Consistency, Availability, Partition tolerance - you can only guarantee 2 of 3", "Cache, API, Protocol - a trilemma for web services", "Compute, Access, Processing - fundamental cloud constraints", "Concurrent, Atomic, Persistent - ACID properties for databases"], correctOption: 0, points: 15 },
      { questionId: "t3", text: "What is the purpose of a load balancer?", type: "multiple_choice", options: ["Encrypt network traffic", "Distribute incoming traffic across multiple servers", "Store cached responses", "Monitor database performance"], correctOption: 1, points: 10 },
      { questionId: "t4", text: "In REST APIs, what does HTTP status code 401 mean?", type: "multiple_choice", options: ["Not Found", "Internal Server Error", "Unauthorized", "Bad Request"], correctOption: 2, points: 10 },
      { questionId: "t5", text: "What is the difference between SQL and NoSQL databases? When would you choose each?", type: "short_answer", options: null, correctOption: null, points: 25 },
      { questionId: "t6", text: "Which design pattern separates the construction of a complex object from its representation?", type: "multiple_choice", options: ["Observer", "Builder", "Factory", "Singleton"], correctOption: 1, points: 10 },
      { questionId: "t7", text: "Design a URL shortening service like bit.ly. Describe the key components and how they interact.", type: "short_answer", options: null, correctOption: null, points: 20 },
    ],
  },
];

async function seed() {
  console.log("Seeding assessments...");
  for (const a of assessments) {
    const existing = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.assessmentId, a.assessmentId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(assessmentsTable).values({
        assessmentId: a.assessmentId,
        title: a.title,
        type: a.type,
        description: a.description,
        durationMinutes: a.durationMinutes,
        maxScore: a.maxScore,
      });

      for (const q of a.questions) {
        const existingQ = await db
          .select()
          .from(questionsTable)
          .where(eq(questionsTable.questionId, q.questionId))
          .limit(1);
        if (existingQ.length === 0) {
          await db.insert(questionsTable).values({
            questionId: q.questionId,
            assessmentId: a.assessmentId,
            text: q.text,
            type: q.type,
            options: q.options ?? undefined,
            correctOption: q.correctOption ?? undefined,
            points: q.points,
          });
        }
      }
      console.log(`Seeded: ${a.title}`);
    } else {
      console.log(`Already exists: ${a.title}`);
    }
  }
  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
