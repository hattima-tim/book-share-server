# Database Schema Documentation

## Overview

The system uses MongoDB as the primary database with Mongoose ODM for schema definition and validation. The database is designed to handle user management, referral tracking, purchase processing, and product catalog efficiently.

## Database Design Principles

- **Normalization**: Balanced approach between normalization and denormalization for optimal performance
- **Indexing**: Strategic indexing for frequently queried fields
- **Relationships**: Proper use of ObjectId references for data integrity
- **Validation**: Schema-level validation with Mongoose
- **Scalability**: Designed to handle growth in users and transactions

## Collections Overview

### 1. Users Collection

**Purpose**: Store user account information, credits, and referral data

**Schema Definition**:

```javascript
{
  _id: ObjectId,
  clerkUserId: String,      // Unique identifier from Clerk
  referralCode: String,     // Unique referral code (8 chars)
  name: String,             // User's full name
  credits: Number,          // Current credit balance
  totalCreditsEarned: Number, // Lifetime credits earned
  totalReferredUsers: Number, // Count of referred users
  referredBy: ObjectId,     // Reference to referring user
  createdAt: Date,          // Account creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

**Indexes**:

```javascript
{
  clerkUserId: 1;
} // Unique index for authentication
{
  referralCode: 1;
} // Unique index for referral lookups
```

**Validation Rules**:

- `clerkUserId`: Required, unique, string
- `referralCode`: Required, unique, uppercase, 8 characters
- `name`: Required, trimmed string
- `credits`: Non-negative number, default 0
- `totalCreditsEarned`: Non-negative number, default 0
- `totalReferredUsers`: Non-negative number, default 0

**Sample Document**:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "clerkUserId": "user_2abc123def456",
  "referralCode": "ABC123XY",
  "name": "John Doe",
  "credits": 12,
  "totalCreditsEarned": 8,
  "totalReferredUsers": 3,
  "referredBy": "507f1f77bcf86cd799439012",
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Referrals Collection

**Purpose**: Track referral relationships and conversion status

**Schema Definition**:

```javascript
{
  _id: ObjectId,
  referrerId: ObjectId,     // User who made the referral
  referredUserId: ObjectId, // User who was referred
  status: String,           // 'pending' or 'converted'
  creditsAwarded: Boolean,  // Whether credits have been awarded
  convertedAt: Date,        // When referral converted (first purchase)
  createdAt: Date,          // Referral creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

**Indexes**:

```javascript
{ referrerId: 1 }                           // For dashboard queries
{ referredUserId: 1 }                       // Unique index
{ status: 1 }                               // For filtering
{ referrerId: 1, referredUserId: 1 }        // Compound unique index
```

**Validation Rules**:

- `referrerId`: Required ObjectId reference to User
- `referredUserId`: Required ObjectId reference to User, unique
- `status`: Required enum ['pending', 'converted']
- `creditsAwarded`: Required boolean, default false
- `convertedAt`: Optional date, set when status becomes 'converted'

**Sample Document**:

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "referrerId": "507f1f77bcf86cd799439011",
  "referredUserId": "507f1f77bcf86cd799439014",
  "status": "converted",
  "creditsAwarded": true,
  "convertedAt": "2024-01-12T14:20:00.000Z",
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-12T14:20:00.000Z"
}
```

### 3. Purchases Collection

**Purpose**: Record all purchase transactions and payment details

**Schema Definition**:

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // User who made the purchase
  productId: ObjectId,      // Product that was purchased
  productName: String,      // Product name (denormalized)
  amount: Number,           // Total purchase amount
  creditsUsed: Number,      // Credits applied to purchase
  creditAmount: Number,     // Dollar value of credits used
  cashAmount: Number,       // Cash payment amount
  paymentMethodId: String,  // Payment method identifier
  isFirstPurchase: Boolean, // Whether this is user's first purchase
  referralCreditAwarded: Boolean, // Whether referral credits were awarded
  createdAt: Date,          // Purchase timestamp
  updatedAt: Date           // Last update timestamp
}
```

**Indexes**:

```javascript
{
  userId: 1;
} // For user purchase history
{
  productId: 1;
} // For product analytics
{
  createdAt: -1;
} // For chronological queries
{
  isFirstPurchase: 1;
} // For referral processing
```

**Validation Rules**:

- `userId`: Required ObjectId reference to User
- `productId`: Required ObjectId reference to Product
- `productName`: Required string
- `amount`: Required number, minimum 0
- `creditsUsed`: Non-negative number, default 0
- `creditAmount`: Non-negative number, default 0
- `cashAmount`: Non-negative number, default 0
- `isFirstPurchase`: Boolean, default false
- `referralCreditAwarded`: Boolean, default false

