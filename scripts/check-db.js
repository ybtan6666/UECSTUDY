// Quick script to check database contents
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  try {
    console.log('Checking database...\n')
    
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)
    
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: { email: true, name: true, uniqueId: true }
    })
    console.log(`\nTeachers (${teachers.length}):`)
    teachers.forEach(t => console.log(`  - ${t.email} (${t.name}) - ${t.uniqueId}`))
    
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { email: true, name: true, uniqueId: true }
    })
    console.log(`\nStudents (${students.length}):`)
    students.forEach(s => console.log(`  - ${s.email} (${s.name}) - ${s.uniqueId}`))
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true, uniqueId: true }
    })
    console.log(`\nAdmins (${admins.length}):`)
    admins.forEach(a => console.log(`  - ${a.email} (${a.name}) - ${a.uniqueId}`))
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

check()

