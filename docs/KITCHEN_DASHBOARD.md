# Kitchen Dashboard Documentation

This document provides comprehensive documentation for the Kitchen Dashboard feature in the Meal Planner System.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Aggregation Logic](#aggregation-logic)
- [Custom UI Components](#custom-ui-components)
- [Usage Instructions](#usage-instructions)
- [API Integration](#api-integration)
- [Performance Optimizations](#performance-optimizations)
- [Troubleshooting](#troubleshooting)

## Overview

The Kitchen Dashboard is a specialized interface designed for kitchen staff to efficiently plan and prepare meals. It provides real-time ingredient aggregation, order tracking, and alert management.

### Purpose

- **Ingredient Planning**: View aggregated ingredient quantities for a specific date and meal type
- **Order Tracking**: Monitor meal preparation progress with status indicators
- **Alert Management**: Receive and acknowledge urgent order notifications
- **Summary Statistics**: Quick overview of pending, prepared, and completed orders

### User Roles

- **Kitchen Staff**: Primary users with full dashboard access
- **Admin**: Full access to all dashboard features
- **Caregiver**: No access to kitchen dashboard

## Features

### 1. Date and Meal Type Selection

Select the date and meal type to view relevant data:
- Date picker for selecting any date
- Meal type selector (Breakfast, Lunch, Dinner)
- Real-time data updates on selection change

### 2. Summary Statistics

Quick overview of order status:
- **Total Orders**: Total number of orders for selected date/meal
- **Pending Orders**: Orders awaiting preparation
- **Prepared Orders**: Orders marked as prepared
- **Completed Orders**: Orders marked as completed

### 3. Ingredient Aggregation Report

Aggregated ingredient quantities across all orders:
- Grouped by category (bread, spreads, beverages, etc.)
- Shows quantity and unit for each ingredient
- Automatically filters by order status (pending + prepared only)
- Optimized database queries for fast performance

### 4. Order List

Detailed list of all meal orders:
- Resident name and room number
- Meal preferences and special notes
- Order status with visual indicators
- Ability to mark orders as prepared
- Filter by status (pending, prepared, completed)

### 5. Alert Notifications

Real-time alerts for urgent orders:
- Prominent display of unacknowledged alerts
- Severity indicators (low, medium, high, critical)
- One-click acknowledgment
- Alert history

## Aggregation Logic

### How It Works

The ingredient aggregation system counts ingredients across all meal orders for a specific date and meal type.

### Algorithm

```typescript
// 1. Fetch all meal orders for date and meal type
const orders = await fetchMealOrders({
  date: '2024-01-15',
  mealType: 'breakfast',
  status: ['pending', 'prepared']  // Only count active orders
})

// 2. Initialize ingredient counters
const ingredients = new Map<string, number>()

// 3. Iterate through each order
for (const order of orders) {
  // 4. Extract meal-specific options
  const options = order.breakfastOptions  // or lunchOptions, dinnerOptions
  
  // 5. Count each ingredient
  if (options.breadItems) {
    for (const item of options.breadItems) {
      ingredients.set(item, (ingredients.get(item) || 0) + 1)
    }
  }
  
  if (options.spreads) {
    for (const spread of options.spreads) {
      ingredients.set(spread, (ingredients.get(spread) || 0) + 1)
    }
  }
  
  // ... count other ingredients
}

// 6. Format results
const result = Array.from(ingredients.entries()).map(([name, quantity]) => ({
  name,
  category: getCategoryForIngredient(name),
  quantity,
  unit: getUnitForIngredient(name)
}))
```

### Optimization

**Database-Level Aggregation**:
```typescript
// Instead of fetching all orders and counting in memory,
// use database aggregation for better performance

const result = await db.query(`
  SELECT 
    ingredient,
    COUNT(*) as quantity
  FROM (
    SELECT unnest(breakfast_options->'breadItems') as ingredient
    FROM meal_orders
    WHERE date = $1 AND meal_type = $2 AND status IN ('pending', 'prepared')
  ) subquery
  GROUP BY ingredient
`, [date, mealType])
```

### Example Output

```json
{
  "date": "2024-01-15",
  "mealType": "breakfast",
  "totalOrders": 50,
  "ingredients": [
    {
      "name": "brötchen",
      "category": "bread",
      "quantity": 82,
      "unit": "pieces"
    },
    {
      "name": "butter",
      "category": "spread",
      "quantity": 65,
      "unit": "portions"
    },
    {
      "name": "kaffee",
      "category": "beverage",
      "quantity": 45,
      "unit": "cups"
    }
  ]
}
```


## Custom UI Components

### Dashboard Layout

```tsx
<main className="kitchen-dashboard">
  <header>
    <h1>Kitchen Dashboard</h1>
    <DateMealTypeSelector />
  </header>
  
  <section className="summary-stats">
    <StatCard title="Total Orders" value={50} />
    <StatCard title="Pending" value={30} variant="warning" />
    <StatCard title="Prepared" value={15} variant="success" />
    <StatCard title="Completed" value={5} variant="info" />
  </section>
  
  <section className="ingredient-report">
    <h2>Ingredient Report</h2>
    <IngredientTable ingredients={ingredients} />
  </section>
  
  <section className="order-list">
    <h2>Meal Orders</h2>
    <OrderFilters />
    <OrderTable orders={orders} onStatusChange={handleStatusChange} />
  </section>
  
  <section className="alerts">
    <h2>Alerts</h2>
    <AlertList alerts={alerts} onAcknowledge={handleAcknowledge} />
  </section>
</main>
```

### Date and Meal Type Selector

```tsx
function DateMealTypeSelector({ onSelect }) {
  const [date, setDate] = useState(new Date())
  const [mealType, setMealType] = useState('breakfast')
  
  useEffect(() => {
    onSelect({ date, mealType })
  }, [date, mealType])
  
  return (
    <div className="selector">
      <input
        type="date"
        value={formatDate(date)}
        onChange={(e) => setDate(new Date(e.target.value))}
        aria-label="Select date"
      />
      
      <select
        value={mealType}
        onChange={(e) => setMealType(e.target.value)}
        aria-label="Select meal type"
      >
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
    </div>
  )
}
```

### Ingredient Table

```tsx
function IngredientTable({ ingredients }) {
  // Group ingredients by category
  const grouped = groupBy(ingredients, 'category')
  
  return (
    <table className="ingredient-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Ingredient</th>
          <th>Quantity</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(grouped).map(([category, items]) => (
          <React.Fragment key={category}>
            <tr className="category-row">
              <td colSpan={4}><strong>{category}</strong></td>
            </tr>
            {items.map((item) => (
              <tr key={item.name}>
                <td></td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}
```

### Order Table

```tsx
function OrderTable({ orders, onStatusChange }) {
  return (
    <table className="order-table">
      <thead>
        <tr>
          <th>Resident</th>
          <th>Room</th>
          <th>Preferences</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className={`status-${order.status}`}>
            <td>{order.resident.name}</td>
            <td>{order.resident.roomNumber}</td>
            <td>
              <PreferenceSummary options={order.breakfastOptions} />
            </td>
            <td>
              <StatusBadge status={order.status} />
            </td>
            <td>
              {order.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(order.id, 'prepared')}
                  className="btn-primary"
                >
                  Mark Prepared
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Alert List

```tsx
function AlertList({ alerts, onAcknowledge }) {
  const unacknowledged = alerts.filter(a => !a.acknowledged)
  
  return (
    <div className="alert-list">
      {unacknowledged.length === 0 ? (
        <p className="no-alerts">No unacknowledged alerts</p>
      ) : (
        unacknowledged.map((alert) => (
          <div key={alert.id} className={`alert severity-${alert.severity}`}>
            <div className="alert-icon">
              <AlertIcon severity={alert.severity} />
            </div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              <p className="alert-time">
                {formatTimeAgo(alert.createdAt)}
              </p>
            </div>
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="btn-acknowledge"
              aria-label="Acknowledge alert"
            >
              Acknowledge
            </button>
          </div>
        ))
      )}
    </div>
  )
}
```

### Status Badge

```tsx
function StatusBadge({ status }) {
  const variants = {
    pending: { color: 'warning', label: 'PENDING' },
    prepared: { color: 'success', label: 'PREPARED' },
    completed: { color: 'info', label: 'COMPLETED' }
  }
  
  const variant = variants[status]
  
  return (
    <span className={`badge badge-${variant.color}`}>
      {variant.label}
    </span>
  )
}
```

## Usage Instructions

### For Kitchen Staff

#### 1. Accessing the Dashboard

1. Log in with kitchen staff credentials
2. Navigate to "Kitchen Dashboard" from the main menu
3. Dashboard loads with today's date and breakfast by default

#### 2. Viewing Ingredient Report

1. Select desired date using date picker
2. Select meal type (Breakfast, Lunch, or Dinner)
3. View aggregated ingredient quantities in the report
4. Ingredients are grouped by category for easy reading
5. Print or export report if needed

#### 3. Managing Orders

1. View list of all orders for selected date/meal
2. Orders are color-coded by status:
   - Yellow: Pending
   - Green: Prepared
   - Blue: Completed
3. Click "Mark Prepared" to update order status
4. Use filters to show only specific statuses

#### 4. Handling Alerts

1. Unacknowledged alerts appear at the top
2. Alerts are color-coded by severity:
   - Red: Critical
   - Orange: High
   - Yellow: Medium
   - Blue: Low
3. Click "Acknowledge" to mark alert as seen
4. Acknowledged alerts move to history

### For Administrators

Administrators have all kitchen staff capabilities plus:
- Access to all historical data
- Ability to generate reports
- User management
- System configuration

## API Integration

### Fetching Dashboard Data

```typescript
async function fetchDashboardData(date: string, mealType: string) {
  const response = await fetch(
    `/api/kitchen/dashboard?date=${date}&mealType=${mealType}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  
  return response.json()
}
```

### Updating Order Status

```typescript
async function updateOrderStatus(orderId: string, status: string) {
  const response = await fetch(`/api/meal-orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update order status')
  }
  
  return response.json()
}
```

### Acknowledging Alerts

```typescript
async function acknowledgeAlert(alertId: string) {
  const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to acknowledge alert')
  }
  
  return response.json()
}
```

### Real-Time Updates (WebSocket)

```typescript
function setupWebSocket() {
  const ws = new WebSocket('ws://localhost:3000/ws')
  
  ws.onopen = () => {
    console.log('Connected to WebSocket')
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'alert') {
      // Add new alert to dashboard
      addAlert(data.data)
      // Show notification
      showNotification(data.data.message)
    }
    
    if (data.type === 'order_update') {
      // Update order in dashboard
      updateOrder(data.data)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  ws.onclose = () => {
    console.log('WebSocket disconnected')
    // Attempt to reconnect
    setTimeout(setupWebSocket, 5000)
  }
  
  return ws
}
```

## Performance Optimizations

### 1. Database Indexes

Ensure these indexes exist for optimal performance:

```sql
-- Composite index for dashboard queries
CREATE INDEX idx_meal_orders_date_meal_type 
ON meal_orders(date, meal_type);

-- Index for status filtering
CREATE INDEX idx_meal_orders_status 
ON meal_orders(status);

-- Index for resident lookups
CREATE INDEX idx_meal_orders_resident 
ON meal_orders(resident_id);
```

### 2. Caching Strategy

```typescript
// Cache ingredient aggregation results for 5 minutes
const cache = new Map()

async function getAggregatedIngredients(date: string, mealType: string) {
  const cacheKey = `${date}-${mealType}`
  
  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data
    }
  }
  
  // Fetch from database
  const data = await fetchFromDatabase(date, mealType)
  
  // Store in cache
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  
  return data
}
```

### 3. Pagination

For large order lists, implement pagination:

```typescript
async function fetchOrders(date: string, mealType: string, page: number = 1) {
  const limit = 50
  const offset = (page - 1) * limit
  
  const response = await fetch(
    `/api/meal-orders?date=${date}&mealType=${mealType}&limit=${limit}&offset=${offset}`
  )
  
  return response.json()
}
```

### 4. Lazy Loading

Load data only when needed:

```typescript
function KitchenDashboard() {
  const [activeTab, setActiveTab] = useState('ingredients')
  
  return (
    <div>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="ingredients">Ingredients</Tab>
        <Tab value="orders">Orders</Tab>
        <Tab value="alerts">Alerts</Tab>
      </Tabs>
      
      {activeTab === 'ingredients' && <IngredientReport />}
      {activeTab === 'orders' && <OrderList />}
      {activeTab === 'alerts' && <AlertList />}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

#### Issue: Ingredient counts seem incorrect

**Possible Causes**:
- Orders with status "completed" are being counted
- Duplicate orders exist
- Cache is stale

**Solutions**:
1. Verify only pending and prepared orders are counted
2. Check for duplicate orders in database
3. Clear cache and refresh data

#### Issue: Dashboard loads slowly

**Possible Causes**:
- Missing database indexes
- Too many orders to process
- Network latency

**Solutions**:
1. Add database indexes (see Performance Optimizations)
2. Implement pagination
3. Enable caching
4. Use database-level aggregation

#### Issue: Alerts not appearing in real-time

**Possible Causes**:
- WebSocket connection failed
- Browser blocking WebSocket
- Server WebSocket not configured

**Solutions**:
1. Check WebSocket connection in browser console
2. Verify WebSocket server is running
3. Check firewall/proxy settings
4. Fall back to polling if WebSocket unavailable

#### Issue: Cannot mark orders as prepared

**Possible Causes**:
- Insufficient permissions
- Order already prepared
- Network error

**Solutions**:
1. Verify user has kitchen or admin role
2. Check order status before attempting update
3. Check network connection
4. Review error message in console

### Debug Mode

Enable debug mode to see detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_KITCHEN_DASHBOARD = true
}

// In component
if (window.DEBUG_KITCHEN_DASHBOARD) {
  console.log('Dashboard data:', data)
  console.log('Aggregation result:', ingredients)
  console.log('WebSocket status:', ws.readyState)
}
```

## Best Practices

### 1. Refresh Data Regularly

```typescript
// Auto-refresh every 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData(date, mealType)
  }, 5 * 60 * 1000)
  
  return () => clearInterval(interval)
}, [date, mealType])
```

### 2. Handle Errors Gracefully

```typescript
try {
  const data = await fetchDashboardData(date, mealType)
  setDashboardData(data)
} catch (error) {
  console.error('Failed to fetch dashboard data:', error)
  showError('Failed to load dashboard. Please try again.')
}
```

### 3. Provide Loading States

```typescript
function KitchenDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  
  useEffect(() => {
    setLoading(true)
    fetchDashboardData(date, mealType)
      .then(setData)
      .finally(() => setLoading(false))
  }, [date, mealType])
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return <DashboardContent data={data} />
}
```

### 4. Optimize for Mobile

```css
/* Responsive design for tablets */
@media (max-width: 768px) {
  .ingredient-table {
    font-size: 14px;
  }
  
  .order-table {
    display: block;
    overflow-x: auto;
  }
  
  .alert-list {
    padding: 8px;
  }
}
```

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Data Models](DATA_MODELS.md)
- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md)
- [Aggregation Logic](../lib/aggregation/README.md)

---

**Last Updated**: December 2024
