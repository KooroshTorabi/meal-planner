# Swagger API Documentation - Quick Reference

## 🚀 Quick Start (30 seconds)

1. **Open**: http://localhost:3000/api-docs
2. **Login**: Click `POST /api/users/login` → Try it out
3. **Credentials**: `admin@example.com` / `test`
4. **Execute**: Click Execute button
5. **Copy Token**: Copy the `token` value from response
6. **Authorize**: Click 🔓 Authorize button at top
7. **Paste**: Enter `Bearer <your-token>`
8. **Done**: Now test any endpoint!

## 📍 Access Points

| Resource | URL |
|----------|-----|
| Swagger UI | http://localhost:3000/api-docs |
| OpenAPI Spec | http://localhost:3000/api/swagger.json |
| Home Page Link | http://localhost:3000 → Developer Resources |

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | test |
| Caregiver | caregiver@example.com | test |
| Kitchen | kitchen@example.com | test |

## 📚 Documented Endpoints (15 total)

### Authentication (5)
- `POST /api/users/login` - Login
- `POST /api/users/refresh` - Refresh token
- `POST /api/users/logout` - Logout
- `POST /api/users/enable-2fa` - Enable 2FA
- `POST /api/users/verify-2fa` - Verify 2FA

### Kitchen (2)
- `GET /api/kitchen/dashboard` - Dashboard
- `GET /api/kitchen/aggregate-ingredients` - Ingredients

### Search (2)
- `GET /api/meal-orders/search` - Search orders
- `GET /api/residents/search` - Search residents

### Alerts (2)
- `POST /api/alerts/{id}/acknowledge` - Acknowledge
- `POST /api/alerts/escalate` - Escalate

### Reports (2)
- `GET /api/reports/meal-orders` - Generate report
- `GET /api/reports/analytics` - Analytics

### Admin (2)
- `GET /api/archived/{collection}/{id}` - Archived data
- `GET /api/audit-logs` - Audit logs

## 🎯 Common Tasks

### Test Authentication
```
1. POST /api/users/login
2. Copy token
3. Click Authorize
4. Paste token
5. Test protected endpoint
```

### Test Kitchen Dashboard
```
1. Authorize first
2. GET /api/kitchen/dashboard
3. Parameters:
   - date: 2024-12-04
   - mealType: breakfast
4. Execute
```

### Search Meal Orders
```
1. Authorize first
2. GET /api/meal-orders/search
3. Parameters:
   - mealType: breakfast
   - status: pending
4. Execute
```

### Generate Report
```
1. Authorize as admin
2. GET /api/reports/meal-orders
3. Parameters:
   - startDate: 2024-12-01
   - endDate: 2024-12-31
   - format: json
4. Execute
```

## 🛠️ Tools Integration

### Postman
```
1. Open Postman
2. Import → Link
3. http://localhost:3000/api/swagger.json
4. Import
```

### Generate Client SDK
```bash
npm install -g @openapitools/openapi-generator-cli
openapi-generator-cli generate \
  -i http://localhost:3000/api/swagger.json \
  -g typescript-fetch \
  -o ./client
```

### Curl
```bash
# Get spec
curl http://localhost:3000/api/swagger.json > api-spec.json

# Test endpoint
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"test"}'
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Swagger UI blank | Check `/api/swagger.json` loads |
| 401 Unauthorized | Re-authorize with fresh token |
| Endpoint missing | Restart dev server |
| Request fails | Check required parameters |

## 📖 Full Documentation

- **Usage Guide**: [SWAGGER_API_DOCS.md](./SWAGGER_API_DOCS.md)
- **Implementation**: [SWAGGER_IMPLEMENTATION_SUMMARY.md](./SWAGGER_IMPLEMENTATION_SUMMARY.md)
- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 💡 Tips

- ✅ Use **Try it out** to test endpoints
- ✅ Check **Schemas** section for data models
- ✅ Use **Authorize** once, works for all endpoints
- ✅ Copy examples from documentation
- ✅ Test different roles to verify access control

---

**Need Help?** See [SWAGGER_API_DOCS.md](./SWAGGER_API_DOCS.md) for detailed guide
