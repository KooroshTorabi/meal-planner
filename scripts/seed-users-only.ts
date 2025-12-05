/**
 * Simple seed script - creates only users
 * Run with: npm run seed:users
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
try {
  const envPath = resolve(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  })
  
  console.log('Environment variables loaded from .env')
} catch (error) {
  console.warn('Could not load .env file:', error)
}

async function seedUsers() {
  try {
    console.log('Loading Payload configuration...')
    const { getPayload } = await import('payload')
    const config = await import('../payload.config')
    
    console.log('Initializing Payload...')
    const payload = await getPayload({ config: config.default })
    
    console.log('Creating test users...')
    
    // Note: Pass plain passwords - Payload will hash them automatically
    const users = [
      {
        email: 'admin@example.com',
        password: 'test',
        role: 'admin',
        name: 'Admin User',
        active: true,
      },
      {
        email: 'caregiver@example.com',
        password: 'test',
        role: 'caregiver',
        name: 'Caregiver User',
        active: true,
      },
      {
        email: 'kitchen@example.com',
        password: 'test',
        role: 'kitchen',
        name: 'Kitchen User',
        active: true,
      },
    ]

    for (const user of users) {
      try {
        await payload.create({
          collection: 'users',
          data: user,
        })
        console.log(`✅ Created user: ${user.email}`)
      } catch (error: any) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          console.log(`⚠️  User already exists: ${user.email}`)
        } else {
          console.error(`❌ Failed to create user ${user.email}:`, error.message)
        }
      }
    }
    
    console.log('\n✅ User seeding completed!')
    console.log('\nTest credentials:')
    console.log('  Admin:     admin@example.com / test')
    console.log('  Caregiver: caregiver@example.com / test')
    console.log('  Kitchen:   kitchen@example.com / test')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seedUsers()
