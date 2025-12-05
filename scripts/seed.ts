/**
 * Standalone seed script
 * Run with: npm run seed
 */

// Load environment variables from .env file
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Manually load .env file
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

// Set environment variable
process.env.SEED_DATABASE = 'true'

// Import and run seed
async function runSeed() {
  try {
    console.log('Loading Payload configuration...')
    const { getPayload } = await import('payload')
    const config = await import('../payload.config')
    
    console.log('Initializing Payload...')
    const payload = await getPayload({ config: config.default })
    
    console.log('Running seed script...')
    const { seedDatabase } = await import('../lib/seed')
    await seedDatabase(payload)
    
    console.log('✅ Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

runSeed()
