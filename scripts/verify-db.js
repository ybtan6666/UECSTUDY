// Quick script to verify database has users
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking database...\n')
    
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)
    
    if (userCount === 0) {
      console.log('\n❌ Database is empty!')
      console.log('Run: npm run db:seed')
      process.exit(1)
    }
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        uniqueId: true,
      }
    })
    
    console.log('\nUsers in database:')
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - ${u.uniqueId}`)
    })
    
    // Test specific user
    const testUser = await prisma.user.findUnique({
      where: { email: 'student1@uec.com' }
    })
    
    if (testUser) {
      console.log('\n✅ student1@uec.com exists!')
      console.log(`   Name: ${testUser.name}`)
      console.log(`   Role: ${testUser.role}`)
      console.log(`   Password hash: ${testUser.password.substring(0, 20)}...`)
    } else {
      console.log('\n❌ student1@uec.com NOT found!')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

