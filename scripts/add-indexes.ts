#!/usr/bin/env tsx

/**
 * Script to add performance indexes to the database
 * 
 * Usage: npm run add-indexes
 * or: tsx scripts/add-indexes.ts
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import { addPerformanceIndexes } from '../lib/db/add-indexes'

async function main() {
  console.log('Initializing Payload...')
  
  const payload = await getPayload({ config })
  
  console.log('Payload initialized successfully')
  
  await addPerformanceIndexes(payload)
  
  console.log('Done!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
