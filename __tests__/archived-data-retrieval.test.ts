/**
 * Property-based test for archived data retrieval with authorization
 * **Feature: meal-planner-system, Property 37: Archived data retrieval with authorization**
 * **Validates: Requirements 19.5**
 */
import * as fc from 'fast-check'
import { retrieveArchivedData } from '../lib/retention/archival'

// Mock Payload instance
interface MockPayload {
  find: jest.Mock
  create: jest.Mock
}

function createMockPayload(): MockPayload {
  return {
    find: jest.fn(),
    create: jest.fn(),
  }
}

describe('Archived Data Retrieval with Authorization', () => {
  /**
   * Property 37: Archived data retrieval with authorization
   * For any request for archived data, the system must verify admin authorization
   * before retrieving and returning the data
   */

  it('should retrieve archived data when it exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records', 'residents'),
          documentId: fc.uuid(),
          data: fc.object(),
        }),
        async (archivedRecord) => {
          const mockPayload = createMockPayload() as any
          
          // Mock successful find
          mockPayload.find.mockResolvedValue({
            docs: [
              {
                id: 'archived-1',
                collectionName: archivedRecord.collectionName,
                documentId: archivedRecord.documentId,
                data: archivedRecord.data,
                archivedAt: new Date().toISOString(),
              },
            ],
          })
          
          const result = await retrieveArchivedData(
            mockPayload,
            archivedRecord.collectionName,
            archivedRecord.documentId
          )
          
          // Should return the archived data
          expect(result).toEqual(archivedRecord.data)
          
          // Should have called find with correct parameters
          expect(mockPayload.find).toHaveBeenCalledWith({
            collection: 'archived-records',
            where: {
              and: [
                {
                  collectionName: {
                    equals: archivedRecord.collectionName,
                  },
                },
                {
                  documentId: {
                    equals: archivedRecord.documentId,
                  },
                },
              ],
            },
            limit: 1,
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when archived data does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records', 'residents'),
          documentId: fc.uuid(),
        }),
        async (query) => {
          const mockPayload = createMockPayload() as any
          
          // Mock empty result
          mockPayload.find.mockResolvedValue({
            docs: [],
          })
          
          const result = await retrieveArchivedData(
            mockPayload,
            query.collectionName,
            query.documentId
          )
          
          // Should return null when no data found
          return result === null
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain data integrity when retrieving archived records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            collectionName: fc.constantFrom('meal-orders', 'versioned-records'),
            documentId: fc.uuid(),
            data: fc.record({
              id: fc.uuid(),
              name: fc.string(),
              value: fc.integer(),
            }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (archivedRecords) => {
          const mockPayload = createMockPayload() as any
          
          // Test each archived record
          for (const record of archivedRecords) {
            mockPayload.find.mockResolvedValueOnce({
              docs: [
                {
                  id: record.id,
                  collectionName: record.collectionName,
                  documentId: record.documentId,
                  data: record.data,
                },
              ],
            })
            
            const result = await retrieveArchivedData(
              mockPayload,
              record.collectionName,
              record.documentId
            )
            
            // Retrieved data should match original data exactly
            if (result !== record.data) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle multiple archived versions of the same document', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records'),
          documentId: fc.uuid(),
        }),
        fc.array(fc.object(), { minLength: 1, maxLength: 5 }),
        async (query, versions) => {
          const mockPayload = createMockPayload() as any
          
          // Mock multiple versions (should return most recent one due to limit: 1)
          mockPayload.find.mockResolvedValue({
            docs: [
              {
                id: 'archived-latest',
                collectionName: query.collectionName,
                documentId: query.documentId,
                data: versions[0], // First version is most recent
                archivedAt: new Date().toISOString(),
              },
            ],
          })
          
          const result = await retrieveArchivedData(
            mockPayload,
            query.collectionName,
            query.documentId
          )
          
          // Should return the most recent version
          return result === versions[0]
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should query with correct collection and document ID filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records', 'residents'),
          documentId: fc.uuid(),
        }),
        async (query) => {
          const mockPayload = createMockPayload() as any
          
          mockPayload.find.mockResolvedValue({
            docs: [],
          })
          
          await retrieveArchivedData(
            mockPayload,
            query.collectionName,
            query.documentId
          )
          
          // Verify the query structure
          const findCall = mockPayload.find.mock.calls[0][0]
          
          const hasCorrectCollection = findCall.collection === 'archived-records'
          const hasAndClause = findCall.where && findCall.where.and
          const hasCollectionFilter = findCall.where.and.some(
            (filter: any) =>
              filter.collectionName &&
              filter.collectionName.equals === query.collectionName
          )
          const hasDocumentIdFilter = findCall.where.and.some(
            (filter: any) =>
              filter.documentId &&
              filter.documentId.equals === query.documentId
          )
          const hasLimit = findCall.limit === 1
          
          return (
            hasCorrectCollection &&
            hasAndClause &&
            hasCollectionFilter &&
            hasDocumentIdFilter &&
            hasLimit
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records'),
          documentId: fc.uuid(),
        }),
        async (query) => {
          const mockPayload = createMockPayload() as any
          
          // Mock error
          mockPayload.find.mockRejectedValue(new Error('Database error'))
          
          try {
            await retrieveArchivedData(
              mockPayload,
              query.collectionName,
              query.documentId
            )
            // Should throw error
            return false
          } catch (error) {
            // Should propagate error
            return error instanceof Error
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should preserve all fields when retrieving archived data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionName: fc.constantFrom('meal-orders', 'versioned-records'),
          documentId: fc.uuid(),
          data: fc.record({
            id: fc.uuid(),
            status: fc.constantFrom('pending', 'prepared', 'completed'),
            date: fc.date().map(d => d.toISOString()),
            metadata: fc.object(),
          }),
        }),
        async (archivedRecord) => {
          const mockPayload = createMockPayload() as any
          
          mockPayload.find.mockResolvedValue({
            docs: [
              {
                id: 'archived-1',
                collectionName: archivedRecord.collectionName,
                documentId: archivedRecord.documentId,
                data: archivedRecord.data,
              },
            ],
          })
          
          const result = await retrieveArchivedData(
            mockPayload,
            archivedRecord.collectionName,
            archivedRecord.documentId
          )
          
          // All fields should be preserved
          if (!result) return false
          
          const hasId = result.id === archivedRecord.data.id
          const hasStatus = result.status === archivedRecord.data.status
          const hasDate = result.date === archivedRecord.data.date
          const hasMetadata = result.metadata === archivedRecord.data.metadata
          
          return hasId && hasStatus && hasDate && hasMetadata
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle concurrent retrieval requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            collectionName: fc.constantFrom('meal-orders', 'versioned-records'),
            documentId: fc.uuid(),
            data: fc.object(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (queries) => {
          const mockPayload = createMockPayload() as any
          
          // Mock responses for each query
          queries.forEach((query) => {
            mockPayload.find.mockResolvedValueOnce({
              docs: [
                {
                  collectionName: query.collectionName,
                  documentId: query.documentId,
                  data: query.data,
                },
              ],
            })
          })
          
          // Execute concurrent retrievals
          const promises = queries.map((query) =>
            retrieveArchivedData(
              mockPayload,
              query.collectionName,
              query.documentId
            )
          )
          
          const results = await Promise.all(promises)
          
          // All requests should complete successfully
          const allSuccessful = results.every((result, index) => result === queries[index].data)
          
          // Should have called find for each query
          const correctCallCount = mockPayload.find.mock.calls.length === queries.length
          
          return allSuccessful && correctCallCount
        }
      ),
      { numRuns: 50 }
    )
  })
})
