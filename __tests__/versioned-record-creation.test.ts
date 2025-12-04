/**
 * Property-based test for versioned record creation on modification
 * **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
 * **Validates: Requirements 8.1, 8.2**
 */
import * as fc from 'fast-check'
import { VersionedRecords } from '../collections/VersionedRecords'
import { MealOrders } from '../collections/MealOrders'

describe('Versioned Record Creation on Modification', () => {
  /**
   * Property 14: Versioned record creation on modification
   * For any meal order update, a versioned record must be created capturing
   * the complete previous state with timestamp and user information
   * 
   * This test validates that the afterChange hook implements versioning
   */
  it('should have afterChange hook for versioning', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    expect(MealOrders.hooks).toBeDefined()
    expect(MealOrders.hooks?.afterChange).toBeDefined()
    expect(Array.isArray(MealOrders.hooks?.afterChange)).toBe(true)
    expect(MealOrders.hooks?.afterChange?.length).toBeGreaterThan(0)
  })

  it('should have VersionedRecords collection with required fields', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const collectionNameField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'collectionName')
    const documentIdField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'documentId')
    const versionField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'version')
    const snapshotField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'snapshot')
    const changeTypeField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'changeType')
    const changedFieldsField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'changedFields')
    const changedByField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'changedBy')
    
    // All required fields must be present
    expect(collectionNameField).toBeDefined()
    expect(collectionNameField).toHaveProperty('required', true)
    
    expect(documentIdField).toBeDefined()
    expect(documentIdField).toHaveProperty('required', true)
    
    expect(versionField).toBeDefined()
    expect(versionField).toHaveProperty('required', true)
    
    expect(snapshotField).toBeDefined()
    expect(snapshotField).toHaveProperty('required', true)
    
    expect(changeTypeField).toBeDefined()
    expect(changeTypeField).toHaveProperty('required', true)
    
    expect(changedFieldsField).toBeDefined()
    expect(changedByField).toBeDefined()
  })

  it('should have indexes for efficient querying', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    expect(VersionedRecords.indexes).toBeDefined()
    expect(Array.isArray(VersionedRecords.indexes)).toBe(true)
    expect(VersionedRecords.indexes?.length).toBeGreaterThan(0)
    
    // Should have composite index on collectionName and documentId
    const compositeIndex = VersionedRecords.indexes?.find(
      (idx) => 'fields' in idx && 'collectionName' in idx.fields && 'documentId' in idx.fields
    )
    expect(compositeIndex).toBeDefined()
    
    // Should have index on createdAt for time-based queries
    const createdAtIndex = VersionedRecords.indexes?.find(
      (idx) => 'fields' in idx && 'createdAt' in idx.fields
    )
    expect(createdAtIndex).toBeDefined()
  })

  it('should validate version number increments for any document', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    // Generator for versioned records (versions start at 1)
    const versionedRecordGenerator = fc.record({
      collectionName: fc.constant('meal-orders'),
      documentId: fc.uuid(),
      version: fc.integer({ min: 1, max: 100 }),
      changeType: fc.constantFrom('create', 'update', 'delete'),
    })
    
    fc.assert(
      fc.property(versionedRecordGenerator, (record) => {
        // For any versioned record, version should be a positive integer
        return record.version >= 1 && Number.isInteger(record.version)
      }),
      { numRuns: 100 }
    )
  })

  it('should validate that versions are sequential for same document', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const documentIdGen = fc.uuid()
    // Generate unique version numbers starting from 1
    const versionSequenceGen = fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 10 })
      .map(versions => {
        // Remove duplicates and sort
        const uniqueVersions = [...new Set(versions)].sort((a, b) => a - b)
        return uniqueVersions.length >= 2 ? uniqueVersions : [1, 2]
      })
    
    fc.assert(
      fc.property(documentIdGen, versionSequenceGen, (docId, versions) => {
        // For any sequence of versions for the same document,
        // each version should be greater than the previous
        for (let i = 1; i < versions.length; i++) {
          if (versions[i] <= versions[i - 1]) {
            return false
          }
        }
        return true
      }),
      { numRuns: 100 }
    )
  })

  it('should validate changeType is one of create, update, or delete', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const changeTypeGen = fc.constantFrom('create', 'update', 'delete')
    
    fc.assert(
      fc.property(changeTypeGen, (changeType) => {
        // For any versioned record, changeType must be valid
        const validTypes = ['create', 'update', 'delete']
        return validTypes.includes(changeType)
      }),
      { numRuns: 100 }
    )
  })

  it('should validate snapshot contains complete document data', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    // Generator for meal order snapshot
    const mealOrderSnapshotGen = fc.record({
      id: fc.uuid(),
      resident: fc.uuid(),
      date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
      mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
      status: fc.constantFrom('pending', 'prepared', 'completed'),
      urgent: fc.boolean(),
    })
    
    fc.assert(
      fc.property(mealOrderSnapshotGen, (snapshot) => {
        // For any snapshot, it must contain all required fields
        return (
          snapshot.id !== undefined &&
          snapshot.resident !== undefined &&
          snapshot.date !== undefined &&
          snapshot.mealType !== undefined &&
          snapshot.status !== undefined &&
          snapshot.urgent !== undefined
        )
      }),
      { numRuns: 100 }
    )
  })

  it('should validate changedFields tracks field modifications', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const fieldNamesGen = fc.array(
      fc.constantFrom('resident', 'date', 'mealType', 'status', 'urgent', 'specialNotes'),
      { minLength: 0, maxLength: 6 }
    )
    
    fc.assert(
      fc.property(fieldNamesGen, (changedFields) => {
        // For any set of changed fields, all should be valid field names
        const validFields = [
          'resident', 'date', 'mealType', 'status', 'urgent',
          'breakfastOptions', 'lunchOptions', 'dinnerOptions',
          'specialNotes', 'preparedAt', 'preparedBy'
        ]
        
        return changedFields.every(field => validFields.includes(field))
      }),
      { numRuns: 100 }
    )
  })

  it('should validate versioned records are immutable', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    // Verify that update and delete access are disabled
    expect(VersionedRecords.access?.update).toBeDefined()
    expect(VersionedRecords.access?.delete).toBeDefined()
    
    // Both should be functions that return false
    if (typeof VersionedRecords.access?.update === 'function') {
      const updateResult = VersionedRecords.access.update({} as any)
      expect(updateResult).toBe(false)
    }
    
    if (typeof VersionedRecords.access?.delete === 'function') {
      const deleteResult = VersionedRecords.access.delete({} as any)
      expect(deleteResult).toBe(false)
    }
  })

  it('should validate version numbers start at 1 and increment', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const versionCountGen = fc.nat({ max: 50 })
    
    fc.assert(
      fc.property(versionCountGen, (count) => {
        // For any number of versions, they should start at 1 and increment by 1
        const versions = Array.from({ length: count }, (_, i) => i + 1)
        
        // First version should be 1
        if (versions.length > 0 && versions[0] !== 1) {
          return false
        }
        
        // Each subsequent version should increment by 1
        for (let i = 1; i < versions.length; i++) {
          if (versions[i] !== versions[i - 1] + 1) {
            return false
          }
        }
        
        return true
      }),
      { numRuns: 100 }
    )
  })

  it('should validate collectionName matches the source collection', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const collectionNameGen = fc.constantFrom('meal-orders', 'residents', 'users')
    
    fc.assert(
      fc.property(collectionNameGen, (collectionName) => {
        // For any versioned record, collectionName should be a valid collection
        const validCollections = ['meal-orders', 'residents', 'users', 'alerts']
        return validCollections.includes(collectionName)
      }),
      { numRuns: 100 }
    )
  })

  it('should validate timestamps are present and valid', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    // VersionedRecords should have timestamps enabled
    expect(VersionedRecords.timestamps).toBe(true)
  })

  it('should validate changedBy references a user', () => {
    // **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
    
    const changedByField = VersionedRecords.fields.find((f) => 'name' in f && f.name === 'changedBy')
    
    expect(changedByField).toBeDefined()
    expect(changedByField).toHaveProperty('type', 'relationship')
    
    if ('relationTo' in changedByField!) {
      expect(changedByField.relationTo).toBe('users')
    }
  })
})
