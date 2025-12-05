/**
 * Reset database script
 * WARNING: This will delete all data!
 * Run with: npm run reset-db
 */

import { Client } from 'pg'
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
} catch (error) {
  console.error('Could not load .env file:', error)
  process.exit(1)
}

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URI || process.env.POSTGRES_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URI or POSTGRES_URL not found in environment variables')
    process.exit(1)
  }

  // Parse database URL to get connection details
  const url = new URL(databaseUrl)
  const dbName = url.pathname.slice(1) // Remove leading slash
  
  // Connect to postgres database (not the target database)
  const client = new Client({
    host: url.hostname,
    port: Number.parseInt(url.port) || 5432,
    user: url.username,
    password: url.password,
    database: 'postgres', // Connect to default postgres database
  })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL server')

    // Terminate existing connections to the target database
    console.log(`Terminating connections to database: ${dbName}`)
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName])

    // Drop the database
    console.log(`Dropping database: ${dbName}`)
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`)

    // Recreate the database
    console.log(`Creating database: ${dbName}`)
    await client.query(`CREATE DATABASE "${dbName}"`)

    console.log('✅ Database reset successfully!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run seed')
    console.log('2. Or start the server: npm run dev')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

resetDatabase()
