// Seeds the local demo environment: two accounts, course categories and a few
// courses with lessons so every student and admin flow can be tested.
// Safe to run repeatedly; records are upserted by fixed id.

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const db = new PrismaClient();

const hash = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};

const categories = [
  "Computer Science",
  "Engineering",
  "Mass Communication",
  "Mathematics",
  "Software Development",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Information Technology",
  "Business",
  "Finance",
  "Marketing",
  "Law",
  "Communication",
  "Graphic Design",
  "UI and UX Design",
  "Photography",
  "Personal Development",
  "Project Management",
  "Web Development",
];

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

async function upsertUser({ id, name, email, password, role, username, displayName, headline, bio }) {
  await db.demoUser.upsert({
    where: { id },
    update: { name, email, passwordHash: hash(password), role },
    create: { id, name, email, passwordHash: hash(password), role },
  });
  await db.userProfile.upsert({
    where: { userId: id },
    update: { username, displayName },
    create: { userId: id, username, displayName },
  });
  if (headline) {
    await db.teacherProfile.upsert({
      where: { userId: id },
      update: { headline, bio },
      create: { userId: id, headline, bio, expertise: ["Teaching", "Curriculum design"] },
    });
  }
}

async function upsertCourse(course) {
  const { chapters, id, ...data } = course;
  await db.course.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
  for (const chapter of chapters) {
    const { id: chapterId, ...chapterData } = chapter;
    await db.chapter.upsert({
      where: { id: chapterId },
      update: chapterData,
      create: chapter,
    });
  }
}

async function main() {
  for (const name of categories) {
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  await upsertUser({
    id: "demo-admin",
    name: "Amara Okafor",
    email: "admin@sabiplex.dev",
    password: "admin123",
    role: "ADMIN",
    username: "amara",
    displayName: "Amara Okafor",
    headline: "Product engineer and educator",
    bio: "I teach practical software skills to students who want to build real things. Ten years building products, five years teaching.",
  });

  await upsertUser({
    id: "demo-student",
    name: "Tunde Balogun",
    email: "student@sabiplex.dev",
    password: "student123",
    role: "STUDENT",
    username: "tunde",
    displayName: "Tunde Balogun",
  });

  const cs = await db.category.findUnique({ where: { name: "Computer Science" } });
  const web = await db.category.findUnique({ where: { name: "Web Development" } });
  const design = await db.category.findUnique({ where: { name: "UI and UX Design" } });

  await upsertCourse({
    id: "demo-course-free",
    userId: "demo-admin",
    title: "Algorithms Foundations",
    description:
      "<p>Start with the ideas behind every program you will ever write. We cover searching, sorting and complexity in plain language, with small exercises after each lesson.</p><p>This course is completely free so you can see how Sabiplex lessons feel.</p>",
    imageUrl: "/course-placeholder.svg",
    price: 0,
    isPublished: true,
    categoryId: cs ? cs.id : null,
    chapters: [
      {
        id: "demo-free-ch1",
        courseId: "demo-course-free",
        title: "Why algorithms matter",
        description: "<p>An introduction to algorithmic thinking: what an algorithm is, why efficiency matters, and how to reason about the steps a program takes.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 1,
        isPublished: true,
        isFree: true,
      },
      {
        id: "demo-free-ch2",
        courseId: "demo-course-free",
        title: "Searching a list",
        description: "<p>Linear search versus binary search. We walk through both, then look at when the sorted-list shortcut is worth it.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 2,
        isPublished: true,
        isFree: false,
      },
      {
        id: "demo-free-ch3",
        courseId: "demo-course-free",
        title: "Sorting step by step",
        description: "<p>Bubble sort, insertion sort and merge sort compared on the same small dataset.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 3,
        isPublished: true,
        isFree: false,
      },
    ],
  });

  await upsertCourse({
    id: "demo-course-paid",
    userId: "demo-admin",
    title: "Design Systems for Beginners",
    description:
      "<p>Build a reusable design system: colours, type scales, spacing and components. You will leave with a small component library you can use in your own projects.</p>",
    imageUrl: "/course-placeholder.svg",
    price: 7500,
    isPublished: true,
    categoryId: design ? design.id : null,
    chapters: [
      {
        id: "demo-paid-ch1",
        courseId: "demo-course-paid",
        title: "What a design system is",
        description: "<p>A free preview lesson: the pieces of a design system and how teams use them.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 1,
        isPublished: true,
        isFree: true,
      },
      {
        id: "demo-paid-ch2",
        courseId: "demo-course-paid",
        title: "Colour and type scales",
        description: "<p>Choosing a palette and a type scale that stay readable at every size.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 2,
        isPublished: true,
        isFree: false,
      },
      {
        id: "demo-paid-ch3",
        courseId: "demo-course-paid",
        title: "Building reusable components",
        description: "<p>Turning the tokens into buttons, inputs and cards with consistent behaviour.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 3,
        isPublished: true,
        isFree: false,
      },
    ],
  });

  await upsertCourse({
    id: "demo-course-draft",
    userId: "demo-admin",
    title: "Everyday Web Performance",
    description:
      "<p>A draft course about making ordinary websites fast: images, fonts, and measuring what users actually feel.</p>",
    imageUrl: "/course-placeholder.svg",
    price: 4500,
    isPublished: false,
    categoryId: web ? web.id : null,
    chapters: [
      {
        id: "demo-draft-ch1",
        courseId: "demo-course-draft",
        title: "Measuring what users feel",
        description: "<p>The draft first lesson. Publish this chapter once the video is uploaded.</p>",
        videoUrl: SAMPLE_VIDEO,
        position: 1,
        isPublished: false,
        isFree: false,
      },
    ],
  });

  console.log("Demo data ready:");
  console.log("  admin@sabiplex.dev / admin123   (administrator)");
  console.log("  student@sabiplex.dev / student123 (student)");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
