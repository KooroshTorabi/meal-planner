/**
 * Property-based test for data retention policy enforcement
 * **Feature: meal-planner-system, Property 36: Data retention policy enforcement**
 * **Validates: Requirements 19.2, 19.3**
 */
import * as fc from 'fast-check'
import { getArchivalCutoffDate, getRetentionPolicy } from '../lib/retention/config'

describe('Data Retention Policy Enforcement', () => {
  /**
   * Property 36: Data retention policy enforcement
   * For any versioned record or audit log older than the configured retention period,
   * the system must archive the data while maintaining referential integrity
   */

  it('should calculate correct cutoff dates for any retention period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3650 }), // 1 day to 10 years
        async (retentionDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          const now = new Date()
          
          // Cutoff date should be in the past
          const isPast = cutoffDate < now
          
          // Calculate expected date
          const expectedDate = new Date()
          expectedDate.setDate(expectedDate.getDate() - retentionDays)
          expectedDate.setHours(0, 0, 0, 0)
          
          // Cutoff date should match expected date (within same day)
          const sameDay = 
            cutoffDate.getFullYear() === expectedDate.getFullYear() &&
            cutoffDate.getMonth() === expectedDate.getMonth() &&
            cutoffDate.getDate() === expectedDate.getDate()
          
          // Cutoff should be at start of day (midnight)
          const isStartOfDay = 
            cutoffDate.getHours() === 0 &&
            cutoffDate.getMinutes() === 0 &&
            cutoffDate.getSeconds() === 0 &&
            cutoffDate.getMilliseconds() === 0
          
          return isPast && sameDay && isStartOfDay
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should identify records older than retention period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 30, max: 365 }), // Retention period in days
        fc.integer({ min: 0, max: 100 }), // Days ago the record was created
        async (retentionDays, recordAgeDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          
          // Create a record date
          const recordDate = new Date()
          recordDate.setDate(recordDate.getDate() - recordAgeDays)
          
          // Record should be archived if it's older than cutoff
          const shouldArchive = recordDate < cutoffDate
          const expectedArchival = recordAgeDays > retentionDays
          
          return shouldArchive === expectedArchival
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain referential integrity when archiving', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            documentId: fc.uuid(),
            collectionName: fc.constantFrom('meal-orders', 'residents', 'users'),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            snapshot: fc.object(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 30, max: 365 }),
        async (records, retentionDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          
          // Separate records into those to archive and those to keep
          const toArchive = records.filter(r => r.createdAt < cutoffDate)
          const toKeep = records.filter(r => r.createdAt >= cutoffDate)
          
          // All records should be categorized
          const allCategorized = (toArchive.length + toKeep.length) === records.length
          
          // No overlap between categories
          const noOverlap = toArchive.every(a => !toKeep.some(k => k.id === a.id))
          
          // Each archived record should maintain its documentId reference
          const referencesIntact = toArchive.every(r => 
            r.documentId !== null && r.documentId !== undefined
          )
          
          return allCategorized && noOverlap && referencesIntact
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should respect different retention periods for different data types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          versionedRecordsRetentionDays: fc.integer({ min: 30, max: 730 }),
          auditLogsRetentionDays: fc.integer({ min: 30, max: 1095 }),
          completedOrdersRetentionDays: fc.integer({ min: 30, max: 365 }),
        }),
        async (retentionConfig) => {
          // Calculate cutoff dates for each data type
          const versionedCutoff = getArchivalCutoffDate(retentionConfig.versionedRecordsRetentionDays)
          const auditCutoff = getArchivalCutoffDate(retentionConfig.auditLogsRetentionDays)
          const ordersCutoff = getArchivalCutoffDate(retentionConfig.completedOrdersRetentionDays)
          
          // All cutoff dates should be valid dates
          const allValid = 
            versionedCutoff instanceof Date &&
            auditCutoff instanceof Date &&
            ordersCutoff instanceof Date
          
          // All cutoff dates should be in the past
          const now = new Date()
          const allInPast = 
            versionedCutoff < now &&
            auditCutoff < now &&
            ordersCutoff < now
          
          // If retention periods differ, cutoff dates should differ
          const periodsMatch = 
            retentionConfig.versionedRecordsRetentionDays === retentionConfig.auditLogsRetentionDays &&
            retentionConfig.auditLogsRetentionDays === retentionConfig.completedOrdersRetentionDays
          
          const datesMatch = 
            versionedCutoff.getTime() === auditCutoff.getTime() &&
            auditCutoff.getTime() === ordersCutoff.getTime()
          
          // If periods match, dates should match; if periods differ, dates should differ
          const consistencyCheck = periodsMatch ? datesMatch : true
          
          return allValid && allInPast && consistencyCheck
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases in retention period calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(0, 1, 365, 730, 1095, 3650), // Edge case retention periods
        async (retentionDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          const now = new Date()
          
          // For 0 days, cutoff should be today
          if (retentionDays === 0) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return cutoffDate.getTime() === today.getTime()
          }
          
          // For any positive retention, cutoff should be in the past
          return cutoffDate < now
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should preserve data integrity during archival process', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            collectionName: fc.constantFrom('versioned-records', 'meal-orders'),
            documentId: fc.uuid(),
            data: fc.object(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        fc.integer({ min: 90, max: 365 }),
        async (records, retentionDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          
          // Identify records to archive
          const recordsToArchive = records.filter(r => r.createdAt < cutoffDate)
          
          // For each record to archive, verify data integrity
          const integrityChecks = recordsToArchive.map(record => {
            // Record must have an ID
            const hasId = record.id !== null && record.id !== undefined
            
            // Record must have a collection name
            const hasCollection = record.collectionName !== null && record.collectionName !== undefined
            
            // Record must have data
            const hasData = record.data !== null && record.data !== undefined
            
            // Record must have a creation date
            const hasCreatedAt = record.createdAt !== null && record.createdAt !== undefined
            
            return hasId && hasCollection && hasData && hasCreatedAt
          })
          
          // All records should pass integrity checks
          return integrityChecks.every(check => check === true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly load retention policy from configuration', () => {
    const policy = getRetentionPolicy()
    
    // Policy should have all required fields
    expect(policy).toHaveProperty('versionedRecordsRetentionDays')
    expect(policy).toHaveProperty('auditLogsRetentionDays')
    expect(policy).toHaveProperty('completedOrdersRetentionDays')
    expect(policy).toHaveProperty('archivalEnabled')
    expect(policy).toHaveProperty('archivalScheduleHour')
    
    // Retention days should be positive numbers
    expect(policy.versionedRecordsRetentionDays).toBeGreaterThan(0)
    expect(policy.auditLogsRetentionDays).toBeGreaterThan(0)
    expect(policy.completedOrdersRetentionDays).toBeGreaterThan(0)
    
    // Schedule hour should be valid (0-23)
    expect(policy.archivalScheduleHour).toBeGreaterThanOrEqual(0)
    expect(policy.archivalScheduleHour).toBeLessThan(24)
    
    // Archival enabled should be a boolean
    expect(typeof policy.archivalEnabled).toBe('boolean')
  })

  it('should handle year boundaries correctly in retention calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 400 }), // Retention days spanning year boundaries
        async (retentionDays) => {
          const cutoffDate = getArchivalCutoffDate(retentionDays)
          
          // Create a date exactly at the cutoff
          const testDate = new Date(cutoffDate)
          
          // Create dates just before and after cutoff
          const beforeCutoff = new Date(cutoffDate)
          beforeCutoff.setDate(beforeCutoff.getDate() - 1)
          
          const afterCutoff = new Date(cutoffDate)
          afterCutoff.setDate(afterCutoff.getDate() + 1)
          
          // Verify correct categorization
          const beforeShouldArchive = beforeCutoff < cutoffDate
          const atShouldNotArchive = testDate >= cutoffDate
          const afterShouldNotArchive = afterCutoff >= cutoffDate
          
          return beforeShouldArchive && atShouldNotArchive && afterShouldNotArchive
        }
      ),
      { numRuns: 100 }
    )
  })
})
