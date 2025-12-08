# Kitchen Dashboard - Order Details Feature

## What Was Added

Added the ability for kitchen staff to view detailed meal options for each order in the kitchen dashboard.

## Changes Made

### 1. Updated `app/kitchen/dashboard/page.tsx`

#### Added State Management
- Added `expandedOrderId` state to track which order's details are currently expanded
- Only one order can be expanded at a time for cleaner UI

#### Added Meal Options Interface
- Extended `MealOrder` interface to include:
  - `breakfastOptions`
  - `lunchOptions`
  - `dinnerOptions`

#### Created `formatMealOptions()` Helper Function
This function formats and displays meal-specific options based on meal type:

**Breakfast Options:**
- Follows Plan indicator
- Bread items (Brötchen, Vollkornbrötchen, Graubrot, etc.)
- Bread preparation (Sliced, Spread)
- Spreads (Butter, Margarine, Jam, Honey, Cheese, Sausage)
- Porridge option
- Beverages (Coffee, Tea, Hot/Cold milk)
- Additions (Sugar, Sweetener, Coffee creamer)

**Lunch Options:**
- Portion size (Small, Large, Vegetarian)
- Soup option
- Dessert option
- Special preparations (Pureed food, Pureed meat, Sliced meat, Mashed potatoes)
- Restrictions (No fish, Fingerfood, Only sweet)

**Dinner Options:**
- Follows Plan indicator
- Bread items (Graubrot, Vollkornbrot, Weißbrot, Knäckebrot)
- Bread preparation (Spread, Sliced)
- Spreads (Butter, Margarine)
- Soup option
- Porridge option
- No Fish option
- Beverages (Tea, Cocoa, Hot/Cold milk)
- Additions (Sugar, Sweetener)

#### Updated Order Display
- Added "View Details" button with chevron icon that rotates when expanded
- Details section shows/hides when button is clicked
- Details are displayed in a clean, organized format with:
  - Section header showing meal type
  - Formatted meal options with labels and values
  - Color-coded badges for boolean options (Yes/No)
  - Comma-separated lists for multi-select options

## User Experience

### For Kitchen Staff

1. **Login** as kitchen user (`kitchen@example.com` / `test`)
2. **Navigate** to Kitchen Dashboard
3. **Select** date and meal type
4. **View** list of orders with basic information:
   - Resident name and room number
   - Urgent flag (if applicable)
   - Special notes
   - Order status
5. **Click** "View Details" on any order to see:
   - All meal-specific options
   - Dietary preferences
   - Special preparations
   - Beverage choices
   - Additional items
6. **Click** "Hide Details" to collapse the section

### Visual Design

- Details button uses blue color scheme matching the app
- Chevron icon rotates 90° when expanded for visual feedback
- Details section has a top border to separate from main content
- Options are displayed with clear labels and organized spacing
- Boolean options (Yes/No) shown as colored badges
- Multi-select options shown as comma-separated lists

## Benefits

1. **Complete Information**: Kitchen staff can see exactly what each resident ordered
2. **Better Preparation**: All dietary requirements and preferences visible at a glance
3. **Reduced Errors**: Clear display of all options reduces chance of mistakes
4. **Efficient Workflow**: Expandable design keeps interface clean while providing access to details when needed
5. **Mobile Friendly**: Works well on all screen sizes

## Testing

### Test Scenario 1: View Breakfast Order Details
1. Login as kitchen user
2. Select today's date and "Breakfast" meal type
3. Click "View Details" on any breakfast order
4. Verify you can see:
   - Bread items selected
   - Spreads and toppings
   - Beverage choices
   - Any special additions

### Test Scenario 2: View Lunch Order Details
1. Select "Lunch" meal type
2. Click "View Details" on any lunch order
3. Verify you can see:
   - Portion size
   - Soup/Dessert options
   - Special preparations
   - Dietary restrictions

### Test Scenario 3: View Dinner Order Details
1. Select "Dinner" meal type
2. Click "View Details" on any dinner order
3. Verify you can see:
   - Bread items and preparation
   - Soup/Porridge options
   - No Fish restriction
   - Beverage choices

### Test Scenario 4: Expand/Collapse Multiple Orders
1. Click "View Details" on first order - should expand
2. Click "View Details" on second order - first should collapse, second should expand
3. Click "Hide Details" - should collapse current order

## Files Modified

- ✅ `app/kitchen/dashboard/page.tsx` - Added order details functionality and fixed status update endpoint

## Next Steps (Optional Enhancements)

1. **Print View**: Add a "Print Order Details" button for physical kitchen copies
2. **Bulk Expand**: Add "Expand All" / "Collapse All" buttons
3. **Search/Filter**: Add search by resident name or room number
4. **Dietary Alerts**: Highlight specific dietary restrictions in red
5. **Order Notes**: Allow kitchen staff to add preparation notes
6. **Time Tracking**: Show how long each order has been pending

## Technical Notes

- Uses React state management for expand/collapse
- No API changes required - data already available from existing endpoint
- Fully responsive design works on mobile and desktop
- Dark mode compatible
- Accessible with keyboard navigation

## Bug Fixes

### Fixed Status Update Endpoint (404 Error)
**Issue**: When clicking "Mark Prepared" or "Mark Completed", the request was going to `/api/collections/meal-orders/:id` which doesn't exist, resulting in a 404 error.

**Solution**: Changed the endpoint to `/api/meal-orders/:id` which is the correct API route. Also added:
- `credentials: 'include'` for proper authentication
- Better error handling to show the actual error message from the API

**Before**: 
```javascript
fetch(`/api/collections/meal-orders/${orderId}`, ...)
```

**After**:
```javascript
fetch(`/api/meal-orders/${orderId}`, {
  method: 'PATCH',
  credentials: 'include',
  ...
})
```
