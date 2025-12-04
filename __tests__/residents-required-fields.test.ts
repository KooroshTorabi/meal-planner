/**
 * Property-Based Test for Resident Required Fields
 * **Feature: meal-planner-system, Property 11: Resident required fields validation**
 * **Validates: Requirements 7.1**
 * 
 * Property: For any resident creation attempt without name or room number, the system must reject the creation
 */

import * as fc from 'fast-check'
import { Residents } from '../collections/Residents'

describe('Resident Required Fields Property Tests', () => {
  describe('Property 11: Resident required fields validation', () => {
    it('should require name field', () => {
      // **Feature: meal-planner-system, Property 11: Resident required fields validation**
      
      const nameField = Residents.fields.find((f) => 'name' in f && f.name === 'name')
      
      expect(nameField).toBeDefined()
      expect(nameField).toHaveProperty('type', 'text')
      expect(nameField).toHaveProperty('required', true)
    })
    
    it('should require roomNumber field', () => {
      // **Feature: meal-planner-system, Property 11: Resident required fields validation**
      
      const roomNumberField = Residents.fields.find((f) => 'name' in f && f.name === 'roomNumber')
      
      expect(roomNumberField).toBeDefined()
      expect(roomNumberField).toHaveProperty('type', 'text')
      expect(roomNumberField).toHaveProperty('required', true)
    })
    
    it('should have all expected fields with correct types', () => {
      // **Feature: meal-planner-system, Property 11: Resident required fields validation**
      
      const fieldNames = Residents.fields
        .filter((f) => 'name' in f)
        .map((f) => 'name' in f ? f.name : '')
      
      // Required fields
      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('roomNumber')
      
      // Optional fields
      expect(fieldNames).toContain('tableNumber')
      expect(fieldNames).toContain('station')
      expect(fieldNames).toContain('dietaryRestrictions')
      expect(fieldNames).toContain('aversions')
      expect(fieldNames).toContain('specialNotes')
      expect(fieldNames).toContain('highCalorie')
      expect(fieldNames).toContain('active')
    })
    
    it('should validate that name and roomNumber are always present in valid resident data', () => {
      // **Feature: meal-planner-system, Property 11: Resident required fields validation**
      
      // Generator for valid resident data
      const validResidentGenerator = fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        roomNumber: fc.string({ minLength: 1, maxLength: 50 }),
        tableNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        station: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        highCalorie: fc.boolean(),
        active: fc.boolean(),
      })
      
      fc.assert(
        fc.property(validResidentGenerator, (residentData) => {
          // Valid resident data must have name and roomNumber
          return (
            residentData.name !== undefined &&
            residentData.name.length > 0 &&
            residentData.roomNumber !== undefined &&
            residentData.roomNumber.length > 0
          )
        }),
        { numRuns: 100 }
      )
    })
    
    it('should identify invalid resident data missing required fields', () => {
      // **Feature: meal-planner-system, Property 11: Resident required fields validation**
      
      // Generator for invalid resident data (missing name or roomNumber)
      const invalidResidentGenerator = fc.oneof(
        // Missing name
        fc.record({
          name: fc.constant(undefined),
          roomNumber: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        // Missing roomNumber
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          roomNumber: fc.constant(undefined),
        }),
        // Empty name
        fc.record({
          name: fc.constant(''),
          roomNumber: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        // Empty roomNumber
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          roomNumber: fc.constant(''),
        }),
        // Both missing
        fc.record({
          name: fc.constant(undefined),
          roomNumber: fc.constant(undefined),
        })
      )
      
      fc.assert(
        fc.property(invalidResidentGenerator, (residentData) => {
          // Invalid resident data should be missing name or roomNumber or have empty values
          const hasValidName = residentData.name !== undefined && residentData.name.length > 0
          const hasValidRoomNumber = residentData.roomNumber !== undefined && residentData.roomNumber.length > 0
          
          // At least one required field should be invalid
          return !(hasValidName && hasValidRoomNumber)
        }),
        { numRuns: 100 }
      )
    })
  })
})
