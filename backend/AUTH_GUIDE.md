# Authentication Implementation Guide

## Overview

This backend now includes complete JWT-based authentication with:
- ✅ HTTP-only cookies for token storage
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ User registration and login endpoints

---

## Architecture

### Components

1. **Auth Service** (`infrastructure/services/auth.py`)
   - Password hashing and verification
   - JWT token generation and validation
   - Token extraction from headers/cookies

2. **Auth Repository** (`infrastructure/repositories/auth.py`)
   - Database operations for auth
   - User CRUD operations
   - Credential verification

3. **Auth Dependencies** (`application/dependencies.py`)
   - Dependency injection for current user
   - Role-based access control checks
   - Optional user support

4. **Auth Schemas** (`application/schemas/auth.py`)
   - Request/response data models
   - Validation rules
   - Type definitions

5. **Auth Router** (`presentation/routers/v1/auth.py`)
   - Endpoints for login, register, logout
   - Token refresh and verification
   - Password change

---

## Setup Steps

### 1. Update Environment Variables

Edit `backend/.env` and update:

```env
# Generate a strong secret key - min 32 characters
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars-abc123xyz789

# Token expiration in minutes
ACCESS_TOKEN_EXPIRE_MINUTES=30

# For development (disable in production with HTTPS)
SECURE_COOKIES=false
```

**Generate a secure SECRET_KEY:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 2. Update Database Schema

Run the migration to add auth fields:

```bash
cd backend
alembic upgrade head
```

This adds:
- `hashed_password` - Encrypted password
- `is_active` - Account status
- `default_role` - User role

### 3. Start Backend

```bash
cd backend
python -m uvicorn src.application.main:app --reload
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### **POST** `/api/v1/auth/register`
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "user_name": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone_num": "1234567890",
  "password": "SecurePass123!",
  "role": "buyer"
}
```

**Validation Rules:**
- Email: valid email format
- Username: 3-64 chars, alphanumeric + underscore
- Password: min 8 chars, must include uppercase, digit, & special char
- Role: `admin`, `seller`, or `buyer` (default: `buyer`)

**Response:** `201 Created`
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "user_name": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "default_role": "buyer",
  "phone_num": "1234567890",
  "is_active": true,
  "profile_image_url": null
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or user already exists
- `422 Unprocessable Entity` - Validation error

---

#### **POST** `/api/v1/auth/login`
Login with email or username

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer"
}
```

**Side Effect:** Sets `access_token` HTTP-only cookie

**Error Responses:**
- `401 Unauthorized` - Invalid credentials or inactive user

---

### Protected Endpoints (Authentication Required)

#### **GET** `/api/v1/auth/me`
Get current user profile

**Headers:**
```
Authorization: Bearer <token>
```
OR automatically uses `access_token` cookie

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "user_name": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "default_role": "buyer",
  "phone_num": "1234567890",
  "is_active": true,
  "profile_image_url": null
}
```

---

#### **POST** `/api/v1/auth/change-password`
Change user password

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Current password incorrect

---

#### **POST** `/api/v1/auth/logout`
Logout user (clear cookie)

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**Side Effect:** Deletes `access_token` HTTP-only cookie

---

#### **POST** `/api/v1/auth/refresh-token`
Refresh access token before expiration

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer"
}
```

**Side Effect:** Updates `access_token` HTTP-only cookie

---

#### **GET** `/api/v1/auth/verify-token`
Verify if current token is valid

**Response:** `200 OK`
```json
{
  "valid": true,
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer"
}
```

---

## Using Authentication in Your Endpoints

### Example 1: Protected Endpoint - Any Authenticated User

```python
from fastapi import APIRouter, Depends
from src.application.dependencies import get_current_user
from src.application.schemas.auth import TokenData

router = APIRouter()

