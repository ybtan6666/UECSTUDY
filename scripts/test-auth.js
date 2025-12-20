// Test authentication
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing authentication...\n')
    
    // Test student1
    const student = await prisma.user.findUnique({
      where: { email: 'student1@uec.com' }
    })
    
    if (!student) {
      console.log('❌ student1@uec.com not found')
    } else {
      console.log(`✅ Found: ${student.email} (${student.name})`)
      const isValid = await bcrypt.compare('student123', student.password)
      console.log(`   Password check: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
    }
    
    // Test teacher1
    const teacher = await prisma.user.findUnique({
      where: { email: 'teacher1@uec.com' }
    })
    
    if (!teacher) {
      console.log('❌ teacher1@uec.com not found')
    } else {
      console.log(`✅ Found: ${teacher.email} (${teacher.name})`)
      const isValid = await bcrypt.compare('teacher123', teacher.password)
      console.log(`   Password check: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()

