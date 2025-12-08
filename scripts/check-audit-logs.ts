/**
 * Check Audit Logs
 * Simple script to view audit logs in the database
 */

import { getPayload } from 'payload'
import config from '../payload.config'

// Load environment variables from .env file
import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      process.env[key.trim()] = value
        console.log(`key : ${key.trim()} , value : ${value}`)
    }
  })
  console.log('.env file loaded successfully');

} catch (error) {
  console.error('Could not load .env file')
}

async function checkAuditLogs() {
  try {

    
    console.log(`Starting with ${process.env['PAYLOAD_SECRET']} ... `)
    
    const payload = await getPayload({ config })

    console.log('Fetching audit logs...\n')

    const result = await payload.find({
      collection: 'audit-logs',
      limit: 20,
      sort: '-createdAt',
    })

    console.log(`Total audit logs: ${result.totalDocs}`)
    console.log(`Showing ${result.docs.length} most recent logs:\n`)

    if (result.docs.length === 0) {
      console.log('No audit logs found in database.')
    } else {
      result.docs.forEach((log: any, index: number) => {
        console.log(`${index + 1}. ${log.action} - ${log.status}`)
        console.log(`   Email: ${log.email || 'N/A'}`)
        console.log(`   User ID: ${log.userId || 'N/A'}`)
        console.log(`   IP: ${log.ipAddress || 'N/A'}`)
        console.log(`   Time: ${new Date(log.createdAt).toLocaleString()}`)
        if (log.errorMessage) {
          console.log(`   Error: ${log.errorMessage}`)
        }
        console.log('')
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('Error checking audit logs:', error)
    process.exit(1)
  }
}

checkAuditLogs()
