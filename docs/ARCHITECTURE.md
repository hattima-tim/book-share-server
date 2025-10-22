# System Architecture Documentation

## Overview

The Referral & Credit System is built using a modern Node.js backend architecture with clean separation of concerns, following RESTful API principles and implementing robust business logic for referral management and credit systems.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Clerk Auth    │
                       │   Service       │
                       └─────────────────┘
```

## System Components

### 1. Application Layer

#### Express.js Server

- **Purpose**: HTTP server and request routing
- **Responsibilities**:
  - Request/response handling
  - Middleware orchestration
  - Route management
  - Error handling

#### Middleware Stack

```
Request → Security → CORS → Auth → Validation → Controller → Response
```

1. **Security Middleware** (Helmet)
   - Sets security headers
   - Prevents common vulnerabilities

2. **CORS Middleware**
   - Handles cross-origin requests
   - Configurable origins

3. **Authentication Middleware** (Clerk)
   - JWT token validation
   - User context injection

4. **Validation Middleware** (Joi)
   - Input sanitization
   - Schema validation

### 2. Business Logic Layer

#### Controllers

- **Purpose**: Handle HTTP requests and responses
- **Responsibilities**:
  - Request parsing
  - Service orchestration
  - Response formatting
  - Error handling

#### Services

- **Purpose**: Implement core business logic
- **Responsibilities**:
  - Data processing
  - Business rule enforcement
  - Transaction management
  - External service integration

### 3. Data Access Layer

#### Models (Mongoose ODM)

- **Purpose**: Data structure definition and validation
- **Responsibilities**:
  - Schema definition
  - Data validation
  - Relationship management
  - Index optimization

#### Database (MongoDB)

- **Purpose**: Data persistence and retrieval
- **Responsibilities**:
  - Document storage
  - Query processing
  - Transaction support
  - Data integrity

## Detailed Component Architecture

### Controller-Service Pattern

```
┌─────────────────┐
│   Controller    │
│                 │
│ • Request       │
│   handling      │
│ • Response      │
│   formatting    │
│ • Error         │
│   handling      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│    Service      │
│                 │
│ • Business      │
│   logic         │
│ • Data          │
│   processing    │
│ • Transaction   │
│   management    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│     Model       │
│                 │
│ • Data          │
│   validation    │
│ • Schema        │
│   definition    │
│ • Database      │
│   operations    │
└─────────────────┘
```

### Data Flow Architecture

#### User Registration Flow

```
Frontend → POST /auth/sync → AuthController → AuthService → UserModel → MongoDB
    ↓
Clerk JWT → Middleware → User Creation → Referral Processing → Response
```

#### Purchase Flow

```
Frontend → POST /purchase → PurchaseController → PurchaseService
    ↓
Validation → Credit Calculation → Transaction Start
    ↓
Purchase Creation → Credit Deduction → Referral Credit Award → Transaction Commit
```

## Database Schema Design

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │    Referral     │     │    Purchase     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ _id (ObjectId)  │◄────┤ referrerId      │     │ _id (ObjectId)  │
│ clerkUserId     │     │ referredUserId  ├────►│ userId          │
│ referralCode    │     │ status          │     │ productId       │
│ credits         │     │ creditsAwarded  │     │ amount          │
│ totalCredits... │     │ convertedAt     │     │ creditsUsed     │
│ referredBy      │     │ createdAt       │     │ isFirstPurchase │
└─────────────────┘     └─────────────────┘     │ referralCredit..│
                                                └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │    Product      │
                                                ├─────────────────┤
                                                │ _id (ObjectId)  │
                                                │ title           │
                                                │ description     │
                                                │ price           │
                                                │ category        │
                                                └─────────────────┘
```

### Schema Relationships

1. **User ↔ Referral**: One-to-many (one user can refer many users)
2. **User ↔ Purchase**: One-to-many (one user can make many purchases)
3. **Product ↔ Purchase**: One-to-many (one product can be purchased many times)
4. **User ↔ User**: Self-referencing (referredBy relationship)

## Business Logic Architecture

### Referral System Logic

```
┌─────────────────┐
│ User Signup     │
│ with Referral   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Create User     │
│ Record Referral │
│ Status: Pending │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ First Purchase  │
│ by Referred     │
│ User            │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Award Credits   │
│ • Referrer: 2   │
│ • Referred: 2   │
│ Status: Convert │
└─────────────────┘
```

### Credit System Logic

```
┌─────────────────┐
│ Purchase        │
│ Request         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Calculate       │
│ Credit Usage    │
│ (1 credit=$10)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Hybrid Payment  │
│ Credits + Cash  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Process         │
│ Referral        │
│ Credits         │
└─────────────────┘
```

## Security Architecture

### Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Clerk Auth    │    │   Backend       │
│                 │    │   Service       │    │   API           │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 1. Login        ├───►│ 2. Validate     │    │                 │
│    Request      │    │    Credentials  │    │                 │
│                 │    │                 │    │                 │
│ 4. Store JWT    │◄───┤ 3. Issue JWT    │    │                 │
│                 │    │                 │    │                 │
│ 5. API Request  ├────┼─────────────────┼───►│ 6. Validate JWT │
│    with JWT     │    │                 │    │                 │
│                 │    │                 │    │ 7. Process      │
│ 9. Response     │◄───┼─────────────────┼────┤    Request      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Security Layers

1. **Transport Security**: HTTPS in production
2. **Authentication**: Clerk JWT validation
3. **Authorization**: Route-level protection
4. **Input Validation**: Joi schema validation
5. **Output Sanitization**: Response filtering
6. **Security Headers**: Helmet middleware

## Performance Architecture

### Database Optimization

#### Indexing Strategy

```javascript
// User Collection Indexes
{ clerkUserId: 1 }        // Unique, for auth lookups
{ referralCode: 1 }       // Unique, for referral lookups

// Referral Collection Indexes
{ referrerId: 1 }         // For dashboard queries
{ referredUserId: 1 }     // Unique, prevent duplicates
{ status: 1 }             // For filtering conversions
{ referrerId: 1, referredUserId: 1 }  // Compound unique

// Purchase Collection Indexes
{ userId: 1 }             // For user purchase history
{ productId: 1 }          // For product analytics
{ createdAt: -1 }         // For chronological queries
```

#### Query Optimization

- Use projection to limit returned fields
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries
- Leverage MongoDB's built-in operators

### Caching Strategy (Future Enhancement)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Redis Cache   │    │   MongoDB       │
│   Layer         │    │                 │    │   Database      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 1. Check Cache  ├───►│ 2. Cache Hit?   │    │                 │
│                 │    │                 │    │                 │
│ 4. Return Data  │◄───┤ 3. Return Data  │    │                 │
│                 │    │                 │    │                 │
│ 5. Query DB     ├────┼─────────────────┼───►│ 6. Execute      │
│    (Cache Miss) │    │                 │    │    Query        │
│                 │    │                 │    │                 │
│ 8. Return Data  │◄───┤ 7. Cache Result │◄───┤ 7. Return Data  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Error Handling Architecture

### Error Flow

```
┌─────────────────┐
│ Error Occurs    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Error Type?     │
├─────────────────┤
│ • Validation    │
│ • Business      │
│ • System        │
│ • Database      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Error Handler   │
│ Middleware      │
├─────────────────┤
│ • Log Error     │
│ • Format        │
│   Response      │
│ • Set Status    │
│   Code          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Client Response │
└─────────────────┘
```

### Error Categories

1. **Validation Errors** (400)
   - Invalid input format
   - Missing required fields
   - Schema validation failures

2. **Authentication Errors** (401)
   - Invalid JWT token
   - Expired token
   - Missing authorization

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Resource access denied

4. **Business Logic Errors** (400/409)
   - Insufficient credits
   - Duplicate referrals
   - Invalid business rules

5. **System Errors** (500)
   - Database connection issues
   - External service failures
   - Unexpected exceptions

## Scalability Considerations

### Horizontal Scaling

- Stateless application design
- Database connection pooling
- Load balancer compatibility
- Session management via JWT

### Vertical Scaling

- Efficient memory usage
- Optimized database queries
- Minimal CPU-intensive operations
- Proper resource cleanup

### Future Enhancements

- Microservices architecture
- Event-driven architecture
- Message queues for async processing
- Distributed caching
- Database sharding

## Monitoring and Observability

### Logging Strategy

```
┌─────────────────┐
│ Application     │
│ Logs            │
├─────────────────┤
│ • Request/      │
│   Response      │
│ • Business      │
│   Events        │
│ • Errors        │
│ • Performance   │
└─────────────────┘
```

### Health Monitoring

- `/health` endpoint for load balancers
- Database connection status
- External service availability
- Memory and CPU usage

### Metrics Collection (Future)

- Request rate and latency
- Error rates by endpoint
- Business metrics (referrals, purchases)
- Database performance metrics

## Deployment Architecture

### Development Environment

```
┌─────────────────┐    ┌─────────────────┐
│   Local Dev     │    │   Local MongoDB │
│   Server        │◄──►│   Instance      │
│   (tsx watch)   │    │                 │
└─────────────────┘    └─────────────────┘
```

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load          │    │   Application   │    │   MongoDB       │
│   Balancer      │◄──►│   Servers       │◄──►│   Cluster       │
│                 │    │   (PM2/Docker)  │    │   (Atlas)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

This architecture provides a solid foundation for a scalable, maintainable, and secure referral and credit management system.
