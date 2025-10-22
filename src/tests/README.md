# Node.js Built-in Test Runner Setup

This project uses Node.js built-in test runner instead of Jest for better performance and simpler setup.

## Key Benefits

✅ **No External Dependencies**: Uses Node.js built-in test runner (stable since v20.0.0)
✅ **Faster Execution**: No Jest overhead, direct TypeScript execution
✅ **Built-in Coverage**: Native coverage reporting with `--experimental-test-coverage`
✅ **Watch Mode**: Built-in file watching with `--watch`
✅ **TypeScript Support**: Direct execution with `--experimental-strip-types`

## Test Files

- `*.node.test.ts` - Node.js built-in test runner tests
- `*.test.ts` - Legacy Jest tests (can be removed)

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
node --test --experimental-strip-types src/tests/services/purchaseService.node.test.ts
```

## Test Structure

### Unit Tests
```typescript
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

describe("Test Suite", () => {
  beforeEach(async () => {
    // Setup before each test
  });

  it("should do something", async () => {
    // Test implementation
    assert.strictEqual(actual, expected);
    assert.ok(condition);
    await assert.rejects(asyncFunction(), /error message/);
  });
});
```

### HTTP Endpoint Tests (with Supertest)
```typescript
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";

const app = express();
app.use(express.json());
// Add your routes...

describe("API Tests", () => {
  it("should handle POST requests", async () => {
    const response = await request(app)
      .post("/api/endpoint")
      .send({ data: "test" })
      .expect(201);

    assert.strictEqual(response.body.success, true);
  });
});
```

## Assertions

### Node.js Built-in Assert
- `assert.strictEqual(actual, expected)` - Strict equality
- `assert.ok(value)` - Truthy check
- `assert.rejects(promise, error)` - Async error testing
- `assert.deepStrictEqual(actual, expected)` - Deep object comparison

### Supertest HTTP Assertions
- `.expect(statusCode)` - Assert HTTP status code
- `.expect(field, value)` - Assert response header
- `.expect(body)` - Assert response body
- `.expect(callback)` - Custom assertion function

## Database Setup

Tests use MongoDB Memory Server for isolated testing:

```typescript
import "./setup.ts"; // Imports database setup

// Database is automatically:
// - Created before all tests
// - Cleaned between each test
// - Destroyed after all tests
```

## Coverage

Coverage is collected automatically with:

```bash
npm run test:coverage
```

Reports include:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## HTTP Testing with Supertest

Supertest is used for testing HTTP endpoints and works seamlessly with Node.js test runner:

```typescript
import request from "supertest";
import { app } from "../app"; // Your Express app

// Test HTTP endpoints
const response = await request(app)
  .post("/api/users")
  .send({ name: "John" })
  .expect(201)
  .expect("Content-Type", /json/);

assert.strictEqual(response.body.name, "John");
```

## Migration from Jest

Key differences:

- `expect()` → `assert.strictEqual()`
- `toBe()` → `assert.strictEqual()`
- `toThrow()` → `assert.rejects()`
- `beforeAll()` → `before()`
- `afterAll()` → `after()`
- `jest.mock()` → Manual mocking or dependency injection
- Keep `supertest` for HTTP testing (works with any test runner)
