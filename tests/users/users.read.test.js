/**
 * User Read Tests
 *
 * This test suite validates user retrieval operations including:
 * - GET /users - List all users (protected)
 * - GET /users/:id - Get specific user (protected)
 * - GET /users/profile/me - Get current user profile (protected)
 * - Field visibility and privacy controls
 * - Authorization checks (user can only view own full profile)
 * - Admin privileges (if applicable)
 *
 * Security considerations:
 * - Authentication requirements
 * - Data privacy (which fields are public vs private)
 * - Authorization (who can see what)
 */

const { createTestUser, getUserById, getAllUsers, deleteUser, request } = require('../helpers/testHelpers');

describe('User Reading (GET /users)', () => {
    let testUser = null;
    let anotherUser = null;
    let authToken = null;
    let anotherToken = null;

    beforeAll(async () => {
        // Create primary test user
        const testUserResult = await createTestUser(
            {
                email: 'read.test@example.com',
                firstName: 'Read',
                lastName: 'Test',
                dateOfBirth: '1990-05-15',
                gender: 'M',
                height: 180,
                weight: 75
            },
            true
        ); // authenticate = true

        testUser = {
            id: testUserResult.userId,
            email: 'read.test@example.com',
            token: testUserResult.token
        };
        authToken = testUserResult.token;

        // Create another user for authorization tests
        const anotherUserResult = await createTestUser(
            {
                email: 'another.user@example.com',
                firstName: 'Another',
                lastName: 'User',
                dateOfBirth: '1985-03-20',
                gender: 'F',
                height: 165,
                weight: 60
            },
            true
        );

        anotherUser = {
            id: anotherUserResult.userId,
            email: 'another.user@example.com',
            token: anotherUserResult.token
        };
        anotherToken = anotherUserResult.token;
    });

    afterAll(async () => {
        // Clean up test users
        if (testUser && testUser.id) {
            await deleteUser(testUser.id, testUser.token);
        }
        if (anotherUser && anotherUser.id) {
            await deleteUser(anotherUser.id, anotherUser.token);
        }
    });

    describe('GET /users - List All Users', () => {
        /**
         * Test: Requires authentication
         * Public user list should be protected
         */
        test('should require authentication to get user list', async () => {
            const response = await request().get('/users');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        /**
         * Test: Get all users with valid authentication
         * Should return array of users with limited fields
         */
        test('should get all users with authentication', async () => {
            const response = await getAllUsers(authToken);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2); // At least our two test users

            // Find our test users in the response
            const foundTestUser = response.body.find((u) => u._id === testUser.id);
            const foundAnotherUser = response.body.find((u) => u._id === anotherUser.id);

            expect(foundTestUser).toBeDefined();
            expect(foundAnotherUser).toBeDefined();
        });

        /**
         * Test: Public fields only in user list
         * Sensitive information should not be exposed in list view
         */
        test('should only return public fields in user list', async () => {
            const response = await getAllUsers(authToken);

            expect(response.status).toBe(200);
            const users = response.body;

            users.forEach((user) => {
                // Should include public fields
                expect(user._id).toBeDefined();
                expect(user.firstName).toBeDefined();
                expect(user.lastName).toBeDefined();
                expect(user.gender).toBeDefined();
                expect(user.createdAt).toBeDefined();
                expect(user.isTestUser).toBeDefined();

                // Should NOT include sensitive fields
                expect(user.password).toBeUndefined();
                expect(user.email).toBeUndefined(); // Email is considered private in list view
                expect(user.dateOfBirth).toBeUndefined(); // Age is private
                expect(user.height).toBeUndefined(); // Personal measurements are private
                expect(user.weight).toBeUndefined();
                expect(user.role).toBeUndefined(); // Role might be sensitive
                expect(user.emailVerified).toBeUndefined();
                expect(user.isActive).toBeUndefined();
            });
        });

        /**
         * Test: Invalid token handling
         * Should reject invalid authentication tokens
         */
        test('should reject invalid authentication token', async () => {
            const response = await getAllUsers('invalid-token-here');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid or expired token');
        });
    });

    describe('GET /users/:id - Get Single User', () => {
        /**
         * Test: Requires authentication
         * Individual user details should be protected
         */
        test('should require authentication to get user details', async () => {
            const response = await request().get(`/users/${testUser.id}`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        /**
         * Test: User can view their own full profile
         * All non-password fields should be visible to the user themselves
         */
        test('should allow user to view their own full profile', async () => {
            const response = await getUserById(testUser.id, authToken);

            expect(response.status).toBe(200);

            // Verify all fields except password are present
            expect(response.body._id).toBe(testUser.id);
            expect(response.body.firstName).toBe('Read');
            expect(response.body.lastName).toBe('Test');
            expect(response.body.email).toBe('read.test@example.com');
            expect(response.body.dateOfBirth).toBeDefined();
            expect(response.body.gender).toBe('M');
            expect(response.body.height).toBe(180);
            expect(response.body.weight).toBe(75);
            expect(response.body.role).toBe('user');
            expect(response.body.emailVerified).toBe(false);
            expect(response.body.isActive).toBe(true);
            expect(response.body.isTestUser).toBe(true);
            expect(response.body.createdAt).toBeDefined();

            // Password should never be returned
            expect(response.body.password).toBeUndefined();
        });

        /**
         * Test: User cannot view another user's profile
         * Privacy protection - users can only see their own full details
         */
        test('should not allow user to view another user profile', async () => {
            // Try to view anotherUser's profile using testUser's token
            const response = await getUserById(anotherUser.id, authToken);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. You can only view your own profile.');
        });

        /**
         * Test: Handle non-existent user
         * Should return 404 for users that don't exist
         */
        test('should return 404 for non-existent user', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
            const response = await getUserById(nonExistentId, authToken);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        /**
         * Test: Handle malformed user ID
         * Should handle invalid ObjectId format gracefully
         */
        test('should handle malformed user ID', async () => {
            const response = await getUserById('invalid-id-format', authToken);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to fetch user');
        });

        /**
         * Test: Admin access (if implemented)
         * Admins should be able to view any user's profile
         */
        test.skip('should allow admin to view any user profile', async () => {
            // This test is skipped because admin functionality needs to be implemented
            // In production, create an admin user and test their elevated privileges
            // const adminToken = await getAdminToken();
            // const response = await getUserById(testUser.id, adminToken);
            // expect(response.status).toBe(200);
        });
    });

    describe('GET /users/profile/me - Get Current User Profile', () => {
        /**
         * Test: Get current user profile
         * Convenient endpoint to get logged-in user's data
         */
        test('should get current user profile', async () => {
            const response = await request().get('/users/profile/me').set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);

            // Should return full profile of authenticated user
            expect(response.body._id).toBe(testUser.id);
            expect(response.body.email).toBe('read.test@example.com');
            expect(response.body.firstName).toBe('Read');
            expect(response.body.lastName).toBe('Test');
            expect(response.body.password).toBeUndefined();
        });

        /**
         * Test: Requires authentication
         * Should not work without valid token
         */
        test('should require authentication for /profile/me', async () => {
            const response = await request().get('/users/profile/me');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        /**
         * Test: Different users get their own profiles
         * Ensures token correctly identifies the user
         */
        test('should return different profiles for different tokens', async () => {
            // Get profile with first user's token
            const response1 = await request().get('/users/profile/me').set('Authorization', `Bearer ${authToken}`);

            // Get profile with second user's token
            const response2 = await request().get('/users/profile/me').set('Authorization', `Bearer ${anotherToken}`);

            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);

            // Should be different users
            expect(response1.body._id).toBe(testUser.id);
            expect(response2.body._id).toBe(anotherUser.id);
            expect(response1.body.email).not.toBe(response2.body.email);
        });
    });

    describe('Data Consistency', () => {
        /**
         * Test: Date format consistency
         * Dates should be returned in consistent ISO format
         */
        test('should return dates in consistent format', async () => {
            const response = await getUserById(testUser.id, authToken);

            expect(response.status).toBe(200);

            // Check date formats
            const dateFields = ['dateOfBirth', 'createdAt'];
            dateFields.forEach((field) => {
                if (response.body[field]) {
                    // Should be valid ISO date string
                    const date = new Date(response.body[field]);
                    expect(date.toISOString()).toBe(response.body[field]);
                }
            });
        });

        /**
         * Test: Data type consistency
         * Numeric fields should be returned as numbers
         */
        test('should return correct data types', async () => {
            const response = await getUserById(testUser.id, authToken);

            expect(response.status).toBe(200);

            // Check data types
            expect(typeof response.body._id).toBe('string');
            expect(typeof response.body.firstName).toBe('string');
            expect(typeof response.body.lastName).toBe('string');
            expect(typeof response.body.email).toBe('string');
            expect(typeof response.body.gender).toBe('string');
            expect(typeof response.body.height).toBe('number');
            expect(typeof response.body.weight).toBe('number');
            expect(typeof response.body.isTestUser).toBe('boolean');
            expect(typeof response.body.isActive).toBe('boolean');
            expect(typeof response.body.emailVerified).toBe('boolean');
        });
    });
});
