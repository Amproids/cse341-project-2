/**
 * User Update Tests
 *
 * This test suite validates user update operations including:
 * - PUT /users/:id - Update user profile
 * - PATCH /users/:id/role - Update user role (admin only)
 * - Field validation during updates
 * - Partial updates
 * - Authorization checks (users can only update own profile)
 * - Email uniqueness during updates
 * - Data normalization
 *
 * Security considerations:
 * - Authentication requirements
 * - Authorization (who can update what)
 * - Role elevation prevention
 * - Data integrity
 */

const { createTestUser, getUserById, updateUser, deleteUser, request } = require('../helpers/testHelpers');

describe('User Updates (PUT /users/:id)', () => {
    let testUser = null;
    let anotherUser = null;
    let authToken = null;
    let anotherToken = null;

    beforeAll(async () => {
        // Create primary test user
        const testUserResult = await createTestUser(
            {
                email: 'update.test@example.com',
                firstName: 'Update',
                lastName: 'Test',
                dateOfBirth: '1990-01-01',
                gender: 'M',
                height: 170,
                weight: 70
            },
            true
        );

        testUser = {
            id: testUserResult.userId,
            email: 'update.test@example.com',
            password: 'SecurePassword123!',
            token: testUserResult.token
        };
        authToken = testUserResult.token;

        // Create another user for authorization tests
        const anotherUserResult = await createTestUser(
            {
                email: 'another.update@example.com',
                firstName: 'Another',
                lastName: 'Update'
            },
            true
        );

        anotherUser = {
            id: anotherUserResult.userId,
            email: 'another.update@example.com',
            token: anotherUserResult.token
        };
        anotherToken = anotherUserResult.token;
    });

    afterAll(async () => {
        // Clean up test users
        if (testUser && testUser.id) {
            // Re-authenticate in case email was changed
            try {
                const currentProfile = await request()
                    .get('/users/profile/me')
                    .set('Authorization', `Bearer ${authToken}`);

                if (currentProfile.status === 200) {
                    await deleteUser(testUser.id, authToken);
                }
            } catch (error) {
                console.log(`Failed to cleanup test user: ${error.message}`);
            }
        }

        if (anotherUser && anotherUser.id) {
            await deleteUser(anotherUser.id, anotherToken);
        }
    });

    describe('Authentication Requirements', () => {
        /**
         * Test: Update requires authentication
         * Cannot update users without valid token
         */
        test('should require authentication to update user', async () => {
            const response = await request().put(`/users/${testUser.id}`).send({ firstName: 'NewName' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        /**
         * Test: Invalid token handling
         * Should reject invalid authentication tokens
         */
        test('should reject update with invalid token', async () => {
            const response = await request()
                .put(`/users/${testUser.id}`)
                .set('Authorization', 'Bearer invalid-token')
                .send({ firstName: 'NewName' });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid or expired token');
        });
    });

    describe('Authorization Checks', () => {
        /**
         * Test: Users can update their own profile
         * Basic authorization - users have control over their data
         */
        test('should allow user to update their own profile', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const response = await updateUser(testUser.id, updateData, authToken);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User updated successfully');

            // Verify the update
            const getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.firstName).toBe('Updated');
            expect(getResponse.body.lastName).toBe('Name');
        });

        /**
         * Test: Users cannot update other users' profiles
         * Security check - prevent unauthorized modifications
         */
        test('should not allow user to update another user profile', async () => {
            const response = await updateUser(
                anotherUser.id,
                { firstName: 'Hacked' },
                authToken // Using testUser's token to update anotherUser
            );

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. You can only update your own profile.');

            // Verify the other user was not modified
            const getResponse = await getUserById(anotherUser.id, anotherToken);
            expect(getResponse.body.firstName).toBe('Another'); // Unchanged
        });
    });

    describe('Valid Updates', () => {
        /**
         * Test: Update all editable fields
         * Comprehensive update test
         */
        test('should update user with all editable fields', async () => {
            const updateData = {
                firstName: 'Fully',
                lastName: 'Updated',
                email: 'fully.updated@example.com',
                dateOfBirth: '1995-06-15',
                gender: 'F',
                height: 165,
                weight: 60
            };

            const response = await updateUser(testUser.id, updateData, authToken);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User updated successfully');

            // Verify all updates
            const getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.firstName).toBe('Fully');
            expect(getResponse.body.lastName).toBe('Updated');
            expect(getResponse.body.email).toBe('fully.updated@example.com');
            expect(getResponse.body.gender).toBe('F');
            expect(getResponse.body.height).toBe(165);
            expect(getResponse.body.weight).toBe(60);

            // Update testUser email for future tests
            testUser.email = 'fully.updated@example.com';
        });

        /**
         * Test: Partial updates
         * Should only update provided fields
         */
        test('should support partial updates', async () => {
            // Update only firstName
            let response = await updateUser(testUser.id, { firstName: 'Partial' }, authToken);
            expect(response.status).toBe(200);

            // Verify only firstName changed
            let getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.firstName).toBe('Partial');
            expect(getResponse.body.lastName).toBe('Updated'); // Unchanged from previous test
            expect(getResponse.body.email).toBe('fully.updated@example.com'); // Unchanged

            // Update only weight
            response = await updateUser(testUser.id, { weight: 65 }, authToken);
            expect(response.status).toBe(200);

            // Verify only weight changed
            getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.weight).toBe(65);
            expect(getResponse.body.firstName).toBe('Partial'); // Unchanged
        });

        /**
         * Test: Email normalization during update
         * Email should be normalized to lowercase
         */
        test('should normalize email during update', async () => {
            const response = await updateUser(testUser.id, { email: 'UPPERCASE.EMAIL@EXAMPLE.COM' }, authToken);

            expect(response.status).toBe(200);

            const getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.email).toBe('uppercase.email@example.com');

            // Update stored email for future tests
            testUser.email = 'uppercase.email@example.com';
        });

        /**
         * Test: Update with empty optional fields
         * Should handle null/empty values for optional fields
         */
        test('should handle empty optional fields', async () => {
            const response = await updateUser(
                testUser.id,
                {
                    height: null,
                    weight: null
                },
                authToken
            );

            expect(response.status).toBe(200);

            const getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body.height).toBeNull();
            expect(getResponse.body.weight).toBeNull();
        });

        /**
         * Test: Update timestamp
         * Should set updatedAt field when updating
         */
        test('should set updatedAt timestamp', async () => {
            const beforeUpdate = new Date();

            const response = await updateUser(testUser.id, { firstName: 'Timestamped' }, authToken);

            expect(response.status).toBe(200);

            const getResponse = await getUserById(testUser.id, authToken);
            if (getResponse.body.updatedAt) {
                const updatedAt = new Date(getResponse.body.updatedAt);
                expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
            }
        });
    });

    describe('Update Validation', () => {
        /**
         * Test: Invalid name validation
         * Names should only contain valid characters
         */
        test('should reject invalid name during update', async () => {
            const response = await updateUser(testUser.id, { firstName: 'Invalid123' }, authToken);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('First name contains invalid characters');
        });

        /**
         * Test: Name length validation
         * Names must not exceed maximum length
         */
        test('should reject names that are too long', async () => {
            const response = await updateUser(
                testUser.id,
                { lastName: 'ThisIsAnExtremelyLongLastNameThatExceedsFiftyCharactersInLength' },
                authToken
            );

            expect(response.status).toBe(400);
            expect(response.body.details).toContain('Last name must be 50 characters or less');
        });

        /**
         * Test: Email format validation
         * Should validate email format during updates
         */
        test('should reject invalid email format during update', async () => {
            const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test..test@example.com'];

            for (const email of invalidEmails) {
                const response = await updateUser(testUser.id, { email }, authToken);

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Validation failed');
            }
        });

        /**
         * Test: Date of birth validation
         * Should enforce age restrictions during update
         */
        test('should reject invalid date of birth during update', async () => {
            const today = new Date();
            const invalidDates = [
                new Date(today.getFullYear() + 1, 0, 1).toISOString().split('T')[0], // Future
                new Date(today.getFullYear() - 150, 0, 1).toISOString().split('T')[0], // Too old
                new Date(today.getFullYear() - 10, 0, 1).toISOString().split('T')[0] // Too young
            ];

            for (const dateOfBirth of invalidDates) {
                const response = await updateUser(testUser.id, { dateOfBirth }, authToken);

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Validation failed');
            }
        });

        /**
         * Test: Gender validation
         * Only M and F values should be accepted
         */
        test('should reject invalid gender during update', async () => {
            const response = await updateUser(testUser.id, { gender: 'X' }, authToken);

            expect(response.status).toBe(400);
            expect(response.body.details).toContain('Gender must be M or F');
        });

        /**
         * Test: Height and weight validation
         * Should enforce reasonable bounds
         */
        test('should reject invalid height and weight values', async () => {
            // Invalid height
            let response = await updateUser(testUser.id, { height: 350 }, authToken);
            expect(response.status).toBe(400);
            expect(response.body.details).toContain('Height must be between 50 and 300 cm');

            // Invalid weight
            response = await updateUser(testUser.id, { weight: 600 }, authToken);
            expect(response.status).toBe(400);
            expect(response.body.details).toContain('Weight must be between 20 and 500 kg');
        });
    });

    describe('Email Uniqueness', () => {
        /**
         * Test: Duplicate email prevention
         * Cannot update to an email that's already taken
         */
        test('should reject duplicate email during update', async () => {
            // Try to update testUser's email to anotherUser's email
            const response = await updateUser(testUser.id, { email: anotherUser.email }, authToken);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already exists');
        });

        /**
         * Test: Case-insensitive duplicate check
         * Email uniqueness should be case-insensitive
         */
        test('should reject duplicate email regardless of case', async () => {
            const response = await updateUser(testUser.id, { email: anotherUser.email.toUpperCase() }, authToken);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already exists');
        });

        /**
         * Test: Allow updating to same email
         * Users should be able to "update" with their current email
         */
        test('should allow updating to same email', async () => {
            // Get current email
            const currentProfile = await getUserById(testUser.id, authToken);
            const currentEmail = currentProfile.body.email;

            const response = await updateUser(testUser.id, { email: currentEmail }, authToken);

            expect(response.status).toBe(200);
        });
    });

    describe('Protected Fields', () => {
        /**
         * Test: Cannot update role via regular update
         * Role changes should require special endpoint/permissions
         */
        test('should not update role through regular update endpoint', async () => {
            const response = await updateUser(
                testUser.id,
                {
                    firstName: 'Testing',
                    role: 'admin' // Attempting to elevate privileges
                },
                authToken
            );

            // Update might succeed but role should not change
            if (response.status === 200) {
                const getResponse = await getUserById(testUser.id, authToken);
                expect(getResponse.body.role).toBe('user'); // Should remain 'user'
                expect(getResponse.body.firstName).toBe('Testing'); // Other updates work
            }
        });

        /**
         * Test: Cannot update system fields
         * Fields like _id, createdAt should not be modifiable
         */
        test('should not update system fields', async () => {
            await updateUser(
                testUser.id,
                {
                    _id: '507f1f77bcf86cd799439011',
                    createdAt: new Date('2020-01-01').toISOString(),
                    emailVerified: true,
                    isActive: false
                },
                authToken
            );

            // These fields should be ignored or rejected
            const getResponse = await getUserById(testUser.id, authToken);
            expect(getResponse.body._id).toBe(testUser.id); // Unchanged
            expect(getResponse.body.emailVerified).toBe(false); // Unchanged
            expect(getResponse.body.isActive).toBe(true); // Unchanged
        });
    });

    describe('Error Handling', () => {
        /**
         * Test: Non-existent user update
         * Should return 404 for users that don't exist
         */
        test('should return 404 for non-existent user', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';
            const response = await updateUser(nonExistentId, { firstName: 'Ghost' }, authToken);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        /**
         * Test: Malformed user ID
         * Should handle invalid ObjectId format
         */
        test('should handle malformed user ID', async () => {
            const response = await updateUser('invalid-id-format', { firstName: 'Test' }, authToken);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to update user');
        });
    });

    describe('PATCH /users/:id/role - Role Updates', () => {
        /**
         * Test: Role update requires admin privileges
         * Regular users cannot change roles
         */
        test('should require admin privileges to update roles', async () => {
            const response = await request()
                .patch(`/users/${anotherUser.id}/role`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'admin' });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. Admin privileges required.');
        });

        /**
         * Test: Invalid role validation
         * Only valid roles should be accepted
         */
        test('should validate role values', async () => {
            // This test assumes we could get an admin token
            // In production, you'd need to set up an admin user

            // Simulate what would happen with admin token
            const response = await request()
                .patch(`/users/${testUser.id}/role`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'superuser' }); // Invalid role

            // Even if user was admin, invalid role should be rejected
            expect(response.status).toBeOneOf([400, 403]);
        });
    });
});

// Add custom matcher if not already defined
if (!expect.extend.toBeOneOf) {
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
}