@router.get("/profile")
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Any authenticated user can access this"""
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role
    }
```

---

### Example 2: Admin Only Endpoint

```python
from src.application.dependencies import get_current_admin

@router.get("/admin/users")
async def list_all_users(current_user: TokenData = Depends(get_current_admin)):
    """Only admin users can access this"""
    # Admin logic here
    pass
```

---

### Example 3: Seller Only Endpoint

```python
from src.application.dependencies import get_current_seller

@router.post("/seller/auction")
async def create_auction(current_user: TokenData = Depends(get_current_seller)):
    """Sellers and admins can access this"""
    # Seller logic here
    pass
```

---

### Example 4: Buyer Only Endpoint

```python
from src.application.dependencies import get_current_buyer

@router.post("/buyer/bid")
async def place_bid(current_user: TokenData = Depends(get_current_buyer)):
    """Buyers and admins can access this"""
    # Buyer logic here
    pass
```

---

### Example 5: Optional Authentication

```python
from src.application.dependencies import get_optional_user
from typing import Optional

@router.get("/auctions")
async def list_auctions(current_user: Optional[TokenData] = Depends(get_optional_user)):
    """Anyone can access, but user info available if logged in"""
    if current_user:
        # User is authenticated
        return {"auctions": [...], "user_id": current_user.user_id}
    else:
        # Anonymous user
        return {"auctions": [...], "user_id": None}
```

---

## Frontend Integration

### Using Fetch API

```javascript
// Login
async function login(username, password) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Important: Include cookies
    body: JSON.stringify({ username, password })
  });
  return await response.json();
}

// Access protected endpoint
async function getProfile() {
  const response = await fetch('http://localhost:8000/api/v1/auth/me', {
    credentials: 'include'  // Include access_token cookie
  });
  return await response.json();
}

// Logout
async function logout() {
  await fetch('http://localhost:8000/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
}
```

### Using Axios

```javascript
import axios from 'axios';

// Create instance with credentials
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true  // Include cookies
});

// Login
async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

// Access protected endpoint
async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data;
}
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Change `SECRET_KEY` to a strong random value in production
- ✅ Use at least 32 characters for `SECRET_KEY`
- ✅ Never commit `.env` to version control

### 2. HTTPS
- ✅ Set `SECURE_COOKIES=true` in production (requires HTTPS)
- ✅ Configure `CORSMiddleware` with specific origins (not `["*"]`)

### 3. Token Expiration
- ✅ Set `ACCESS_TOKEN_EXPIRE_MINUTES` to reasonable value (15-60 min)
- ✅ Implement token refresh logic in frontend
- ✅ Clear cookies on logout

### 4. Password Requirements
- ✅ Enforce strong passwords (8+ chars, uppercase, digit, special char)
- ✅ Never log passwords
- ✅ Hash passwords with bcrypt

### 5. Rate Limiting (Optional)
Add rate limiting to auth endpoints:
```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    pass
```

---

## Role-Based Access Control

### Roles Explained

| Role | Permissions |
|------|------------|
| **Admin** | View users, manage system, access seller/buyer features |
| **Seller** | Create auctions, view sales, manage products |
| **Buyer** | Place bids, view auctions, manage purchases |

---

## Troubleshooting

### Issue: "Not authenticated" error on protected endpoint

**Solution:**
1. Ensure login endpoint was called first
2. Check if cookie is being sent: `credentials: 'include'` in frontend
3. Verify token in browser DevTools > Application > Cookies
4. Ensure CORS allows credentials: `allow_credentials=True`

---

### Issue: Token expired

**Solution:**
1. Implement token refresh in frontend before expiration
2. Call `/api/v1/auth/refresh-token` endpoint
3. Update token in cookie automatically

---

### Issue: CORS error

**Solution:**
Ensure CORS is configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing with Swagger

1. Open API docs: `http://localhost:8000/docs`
2. Click "Authorize" button (lock icon)
3. Enter token from login response
4. Protected endpoints now accessible

---

## Database Schema

User table now includes:

```sql
CREATE TABLE users (
    user_id UNIQUEIDENTIFIER PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    user_name VARCHAR(64) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,  -- NEW
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    phone_num VARCHAR(32) NOT NULL,
    default_role VARCHAR(16) NOT NULL DEFAULT 'buyer',
    is_active BIT NOT NULL DEFAULT 1,  -- NEW
    profile_image_url VARCHAR(256)
);
```

---

## Next Steps

1. ✅ Implement refresh token rotation for better security
2. ✅ Add email verification endpoint
3. ✅ Add password reset functionality
4. ✅ Implement two-factor authentication (2FA)
5. ✅ Add audit logging for auth events
6. ✅ Add rate limiting to prevent brute force
7. ✅ Implement permission-based resources (beyond roles)

---

## Questions?

Reference the implementation files:
- `src/infrastructure/services/auth.py` - Token/password logic
- `src/application/dependencies.py` - Access control
- `src/presentation/routers/v1/auth.py` - Endpoints
- `src/infrastructure/repositories/auth.py` - Database ops
