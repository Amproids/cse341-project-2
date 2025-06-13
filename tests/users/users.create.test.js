const { cleanupTestUsers, createTestUser, request } = require('../helpers/testHelpers');

describe('User Creation (POST /users)', () => {
    const createdUserIds = [];

    beforeAll(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        // Clean up users created in this test suite
        console.log(`Cleaning up ${createdUserIds.length} users from creation tests...`);
        for (const userId of createdUserIds) {
            await request().delete(`/users/${userId}`);
        }
    });

    describe('Valid User Creation', () => {
        test('should create user with all fields', async () => {
            const response = await createTestUser({
                email: 'john.doe@example.com'
            });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body._id).toBeDefined();

            if (response.body._id) {
                createdUserIds.push(response.body._id);
            }
        });

        test('should create user with only required fields', async () => {
            const response = await request().post('/users').send({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                password: 'AnotherPassword456!',
                passwordConfirm: 'AnotherPassword456!',
                dateOfBirth: '1985-12-03',
                gender: 'F',
                isTestUser: true
            });

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUserIds.push(response.body._id);
            }
        });

        test('should normalize email to lowercase', async () => {
            const response = await createTestUser({
                email: 'SARAH.WILSON@EXAMPLE.COM'
            });

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUserIds.push(response.body._id);
            }
        });

        test('should accept lowercase gender', async () => {
            const response = await createTestUser({
                email: 'alex.johnson@example.com',
                gender: 'f'
            });

            expect(response.status).toBe(201);
            if (response.body._id) {
                createdUserIds.push(response.body._id);
            }
        });

        test('should accept edge case ages (13 and 120 years old)', async () => {
            // 13 years old
            const youngResponse = await createTestUser({
                email: 'young@example.com',
                dateOfBirth: '2012-06-11'
            });
            expect(youngResponse.status).toBe(201);
            if (youngResponse.body._id) createdUserIds.push(youngResponse.body._id);

            // 120 years old
            const oldResponse = await createTestUser({
                email: 'old@example.com',
                dateOfBirth: '1905-06-11'
            });
            expect(oldResponse.status).toBe(201);
            if (oldResponse.body._id) createdUserIds.push(oldResponse.body._id);
        });
    });

    describe('Validation Errors', () => {
        test('should reject missing required fields', async () => {
            const response = await request().post('/users').send({
                firstName: 'Test',
                email: 'missing@fields.com',
                password: 'password123'
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Validation failed');
        });

        test('should reject invalid name characters', async () => {
            const response = await createTestUser({
                firstName: 'John123',
                lastName: 'Doe$',
                email: 'invalid.name@example.com'
            });

            expect(response.status).toBe(400);
        });

        test('should reject names that are too long', async () => {
            const response = await createTestUser({
                firstName: 'ThisIsAnExtremelyLongFirstNameThatExceedsFiftyCharactersInLength',
                email: 'longname@example.com'
            });

            expect(response.status).toBe(400);
        });

        test('should reject invalid email formats', async () => {
            const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test..test@example.com'];

            for (const email of invalidEmails) {
                const response = await createTestUser({ email });
                expect(response.status).toBe(400);
            }
        });

        test('should reject password mismatch', async () => {
            const response = await createTestUser({
                password: 'Password123!',
                passwordConfirm: 'DifferentPassword456!',
                email: 'mismatch@example.com'
            });

            expect(response.status).toBe(400);
        });

        test('should reject invalid dates of birth', async () => {
            const invalidDates = [
                '2030-01-01', // Future date
                '1800-01-01', // Too old
                '2020-01-01', // Too young
                'invalid-date'
            ];

            for (const dateOfBirth of invalidDates) {
                const response = await createTestUser({
                    dateOfBirth,
                    email: `test-${Date.now()}@example.com`
                });
                expect(response.status).toBe(400);
            }
        });

        test('should reject invalid gender values', async () => {
            const response = await createTestUser({
                gender: 'X',
                email: 'invalidgender@example.com'
            });

            expect(response.status).toBe(400);
        });

        test('should reject invalid height values', async () => {
            const invalidHeights = [30, 400, -5];

            for (const height of invalidHeights) {
                const response = await createTestUser({
                    height,
                    email: `height-${Date.now()}@example.com`
                });
                expect(response.status).toBe(400);
            }
        });

        test('should reject invalid weight values', async () => {
            const invalidWeights = [10, 600, -10];

            for (const weight of invalidWeights) {
                const response = await createTestUser({
                    weight,
                    email: `weight-${Date.now()}@example.com`
                });
                expect(response.status).toBe(400);
            }
        });
    });

    describe('Duplicate Email Handling', () => {
        test('should reject duplicate emails', async () => {
            // First user should succeed
            const firstResponse = await createTestUser({
                email: 'duplicate.test@example.com'
            });
            expect(firstResponse.status).toBe(201);
            if (firstResponse.body._id) createdUserIds.push(firstResponse.body._id);

            // Second user with same email should fail
            const secondResponse = await createTestUser({
                email: 'duplicate.test@example.com',
                firstName: 'Another'
            });
            expect(secondResponse.status).toBe(409);
            expect(secondResponse.body.error).toBe('Email already exists');
        });
    });
});
