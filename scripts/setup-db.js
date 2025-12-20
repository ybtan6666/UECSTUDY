// Quick database setup script
// Run: node scripts/setup-db.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up database...\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="uec-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created\n');
}

// Check schema provider
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (schemaContent.includes('provider = "postgresql"')) {
  console.log('⚠️  Schema is set to PostgreSQL.');
  console.log('   For local development, you may want to switch to SQLite.');
  console.log('   Change line 9 in prisma/schema.prisma to: provider = "sqlite"');
  console.log('   And update DATABASE_URL in .env to: DATABASE_URL="file:./dev.db"\n');
}

try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');

  console.log('🗄️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed\n');

  console.log('🌱 Seeding database...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded\n');

  console.log('🎉 Setup complete!');
  console.log('\nDemo accounts:');
  console.log('  Teacher 1: teacher1@uec.com / teacher123');
  console.log('  Teacher 2: teacher2@uec.com / teacher123');
  console.log('  Student 1: student1@uec.com / student123');
  console.log('  Student 2: student2@uec.com / student123');
  console.log('  Admin: admin@uec.com / admin123\n');
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

