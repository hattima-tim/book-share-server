# Testing Documentation

## Overview

The testing suite provides comprehensive coverage of critical business logic, focusing on payment simulation, referral systems, and data integrity. Tests are organized into unit tests, integration tests, and API endpoint tests.

## Test Structure

```
src/tests/
├── setup.ts                    # Test configuration and setup
├── testUtils.ts                # Testing utilities and helpers
├── controllers/                # API endpoint tests
│   └── purchaseController.test.ts
├── services/                   # Business logic tests
│   ├── purchaseService.test.ts
│   └── authService.test.ts
├── models/                     # Data model tests
│   └── userModel.test.ts
└── integration/                # End-to-end tests
    └── purchaseFlow.test.ts
```

## Test Categories

### 1. Critical Payment Tests (`purchaseService.test.ts`)

**Purpose**: Validate core payment processing and referral credit logic

**Key Test Cases**:

- Hybrid payment system (credits + cash)
- Referral credit awarding on first purchase
- Transaction integrity and rollback
- Concurrent purchase handling
- Edge cases (zero amounts, large amounts)

**Example**:

```typescript
import { it } from 'node:test';
import assert from 'node:assert';

it("should process hybrid payment (credits + cash) when credits are insufficient", async () => {
  const purchaseAmount = 50; // $50
  const userCredits = 3; // User has 3 credits ($30 value)
  const creditAmount = userCredits * CREDIT_VALUE; // $30
  const cashAmount = purchaseAmount - creditAmount; // $20

  const result = await createPurchaseWithHybridPayment({
    user: updatedUser!,
    productId: testProduct._id.toString(),
    productName: testProduct.title,
    amount: purchaseAmount,
    creditsUsed: userCredits,
    creditAmount: creditAmount,
    cashAmount: cashAmount,
  });

  assert.strictEqual(result.purchase.creditsUsed, userCredits);
  assert.strictEqual(result.purchase.creditAmount, creditAmount);
  assert.strictEqual(result.purchase.cashAmount, cashAmount);
});
```

### 2. Authentication & User Management Tests (`authService.test.ts`)

**Purpose**: Validate user creation, referral relationships, and data integrity

**Key Test Cases**:

- User sync with and without referral codes
- Referral code generation and uniqueness
- Self-referral prevention
- Concurrent user creation
- Error handling and retries

### 3. API Endpoint Tests (`purchaseController.test.ts`)

**Purpose**: Validate HTTP API behavior and error handling using supertest

**Key Test Cases**:

- Request validation and error responses
- Authentication and authorization
- Credit calculation logic
- Concurrent request handling
- Error response formats

**Example**:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());
app.post('/purchase', purchaseValidation, createPurchase);

it('should create purchase successfully with valid data', async () => {
  const purchaseData = {
    productId: testProduct._id.toString(),
    productName: testProduct.title,
    amount: testProduct.price,
  };

  const response = await request(app)
    .post('/purchase')
    .send(purchaseData)
    .expect(201);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Purchase created successfully');
});
```

### 4. Data Model Tests (`userModel.test.ts`)

**Purpose**: Validate database schema, constraints, and performance

**Key Test Cases**:

- Schema validation and constraints
- Index performance
- Data integrity during concurrent updates
- Large batch operations
- Query optimization

### 5. Integration Tests (`purchaseFlow.test.ts`)

**Purpose**: Validate complete business workflows end-to-end

**Key Test Cases**:

- Complete referral flow (signup → purchase → credit award)
- Multi-user concurrent scenarios
- Edge cases (deleted referrer, orphaned data)
- Large volume testing
- Data consistency verification

## Running Tests

### Prerequisites

Install test dependencies:

```bash
npm install
```

### Test Commands

**Run all tests**:

```bash
npm test
```

**Run tests in watch mode**:

```bash
npm run test:watch
```

**Run tests with coverage**:

```bash
npm run test:coverage
```

**Run tests for CI/CD**:

```bash
npm run test:ci
```

**Run specific test file**:

```bash
node --test --experimental-strip-types src/tests/services/purchaseService.node.test.ts
```

### Test Configuration

Tests use Node.js built-in test runner with supertest for HTTP testing:

- **Test Framework**: Node.js built-in test runner (v20+)
- **HTTP Testing**: Supertest for API endpoint testing
- **Database**: MongoDB Memory Server (in-memory)
- **TypeScript**: Direct execution with `--experimental-strip-types`
- **Coverage**: Built-in coverage with `--experimental-test-coverage`
- **Execution**: Sequential (to avoid database conflicts)

## Test Database

### In-Memory Database

Tests use `mongodb-memory-server` for isolated, fast testing:

```typescript
import { before, after } from 'node:test';

let mongoServer: MongoMemoryServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
```

### Data Cleanup

Each test starts with a clean database:

```typescript
import { beforeEach } from 'node:test';

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Mock Data and Utilities

### Test Users

