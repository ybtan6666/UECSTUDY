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
  console.log("Seeding database...")

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
      name: "Dr. Lim Wei Ming",
      password: teacher1Password,
      role: "TEACHER",
      uniqueId: "UEC-TEA-0001",
      avatar: generateAvatar("Dr. Lim Wei Ming"),
    },
  })

  const teacher2Password = await bcrypt.hash("teacher123", 10)
  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@uec.com" },
    update: {},
    create: {
      email: "teacher2@uec.com",
      name: "Ms. Tan Mei Ling",
      password: teacher2Password,
      role: "TEACHER",
      uniqueId: "UEC-TEA-0002",
      avatar: generateAvatar("Ms. Tan Mei Ling"),
    },
  })

  // Create students
  const student1Password = await bcrypt.hash("student123", 10)
  const student1 = await prisma.user.upsert({
    where: { email: "student1@uec.com" },
    update: {},
    create: {
      email: "student1@uec.com",
      name: "Ahmad bin Abdullah",
      password: student1Password,
      role: "STUDENT",
      uniqueId: "UEC-STU-0001",
      avatar: generateAvatar("Ahmad bin Abdullah"),
    },
  })

  const student2Password = await bcrypt.hash("student123", 10)
  const student2 = await prisma.user.upsert({
    where: { email: "student2@uec.com" },
    update: {},
    create: {
      email: "student2@uec.com",
      name: "Lee Xiao Hui",
      password: student2Password,
      role: "STUDENT",
      uniqueId: "UEC-STU-0002",
      avatar: generateAvatar("Lee Xiao Hui"),
    },
  })

  // Create sample math questions
  const deadline1 = new Date()
  deadline1.setHours(deadline1.getHours() + 24)

  const question1 = await prisma.mathQuestion.create({
    data: {
      questionText: "How do I solve quadratic equations using the quadratic formula?",
      studentId: student1.id,
      teacherId: teacher1.id,
      price: 10.0,
      expectedResponseHours: 24,
      deadline: deadline1,
      status: "PENDING",
      paymentHeld: true,
    },
  })

  const deadline2 = new Date()
  deadline2.setHours(deadline2.getHours() + 6)

  const question2 = await prisma.mathQuestion.create({
    data: {
      questionText: "Can you explain the concept of derivatives in calculus?",
      studentId: student2.id,
      price: 15.0,
      expectedResponseHours: 6,
      deadline: deadline2,
      status: "PENDING",
      paymentHeld: true,
    },
  })

  // Create completed question (for endorsements demo)
  const completedQuestion = await prisma.mathQuestion.create({
    data: {
      questionText: "What is the derivative of x^2?",
      studentId: student1.id,
      teacherId: teacher1.id,
      price: 8.0,
      expectedResponseHours: 24,
      deadline: new Date(Date.now() - 1000),
      status: "COMPLETED",
      paymentHeld: false,
      paymentReleased: true,
      platformFee: 1.2,
      acceptedAt: new Date(Date.now() - 86400000),
      answeredAt: new Date(Date.now() - 43200000),
      completedAt: new Date(Date.now() - 3600000),
      answerText: "The derivative of x^2 is 2x. This follows from the power rule: d/dx(x^n) = n*x^(n-1).",
    },
  })

  // Create endorsement (only if it doesn't exist)
  const existingEndorsement = await prisma.endorsement.findUnique({
    where: {
      studentId_teacherId: {
        studentId: student1.id,
        teacherId: teacher1.id,
      },
    },
  })

  if (!existingEndorsement) {
    await prisma.endorsement.create({
      data: {
        studentId: student1.id,
        teacherId: teacher1.id,
        questionId: completedQuestion.id,
      },
    })
  }

  // Create time slots
  const slot1Start = new Date()
  slot1Start.setDate(slot1Start.getDate() + 1)
  slot1Start.setHours(10, 0, 0, 0)
  const slot1End = new Date(slot1Start)
  slot1End.setHours(11, 0, 0, 0)

  const slot1 = await prisma.timeSlot.create({
    data: {
      teacherId: teacher1.id,
      startTime: slot1Start,
      endTime: slot1End,
      minPrice: 20.0,
      maxStudents: 1,
      minStudents: 1,
      isGroupSession: false,
      status: "AVAILABLE",
    },
  })

  const slot2Start = new Date()
  slot2Start.setDate(slot2Start.getDate() + 2)
  slot2Start.setHours(14, 0, 0, 0)
  const slot2End = new Date(slot2Start)
  slot2End.setHours(15, 30, 0, 0)

  const slot2 = await prisma.timeSlot.create({
    data: {
      teacherId: teacher2.id,
      startTime: slot2Start,
      endTime: slot2End,
      minPrice: 25.0,
      maxStudents: 5,
      minStudents: 3,
      isGroupSession: true,
      status: "AVAILABLE",
    },
  })

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      timeSlotId: slot1.id,
      studentId: student2.id,
      teacherId: teacher1.id,
      topic: "Calculus review for exam",
      expectations: "Explanation of key concepts",
      preferredFormat: "video",
      price: 20.0,
      status: "CONFIRMED",
      paymentHeld: true,
    },
  })

  // Create order logs
  await prisma.orderLog.create({
    data: {
      userId: student1.id,
      questionId: question1.id,
      toStatus: "PENDING",
      action: "CREATE",
      metadata: JSON.stringify({ price: 10.0, expectedResponseHours: 24 }),
    },
  })

  await prisma.orderLog.create({
    data: {
      userId: teacher1.id,
      questionId: completedQuestion.id,
      fromStatus: "PENDING",
      toStatus: "ACCEPTED",
      action: "ACCEPT",
    },
  })

  await prisma.orderLog.create({
    data: {
      userId: teacher1.id,
      questionId: completedQuestion.id,
      fromStatus: "ACCEPTED",
      toStatus: "ANSWERED",
      action: "ANSWER",
    },
  })

  await prisma.orderLog.create({
    data: {
      userId: student1.id,
      questionId: completedQuestion.id,
      fromStatus: "ANSWERED",
      toStatus: "COMPLETED",
      action: "COMPLETE",
      metadata: JSON.stringify({ platformFee: 1.2, teacherPayout: 6.8 }),
    },
  })

  await prisma.orderLog.create({
    data: {
      userId: student2.id,
      bookingId: booking.id,
      toStatus: "CONFIRMED",
      action: "CREATE",
      metadata: JSON.stringify({ price: 20.0 }),
    },
  })

  console.log("Seed completed!")
  console.log("Admin: admin@uec.com / admin123")
  console.log("Teacher 1: teacher1@uec.com / teacher123")
  console.log("Teacher 2: teacher2@uec.com / teacher123")
  console.log("Student 1: student1@uec.com / student123")
  console.log("Student 2: student2@uec.com / student123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
