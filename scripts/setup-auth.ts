/**
 * Automated setup script for authentication
 * This script:
 * 1. Resets the database
 * 2. Temporarily enables schema push
 * 3. Seeds users
 * 4. Disables schema push
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const configPath = resolve(process.cwd(), 'payload.config.ts')

function enableSchemaPush() {
  console.log('📝 Enabling schema push...')
  const config = readFileSync(configPath, 'utf-8')
  const updated = config.replace(/push: false,/g, 'push: true,')
  writeFileSync(configPath, updated)
  console.log('✅ Schema push enabled')
}

function disableSchemaPush() {
  console.log('📝 Disabling schema push...')
  const config = readFileSync(configPath, 'utf-8')
  const updated = config.replace(/push: true,/g, 'push: false,')
  writeFileSync(configPath, updated)
  console.log('✅ Schema push disabled')
}

async function setup() {
  try {
    console.log('🚀 Starting authentication setup...\n')

    // Step 1: Reset database
    console.log('1️⃣  Resetting database...')
    execSync('npm run reset-db', { stdio: 'inherit' })
    console.log('✅ Database reset complete\n')

    // Step 2: Enable schema push
    console.log('2️⃣  Configuring schema push...')
    enableSchemaPush()
    console.log()

    // Step 3: Seed users
    console.log('3️⃣  Seeding users...')
    execSync('npm run seed:users', { stdio: 'inherit' })
    console.log('✅ Users seeded\n')

    // Step 4: Disable schema push
    console.log('4️⃣  Restoring configuration...')
    disableSchemaPush()
    console.log()

    console.log('✅ Setup complete!\n')
    console.log('Next steps:')
    console.log('  1. Start the server: npm run dev')
    console.log('  2. Go to: http://localhost:3000/login')
    console.log('  3. Login with:')
    console.log('     - admin@example.com / test')
    console.log('     - caregiver@example.com / test')
    console.log('     - kitchen@example.com / test')
    console.log()
  } catch (error) {
    console.error('❌ Setup failed:', error)
    // Try to restore config even if setup fails
    try {
      disableSchemaPush()
    } catch (e) {
      console.error('Failed to restore config:', e)
    }
    process.exit(1)
  }
}

setup()