```typescript
export const testUsers = {
  referrer: {
    clerkUserId: "user_referrer_123",
    name: "John Referrer",
    referralCode: "REF123XY",
    credits: 10,
    totalCreditsEarned: 10,
    totalReferredUsers: 1,
  },
  referred: {
    clerkUserId: "user_referred_456",
    name: "Jane Referred",
    referralCode: "REF456ZW",
    credits: 0,
    totalCreditsEarned: 0,
    totalReferredUsers: 0,
  },
};
```

### Mock Authentication

```typescript
export const mockClerkAuth = (userId: string) => ({
  userId,
  sessionId: "test-session",
  orgId: null,
  orgRole: null,
  orgSlug: null,
});
```

### Test Utilities

```typescript
// Clean all test data
export const cleanDatabase = async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    ReferralModel.deleteMany({}),
    PurchaseModel.deleteMany({}),
    ProductModel.deleteMany({}),
  ]);
};

// Generate random test data
export const generateRandomUser = (index: number) => ({
  clerkUserId: `test_user_${index}_${Date.now()}`,
  name: `Test User ${index}`,
  referralCode: `TEST${index.toString().padStart(4, "0")}`,
  credits: Math.floor(Math.random() * 50),
});
```

## Critical Test Scenarios

### 1. Payment Simulation Tests

**Scenario**: User with partial credits makes a purchase

```typescript
// User has 3 credits ($30), wants to buy $50 item
// Should use all 3 credits + $20 cash
const result = await createPurchaseWithHybridPayment({
  amount: 50,
  creditsUsed: 3,
  creditAmount: 30,
  cashAmount: 20,
});
```

**Verification**:

- Credits deducted correctly
- Cash amount calculated properly
- Purchase record accurate
- User balance updated

### 2. Referral Credit Tests

**Scenario**: Referred user makes first purchase

```typescript
// Should award 2 credits each to referrer and referred user
// Should update referral status to 'converted'
// Should NOT award credits on subsequent purchases
```

**Verification**:

- Both users receive 2 credits
- Referral status changes to 'converted'
- Credits only awarded once
- Transaction atomicity maintained

### 3. Concurrent Operation Tests

**Scenario**: Multiple users making simultaneous purchases

```typescript
// 5 referred users make first purchase simultaneously
// Should handle race conditions properly
// Should maintain data consistency
```

**Verification**:

- All purchases processed correctly
- No duplicate credit awards
- Database consistency maintained
- Performance within acceptable limits

### 4. Error Handling Tests

**Scenario**: Various error conditions

```typescript
// Database connection failures
// Invalid input data
// Insufficient credits
// Missing users/products
```

**Verification**:

- Appropriate error responses
- Transaction rollback on failures
- No data corruption
- Graceful error handling

## Performance Testing

### Load Testing

Tests include scenarios with:

- 100+ concurrent users
- 1000+ database operations
- Large batch insertions
- Complex aggregation queries

### Performance Benchmarks

- User creation: < 100ms per user
- Purchase processing: < 500ms per transaction
- Database queries: < 100ms for indexed lookups
- Batch operations: < 5 seconds for 100 items

## Coverage Requirements

### Minimum Coverage Targets

- **Overall**: 85%
- **Services**: 90% (critical business logic)
- **Controllers**: 80% (API endpoints)
- **Models**: 75% (data validation)

### Coverage Report

```bash
npm run test:coverage
```

Generates HTML report in `coverage/` directory showing:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v1
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:ci && npm run lint"
    }
  }
}
```

## Debugging Tests

### Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Node Tests",
  "program": "${workspaceFolder}/node_modules/.bin/node",
  "args": ["--test", "--experimental-strip-types", "src/tests/**/*.test.ts"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

**MongoDB Connection**:

```typescript
// Ensure proper cleanup
afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});
```

**Async Operations**:

```typescript
import assert from 'node:assert';

// Always await async operations
await assert.rejects(asyncFunction(), /error message/);
```

**Mock Cleanup**:

```typescript
import { afterEach } from 'node:test';

// Restore mocks after tests (manual cleanup for Node.js test runner)
afterEach(() => {
  // Restore any manually mocked functions
  UserModel.findOne = originalFindOne;
});
```

## Best Practices

### Test Organization

1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Tests should read like specifications
3. **Single Responsibility**: One assertion per test when possible
4. **Independent Tests**: No dependencies between tests

### Data Management

1. **Clean State**: Each test starts with clean data
2. **Realistic Data**: Use data similar to production
3. **Edge Cases**: Test boundary conditions
4. **Error Scenarios**: Test failure paths

### Performance

1. **Fast Execution**: Tests should run quickly
2. **Parallel Safe**: Tests should not interfere with each other
3. **Resource Cleanup**: Properly clean up resources
4. **Minimal Setup**: Only create necessary test data

### Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Coverage Monitoring**: Maintain high test coverage
3. **Performance Monitoring**: Watch for slow tests
4. **Documentation**: Keep test documentation current

This testing strategy ensures the referral and credit system is robust, reliable, and ready for production use.
