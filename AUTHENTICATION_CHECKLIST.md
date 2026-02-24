# Authentication Implementation - Quick Start Checklist

## Pre-Implementation
- [ ] Read [AUTH_GUIDE.md](AUTH_GUIDE.md) for complete documentation

## Step 1: Environment Setup
- [ ] Update `backend/.env` with a strong `SECRET_KEY` (min 32 chars)
- [ ] Verify `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- [ ] Set `SECURE_COOKIES=false` for development (true for production)

## Step 2: Database Migration
- [ ] Run: `cd backend && alembic upgrade head`
- [ ] This adds: `hashed_password`, `is_active`, `default_role` columns
- [ ] Verify migration in MSSQL: Check users table schema

## Step 3: Install Dependencies
- [ ] Verify all dependencies in `requirements.txt`:
  - `fastapi==0.127.0` ✅
  - `python-jose[cryptography]==3.3.0` ✅
  - `passlib[bcrypt]==1.7.4` ✅
  - `bcrypt==4.2.0` ✅
  - `python-dotenv==1.0.1` ✅

## Step 4: Backend Files Created
Check these files exist:
- [ ] `src/infrastructure/services/auth.py` - Auth service
- [ ] `src/infrastructure/repositories/auth.py` - Auth repository
- [ ] `src/application/schemas/auth.py` - Auth schemas
- [ ] `src/presentation/routers/v1/auth.py` - Auth endpoints
- [ ] `src/application/dependencies.py` - Updated with auth dependencies
- [ ] `.env` - Updated with SECRET_KEY

## Step 5: Backend File Updates
Check these files were modified:
- [ ] `src/domain/models/user.py` - Added `hashed_password` and `is_active`
- [ ] `src/application/main.py` - Imports auth router, updated CORS

## Step 6: Test Backend
```bash
# Navigate to backend
cd backend

# Start server
python -m uvicorn src.application.main:app --reload
```

## Step 7: Test Auth Endpoints

### Test Registration
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "user_name": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "phone_num": "1234567890",
    "password": "TestPass123!",
    "role": "buyer"
  }'
```

### Test Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

### Test Protected Endpoint (with cookie)
```bash
curl "http://localhost:8000/api/v1/auth/me" \
  -H "Cookie: access_token=<token_from_login>"
```

### Test Logout
```bash
curl -X POST "http://localhost:8000/api/v1/auth/logout" \
  -c cookies.txt
```

## Step 8: Frontend Integration

### Update API Client
In `frontend/lib/apiClient.ts`:
```typescript
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,  // Important: Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Create Auth Context/Store
- [ ] Create `frontend/context/auth.tsx` or use your state management
- [ ] Implement login function that stores token
- [ ] Implement logout function that clears token
- [ ] Implement protected routes wrapper

### Example Protected Route (Next.js):
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';

export default function ProtectedPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return <div>Welcome, {user?.email}</div>;
}
```

## Step 9: Protect Your Endpoints

### Add Role-Based Checks
Update existing endpoints to require authentication:

```python
from src.application.dependencies import get_current_seller

@router.post("/seller/auction", response_model=AuctionResponse)
async def create_auction(
    auction: AuctionCreateSchema,
    current_user: TokenData = Depends(get_current_seller),  # Add this
    db: Session = Depends(get_db),
):
    # Verify user is owner
    auction.seller_id = current_user.user_id
    # ... rest of logic
```

## Step 10: Update All Sensitive Endpoints

Review your routers and add appropriate dependencies:
- [ ] `bid.py` - Buyer/Admin required for bid placement
- [ ] `auction.py` - Seller/Admin required for creation
- [ ] `order.py` - Buyer required for order placement
- [ ] `user.py` - Update profile endpoints to require auth

## Step 11: Testing in Development

### Using Swagger UI
1. Go to: `http://localhost:8000/docs`
2. Find `/auth/register` - Register a test user
3. Find `/auth/login` - Login to get token
4. Click "Authorize" (lock icon at top)
5. Paste token in format: `Bearer <token_here>`
6. Now test protected endpoints

### Using Postman
1. In Login request, go to Tests tab:
```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.access_token);
pm.environment.set("user_id", jsonData.user_id);
```
2. In protected requests, use Header:
```
Authorization: Bearer {{token}}
```

## Step 12: Security Checklist

- [ ] Change `SECRET_KEY` in `.env` to a unique 32+ char string
- [ ] In production: Set `SECURE_COOKIES=true` (requires HTTPS)
- [ ] In production: Update `CORS_ORIGINS` to your domain only
- [ ] Never commit `.env` to Git (already in `.gitignore`)
- [ ] Update password requirements if needed in `schemas/auth.py`
- [ ] Add rate limiting to login endpoint (optional but recommended)

## Troubleshooting

### Issue: 422 Unprocessable Entity on register
- Check password format: must have uppercase, digit, special char
- Example valid: `TestPass123!`

### Issue: 401 Unauthorized on protected endpoint
- Ensure you logged in first
- Check cookie is being sent: `withCredentials: true`
- Verify token not expired (default 30 minutes)

### Issue: CORS errors
- Add frontend URL to `origins` list in `main.py`
- Ensure `allow_credentials=True` in CORS middleware

### Issue: Database columns don't exist
- Run migration: `alembic upgrade head`
- Check migration file: `alembic/versions/001_add_auth_fields.py`

## Next Steps

### Phase 2: Advanced Features
1. Implement email verification on registration
2. Add password reset with email link
3. Add refresh token rotation
4. Implement 2FA (two-factor authentication)
5. Add audit logging for security events

### Phase 3: Integration Testing
- [ ] Write unit tests for auth service
- [ ] Write integration tests for auth endpoints
- [ ] Test with various user roles
- [ ] Test token expiration and refresh

---

## References

- [FastAPI Security Docs](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Complete Guide](AUTH_GUIDE.md)
