# Referral & Credit System Backend

A scalable Node.js backend API for a digital product platform with referral and credit management system.

## 🚀 Features

- **User Authentication**: Secure authentication using Clerk
- **Referral System**: Unique referral codes and tracking
- **Credit Management**: Earn and spend credits on purchases
- **Purchase System**: Hybrid payment (credits + cash)
- **Dashboard Analytics**: Comprehensive referral statistics
- **RESTful API**: Clean, well-structured API endpoints

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Development**: tsx for hot reloading

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Clerk account for authentication

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd referral-backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/referral-system
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Seed the database with sample products:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication

All protected routes require a valid Clerk JWT token in the Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

### Endpoints

#### User Management

**POST /api/auth/sync**

- Sync user data from Clerk authentication
- Creates new user or returns existing user
- Handles referral code processing during signup

```json
{
  "id": "user_id",
  "clerkUserId": "clerk_user_id",
  "referralCode": "ABC123",
  "credits": 0,
  "name": "John Doe"
}
```

**GET /api/dashboard**

- Get comprehensive dashboard data for authenticated user
- Returns referral statistics, credits, and referral link

```json
{
  "name": "John Doe",
  "convertedUsers": 4,
  "totalCreditsEarned": 8,
  "currentBalance": 12,
  "referralLink": "http://localhost:3000/register?r=ABC123",
  "referralCode": "ABC123",
  "referredUsers": [...]
}
```

#### Products

**GET /api/products**

- Get all available products
- Returns paginated list of digital products

#### Purchases

**POST /api/purchase**

- Create a new purchase with hybrid payment
- Automatically handles credit awarding for referrals
- Supports credits + cash payment

```json
{
  "productId": "product_id",
  "productName": "Clean Code",
  "amount": 32.99
}
```

### Health Check

**GET /health**

- Server health status
- Returns uptime and timestamp

## 🏗 Architecture

### Project Structure

```
src/
├── config/          # Database and configuration
├── controller/      # Request handlers
├── middleware/      # Custom middleware
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── validation/      # Input validation schemas
```

### Data Models

#### User Schema

- Stores user information, credits, and referral data
- Links to Clerk for authentication
- Tracks referral relationships

#### Referral Schema

- Manages referrer-referred relationships
- Tracks conversion status and credit awarding
- Prevents duplicate referrals

#### Purchase Schema

- Records all user purchases
- Tracks credit usage and cash payments
- Identifies first purchases for referral credits

#### Product Schema

- Digital product catalog
- Supports multiple categories (ebook, course, template, etc.)

## 💳 Business Logic

### Referral System Flow

1. **User Registration**
   - New user signs up via referral link: `yourapp.com/register?r=REFERRER_CODE`
   - System creates referral relationship
   - Both users start with 0 credits

2. **First Purchase**
   - Referred user makes their first purchase
   - System awards 2 credits to both referrer and referred user
   - Referral status changes from "pending" to "converted"

3. **Credit System**
   - 1 credit = $10 value
   - Credits can be used for partial or full payment
   - Remaining amount charged as cash payment

### Data Integrity

- **Transactions**: MongoDB transactions ensure data consistency
- **Unique Constraints**: Prevent duplicate referrals and codes
- **Validation**: Server-side validation for all inputs
- **Race Conditions**: Proper handling of concurrent operations

## 🔒 Security

- **Authentication**: Clerk JWT validation
- **Authorization**: Protected routes with middleware
- **Input Validation**: Joi schema validation
- **Security Headers**: Helmet middleware
- **CORS**: Configured for frontend domain
- **Environment Variables**: Sensitive data in .env

## 🚀 Deployment

### Production Environment

1. Set production environment variables
2. Build the application: `npm run build`
3. Start production server: `npm start`

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Checks

- `/health` endpoint for load balancer health checks
- Uptime and timestamp information

### Logging

- Request logging middleware
- Error logging with stack traces
- Database connection status

## 🧪 Testing

Run tests:

```bash
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**

- Verify MongoDB is running
- Check DATABASE_URL in .env file
- Ensure network connectivity

**Authentication Errors**

- Verify Clerk keys in .env
- Check JWT token format
- Ensure Clerk webhook configuration

**Port Already in Use**

- Change PORT in .env file
- Kill existing process: `lsof -ti:5000 | xargs kill`

### Support

For issues and questions:

- Check existing GitHub issues
- Create new issue with detailed description
- Include error logs and environment details
