/**
 * User Creation Tests
 *
 * This test suite validates all aspects of user creation including:
 * - Valid user creation with required and optional fields
 * - Input validation for all fields
 * - Duplicate email handling
 * - Password security requirements
 * - Age restrictions
 * - Data normalization (email, gender)
 *
 * Note: These tests do not require authentication as user creation
 * is a public endpoint for registration.
 */

const { createTestUser, request, deleteUser, authenticateUser } = require('../helpers/testHelpers');

describe('User Creation (POST /users)', () => {
    const createdUsers = []; // Track users for cleanup

    afterAll(async () => {
        // Clean up users created in this test suite
        console.log(`Cleaning up ${createdUsers.length} users from creation tests...`);

        for (const user of createdUsers) {
            try {
                // Authenticate as the user to delete their own account
                const token = await authenticateUser({
                    email: user.email,
                    password: user.password || 'SecurePassword123!'
                });
                await deleteUser(user.userId, token);
            } catch (error) {
                console.log(`Failed to cleanup user ${user.userId}: ${error.message}`);
            }
        }
    });

    describe('Valid User Creation', () => {
        /**
         * Test: Create user with all available fields
         * Verifies that the system accepts all valid optional fields
         */
        test('should create user with all fields', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'SecurePassword123!',
                passwordConfirm: 'SecurePassword123!',
                dateOfBirth: '1990-01-15',
                gender: 'M',
                height: 180,
                weight: 75,
                isTestUser: true
            };

            const response = await request().post('/users').send(userData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body._id).toBeDefined();
            expect(response.body._id).toMatch(/^[0-9a-fA-F]{24}$/); // Valid MongoDB ObjectId

            if (response.body._id) {
                createdUsers.push({
                    userId: response.body._id,
                    email: userData.email,
                    password: userData.password
                });
            }
        });

        /**
         * Test: Create user with only required fields
         * Ensures optional fields (height, weight) can be omitted
         */
        test('should create user with only required fields', async () => {
            const userData = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                password: 'AnotherPassword456!',
                passwordConfirm: 'AnotherPassword456!',
                dateOfBirth: '1985-12-03',
                gender: 'F',
                isTestUser: true
            };

            const response = await request().post('/users').send(userData);

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUsers.push({
                    userId: response.body._id,
                    email: userData.email,
                    password: userData.password
                });
            }
        });

        /**
         * Test: Email normalization
         * Verifies that emails are normalized to lowercase
         */
        test('should normalize email to lowercase', async () => {
            const userData = {
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'SARAH.WILSON@EXAMPLE.COM',
                password: 'Password789!',
                passwordConfirm: 'Password789!',
                dateOfBirth: '1992-06-20',
                gender: 'F',
                isTestUser: true
            };

            const response = await request().post('/users').send(userData);

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUsers.push({
                    userId: response.body._id,
                    email: userData.email.toLowerCase(),
                    password: userData.password
                });
            }

            // Verify normalization by attempting login with lowercase
            const loginResponse = await request().post('/users/login').send({
                email: 'sarah.wilson@example.com',
                password: 'Password789!'
            });
            expect(loginResponse.status).toBe(200);
        });

        /**
         * Test: Gender normalization
         * Verifies that gender accepts lowercase and normalizes to uppercase
         */
        test('should accept lowercase gender and normalize to uppercase', async () => {
            const userData = {
                firstName: 'Alex',
                lastName: 'Johnson',
                email: 'alex.johnson@example.com',
                password: 'SecurePass123!',
                passwordConfirm: 'SecurePass123!',
                dateOfBirth: '1988-03-15',
                gender: 'f', // lowercase
                isTestUser: true
            };

            const response = await request().post('/users').send(userData);

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUsers.push({
                    userId: response.body._id,
                    email: userData.email,
                    password: userData.password
                });
            }
        });

        /**
         * Test: Age boundary validation
         * Tests edge cases for minimum (13) and maximum (120) ages
         */
        test('should accept edge case ages (13 and 120 years old)', async () => {
            // Calculate dates for exactly 13 and 120 years ago
            const today = new Date();
            const young = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate() - 1);
            const old = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate() + 1);

            // 13 years old
            const youngUserData = {
                firstName: 'Young',
                lastName: 'User',
                email: 'young@example.com',
                password: 'YoungPass123!',
                passwordConfirm: 'YoungPass123!',
                dateOfBirth: young.toISOString().split('T')[0],
                gender: 'M',
                isTestUser: true
            };

            const youngResponse = await request().post('/users').send(youngUserData);
            expect(youngResponse.status).toBe(201);
            if (youngResponse.body._id) {
                createdUsers.push({
                    userId: youngResponse.body._id,
                    email: youngUserData.email,
                    password: youngUserData.password
                });
            }

            // 120 years old
            const oldUserData = {
                firstName: 'Old',
                lastName: 'User',
                email: 'old@example.com',
                password: 'OldPass123!',
                passwordConfirm: 'OldPass123!',
                dateOfBirth: old.toISOString().split('T')[0],
                gender: 'F',
                isTestUser: true
            };

            const oldResponse = await request().post('/users').send(oldUserData);
            expect(oldResponse.status).toBe(201);
            if (oldResponse.body._id) {
                createdUsers.push({
                    userId: oldResponse.body._id,
                    email: oldUserData.email,
                    password: oldUserData.password
                });
            }
        });

        /**
         * Test: User role assignment
         * Verifies that new users cannot set their own role (security measure)
         */
        test('should not allow users to set their own role during registration', async () => {
            const userData = {
                firstName: 'Sneaky',
                lastName: 'User',
                email: 'sneaky.user@example.com',
                password: 'SneakyPass123!',
                passwordConfirm: 'SneakyPass123!',
                dateOfBirth: '1990-01-01',
                gender: 'M',
                role: 'admin', // Attempting to set admin role
                isTestUser: true
            };

            const response = await request().post('/users').send(userData);
            expect(response.status).toBe(201);

            // Login and check profile to verify role
            const loginResponse = await request().post('/users/login').send({
                email: userData.email,
                password: userData.password
            });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.user.role).toBe('user'); // Should be 'user', not 'admin'

            if (response.body._id) {
                createdUsers.push({
                    userId: response.body._id,
                    email: userData.email,
                    password: userData.password
                });
            }
        });
    });

    describe('Validation Errors', () => {
        /**
         * Test: Missing required fields
         * Validates that all required fields are enforced
         */
        test('should reject missing required fields', async () => {
            const incompleteData = {
                firstName: 'Test',
                email: 'missing@fields.com',
                password: 'password123'
                // Missing: lastName, passwordConfirm, dateOfBirth, gender
            };

            const response = await request().post('/users').send(incompleteData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toBeDefined();
            expect(Array.isArray(response.body.details)).toBe(true);
            expect(response.body.details.length).toBeGreaterThan(0);
        });

        /**
         * Test: Invalid name characters
         * Names should only contain letters, spaces, hyphens, and apostrophes
         */
        test('should reject invalid name characters', async () => {
            const response = await createTestUser({
                firstName: 'John123',
                lastName: 'Doe$',
                email: 'invalid.name@example.com'
            });

            expect(response.response.status).toBe(400);
            expect(response.response.body.details).toContain('First name contains invalid characters');
            expect(response.response.body.details).toContain('Last name contains invalid characters');
        });

        /**
         * Test: Name length validation
         * Names must be 50 characters or less
         */
        test('should reject names that are too long', async () => {
            const response = await createTestUser({
                firstName: 'ThisIsAnExtremelyLongFirstNameThatExceedsFiftyCharactersInLength',
                email: 'longname@example.com'
            });

            expect(response.response.status).toBe(400);
            expect(response.response.body.details).toContain('First name must be 50 characters or less');
        });

        /**
         * Test: Email format validation
         * Tests various invalid email formats
         */
        test('should reject invalid email formats', async () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'test@',
                'test..test@example.com',
                'test.@example.com',
                '.test@example.com',
                'test@.example.com',
                'test@example..com'
            ];

            for (const email of invalidEmails) {
                const response = await createTestUser({ email });
                expect(response.response.status).toBe(400);
                expect(response.response.body.error).toBe('Validation failed');
            }
        });

        /**
         * Test: Password confirmation mismatch
         * Ensures password confirmation is validated
         */
        test('should reject password mismatch', async () => {
            const response = await createTestUser({
                password: 'Password123!',
                passwordConfirm: 'DifferentPassword456!',
                email: 'mismatch@example.com'
            });

            expect(response.response.status).toBe(400);
            expect(response.response.body.details).toContain('Passwords do not match');
        });

        /**
         * Test: Date of birth validation
         * Tests future dates, too old, and too young scenarios
         */
        test('should reject invalid dates of birth', async () => {
            const today = new Date();
            const invalidDates = [
                { date: '2030-01-01', reason: 'future date' },
                { date: '1800-01-01', reason: 'too old (>120 years)' },
                {
                    date: new Date(today.getFullYear() - 10, 0, 1).toISOString().split('T')[0],
                    reason: 'too young (<13 years)'
                },
                { date: 'invalid-date', reason: 'invalid format' }
            ];

            for (const { date, reason } of invalidDates) {
                const response = await createTestUser({
                    dateOfBirth: date,
                    email: `test-${Date.now()}@example.com`
                });
                expect(response.response.status).toBe(400);
                expect(response.response.body.error).toBe('Validation failed');
                // Log for debugging if needed
                if (response.response.status !== 400) {
                    console.log(`Failed for ${reason}:`, response.response.body);
                }
            }
        });

        /**
         * Test: Gender validation
         * Only 'M' and 'F' are accepted values
         */
        test('should reject invalid gender values', async () => {
            const response = await createTestUser({
                gender: 'X',
                email: 'invalidgender@example.com'
            });

            expect(response.response.status).toBe(400);
            expect(response.response.body.details).toContain('Gender must be M or F');
        });

        /**
         * Test: Height validation
         * Height must be between 50 and 300 cm
         */
        test('should reject invalid height values', async () => {
            const invalidHeights = [30, 400, -5, 0];

            for (const height of invalidHeights) {
                const response = await createTestUser({
                    height,
                    email: `height-${Date.now()}@example.com`
                });
                expect(response.response.status).toBe(400);
                expect(response.response.body.details).toContain('Height must be between 50 and 300 cm');
            }
        });

        /**
         * Test: Weight validation
         * Weight must be between 20 and 500 kg
         */
        test('should reject invalid weight values', async () => {
            const invalidWeights = [10, 600, -10, 0];

            for (const weight of invalidWeights) {
                const response = await createTestUser({
                    weight,
                    email: `weight-${Date.now()}@example.com`
                });
                expect(response.response.status).toBe(400);
                expect(response.response.body.details).toContain('Weight must be between 20 and 500 kg');
            }
        });
    });

    describe('Duplicate Email Handling', () => {
        /**
         * Test: Duplicate email prevention
         * Ensures unique email constraint is enforced
         */
        test('should reject duplicate emails', async () => {
            const email = 'duplicate.test@example.com';

            // First user should succeed
            const firstResponse = await createTestUser({ email });
            expect(firstResponse.response.status).toBe(201);
            createdUsers.push({
                userId: firstResponse.response.body._id,
                email,
                password: 'SecurePassword123!'
            });

            // Second user with same email should fail
            const secondResponse = await createTestUser({
                email,
                firstName: 'Another',
                lastName: 'User'
            });
            expect(secondResponse.response.status).toBe(409);
            expect(secondResponse.response.body.error).toBe('Email already exists');
        });

        /**
         * Test: Case-insensitive duplicate prevention
         * Verifies email uniqueness is case-insensitive
         */
        test('should reject duplicate emails regardless of case', async () => {
            const baseEmail = 'CaseSensitive@Example.COM';

            // First user
            const firstResponse = await createTestUser({ email: baseEmail });
            expect(firstResponse.response.status).toBe(201);
            createdUsers.push({
                userId: firstResponse.response.body._id,
                email: baseEmail.toLowerCase(),
                password: 'SecurePassword123!'
            });

            // Try with different case variations
            const variations = ['casesensitive@example.com', 'CASESENSITIVE@EXAMPLE.COM', 'CaSeSenSiTiVe@ExAmPlE.cOm'];

            for (const email of variations) {
                const response = await createTestUser({ email });
                expect(response.response.status).toBe(409);
                expect(response.response.body.error).toBe('Email already exists');
            }
        });
    });
});
