const { cleanupTestUsers, createTestUser, getUserById, request } = require('../helpers/testHelpers');

describe('User Updates (PUT /users/:id)', () => {
    let testUserId;

    beforeAll(async () => {
        await cleanupTestUsers();

        // Create a test user for update tests
        const response = await createTestUser({
            email: 'update.test@example.com'
        });
        testUserId = response.body._id;
    });

    afterAll(async () => {
        if (testUserId) {
            await request().delete(`/users/${testUserId}`);
        }
    });

    describe('Valid Updates', () => {
        test('should update user with all fields', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                email: 'updated.email@example.com',
                dateOfBirth: '1995-01-01',
                gender: 'F',
                height: 165,
                weight: 60
            };

            const response = await request().put(`/users/${testUserId}`).send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User updated successfully');

            // Verify the update
            const getResponse = await getUserById(testUserId);
            expect(getResponse.body.firstName).toBe('Updated');
            expect(getResponse.body.lastName).toBe('Name');
            expect(getResponse.body.email).toBe('updated.email@example.com');
        });

        test('should update user with partial fields', async () => {
            const response = await request().put(`/users/${testUserId}`).send({
                firstName: 'PartialUpdate'
            });

            expect(response.status).toBe(200);

            // Verify only firstName was updated
            const getResponse = await getUserById(testUserId);
            expect(getResponse.body.firstName).toBe('PartialUpdate');
            expect(getResponse.body.email).toBe('updated.email@example.com'); // Should remain unchanged
        });

        test('should normalize email during update', async () => {
            const response = await request().put(`/users/${testUserId}`).send({
                email: 'UPPERCASE.EMAIL@EXAMPLE.COM'
            });

            expect(response.status).toBe(200);

            const getResponse = await getUserById(testUserId);
            expect(getResponse.body.email).toBe('uppercase.email@example.com');
        });
    });

    describe('Update Validation', () => {
        test('should reject invalid name during update', async () => {
            const response = await request().put(`/users/${testUserId}`).send({
                firstName: 'Invalid123'
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Validation failed');
        });

        test('should reject invalid email during update', async () => {
            const response = await request().put(`/users/${testUserId}`).send({
                email: 'invalid-email-format'
            });

            expect(response.status).toBe(400);
        });

        test('should reject duplicate email during update', async () => {
            // Create another user
            const anotherUser = await createTestUser({
                email: 'another.user@example.com'
            });

            try {
                // Try to update our test user to have the same email
                const response = await request().put(`/users/${testUserId}`).send({
                    email: 'another.user@example.com'
                });

                expect(response.status).toBe(409);
                expect(response.body.error).toBe('Email already exists');
            } finally {
                // Clean up the other user
                if (anotherUser.body._id) {
                    await request().delete(`/users/${anotherUser.body._id}`);
                }
            }
        });

        test('should reject invalid date of birth during update', async () => {
            const response = await request().put(`/users/${testUserId}`).send({
                dateOfBirth: '2030-01-01'
            });

            expect(response.status).toBe(400);
        });
    });

    describe('Update Error Cases', () => {
        test('should return 404 for non-existent user', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';
            const response = await request().put(`/users/${nonExistentId}`).send({
                firstName: 'Test'
            });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        test('should return 500 for malformed ID', async () => {
            const response = await request().put('/users/invalid-id').send({
                firstName: 'Test'
            });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to update user');
        });
    });
});
