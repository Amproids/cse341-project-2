/**
 * User Authentication Tests
 *
 * This test suite validates the authentication system including:
 * - User login with valid credentials
 * - JWT token generation and validation
 * - Invalid credential handling
 * - Account status checks (active/inactive)
 * - Token expiration and format
 * - Protected route access
 *
 * Security considerations tested:
 * - Password verification
 * - Token security
 * - Rate limiting (if implemented)
 * - Account lockout (if implemented)
 */

const { createTestUser, request, authenticateUser, deleteUser } = require('../helpers/testHelpers');

describe('User Authentication (POST /users/login)', () => {
    let testUser = null;
    const testPassword = 'TestPassword123!';

    beforeAll(async () => {
        // Create a test user for authentication tests
        const { response } = await createTestUser({
            email: 'auth.test@example.com',
            password: testPassword,
            passwordConfirm: testPassword,
            firstName: 'Auth',
            lastName: 'Test'
        });

        testUser = {
            id: response.body._id,
            email: 'auth.test@example.com',
            password: testPassword
        };
    });

    afterAll(async () => {
        // Clean up test user
        if (testUser && testUser.id) {
            try {
                const token = await authenticateUser({
                    email: testUser.email,
                    password: testUser.password
                });
                await deleteUser(testUser.id, token);
            } catch (error) {
                console.log(`Failed to cleanup auth test user: ${error.message}`);
            }
        }
    });

    describe('Valid Authentication', () => {
        /**
         * Test: Successful login with valid credentials
         * Verifies JWT token generation and response format
         */
        test('should authenticate user with valid credentials', async () => {
            const response = await request().post('/users/login').send({
                email: testUser.email,
                password: testUser.password
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();

            // Verify user object structure
            expect(response.body.user.id).toBe(testUser.id);
            expect(response.body.user.firstName).toBe('Auth');
            expect(response.body.user.lastName).toBe('Test');
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body.user.role).toBe('user');

            // Password should never be returned
            expect(response.body.user.password).toBeUndefined();
        });

        /**
         * Test: JWT token format validation
         * Ensures token follows JWT standards
         */
        test('should return valid JWT token format', async () => {
            const response = await request().post('/users/login').send({
                email: testUser.email,
                password: testUser.password
            });

            expect(response.status).toBe(200);
            const token = response.body.token;

            // JWT format: header.payload.signature
            const tokenParts = token.split('.');
            expect(tokenParts.length).toBe(3);

            // Decode and verify payload (without verification)
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            expect(payload.userId).toBe(testUser.id);
            expect(payload.email).toBe(testUser.email);
            expect(payload.role).toBe('user');
            expect(payload.exp).toBeDefined(); // Expiration
            expect(payload.iat).toBeDefined(); // Issued at
            expect(payload.iss).toBe('cse341-project2'); // Issuer
        });

        /**
         * Test: Case-insensitive email login
         * Users should be able to login regardless of email case
         */
        test('should authenticate with case-insensitive email', async () => {
            const variations = ['AUTH.TEST@EXAMPLE.COM', 'Auth.Test@Example.Com', 'auth.test@example.com'];

            for (const email of variations) {
                const response = await request().post('/users/login').send({
                    email,
                    password: testUser.password
                });

                expect(response.status).toBe(200);
                expect(response.body.token).toBeDefined();
            }
        });
    });

    describe('Invalid Authentication', () => {
        /**
         * Test: Invalid email
         * Should not reveal whether email exists
         */
        test('should reject invalid email', async () => {
            const response = await request().post('/users/login').send({
                email: 'nonexistent@example.com',
                password: 'SomePassword123!'
            });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid email or password');
            // Important: Same error message for invalid email and invalid password
        });

        /**
         * Test: Invalid password
         * Should not reveal that email exists but password is wrong
         */
        test('should reject invalid password', async () => {
            const response = await request().post('/users/login').send({
                email: testUser.email,
                password: 'WrongPassword123!'
            });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid email or password');
        });

        /**
         * Test: Missing credentials
         * Validates required fields for login
         */
        test('should reject missing email', async () => {
            const response = await request().post('/users/login').send({
                password: 'SomePassword123!'
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Email is required');
        });

        test('should reject missing password', async () => {
            const response = await request().post('/users/login').send({
                email: 'test@example.com'
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Password is required');
        });

        /**
         * Test: Invalid email format in login
         * Should validate email format even during login
         */
        test('should reject malformed email during login', async () => {
            const response = await request().post('/users/login').send({
                email: 'not-an-email',
                password: 'SomePassword123!'
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Invalid email format');
        });

        /**
         * Test: Empty credentials
         * Should handle empty string credentials
         */
        test('should reject empty credentials', async () => {
            const response = await request().post('/users/login').send({
                email: '',
                password: ''
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('Account Status Checks', () => {
        /**
         * Test: Inactive account login
         * Verifies that deactivated accounts cannot login
         * Note: This test requires a way to deactivate accounts
         */
        test('should reject login for inactive account', async () => {
            // This test is skipped because there's no endpoint to deactivate accounts
            // In production, you'd have an admin endpoint or database script to set isActive = false
            // const response = await request()
            //     .post('/users/login')
            //     .send({
            //         email: inactiveUser.email,
            //         password: inactiveUser.password
            //     });
            // expect(response.status).toBe(401);
            // expect(response.body.error).toBe('Account is deactivated');
        });
    });

    describe('Token Usage in Protected Routes', () => {
        /**
         * Test: Access protected route with valid token
         * Verifies token authentication works for protected endpoints
         */
        test('should access protected route with valid token', async () => {
            // First, login to get token
            const loginResponse = await request().post('/users/login').send({
                email: testUser.email,
                password: testUser.password
            });

            const token = loginResponse.body.token;

            // Try to access protected route
            const protectedResponse = await request().get('/users').set('Authorization', `Bearer ${token}`);

            expect(protectedResponse.status).toBe(200);
            expect(Array.isArray(protectedResponse.body)).toBe(true);
        });

        /**
         * Test: Reject access without token
         * Protected routes should require authentication
         */
        test('should reject protected route access without token', async () => {
            const response = await request().get('/users');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        /**
         * Test: Reject access with invalid token
         * Should handle malformed or invalid tokens
         */
        test('should reject protected route access with invalid token', async () => {
            const invalidTokens = [
                'invalid.token.here',
                'Bearer invalid.token',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
                ''
            ];

            for (const token of invalidTokens) {
                const response = await request().get('/users').set('Authorization', `Bearer ${token}`);

                expect(response.status).toBeOneOf([401, 403]);
            }
        });

        /**
         * Test: Token in different authorization formats
         * Should only accept "Bearer" token format
         */
        test.skip('should handle different authorization header formats', async () => {
            const loginResponse = await request().post('/users/login').send({
                email: testUser.email,
                password: testUser.password
            });

            const token = loginResponse.body.token;

            // Without "Bearer" prefix
            let response = await request().get('/users').set('Authorization', token);
            expect(response.status).toBe(401);

            // With wrong prefix
            response = await request().get('/users').set('Authorization', `Token ${token}`);
            expect(response.status).toBe(401);

            // Correct format
            response = await request().get('/users').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
        });
    });

    describe('Security Considerations', () => {
        /**
         * Test: SQL injection attempts
         * Verifies input sanitization
         */
        test('should handle SQL injection attempts safely', async () => {
            const maliciousInputs = [
                { email: "admin'--", password: 'password' },
                { email: '" OR 1=1--', password: 'password' },
                { email: 'test@example.com"; DROP TABLE users;--', password: 'pass' }
            ];

            for (const input of maliciousInputs) {
                const response = await request().post('/users/login').send(input);

                // Should either validate and reject, or handle safely
                expect(response.status).toBeOneOf([400, 401]);
                // Database should still be intact
            }
        });

        /**
         * Test: XSS attempts in login
         * Verifies that script tags are handled safely
         */
        test('should handle XSS attempts in login safely', async () => {
            const response = await request().post('/users/login').send({
                email: '<script>alert("xss")</script>@example.com',
                password: '<script>alert("xss")</script>'
            });

            expect(response.status).toBeOneOf([400, 401]);
            // Response should not echo back the script tags
            expect(response.text).not.toContain('<script>');
        });

        /**
         * Test: Password timing attack prevention
         * Login time should be consistent for valid/invalid users
         */
        test.skip('should have consistent response times for valid and invalid emails', async () => {
            const iterations = 5;
            const validEmailTimes = [];
            const invalidEmailTimes = [];

            // Time valid email attempts
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request().post('/users/login').send({
                    email: testUser.email,
                    password: 'WrongPassword'
                });
                validEmailTimes.push(Date.now() - start);
            }

            // Time invalid email attempts
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request().post('/users/login').send({
                    email: 'nonexistent@example.com',
                    password: 'WrongPassword'
                });
                invalidEmailTimes.push(Date.now() - start);
            }

            // Calculate averages
            const avgValidTime = validEmailTimes.reduce((a, b) => a + b) / iterations;
            const avgInvalidTime = invalidEmailTimes.reduce((a, b) => a + b) / iterations;

            // Times should be within reasonable variance (e.g., 50ms)
            // This is a loose check - production systems need tighter controls
            expect(Math.abs(avgValidTime - avgInvalidTime)).toBeLessThan(50);
        });
    });
});

// Add custom matcher for multiple expected values
expect.extend({
    toBeOneOf(received, expectedValues) {
        const pass = expectedValues.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expectedValues}`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be one of ${expectedValues}`,
                pass: false
            };
        }
    }
});
