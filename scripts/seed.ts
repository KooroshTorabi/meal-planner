/**
 * Standalone seed script
 * Run with: npm run seed
 */

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
