const { cleanupTestUsers, createTestUser, request } = require('../helpers/testHelpers');

describe('User Deletion (DELETE /users/:id)', () => {
    beforeAll(async () => {
        await cleanupTestUsers();
    });

    describe('Valid Deletion', () => {
        test('should delete existing user', async () => {
            // Create a user specifically for deletion
            const createResponse = await createTestUser({
                email: 'delete.me@example.com'
            });

            expect(createResponse.status).toBe(201);
            const userId = createResponse.body._id;

            // Delete the user
            const deleteResponse = await request().delete(`/users/${userId}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.message).toBe('User deleted successfully');

            // Verify user is actually deleted
            const getResponse = await request().get(`/users/${userId}`);
            expect(getResponse.status).toBe(404);
        });
    });

    describe('Delete Error Cases', () => {
        test('should return 404 for non-existent user', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';
            const response = await request().delete(`/users/${nonExistentId}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        test('should return 500 for malformed ID', async () => {
            const response = await request().delete('/users/invalid-id-format');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to delete user');
        });

        test('should not delete user twice', async () => {
            // Create and delete a user
            const createResponse = await createTestUser({
                email: 'delete.twice@example.com'
            });
            const userId = createResponse.body._id;

            const firstDelete = await request().delete(`/users/${userId}`);
            expect(firstDelete.status).toBe(200);

            // Try to delete again
            const secondDelete = await request().delete(`/users/${userId}`);
            expect(secondDelete.status).toBe(404);
        });
    });
});
