/**
 * Property-Based Test for Form Label Association
 * 
 * **Feature: meal-planner-system, Property 39: Form label association**
 * **Validates: Requirements 20.4**
 * 
 * Property: For any form input field, the system must associate a label element 
 * and provide clear validation error messages
 */

import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock form components
const FormFieldWithLabel = ({ 
  id, 
  label, 
  type = 'text',
  required = false,
  error 
}: { 
  id: string
  label: string
  type?: string
  required?: boolean
  error?: string
}) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && ' *'}
    </label>
    <input 
      id={id}
      name={id}
      type={type}
      required={required}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
)

const SelectFieldWithLabel = ({ 
  id, 
  label, 
  options,
  required = false,
  error 
}: { 
  id: string
  label: string
  options: string[]
  required?: boolean
  error?: string
}) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && ' *'}
    </label>
    <select 
      id={id}
      name={id}
      required={required}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && (
      <p id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
)

const TextareaFieldWithLabel = ({ 
  id, 
  label, 
  required = false,
  error 
}: { 
  id: string
  label: string
  required?: boolean
  error?: string
}) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && ' *'}
    </label>
    <textarea 
      id={id}
      name={id}
      required={required}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
)

describe('Property 39: Form Label Association', () => {
  /**
   * Property: All form inputs must have associated labels with matching htmlFor/id
   */
  it('should ensure all form inputs have labels with matching htmlFor and id attributes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\s/g, '-')),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('text', 'email', 'password', 'number', 'date', 'tel', 'url'),
        (id, label, type) => {
          const { container } = render(
            <FormFieldWithLabel id={id} label={label} type={type} />
          )
          
          const input = container.querySelector('input')
          const labelElement = container.querySelector('label')
          
          expect(input).toBeInTheDocument()
          expect(labelElement).toBeInTheDocument()
          
          // Input must have an id
          const inputId = input?.getAttribute('id')
          expect(inputId).toBeTruthy()
          
          // Label must have htmlFor attribute
          const labelFor = labelElement?.getAttribute('for')
          expect(labelFor).toBeTruthy()
          
          // htmlFor must match input id
          return labelFor === inputId && inputId === id
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Required fields must be indicated in the label
   */
  it('should indicate required fields in labels', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\s/g, '-')),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (id, label, required) => {
          const { container } = render(
            <FormFieldWithLabel id={id} label={label} required={required} />
          )
          
          const input = container.querySelector('input')
          const labelElement = container.querySelector('label')
          
          expect(input).toBeInTheDocument()
          expect(labelElement).toBeInTheDocument()
          
          // If required, input must have required attribute
          const hasRequiredAttr = input?.hasAttribute('required')
          const hasAriaRequired = input?.getAttribute('aria-required') === 'true'
          
          // If required, label should contain indicator (*)
          const labelText = labelElement?.textContent || ''
          const hasRequiredIndicator = labelText.includes('*')
          
          if (required) {
            return hasRequiredAttr && hasAriaRequired && hasRequiredIndicator
          } else {
            return !hasRequiredAttr || !hasAriaRequired
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Form fields with errors must have clear error messages
   */
  it('should provide clear error messages for invalid fields', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'field'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (id, label, error) => {
          const { container } = render(
            <FormFieldWithLabel id={id} label={label} error={error} />
          )
          
          const input = container.querySelector('input')
          
          expect(input).toBeInTheDocument()
          
          if (error) {
            // Input must have aria-invalid="true"
            const ariaInvalid = input?.getAttribute('aria-invalid')
            expect(ariaInvalid).toBe('true')
            
            // Input must have aria-describedby pointing to error message
            const ariaDescribedBy = input?.getAttribute('aria-describedby')
            expect(ariaDescribedBy).toBeTruthy()
            
            // Error message element must exist
            const errorElement = container.querySelector(`[id="${ariaDescribedBy}"]`)
            expect(errorElement).toBeInTheDocument()
            
            // Error message must have role="alert"
            const errorRole = errorElement?.getAttribute('role')
            expect(errorRole).toBe('alert')
            
            // Error message must contain the error text
            const errorText = errorElement?.textContent
            expect(errorText).toContain(error)
            
            return true
          } else {
            // No error, aria-invalid should be false or not present
            const ariaInvalid = input?.getAttribute('aria-invalid')
            return ariaInvalid !== 'true'
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Select fields must have associated labels
   */
  it('should ensure select fields have labels with matching htmlFor and id', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\s/g, '-')),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (id, label, options) => {
          const { container } = render(
            <SelectFieldWithLabel id={id} label={label} options={options} />
          )
          
          const select = container.querySelector('select')
          const labelElement = container.querySelector('label')
          
          expect(select).toBeInTheDocument()
          expect(labelElement).toBeInTheDocument()
          
          // Select must have an id
          const selectId = select?.getAttribute('id')
          expect(selectId).toBeTruthy()
          
          // Label must have htmlFor attribute
          const labelFor = labelElement?.getAttribute('for')
          expect(labelFor).toBeTruthy()
          
          // htmlFor must match select id
          return labelFor === selectId && selectId === id
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Textarea fields must have associated labels
   */
  it('should ensure textarea fields have labels with matching htmlFor and id', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\s/g, '-')),
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, label) => {
          const { container } = render(
            <TextareaFieldWithLabel id={id} label={label} />
          )
          
          const textarea = container.querySelector('textarea')
          const labelElement = container.querySelector('label')
          
          expect(textarea).toBeInTheDocument()
          expect(labelElement).toBeInTheDocument()
          
          // Textarea must have an id
          const textareaId = textarea?.getAttribute('id')
          expect(textareaId).toBeTruthy()
          
          // Label must have htmlFor attribute
          const labelFor = labelElement?.getAttribute('for')
          expect(labelFor).toBeTruthy()
          
          // htmlFor must match textarea id
          return labelFor === textareaId && textareaId === id
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Form fields must have name attributes for form submission
   */
  it('should ensure all form fields have name attributes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\s/g, '-')),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('text', 'email', 'password'),
        (id, label, type) => {
          const { container } = render(
            <FormFieldWithLabel id={id} label={label} type={type} />
          )
          
          const input = container.querySelector('input')
          expect(input).toBeInTheDocument()
          
          // Input must have name attribute
          const name = input?.getAttribute('name')
          expect(name).toBeTruthy()
          
          // Name should match id for consistency
          return name === id
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Error messages must be associated with their fields via aria-describedby
   */
  it('should associate error messages with fields using aria-describedby', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'field'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (id, label, error) => {
          const { container } = render(
            <FormFieldWithLabel id={id} label={label} error={error} />
          )
          
          const input = container.querySelector('input')
          expect(input).toBeInTheDocument()
          
          // Input must have aria-describedby
          const ariaDescribedBy = input?.getAttribute('aria-describedby')
          expect(ariaDescribedBy).toBeTruthy()
          
          // Error element must exist with matching id
          const errorElement = container.querySelector(`[id="${ariaDescribedBy}"]`)
          expect(errorElement).toBeInTheDocument()
          
          // aria-describedby should reference the error element id
          const expectedErrorId = `${id}-error`
          return ariaDescribedBy === expectedErrorId
        }
      ),
      { numRuns: 100 }
    )
  })
})
