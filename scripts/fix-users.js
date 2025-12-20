// Force create users if they don't exist
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('Creating/updating users...\n')
  
  const users = [
    {
      email: 'student1@uec.com',
      name: 'Ahmad bin Abdullah',
      password: 'student123',
      role: 'STUDENT',
      uniqueId: 'UEC-STU-0001',
    },
    {
      email: 'student2@uec.com',
      name: 'Lee Xiao Hui',
      password: 'student123',
      role: 'STUDENT',
      uniqueId: 'UEC-STU-0002',
    },
    {
      email: 'teacher1@uec.com',
      name: 'Dr. Lim Wei Ming',
      password: 'teacher123',
      role: 'TEACHER',
      uniqueId: 'UEC-TEA-0001',
    },
    {
      email: 'teacher2@uec.com',
      name: 'Ms. Tan Mei Ling',
      password: 'teacher123',
      role: 'TEACHER',
      uniqueId: 'UEC-TEA-0002',
    },
    {
      email: 'admin@uec.com',
      name: 'Admin User',
      password: 'admin123',
      role: 'ADMIN',
      uniqueId: 'UEC-ADM-0001',
    },
  ]
  
  for (const userData of users) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword, // Update password in case it's wrong
          name: userData.name,
          role: userData.role,
          uniqueId: userData.uniqueId,
        },
        create: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          uniqueId: userData.uniqueId,
          avatar: userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        },
      })
      
      console.log(`✅ ${userData.email} - ${user.role}`)
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message)
    }
  }
  
  console.log('\n✅ All users created/updated!')
  console.log('\nTest credentials:')
  console.log('  Student: student1@uec.com / student123')
  console.log('  Teacher: teacher1@uec.com / teacher123')
  console.log('  Admin: admin@uec.com / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