**Sample Document**:

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439014",
  "productId": "507f1f77bcf86cd799439016",
  "productName": "Clean Code",
  "amount": 32.99,
  "creditsUsed": 2,
  "creditAmount": 20.0,
  "cashAmount": 12.99,
  "paymentMethodId": "pm_1234567890",
  "isFirstPurchase": true,
  "referralCreditAwarded": true,
  "createdAt": "2024-01-12T14:20:00.000Z",
  "updatedAt": "2024-01-12T14:20:00.000Z"
}
```

### 4. Products Collection

**Purpose**: Store digital product catalog information

**Schema Definition**:

```javascript
{
  _id: ObjectId,
  title: String,            // Product title
  description: String,      // Product description
  author: String,           // Product author/creator
  price: Number,            // Product price in dollars
  category: String,         // Product category
  imageUrl: String,         // Product image URL
  createdAt: Date,          // Product creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

**Indexes**:

```javascript
{
  category: 1;
} // For category filtering
{
  price: 1;
} // For price-based queries
{
  title: "text";
} // Text search on title
```

**Validation Rules**:

- `title`: Required string, trimmed
- `description`: Required string
- `author`: Required string, trimmed
- `price`: Required number, minimum 0
- `category`: Required enum ['ebook', 'course', 'template', 'software', 'other']
- `imageUrl`: Optional string

**Sample Document**:

```json
{
  "_id": "507f1f77bcf86cd799439016",
  "title": "Clean Code",
  "description": "A handbook of agile software craftsmanship",
  "author": "Robert C. Martin",
  "price": 32.99,
  "category": "ebook",
  "imageUrl": "https://example.com/clean-code.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Relationships and Data Integrity

### Entity Relationships

```
User (1) ←→ (N) Referral
  ↑              ↓
  └── referrerId  referredUserId
                     ↓
User (1) ←→ (N) Purchase
  ↑              ↓
  └── userId     productId
                     ↓
Product (1) ←→ (N) Purchase
```

### Referential Integrity

1. **User → Referral**: One user can make multiple referrals
2. **User → Purchase**: One user can make multiple purchases
3. **Product → Purchase**: One product can be purchased multiple times
4. **User → User**: Self-referencing relationship via `referredBy`

### Constraints

1. **Unique Constraints**:
   - `users.clerkUserId`: Each Clerk user can have only one account
   - `users.referralCode`: Each referral code must be unique
   - `referrals.referredUserId`: Each user can only be referred once

2. **Compound Unique Constraints**:
   - `referrals.{referrerId, referredUserId}`: Prevents duplicate referral records

## Query Patterns

### Common Queries

#### 1. User Dashboard Data

```javascript
// Get user with referral statistics
const user = await User.findOne({ clerkUserId });
const referrals = await Referral.find({ referrerId: user._id }).populate(
  "referredUserId",
  "name referralCode createdAt"
);
```

#### 2. Purchase Processing

```javascript
// Check if first purchase for referral credits
const purchaseCount = await Purchase.countDocuments({ userId });
const isFirstPurchase = purchaseCount === 0;
```

#### 3. Referral Conversion

```javascript
// Update referral status on first purchase
await Referral.findOneAndUpdate(
  { referredUserId: userId, status: "pending" },
  {
    status: "converted",
    creditsAwarded: true,
    convertedAt: new Date(),
  }
);
```

### Performance Optimization

#### Aggregation Pipelines

**User Statistics**:

```javascript
const stats = await User.aggregate([
  { $match: { _id: userId } },
  {
    $lookup: {
      from: "referrals",
      localField: "_id",
      foreignField: "referrerId",
      as: "referrals",
    },
  },
  {
    $addFields: {
      totalReferrals: { $size: "$referrals" },
      convertedReferrals: {
        $size: {
          $filter: {
            input: "$referrals",
            cond: { $eq: ["$$this.status", "converted"] },
          },
        },
      },
    },
  },
]);
```

**Product Analytics**:

```javascript
const productStats = await Purchase.aggregate([
  {
    $group: {
      _id: "$productId",
      totalSales: { $sum: "$amount" },
      totalPurchases: { $sum: 1 },
      avgPrice: { $avg: "$amount" },
    },
  },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product",
    },
  },
]);
```

## Data Migration and Seeding

### Initial Data Setup

**Product Seeding**:

```javascript
const seedProducts = [
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "A handbook of agile software craftsmanship",
    price: 32.99,
    category: "ebook",
    imageUrl: "https://example.com/clean-code.jpg",
  },
  // ... more products
];

await Product.insertMany(seedProducts);
```

### Migration Scripts

**Add New Fields**:

```javascript
// Add totalCreditsEarned field to existing users
await User.updateMany(
  { totalCreditsEarned: { $exists: false } },
  { $set: { totalCreditsEarned: 0 } }
);
```

## Backup and Recovery

### Backup Strategy

1. **Daily Automated Backups**:
   - Full database backup
   - Stored in cloud storage
   - Retention: 30 days

2. **Point-in-Time Recovery**:
   - MongoDB Atlas provides automatic backups
   - Can restore to any point within retention period

3. **Critical Data Export**:
   - Regular export of user and transaction data
   - CSV format for business analysis

### Recovery Procedures

1. **Data Corruption**:
   - Restore from latest backup
   - Verify data integrity
   - Update application connections

2. **Accidental Deletion**:
   - Point-in-time recovery
   - Selective collection restore
   - Data validation scripts

## Monitoring and Maintenance

### Performance Monitoring

1. **Query Performance**:
   - Monitor slow queries (>100ms)
   - Index usage analysis
   - Query optimization

2. **Database Metrics**:
   - Connection pool usage
   - Memory consumption
   - Disk I/O patterns

### Maintenance Tasks

1. **Index Maintenance**:
   - Regular index analysis
   - Remove unused indexes
   - Add indexes for new query patterns

2. **Data Cleanup**:
   - Archive old purchase records
   - Clean up test data
   - Optimize collection sizes

## Security Considerations

### Data Protection

1. **Sensitive Data**:
   - No plaintext passwords stored
   - PII data minimization
   - Encrypted connections (TLS)

2. **Access Control**:
   - Database user permissions
   - Network security groups
   - IP whitelisting

### Compliance

1. **Data Privacy**:
   - GDPR compliance considerations
   - User data deletion procedures
   - Data export capabilities

2. **Audit Trail**:
   - Transaction logging
   - User activity tracking
   - Change history maintenance

This database design provides a solid foundation for the referral and credit system while maintaining data integrity, performance, and scalability.
