/**
 * Basic setup test to verify Jest configuration
 */
describe('Jest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should support TypeScript', () => {
    const message: string = 'TypeScript is working'
    expect(message).toBe('TypeScript is working')
  })
})
