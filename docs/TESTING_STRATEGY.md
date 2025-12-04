# Testing Strategy

## Overview

The Meal Planner System employs a comprehensive testing strategy that combines unit testing, property-based testing, and integration testing to ensure correctness, reliability, and maintainability. This document outlines our testing approach, frameworks, and best practices.

## Testing Philosophy

Our testing strategy is built on the principle of **specification-driven development**:

1. **Formal Specifications**: Each feature has clearly defined correctness properties
2. **Property-Based Testing**: Universal properties are validated across all valid inputs
3. **Unit Testing**: Specific examples and edge cases are tested
4. **Complementary Approaches**: Both testing methods work together to provide comprehensive coverage

## Testing Frameworks

### Jest
- **Purpose**: Test runner and assertion library
- **Version**: Latest stable
- **Configuration**: `jest.config.js`
- **Usage**: All test files use `.test.ts` or `.test.tsx` extension

### fast-check
- **Purpose**: Property-based testing library
- **Version**: Latest stable
- **Configuration**: Minimum 100 iterations per property test
- **Usage**: Tests that validate universal properties across generated inputs

## Test Categories

### 1. Property-Based Tests (PBT)

Property-based tests validate that universal properties hold true across all valid inputs. Each property test:

- Runs a minimum of 100 iterations with randomly generated inputs
- Is tagged with the format: `**Feature: meal-planner-system, Property X: [description]**`
- References the requirement it validates: `**Validates: Requirements X.Y**`
- Uses `fc.assert()` or `fc.asyncProperty()` for async operations

**Example Properties:**
- **Property 1**: User role assignment validity
- **Property 8**: Ingredient aggregation correctness
- **Property 25**: Unauthorized access denial
- **Property 35**: Non-conflicting concurrent operations

**Location**: `__tests__/*-test.ts` files with property test naming

### 2. Unit Tests

Unit tests verify specific examples, edge cases, and integration points:

- Test specific scenarios and boundary conditions
- Validate error handling and edge cases
- Test component integration
- Mock external dependencies when appropriate

**Coverage Areas:**
- Collection hooks (beforeChange, afterChange)
- Access control rules for each role
- Field validators and custom validation logic
- Utility functions (aggregation, filtering, formatting)
- API endpoints with various inputs

**Location**: `__tests__/*-edge-cases.test.ts` and `__tests__/*-test.ts`

### 3. Integration Tests

Integration tests validate end-to-end workflows:

- Authentication flows (login, 2FA, token refresh)
- Complete CRUD operations through API endpoints
- Multi-step business processes
- Alert delivery through multiple channels

**Location**: `__tests__/auth-flows.test.ts`, `__tests__/multi-channel-alert-delivery.test.ts`

## Test Organization

### File Naming Conventions

```
__tests__/
├── [feature]-[property-name].test.ts          # Property-based tests
├── [feature]-edge-cases.test.ts               # Unit tests for edge cases
├── [feature]-flows.test.ts                    # Integration tests
└── setup.test.ts                              # Test environment setup
```

### Test Structure

Each test file follows this structure:

```typescript
/**
 * [Test Type] for [Feature]
 * **Feature: meal-planner-system, Property X: [description]**
 * **Validates: Requirements X.Y**
 */
import * as fc from 'fast-check'

describe('[Feature] Property Tests', () => {
  describe('Property X: [description]', () => {
    it('should [behavior]', async () => {
      // **Feature: meal-planner-system, Property X: [description]**
      
      await fc.assert(
        fc.asyncProperty(
          // Generators
          fc.uuid(),
          fc.constantFrom('value1', 'value2'),
          async (input1, input2) => {
            // Test logic
            return expectedCondition
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
```

## Coverage Requirements

### Minimum Coverage Targets

- **Overall Code Coverage**: 80% minimum
- **Critical Paths**: 100% coverage required
  - Authentication and authorization
  - Access control rules
  - Data validation and integrity
  - Ingredient aggregation logic

### Coverage Reports

Generate coverage reports with:

```bash
npm test -- --coverage
```

Coverage reports are generated in the `coverage/` directory.

## Test Data Generation

### Property-Based Test Generators

We use fast-check generators to create test data:

```typescript
// Good generators
fc.uuid()                                    // Valid UUIDs
fc.constantFrom('admin', 'caregiver', 'kitchen')  // Valid roles
fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })

// Avoid problematic generators
fc.string({ minLength: 1 })                 // Can generate whitespace-only
```

### Best Practices for Generators

1. **Use specific generators**: Prefer `fc.uuid()` over `fc.string()` for IDs
2. **Filter invalid inputs**: Use `.filter()` to exclude edge cases
3. **Validate dates**: Check for `NaN` dates with `!isNaN(date.getTime())`
4. **Constrain ranges**: Use `min` and `max` options to limit generated values

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- __tests__/ingredient-aggregation.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Band (Sequential)

```bash
npm test -- --runInBand
```

Useful for debugging or when tests have shared state.

## Mocking Strategy

### When to Mock

- External API calls
- Database operations in unit tests
- File system operations
- Time-dependent operations

### When NOT to Mock

- Internal business logic
- Access control functions (test actual implementation)
- Data transformations
- Validation logic

### Mock Examples

```typescript
// Mock Payload CMS
const mockPayload = {
  find: jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
  findByID: jest.fn().mockResolvedValue({ id: '123', name: 'Test' }),
  create: jest.fn().mockResolvedValue({ id: '123' }),
}

// Mock request object
const mockRequest = {
  user: { id: 'user-123', role: 'admin' },
  payload: mockPayload,
}
```

