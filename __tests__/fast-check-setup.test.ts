/**
 * Basic property-based test to verify fast-check configuration
 */
import * as fc from 'fast-check'

describe('fast-check Setup', () => {
  it('should run property-based tests successfully', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n
      }),
      { numRuns: 100 }
    )
  })

  it('should support string properties', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0
      }),
      { numRuns: 100 }
    )
  })
})
