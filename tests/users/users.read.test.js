const { cleanupTestUsers, createTestUser, getUserById, request } = require('../helpers/testHelpers');

describe('User Reading (GET /users)', () => {
    let testUserId;

    beforeAll(async () => {
        await cleanupTestUsers();

        // Create a test user for reading tests
        const response = await createTestUser({
            email: 'get.test@example.com'
        });
        testUserId = response.body._id;
    });

    afterAll(async () => {
        if (testUserId) {
            await request().delete(`/users/${testUserId}`);
        }
    });

    describe('GET /users', () => {
        test('should get all users', async () => {
            const response = await request().get('/users');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Check if our test user is in the list
            const testUser = response.body.find((user) => user._id === testUserId);
            expect(testUser).toBeDefined();
            expect(testUser.firstName).toBe('Test');
            expect(testUser.lastName).toBe('User');
        });

        test('should not include password in response', async () => {
            const response = await request().get('/users');

            expect(response.status).toBe(200);
            const users = response.body;

            users.forEach((user) => {
                expect(user.password).toBeUndefined();
            });
        });

        test('should not include private fields in public user list', async () => {
            const response = await request().get('/users');

            expect(response.status).toBe(200);
            const users = response.body;

            users.forEach((user) => {
                // Should not include private/sensitive fields
                expect(user.password).toBeUndefined();
                expect(user.email).toBeUndefined();
                expect(user.dateOfBirth).toBeUndefined();
                expect(user.height).toBeUndefined();
                expect(user.weight).toBeUndefined();
                expect(user.emailVerified).toBeUndefined();
                expect(user.isActive).toBeUndefined();
                expect(user.role).toBeUndefined();

                // Should include public fields
                expect(user.firstName).toBeDefined();
                expect(user.lastName).toBeDefined();
                expect(user._id).toBeDefined();
            });
        });
    });

    describe('GET /users/:id', () => {
        test('should get single user by valid ID', async () => {
            const response = await getUserById(testUserId);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(testUserId);
            expect(response.body.email).toBe('get.test@example.com');
            expect(response.body.firstName).toBe('Test');
            expect(response.body.lastName).toBe('User');
        });

        test('should not include password in single user response', async () => {
            const response = await getUserById(testUserId);

            expect(response.status).toBe(200);
            expect(response.body.password).toBeUndefined();
        });

        test('should include all non-password fields for single user', async () => {
            const response = await getUserById(testUserId);

            expect(response.status).toBe(200);
            const user = response.body;

            // Should include all fields except password
            expect(user._id).toBeDefined();
            expect(user.firstName).toBeDefined();
            expect(user.lastName).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.dateOfBirth).toBeDefined();
            expect(user.gender).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.emailVerified).toBeDefined();
            expect(user.isActive).toBeDefined();
            expect(user.createdAt).toBeDefined();

            // But never the password
            expect(user.password).toBeUndefined();
        });

        test('should return 404 for non-existent user', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';
            const response = await getUserById(nonExistentId);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        test('should return 500 for malformed ID', async () => {
            const response = await getUserById('invalid-id-format');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to fetch user');
        });
    });
});
