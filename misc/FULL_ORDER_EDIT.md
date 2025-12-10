# Full Order Edit Implementation

## Summary
Extended the meal order edit functionality to allow editing all fields of a meal order, not just urgent flag and special notes.

## Changes Made

### 1. Updated `components/caregiver/MealOrderList.tsx`

#### Added Type Definitions
- Added `BreakfastOptions`, `LunchOptions`, and `DinnerOptions` interfaces
- Extended `MealOrder` interface to include meal-specific options

#### Enhanced `handleEditOrder` Function
- Now loads complete order data including all meal-specific options
- Initializes form data with date, meal type, and all meal options
- Converts date to YYYY-MM-DD format for date input

#### Updated `handleSaveEdit` Function
- Prepares complete update data including date, meal type, and meal-specific options
- Only sends meal options relevant to the selected meal type
- Improved error handling with detailed error messages

#### Added `toggleArrayValue` Helper Function
- Handles toggling of checkbox array values (bread items, spreads, beverages, etc.)
- Works with nested meal options structure

#### Completely Redesigned Edit Modal
- **Wider modal** (max-w-2xl) to accommodate more fields
- **Date selector** - Can change the order date
- **Meal type selector** - Can change between breakfast, lunch, dinner
- **Conditional meal options** - Shows appropriate options based on selected meal type
- **All breakfast options editable**:
  - Follows plan checkbox
  - Bread items (multiple selection)
  - Bread preparation (multiple selection)
  - Spreads (multiple selection)
  - Porridge checkbox
  - Beverages (multiple selection)
  - Additions (multiple selection)
- **All lunch options editable**:
  - Portion size dropdown
  - Soup checkbox
  - Dessert checkbox
  - Special preparations (multiple selection)
  - Restrictions (multiple selection)
- **All dinner options editable**:
  - Follows plan checkbox
  - Bread items (multiple selection)
  - Bread preparation (multiple selection)
  - Spreads (multiple selection)
  - Soup checkbox
  - Porridge checkbox
  - No fish checkbox
  - Beverages (multiple selection)
  - Additions (multiple selection)
- **Special notes** - Text area for additional instructions
- **Urgent flag** - Checkbox to mark order as urgent

## Use Cases

### 1. Correcting Data Entry Mistakes
If a caregiver accidentally selected the wrong meal type or date, they can now correct it without deleting and recreating the order.

### 2. Updating Resident Requests
When a resident changes their mind about meal preferences (e.g., wants different bread or beverages), the caregiver can update the order directly.

### 3. Adjusting Meal Options
If dietary requirements change or special preparations are needed, all options can be modified in the edit form.

### 4. Changing Meal Type
If an order was created for the wrong meal (e.g., breakfast instead of lunch), the meal type can be changed and appropriate options will be shown.

## Restrictions

- Only **pending orders** can be edited (Edit button only appears for orders with status='pending')
- **Resident cannot be changed** (shown as read-only information)
- Caregivers can only edit their own orders or orders for the current date (enforced by backend access control)

## Technical Details

### Form State Management
- Uses React state to manage complex nested form data
- Dynamically shows/hides meal-specific options based on selected meal type
- Handles array values (checkboxes) with toggle helper function

### API Integration
- Fetches full order details via GET `/api/meal-orders/:id`
- Updates order via PATCH `/api/meal-orders/:id`
- Sends only relevant meal options based on selected meal type

### UI/UX Features
- Scrollable modal for long forms
- Dark mode support throughout
- Clear visual grouping of meal-specific options
- Responsive grid layout for checkbox groups
- Proper labeling and accessibility

## Testing Recommendations

1. Test editing date and meal type
2. Test toggling various checkboxes and multi-select options
3. Test switching between meal types (breakfast → lunch → dinner)
4. Test saving changes and verifying they persist
5. Test that only pending orders show edit button
6. Test error handling when update fails
7. Test dark mode appearance

## Bug Fixes

### Empty portionSize Validation Error
**Issue**: When creating or editing lunch orders, Payload was rejecting empty string values for `portionSize`.

**Solution**: Added data cleaning logic to remove empty `portionSize` field before sending to API:
- In `MealOrderForm.tsx`: Clean lunch options before creating order
- In `MealOrderList.tsx`: Clean lunch options before updating order

This allows users to create lunch orders without selecting a portion size if they don't need to specify one.

## Files Modified

- `components/caregiver/MealOrderList.tsx` - Complete rewrite of edit functionality + empty portionSize fix
- `components/caregiver/MealOrderForm.tsx` - Added empty portionSize cleanup logic

## Related Files (No Changes Needed)

- `app/api/meal-orders/[id]/route.ts` - PATCH endpoint already supports full updates
- `collections/MealOrders.ts` - Validation hooks already handle all fields