## Async Testing

### Handling Async Operations

All async operations must be properly awaited:

```typescript
// Property-based async tests
await fc.assert(
  fc.asyncProperty(
    fc.uuid(),
    async (userId) => {
      const result = await asyncFunction(userId)
      return result === expectedValue
    }
  ),
  { numRuns: 100 }
)

// Unit async tests
it('should handle async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

## Test Maintenance

### Updating Tests

When modifying code:

1. **Run affected tests first**: Identify which tests cover the changed code
2. **Update test expectations**: Adjust assertions to match new behavior
3. **Add new tests**: Cover new functionality or edge cases
4. **Verify coverage**: Ensure coverage doesn't decrease

### Debugging Failing Tests

1. **Read the error message**: Property tests show counterexamples
2. **Run test in isolation**: Use `.only()` to focus on failing test
3. **Add logging**: Use `console.log()` to inspect values
4. **Check generators**: Verify generators produce valid inputs
5. **Verify async handling**: Ensure all promises are awaited

### Common Issues

**Issue**: Property test fails with edge case inputs
- **Solution**: Add `.filter()` to generator or handle edge case in code

**Issue**: Async function returns Promise instead of value
- **Solution**: Add `await` before function call and use `fc.asyncProperty()`

**Issue**: Mock not being called
- **Solution**: Verify mock is passed correctly and function is actually called

## Continuous Integration

### Pre-commit Checks

Before committing code:

```bash
npm test                    # Run all tests
npm run lint               # Check code style
npm run type-check         # Verify TypeScript types
```

### CI Pipeline

Our CI pipeline runs:

1. Install dependencies
2. Run linter
3. Run type checker
4. Run all tests with coverage
5. Generate coverage report
6. Fail if coverage drops below 80%

## Property Test Catalog

### Authentication & Authorization

- **Property 1**: User role assignment validity
- **Property 2**: Role-based permission enforcement
- **Property 3**: Deactivated user authentication rejection
- **Property 4**: Admin full access
- **Property 16-20**: Authentication token flows
- **Property 25**: Unauthorized access denial
- **Property 26**: Permission-based data filtering
- **Property 27**: Unauthorized operation logging

### Data Operations

- **Property 5**: Meal order uniqueness constraint
- **Property 6**: Meal order creation validation
- **Property 11**: Resident required fields validation
- **Property 12**: Resident update preserves meal orders
- **Property 13**: Inactive resident order prevention
- **Property 14**: Versioned record creation on modification
- **Property 15**: Historical data immutability

### Business Logic

- **Property 7**: Caregiver order visibility filtering
- **Property 8**: Ingredient aggregation correctness
- **Property 9**: Order status update with metadata
- **Property 10**: Status-based order modification prevention
- **Property 21-23**: Alert creation, acknowledgment, and escalation
- **Property 30**: Multi-channel alert delivery

### System Operations

- **Property 28**: Seed script idempotency
- **Property 29**: Search filter combination
- **Property 31-32**: Report filtering and export formats
- **Property 33-35**: Concurrent edit handling
- **Property 36-37**: Data retention and archival
- **Property 38-39**: Accessibility compliance

## Best Practices

### Writing Good Tests

1. **Test behavior, not implementation**: Focus on what the code does, not how
2. **Use descriptive names**: Test names should explain what is being tested
3. **Keep tests focused**: Each test should verify one specific behavior
4. **Avoid test interdependence**: Tests should run independently
5. **Use appropriate assertions**: Choose the right matcher for the check

### Property Test Guidelines

1. **Start with simple properties**: Build up to complex scenarios
2. **Use preconditions**: Filter out invalid inputs with `fc.pre()`
3. **Shrink counterexamples**: fast-check automatically finds minimal failing cases
4. **Document properties**: Clearly state what property is being tested
5. **Reference requirements**: Link each property to its requirement

### Performance Considerations

1. **Limit test data size**: Use reasonable limits for generated arrays
2. **Mock expensive operations**: Don't hit real databases in unit tests
3. **Run tests in parallel**: Use Jest's default parallel execution
4. **Use test timeouts**: Set appropriate timeouts for async operations

## Troubleshooting

### Test Failures

**Symptom**: Random test failures
- **Cause**: Race conditions or shared state
- **Solution**: Use `--runInBand` to run sequentially, fix shared state

**Symptom**: Property test finds counterexample
- **Cause**: Code doesn't handle edge case
- **Solution**: Fix code to handle the case or add precondition to filter it

**Symptom**: Tests pass locally but fail in CI
- **Cause**: Environment differences or timing issues
- **Solution**: Check environment variables, add delays for timing-sensitive tests

### Performance Issues

**Symptom**: Tests run slowly
- **Cause**: Too many iterations or expensive operations
- **Solution**: Reduce `numRuns` for development, mock expensive operations

**Symptom**: Out of memory errors
- **Cause**: Large test data or memory leaks
- **Solution**: Limit generated data size, check for memory leaks

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)

### Internal Documentation

- [Test Catalog](./TEST_CATALOG.md) - Complete catalog of all test files and their categories
- [Design Document](../spec/design.md) - System design and correctness properties
- [Requirements Document](../spec/requirements.md) - Complete system requirements
- [Tasks Document](../spec/tasks.md) - Implementation task list
- [API Documentation](./API_DOCUMENTATION.md)

## Conclusion

Our testing strategy ensures the Meal Planner System is reliable, maintainable, and correct. By combining property-based testing with traditional unit tests, we achieve comprehensive coverage and confidence in our code quality.

For questions or suggestions about testing, please refer to the design document or consult with the development team.
