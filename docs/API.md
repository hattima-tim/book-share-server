# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a valid Clerk JWT token in the Authorization header:

```http
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### Health Check

#### GET /health
Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### Authentication

#### POST /api/auth/sync
Sync user data from Clerk authentication. Creates new user or returns existing user data.

**Headers:**
- `Authorization: Bearer <clerk_jwt_token>` (required)

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "clerkUserId": "user_2abc123def456",
  "referralCode": "ABC123XY",
  "credits": 0,
  "name": "John Doe"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `500 Internal Server Error` - Failed to generate unique referral code

---

### User Dashboard

#### GET /api/dashboard
Get comprehensive dashboard data for the authenticated user.

**Headers:**
- `Authorization: Bearer <clerk_jwt_token>` (required)

**Response:**
```json
{
  "name": "John Doe",
  "referredBy": "507f1f77bcf86cd799439012",
  "convertedUsers": 4,
  "totalCreditsEarned": 8,
  "currentBalance": 12,
  "referralLink": "http://localhost:3000/register?r=ABC123XY",
  "referralCode": "ABC123XY",
  "referredUsers": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Smith",
      "referralCode": "DEF456ZW",
      "status": "converted",
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found
- `400 Bad Request` - Invalid user ID format

---

### Products

#### GET /api/products
Get all available products in the digital marketplace.

**Query Parameters:**
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `category` (optional) - Filter by category (ebook, course, template, software, other)

**Response:**
```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Clean Code",
      "description": "A handbook of agile software craftsmanship",
      "author": "Robert C. Martin",
      "price": 32.99,
      "category": "ebook",
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/products/:id
Get a specific product by ID.

**Parameters:**
- `id` - Product ID

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "title": "Clean Code",
  "description": "A handbook of agile software craftsmanship",
  "author": "Robert C. Martin",
  "price": 32.99,
  "category": "ebook",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Product not found
- `400 Bad Request` - Invalid product ID format

---

### Purchases

#### POST /api/purchase
Create a new purchase with hybrid payment (credits + cash).

**Headers:**
- `Authorization: Bearer <clerk_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439014",
  "productName": "Clean Code",
  "amount": 32.99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase created successfully"
}
```

**Business Logic:**
- Automatically calculates credit usage (1 credit = $10)
- Uses maximum available credits first
- Remaining amount charged as cash payment
- Awards referral credits on first purchase (2 credits each to referrer and referred user)
- Updates referral status from "pending" to "converted"

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `400 Bad Request` - Missing required fields or invalid amount
- `404 Not Found` - User not found
- `402 Payment Required` - Payment processing failed
- `500 Internal Server Error` - Transaction failed

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `VALIDATION_ERROR` - Invalid input data
- `USER_NOT_FOUND` - User does not exist
- `PRODUCT_NOT_FOUND` - Product does not exist
- `INSUFFICIENT_CREDITS` - Not enough credits for purchase
- `PAYMENT_FAILED` - Payment processing error
- `INVALID_PAYMENT_METHOD` - Payment method required
- `INVALID_AMOUNT` - Amount must be greater than 0

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Data Validation

### Purchase Request Validation
- `productId`: Required string, valid MongoDB ObjectId
- `productName`: Required string, 1-200 characters
- `amount`: Required number, minimum 0

### Query Parameter Validation
- `page`: Optional integer, minimum 1
- `limit`: Optional integer, 1-100
- `category`: Optional string, must be valid category enum

## Webhooks

### Clerk User Events
The system can handle Clerk webhook events for user lifecycle management:

**Endpoint:** `POST /api/webhooks/clerk`
**Events:**
- `user.created` - Automatically sync new user
- `user.updated` - Update user information
- `user.deleted` - Handle user deletion

## Testing

### Example cURL Commands

**Sync User:**
```bash
curl -X POST http://localhost:5000/api/auth/sync \
  -H "Authorization: Bearer <clerk_jwt_token>" \
  -H "Content-Type: application/json"
```

**Get Dashboard:**
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer <clerk_jwt_token>"
```

**Create Purchase:**
```bash
curl -X POST http://localhost:5000/api/purchase \
  -H "Authorization: Bearer <clerk_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439014",
    "productName": "Clean Code",
    "amount": 32.99
  }'
```

**Get Products:**
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=5&category=ebook"
```