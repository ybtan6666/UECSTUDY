import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function generateAvatar(name: string): string {
  const names = name.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@uec.com" },
    update: {},
    create: {
      email: "admin@uec.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      uniqueId: "UEC-ADM-0001",
      avatar: generateAvatar("Admin User"),
    },
  })

  // Create teachers
  const teacher1Password = await bcrypt.hash("teacher123", 10)
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@uec.com" },
    update: {},
    create: {
      email: "teacher1@uec.com",
      name: "Dr. Lim",
      password: teacher1Password,
      role: "TEACHER",
      uniqueId: "UEC-TEA-0001",
      avatar: generateAvatar("Dr. Lim"),
    },
  })

  const teacher2Password = await bcrypt.hash("teacher123", 10)
  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@uec.com" },
    update: {},
    create: {
      email: "teacher2@uec.com",
      name: "Ms. Tan",
      password: teacher2Password,
      role: "TEACHER",
      uniqueId: "UEC-TEA-0002",
      avatar: generateAvatar("Ms. Tan"),
    },
  })

  // Create students
  const student1Password = await bcrypt.hash("student123", 10)
  const student1 = await prisma.user.upsert({
    where: { email: "student1@uec.com" },
    update: {},
    create: {
      email: "student1@uec.com",
      name: "Ali",
      password: student1Password,
      role: "STUDENT",
      uniqueId: "UEC-STU-0001",
      avatar: generateAvatar("Ali"),
      virtualCoins: 50,
    },
  })

  const student2Password = await bcrypt.hash("student123", 10)
  const student2 = await prisma.user.upsert({
    where: { email: "student2@uec.com" },
    update: {},
    create: {
      email: "student2@uec.com",
      name: "Siti",
      password: student2Password,
      role: "STUDENT",
      uniqueId: "UEC-STU-0002",
      avatar: generateAvatar("Siti"),
      virtualCoins: 30,
    },
  })

  // Create challenges first
  const challenge1 = await prisma.challenge.create({
    data: {
      title: "Math Quiz Level 1",
      subject: "Mathematics",
      coinReward: 20,
      teacherId: teacher1.id,
      questions: {
        create: [
          {
            question: "What is 2 + 2?",
            optionA: "3",
            optionB: "4",
            optionC: "5",
            optionD: "6",
            correctAnswer: "B",
            order: 0,
          },
          {
            question: "What is 5 × 3?",
            optionA: "10",
            optionB: "15",
            optionC: "20",
            optionD: "25",
            correctAnswer: "B",
            order: 1,
          },
        ],
      },
    },
  })

  const challenge2 = await prisma.challenge.create({
    data: {
      title: "English Grammar Test",
      subject: "English",
      coinReward: 15,
      teacherId: teacher2.id,
      questions: {
        create: [
          {
            question: "Which is correct?",
            optionA: "I am go",
            optionB: "I am going",
            optionC: "I am went",
            optionD: "I am goes",
            correctAnswer: "B",
            order: 0,
          },
        ],
      },
    },
  })

  // Create courses (after challenges)
  const course1 = await prisma.course.create({
    data: {
      title: "Mathematics Fundamentals",
      subject: "Mathematics",
      description: "Learn the basics of mathematics including algebra, geometry, and calculus.",
      price: 99.99,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      externalUrl: "https://example.com/math-resources",
      teacherId: teacher1.id,
    },
  })

  // Link challenge to course
  await prisma.courseChallenge.create({
    data: {
      courseId: course1.id,
      challengeId: challenge1.id,
      order: 0,
    },
  })

  const course2 = await prisma.course.create({
    data: {
      title: "English Literature",
      subject: "English",
      description: "Explore classic and modern English literature.",
      price: 79.99,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      teacherId: teacher2.id,
    },
  })

  // Link challenge to course
  await prisma.courseChallenge.create({
    data: {
      courseId: course2.id,
      challengeId: challenge2.id,
      order: 0,
    },
  })

  // Add some ratings
  await prisma.rating.create({
    data: {
      userId: student1.id,
      courseId: course1.id,
      rating: 5,
      review: "Excellent course! Very helpful.",
    },
  })

  await prisma.rating.create({
    data: {
      userId: student1.id,
      challengeId: challenge1.id,
      rating: 4,
      review: "Good challenge, learned a lot.",
    },
  })

  // Create a paid question
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 7)

  const question1 = await prisma.paidQuestion.create({
    data: {
      question: "How do I solve quadratic equations?",
      studentId: student1.id,
      teacherId: teacher1.id,
      courseId: course1.id,
      price: 25.00,
      deadline,
    },
  })

  // Create time slot
  const slotStart = new Date()
  slotStart.setDate(slotStart.getDate() + 1)
  slotStart.setHours(14, 0, 0, 0)
  const slotEnd = new Date(slotStart)
  slotEnd.setHours(15, 0, 0, 0)

  const timeSlot = await prisma.timeSlot.create({
    data: {
      teacherId: teacher1.id,
      startTime: slotStart,
      endTime: slotEnd,
      topic: "Mathematics Consultation",
      maxStudents: 5,
      zoomLink: "https://zoom.us/j/123456789",
    },
  })

  console.log("Seed data created successfully!")
  console.log("Admin: admin@uec.com / admin123")
  console.log("Teacher 1: teacher1@uec.com / teacher123")
  console.log("Teacher 2: teacher2@uec.com / teacher123")
  console.log("Student 1: student1@uec.com / student123")
  console.log("Student 2: student2@uec.com / student123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

